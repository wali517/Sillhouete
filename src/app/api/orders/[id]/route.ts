import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrderById, updateOrderStatus } from "@/lib/db";

const AUTH_COOKIE = "slh_admin_token";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Only authenticated administrators may update order statuses manually
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (token !== "authenticated_admin_session") {
      return NextResponse.json(
        { error: "Unauthorized. Administrator session required to modify order." },
        { status: 401 }
      );
    }

    const {
      status,
      paymentStatus,
      trackingNumber,
      courier,
      trackingUrl,
      shippingDate,
      estimatedDeliveryDate,
    } = await req.json();
    const updated = await updateOrderStatus(id, {
      status,
      paymentStatus,
      trackingNumber,
      courier,
      trackingUrl,
      shippingDate: shippingDate ? new Date(shippingDate) : undefined,
      estimatedDeliveryDate,
    });

    if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, order: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
