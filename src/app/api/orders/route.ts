import { NextResponse } from "next/server";
import { createOrder, getOrders } from "@/lib/db";
import { runSeedIfEmpty } from "@/lib/seed";

export async function GET(req: Request) {
  try {
    await runSeedIfEmpty();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const orders = await getOrders();

    if (email) {
      const filtered = orders.filter((o) => o.customer.email.toLowerCase() === email.toLowerCase());
      return NextResponse.json({ orders: filtered });
    }

    return NextResponse.json({ orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.items || !body.items.length) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    if (!body.shippingAddress || !body.shippingAddress.email) {
      return NextResponse.json({ error: "Shipping address with valid email is required" }, { status: 400 });
    }

    const order = await createOrder({
      customer: {
        name: `${body.shippingAddress.firstName} ${body.shippingAddress.lastName}`.trim(),
        email: body.shippingAddress.email,
        phone: body.shippingAddress.phone || "",
      },
      shippingAddress: body.shippingAddress,
      items: body.items,
      subtotal: Number(body.subtotal) || 0,
      shipping: Number(body.shipping) || 0,
      discount: Number(body.discount) || 0,
      discountCode: body.discountCode || "",
      total: Number(body.total) || 0,
      currency: body.currency || "PKR",
      paymentMethod: body.paymentMethod || "cod",
      paymentStatus: body.paymentStatus || (body.paymentMethod === "stripe" ? "paid" : "pending"),
      status: "pending",
      notes: body.notes || "",
      stripePaymentIntentId: body.stripePaymentIntentId,
    });

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
