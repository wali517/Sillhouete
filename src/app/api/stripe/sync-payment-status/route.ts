import { NextResponse } from "next/server";
import { getOrderById, markOrderPaidByStripe } from "@/lib/db";
import { getStripeServer, fromStripeAmount, toStripeAmount, resolveStripeSecretKey } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    await resolveStripeSecretKey();
    const body = await req.json();
    const { orderId, paymentIntentId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Already marked paid — nothing to do
    if (order.paymentStatus === "paid" || order.paymentStatus === "succeeded") {
      return NextResponse.json({ order, synced: false, reason: "already_paid" });
    }

    // Only sync Stripe card payments
    if (order.paymentMethod !== "stripe" && order.paymentMethod !== "credit_card") {
      return NextResponse.json({ order, synced: false, reason: "not_stripe_payment" });
    }

    // Resolve PaymentIntent ID — prefer what's stored on the order
    const piId = order.stripePaymentIntentId || paymentIntentId;
    if (!piId) {
      return NextResponse.json({ order, synced: false, reason: "no_payment_intent_id" });
    }

    // Directly query Stripe API to verify payment status
    const stripe = getStripeServer();
    const pi = await stripe.paymentIntents.retrieve(piId, {
      expand: ["payment_method"],
    });

    if (pi.status !== "succeeded") {
      return NextResponse.json({
        order,
        synced: false,
        piStatus: pi.status,
        reason: `payment_intent_not_succeeded`,
      });
    }

    // ── Security: verify amount and currency ───────────────────────────────
    const orderCurrency = (order.currency || "PKR").toUpperCase();
    const piCurrency = (pi.currency || "").toUpperCase();

    if (piCurrency !== orderCurrency) {
      console.error(`[Sync] Currency mismatch for order ${order.id}: expected ${orderCurrency}, got ${piCurrency}`);
      return NextResponse.json({ order, synced: false, reason: "currency_mismatch" }, { status: 400 });
    }

    const expectedStripeAmount = toStripeAmount(order.total, order.currency);
    const receivedStripeAmount = pi.amount_received || pi.amount || 0;
    if (Math.abs(expectedStripeAmount - receivedStripeAmount) > 1) {
      console.error(`[Sync] Amount mismatch for order ${order.id}: expected ${expectedStripeAmount}, got ${receivedStripeAmount}`);
      return NextResponse.json({ order, synced: false, reason: "amount_mismatch" }, { status: 400 });
    }

    // ── Extract card details from PaymentMethod ────────────────────────────
    let paymentDetails:
      | { brand?: string; last4?: string; expMonth?: number; expYear?: number; funding?: string }
      | undefined = undefined;

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

    const amountPaid = fromStripeAmount(receivedStripeAmount, order.currency);

    // ── Mark order paid (server-verified from Stripe) ──────────────────────
    const updatedOrder = await markOrderPaidByStripe({
      orderId: order.id,
      paymentIntentId: pi.id,
      customerId: typeof pi.customer === "string" ? pi.customer : pi.customer?.id,
      amountPaid,
      currency: order.currency,
      eventId: `sync_${pi.id}`,
      paymentDetails,
    });

    console.log(`[Sync] Order #${order.orderNumber} marked PAID via direct Stripe API check (PI: ${pi.id})`);

    return NextResponse.json({ order: updatedOrder, synced: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment sync failed";
    console.error("[Payment Sync Error]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


