import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrderById, cancelOrderAndProcessRefund } from "@/lib/db";

const AUTH_COOKIE = "slh_admin_token";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const cookieStore = await cookies();
    const adminToken = cookieStore.get(AUTH_COOKIE)?.value;
    const isAdmin = adminToken === "authenticated_admin_session";

    const body = await req.json().catch(() => ({}));
    const customerEmail = body.email?.trim().toLowerCase();

    // Verify ownership: must be admin OR matching customer email
    if (!isAdmin) {
      const orderEmail = (order.customer?.email || order.shippingAddress?.email || "").toLowerCase();
      if (!customerEmail || customerEmail !== orderEmail) {
        return NextResponse.json(
          { error: "Unauthorized. Valid customer email required to cancel this order." },
          { status: 403 }
        );
      }
    }

    // Orders that have shipped or delivered cannot be auto-cancelled
    if (order.status === "shipped" || order.status === "delivered") {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${order.status}. Please contact customer care.` },
        { status: 400 }
      );
    }

    if (order.status === "cancelled") {
      return NextResponse.json({
        message: "Order is already cancelled.",
        order,
      });
    }

    // Execute server-side automatic cancellation & refund
    const cancelledOrder = await cancelOrderAndProcessRefund({
      orderId: order.id,
      reason: body.reason || (isAdmin ? "Cancelled by administrator" : "Cancelled by customer"),
      cancelledBy: isAdmin ? "admin" : "customer",
    });

    return NextResponse.json({
      success: true,
      message:
        cancelledOrder?.paymentStatus === "refunded"
          ? "Order cancelled and automatic refund initiated successfully via Stripe."
          : "Order cancelled successfully.",
      order: cancelledOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel order.";
    console.error("Order cancellation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

