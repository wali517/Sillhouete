import { NextResponse } from "next/server";
import { getOrderById, validateAndCalculateOrder, recordOrderPaymentAttempt } from "@/lib/db";
import { getStripeServer, toStripeAmount, validateStripeTestConfig, resolveStripeSecretKey } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    // Resolve secret key: checks process.env first, falls back to MongoDB settings if on Vercel
    await resolveStripeSecretKey();

    const configCheck = validateStripeTestConfig();
    if (!configCheck.valid) {
      console.error("[Stripe Test Mode Policy Violation]:", configCheck.error);
      return NextResponse.json(
        { error: configCheck.error, isConfigError: true, keyType: "test_mode" },
        { status: 500 }
      );
    }
    const body = await req.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Valid orderId is required to initialize payment." },
        { status: 400 }
      );
    }

    // Retrieve order directly from MongoDB - NEVER trust client amounts
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found. Please initiate checkout again." },
        { status: 404 }
      );
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "This order has already been paid." },
        { status: 400 }
      );
    }

    // Re-verify server calculations to ensure data integrity
    const validated = await validateAndCalculateOrder(
      order.items.map((i) => ({
        id: i.id,
        handle: i.handle,
        size: i.size,
        quantity: i.quantity,
        dupatta: i.dupatta,
        adOn: i.adOn,
      })),
      order.discountCode
    );

    if (Math.abs(validated.total - order.total) > 1) {
      return NextResponse.json(
        { error: "Order total discrepancy detected. Please refresh your cart." },
        { status: 400 }
      );
    }

    const stripe = getStripeServer();
    const currency = (order.currency || "PKR").toLowerCase();
    const stripeAmount = toStripeAmount(order.total, currency);

    // Guard: Stripe requires a minimum charge amount (≥ 50 cents USD equivalent)
    // For PKR, minimum is ~140 PKR (14000 paisas). Our products are well above this.
    if (stripeAmount < 14000 && currency === "pkr") {
      return NextResponse.json(
        { error: `Order total Rs. ${order.total} is below the minimum charge amount for Stripe (Rs. 140). Please contact store support.` },
        { status: 400 }
      );
    }

    // Create real Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency,
      receipt_email: order.customer.email,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customer.email,
        expectedAmount: order.total.toString(),
        currency: currency.toUpperCase(),
      },
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe did not return a valid client secret for PaymentIntent.");
    }

    // Save Stripe PaymentIntent ID and timeline against MongoDB order
    await recordOrderPaymentAttempt(order.id, paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to initialize Stripe PaymentIntent";
    console.error("[Stripe PaymentIntent Creation Error]:", message);

    const isApiKeyError =
      message.toLowerCase().includes("invalid api key") ||
      message.toLowerCase().includes("api_key") ||
      message.toLowerCase().includes("unauthorized") ||
      message.toLowerCase().includes("sk_live_") ||
      message.toLowerCase().includes("sk_test_");

    if (isApiKeyError) {
      console.error(
        "[Stripe Configuration Error]: Your STRIPE_SECRET_KEY in .env.local was rejected by Stripe API (Invalid / Expired Key). Please copy an active secret key from https://dashboard.stripe.com/apikeys into .env.local as STRIPE_SECRET_KEY."
      );
      return NextResponse.json(
        {
          error: "Card payment service is temporarily unavailable due to server payment gateway configuration.",
          isConfigError: true,
          keyType: "secret",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
