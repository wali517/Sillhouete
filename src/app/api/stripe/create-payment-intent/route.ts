import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSettings } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { amount, currency = "pkr", items, customerEmail } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const settings = await getSettings();
    const secretKey = process.env.STRIPE_SECRET_KEY || settings.stripeSecretKey;

    if (secretKey && secretKey.startsWith("sk_")) {
      const stripe = new Stripe(secretKey, {
        apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
      });

      // Stripe requires amount in smallest currency unit (e.g. cents, or full rupees if zero-decimal)
      // For PKR, Stripe treats PKR as a 2-decimal currency (100 paisas = 1 PKR) or USD in cents.
      const multiplier = 100;
      const stripeAmount = Math.round(Number(amount) * multiplier);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: currency.toLowerCase(),
        receipt_email: customerEmail,
        metadata: {
          store: "Sillhouete",
          customerEmail: customerEmail || "",
          itemCount: Array.isArray(items) ? items.length.toString() : "0",
        },
        automatic_payment_methods: { enabled: true },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
        isLiveOrTestKey: true,
      });
    }

    // In test/demo mode when no secret key is set yet, return simulated client secret
    // This allows testing the direct on-page card payment flow without blocking the user!
    return NextResponse.json({
      clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2)}`,
      id: `pi_mock_${Date.now()}`,
      isLiveOrTestKey: false,
      message: "Test mode enabled: Use standard card 4242 4242 4242 4242 to complete checkout. Add STRIPE_SECRET_KEY in Admin > Settings or .env to enable live gateway.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Stripe payment initialization failed";
    console.error("Stripe error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
