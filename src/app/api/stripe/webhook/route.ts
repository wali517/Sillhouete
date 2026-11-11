import { NextResponse } from "next/server";
import { getStripeServer, getStripeWebhookSecret, fromStripeAmount, toStripeAmount, resolveStripeSecretKey } from "@/lib/stripe";
import {
  getOrderById,
  getOrderByStripeSessionId,
  getOrderByStripePaymentIntentId,
  markOrderPaidByStripe,
  markOrderPaymentFailed,
  recordOrderRefund,
  updateOrderStatus,
} from "@/lib/db";
import { sendRefundFailedEmail } from "@/lib/email";
import { OrderModel } from "@/lib/models/Order";
import { StripeEventModel } from "@/lib/models/StripeEvent";
import connectDB from "@/lib/mongodb";
import type Stripe from "stripe";

export async function POST(req: Request) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (readErr: unknown) {
    const msg = readErr instanceof Error ? readErr.message : "Failed to read request body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header in webhook request" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    await resolveStripeSecretKey();
    const stripe = getStripeServer();
    const webhookSecret = getStripeWebhookSecret();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[Stripe Webhook] Verification Error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await connectDB();

  // ─── IDEMPOTENCY: PREVENT DUPLICATE WEBHOOK PROCESSING ───────────────────
  try {
    const existingEvent = await StripeEventModel.findOne({ eventId: event.id });
    if (existingEvent) {
      console.log(`[Stripe Webhook] Event ${event.id} already processed. Acknowledging with 200.`);
      return NextResponse.json({ received: true, duplicate: true });
    }
  } catch (dbErr: unknown) {
    console.warn("[Stripe Webhook] Idempotency check warning:", dbErr);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;
        const paymentIntentId = pi.id;

        const order =
          (orderId ? await getOrderById(orderId) : null) ||
          (await getOrderByStripePaymentIntentId(paymentIntentId));

        if (!order) {
          console.error(
            `[Stripe Webhook] Order not found for PaymentIntent ${paymentIntentId} (orderId: ${orderId})`
          );
          return NextResponse.json({ error: "Order not found", received: true }, { status: 200 });
        }

        // Amount & Currency Verification
        const piCurrency = (pi.currency || "").toUpperCase();
        const orderCurrency = (order.currency || "PKR").toUpperCase();
        if (piCurrency !== orderCurrency) {
          console.error(
            `[Stripe Webhook] Currency mismatch for order ${order.id}: expected ${orderCurrency}, received ${piCurrency}`
          );
          return NextResponse.json({ error: "Currency mismatch" }, { status: 400 });
        }

        const expectedStripeAmount = toStripeAmount(order.total, order.currency);
        const receivedStripeAmount = pi.amount_received || pi.amount || 0;

        if (Math.abs(expectedStripeAmount - receivedStripeAmount) > 1) {
          console.error(
            `[Stripe Webhook] Amount mismatch for order ${order.id}: expected ${expectedStripeAmount}, received ${receivedStripeAmount}`
          );
          return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
        }

        let paymentDetails:
          | {
              brand?: string;
              last4?: string;
              expMonth?: number;
              expYear?: number;
              funding?: string;
            }
          | undefined = undefined;

        if (pi.payment_method) {
          try {
            const stripe = getStripeServer();
            const pmId =
              typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method.id;
            const pm = await stripe.paymentMethods.retrieve(pmId);
            if (pm?.card) {
              paymentDetails = {
                brand: pm.card.brand,
                last4: pm.card.last4,
                expMonth: pm.card.exp_month,
                expYear: pm.card.exp_year,
                funding: pm.card.funding,
              };
            }
          } catch (pmErr) {
            console.warn(
              "[Stripe Webhook] Could not retrieve payment method details for PI:",
              pmErr
            );
          }
        }

        const paidAmount = fromStripeAmount(receivedStripeAmount, order.currency);
        await markOrderPaidByStripe({
          orderId: order.id,
          paymentIntentId: pi.id,
          customerId: typeof pi.customer === "string" ? pi.customer : pi.customer?.id,
          amountPaid: paidAmount,
          currency: order.currency,
          eventId: event.id,
          paymentDetails,
        });

        console.log(
          `[Stripe Webhook] Order #${order.orderNumber} successfully marked as PAID via PaymentIntent.`
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;
        const reason = pi.last_payment_error?.message || "Card payment was declined or could not be completed.";
        await markOrderPaymentFailed({
          orderId,
          paymentIntentId: pi.id,
          reason,
          eventId: event.id,
        });
        console.log(`[Stripe Webhook] PaymentIntent ${pi.id} failed: ${reason}`);
        break;
      }

      case "payment_intent.canceled": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;
        const order =
          (orderId ? await getOrderById(orderId) : null) ||
          (await getOrderByStripePaymentIntentId(pi.id));

        if (order && order.paymentStatus !== "paid" && order.paymentStatus !== "succeeded") {
          await updateOrderStatus(order.id, {
            paymentStatus: "cancelled",
          });
          console.log(`[Stripe Webhook] Order #${order.orderNumber} PaymentIntent canceled.`);
        }
        break;
      }

      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.orderId;
        const sessionId = session.id;

        // Locate order by metadata.orderId or by session.id
        const order =
          (orderId ? await getOrderById(orderId) : null) ||
          (await getOrderByStripeSessionId(sessionId));

        if (!order) {
          console.error(
            `[Stripe Webhook] Order not found for session ${sessionId} (orderId: ${orderId})`
          );
          // Acknowledge receipt to prevent Stripe infinite retries for orphaned sessions
          return NextResponse.json({ error: "Order not found", received: true }, { status: 200 });
        }

        // Verify the payment status reported by Stripe
        if (session.payment_status !== "paid") {
          console.log(
            `[Stripe Webhook] Session ${sessionId} for order ${order.id} payment_status is ${session.payment_status}. Awaiting payment confirmation.`
          );
          return NextResponse.json({ received: true, status: session.payment_status });
        }

        // ─── SECURITY VALIDATION: AMOUNT & CURRENCY INTEGRITY ─────────────────
        const sessionCurrency = (session.currency || "").toUpperCase();
        const orderCurrency = (order.currency || "PKR").toUpperCase();
        if (sessionCurrency !== orderCurrency) {
          console.error(
            `[Stripe Webhook] Currency mismatch for order ${order.id}: expected ${orderCurrency}, received ${sessionCurrency}`
          );
          return NextResponse.json({ error: "Currency mismatch" }, { status: 400 });
        }

        const expectedStripeAmount = toStripeAmount(order.total, order.currency);
        const receivedStripeAmount = session.amount_total || 0;

        // Tolerance of at most 1 unit for floating precision
        if (Math.abs(expectedStripeAmount - receivedStripeAmount) > 1) {
          console.error(
            `[Stripe Webhook] Amount mismatch for order ${order.id}: expected ${expectedStripeAmount}, received ${receivedStripeAmount}`
          );
          return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
        }

        // Retrieve PaymentIntent to extract card / payment method details
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;

        let paymentDetails:
          | {
              brand?: string;
              last4?: string;
              expMonth?: number;
              expYear?: number;
              funding?: string;
            }
          | undefined = undefined;

        if (paymentIntentId) {
          try {
            const stripe = getStripeServer();
            const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
              expand: ["payment_method"],
            });
            const pm = pi.payment_method;
            if (pm && typeof pm !== "string" && pm.card) {
              paymentDetails = {
                brand: pm.card.brand,
                last4: pm.card.last4,
                expMonth: pm.card.exp_month,
                expYear: pm.card.exp_year,
                funding: pm.card.funding,
              };
            }
          } catch (piErr) {
            console.warn("[Stripe Webhook] Could not retrieve payment method details:", piErr);
          }
        }

        // Mark order as paid in MongoDB and dispatch confirmation email
        const paidAmount = fromStripeAmount(receivedStripeAmount, order.currency);
        await markOrderPaidByStripe({
          orderId: order.id,
          sessionId: session.id,
          paymentIntentId,
          customerId,
          amountPaid: paidAmount,
          currency: order.currency,
          eventId: event.id,
          paymentDetails,
        });

        console.log(`[Stripe Webhook] Order #${order.orderNumber} successfully marked as PAID.`);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const sessionId = session.id;

        const order =
          (orderId ? await getOrderById(orderId) : null) ||
          (await getOrderByStripeSessionId(sessionId));

        if (order) {
          await markOrderPaymentFailed({
            orderId: order.id,
            reason: "Async payment method failed.",
            eventId: event.id,
          });
          console.log(`[Stripe Webhook] Order #${order.orderNumber} marked as payment FAILED.`);
        }
        break;
      }

      case "charge.refunded":
      case "charge.refund.updated": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;

        if (paymentIntentId) {
          const order = await getOrderByStripePaymentIntentId(paymentIntentId);
          if (order) {
            const refundAmount = fromStripeAmount(charge.amount_refunded, order.currency);
            const isFullRefund =
              charge.refunded === true || charge.amount_refunded >= charge.amount;

            const latestRefundId =
              charge.refunds?.data?.[0]?.id || `re_${Date.now()}`;

            await recordOrderRefund({
              orderId: order.id,
              paymentIntentId,
              refundId: latestRefundId,
              refundAmount,
              isFullRefund,
              eventId: event.id,
            });

            console.log(
              `[Stripe Webhook] Refund recorded for Order #${order.orderNumber}: ${refundAmount} ${order.currency}`
            );
          }
        }
        break;
      }

      case "refund.failed": {
        const refund = event.data.object as Stripe.Refund;
        const paymentIntentId =
          typeof refund.payment_intent === "string"
            ? refund.payment_intent
            : refund.payment_intent?.id;
        if (paymentIntentId) {
          const order = await getOrderByStripePaymentIntentId(paymentIntentId);
          if (order) {
            const failureReason = refund.failure_reason || "Refund declined by card network.";
            await OrderModel.findOneAndUpdate(
              { id: order.id },
              {
                $set: {
                  refundStatus: "refund_failed",
                  refundFailureReason: failureReason,
                },
                $push: {
                  refundTimeline: {
                    title: "Refund Failed",
                    date: new Date().toISOString(),
                    details: `Stripe reported refund failure: ${refund.failure_reason || "Declined by issuing bank"}`,
                    amount: fromStripeAmount(refund.amount, order.currency),
                    refundId: refund.id,
                  },
                },
              }
            );
            console.log(`[Stripe Webhook] Refund failed for Order #${order.orderNumber}`);
            try {
              await sendRefundFailedEmail(order, failureReason);
            } catch (err) {
              console.warn("[Email Notification Error] Refund failure notice:", err);
            }
          }
        }
        break;
      }

      default: {
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        break;
      }
    }

    // Persist event in StripeEventModel for idempotency
    try {
      await StripeEventModel.create({
        eventId: event.id,
        eventType: event.type,
      });
    } catch (saveErr) {
      console.warn("[Stripe Webhook] Failed to record event record:", saveErr);
    }

    return NextResponse.json({ received: true });
  } catch (processErr: unknown) {
    const message = processErr instanceof Error ? processErr.message : "Webhook processing failed";
    console.error("[Stripe Webhook] Processing Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

