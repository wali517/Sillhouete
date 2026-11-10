import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createOrder, getOrders, validateAndCalculateOrder } from "@/lib/db";
import type { PaymentMethod } from "@/types";

const AUTH_COOKIE = "slh_admin_token";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const limit = parseInt(searchParams.get("limit") ?? "0", 10);

    // Check if requester is an authenticated administrator
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    const isAdmin = token === "authenticated_admin_session";

    const orders = await getOrders(limit > 0 ? limit : undefined);

    if (email) {
      const normalized = email.toLowerCase().trim();
      const filtered = orders.filter(
        (o) => o.customer.email.toLowerCase().trim() === normalized
      );
      return NextResponse.json({ orders: filtered });
    }

    // Unauthenticated requests are not permitted to dump all store orders
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication or customer email query parameter required." },
        { status: 401 }
      );
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

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item." },
        { status: 400 }
      );
    }

    const shipping = body.shippingAddress;
    if (
      !shipping ||
      !shipping.firstName?.trim() ||
      !shipping.lastName?.trim() ||
      !shipping.email?.trim() ||
      !shipping.address?.trim() ||
      !shipping.city?.trim()
    ) {
      return NextResponse.json(
        { error: "Complete shipping address with name, email, street address, and city is required." },
        { status: 400 }
      );
    }

    // ─── STRICT SERVER-SIDE CALCULATION ─────────────────────────────────────
    // NEVER trust product price, subtotal, shipping fee, discount, total, or payment status
    // sent from client. Calculate authoritative totals against database products.
    const calculated = await validateAndCalculateOrder(body.items, body.discountCode);

    // Normalize payment method
    let paymentMethod: PaymentMethod = "stripe";
    if (body.paymentMethod === "bank_transfer" || body.paymentMethod === "bank_deposit") {
      paymentMethod = "bank_transfer";
    } else if (body.paymentMethod === "cod") {
      paymentMethod = "cod";
    } else {
      paymentMethod = "stripe";
    }

    // ─── NEVER MARK AS PAID BEFORE STRIPE VERIFICATION ───────────────────────
    // Initial status for ALL new orders must be "pending".
    // Payment status is ONLY updated to "paid" by the verified Stripe webhook.
    const initialPaymentStatus = "pending";

    const customerName = `${shipping.firstName} ${shipping.lastName}`.trim();
    const customerEmail = shipping.email.toLowerCase().trim();
    const customerPhone = (shipping.phone || "").trim();

    const order = await createOrder({
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      shippingAddress: {
        firstName: shipping.firstName.trim(),
        lastName: shipping.lastName.trim(),
        email: customerEmail,
        phone: customerPhone,
        address: shipping.address.trim(),
        apartment: shipping.apartment?.trim() || "",
        city: shipping.city.trim(),
        state: shipping.state?.trim() || "",
        postalCode: shipping.postalCode?.trim() || "",
        country: shipping.country?.trim() || "Pakistan",
      },
      billingAddress: body.billingAddress
        ? {
            firstName: body.billingAddress.firstName?.trim() || shipping.firstName.trim(),
            lastName: body.billingAddress.lastName?.trim() || shipping.lastName.trim(),
            email: (body.billingAddress.email || customerEmail).toLowerCase().trim(),
            phone: (body.billingAddress.phone || customerPhone).trim(),
            address: body.billingAddress.address?.trim() || shipping.address.trim(),
            apartment: body.billingAddress.apartment?.trim() || "",
            city: body.billingAddress.city?.trim() || shipping.city.trim(),
            state: body.billingAddress.state?.trim() || "",
            postalCode: body.billingAddress.postalCode?.trim() || "",
            country: body.billingAddress.country?.trim() || "Pakistan",
          }
        : undefined,
      items: calculated.items,
      subtotal: calculated.subtotal,
      shipping: calculated.shipping,
      discount: calculated.discount,
      discountCode: calculated.discountCode,
      total: calculated.total,
      currency: calculated.currency,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      status: "pending",
      notes: typeof body.notes === "string" ? body.notes.slice(0, 500) : "",
    });

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create order";
    console.error("Order creation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
