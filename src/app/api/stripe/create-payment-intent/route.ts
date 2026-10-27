import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSettings } from "@/lib/db";

/** A real Stripe key is at least 50 chars and follows the pattern sk_test_XXX or sk_live_XXX */
function isRealStripeKey(key: string | undefined | null): boolean {
  if (!key) return false;
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) return false;
  // Real Stripe keys are 50+ chars. Placeholders are shorter or contain sequential chars.
  if (key.length < 40) return false;
  // Reject obvious placeholders like "sk_test_51234567890abcdefghijklmnopqrstuvwxyz"
  if (/^sk_test_\d{5}[0-9a-z]{20,}$/.test(key) && key.length < 60) return false;
  return true;
}

export async function POST(req: Request) {
  try {
    const { amount, currency = "pkr", items, customerEmail } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const settings = await getSettings();
    const envKey = process.env.STRIPE_SECRET_KEY;
    const dbKey = settings.stripeSecretKey;
    const secretKey = isRealStripeKey(envKey) ? envKey : isRealStripeKey(dbKey) ? dbKey : null;

    if (secretKey) {
      try {
        const stripe = new Stripe(secretKey, {
          apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
        });

        const processInPkr = currency.toLowerCase() === "pkr";
        const stripeCurrency = processInPkr ? "usd" : currency.toLowerCase();
        const amountInStripeCurrency = processInPkr
          ? Math.max(1, Math.round(Number(amount) / 280))
          : Number(amount);
        const stripeAmount = Math.round(amountInStripeCurrency * 100);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: stripeAmount,
          currency: stripeCurrency,
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
      } catch (stripeErr: unknown) {
        console.warn("Stripe API call failed, falling back to local test mode:", stripeErr);
        // Fall back to local test mock mode
        return NextResponse.json({
          clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2)}`,
          id: `pi_mock_${Date.now()}`,
          isLiveOrTestKey: false,
          message: "Running in local test mode (Stripe key inactive or in test mode).",
        });
      }
    }

    // Mock / demo mode — no valid Stripe key configured
    // The checkout still works in bank deposit mode; card payment shows helpful message.
    return NextResponse.json({
      clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2)}`,
      id: `pi_mock_${Date.now()}`,
      isLiveOrTestKey: false,
      message: "Stripe not configured. Add your real sk_test_... key in Admin → Settings → Payment.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Stripe payment initialization failed";
    console.error("Stripe error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
