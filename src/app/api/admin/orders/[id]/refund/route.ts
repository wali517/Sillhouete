import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrderById, recordOrderRefund } from "@/lib/db";
import { getStripeServer, toStripeAmount } from "@/lib/stripe";

const AUTH_COOKIE = "slh_admin_token";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Verify administrator authentication
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (token !== "authenticated_admin_session") {
      return NextResponse.json(
        { error: "Unauthorized. Administrator credentials required to issue refunds." },
        { status: 401 }
      );
    }

    // 2. Fetch order from MongoDB
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // 3. Verify order has a valid Stripe transaction
    if (!order.stripePaymentIntentId) {
      return NextResponse.json(
        { error: "This order does not have an associated Stripe PaymentIntent ID for automated refunds." },
        { status: 400 }
      );
    }

    if (order.paymentStatus !== "paid" && order.paymentStatus !== "partially_refunded") {
      return NextResponse.json(
        { error: `Cannot refund order with payment status: ${order.paymentStatus}` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const existingRefundAmount = order.refundAmount || 0;
    const remainingBalance = Math.max(0, order.total - existingRefundAmount);

    if (remainingBalance <= 0) {
      return NextResponse.json(
        { error: "Order has already been fully refunded." },
        { status: 400 }
      );
    }

    // Amount to refund (defaults to full remaining balance if unspecified)
    const requestAmount = body.amount !== undefined ? Number(body.amount) : remainingBalance;
    if (isNaN(requestAmount) || requestAmount <= 0) {
      return NextResponse.json(
        { error: "Refund amount must be a positive number." },
        { status: 400 }
      );
    }

    if (requestAmount > remainingBalance) {
      return NextResponse.json(
        {
          error: `Requested refund (${requestAmount} ${order.currency}) exceeds remaining order balance (${remainingBalance} ${order.currency}).`,
        },
        { status: 400 }
      );
    }

    // 4. Create refund through Stripe Server SDK
    const stripe = getStripeServer();
    const stripeRefundAmount = toStripeAmount(requestAmount, order.currency);

    const idempotencyKey = `refund_admin_${order.id}_${Math.round(requestAmount * 100)}_${Date.now()}`;
    const stripeRefund = await stripe.refunds.create(
      {
        payment_intent: order.stripePaymentIntentId,
        amount: stripeRefundAmount,
        reason: body.reason || "requested_by_customer",
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          initiatedBy: "admin_dashboard",
        },
      },
      { idempotencyKey }
    );

    const isFullRefund = existingRefundAmount + requestAmount >= order.total;

    // 5. Update order refund records in MongoDB
    const updated = await recordOrderRefund({
      orderId: order.id,
      paymentIntentId: order.stripePaymentIntentId,
      refundId: stripeRefund.id,
      refundAmount: requestAmount,
      isFullRefund,
    });

    return NextResponse.json({
      success: true,
      refund: {
        id: stripeRefund.id,
        amount: requestAmount,
        status: stripeRefund.status,
        currency: order.currency,
        isFullRefund,
      },
      order: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process refund";
    console.error("[Stripe Refund Error]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

