import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSettings } from "@/lib/db";

function isRealStripeKey(key: string | undefined | null): boolean {
  if (!key) return false;
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) return false;
  if (key.length < 40) return false;
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

        const url = new URL(req.url);
        const origin = url.origin || "https://sillhouete.com";

        // Create Checkout Session for the Embedded Form SDK
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          ui_mode: "form",
          line_items: [
            {
              price_data: {
                currency: stripeCurrency,
                product_data: {
                  name: "Sillhouete Order",
                  description:
                    Array.isArray(items) && items.length > 0
                      ? items.map((i: { title: string }) => i.title).join(", ").slice(0, 200)
                      : "Sillhouete Designer Wear",
                },
                unit_amount: stripeAmount,
              },
              quantity: 1,
            },
          ],
          customer_email: customerEmail || undefined,
          billing_address_collection: "required",
          name_collection: {
            individual: {
              enabled: true,
              optional: true,
            },
          },
          submit_type: "pay",
          return_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        });

        return NextResponse.json({
          client_secret: session.client_secret,
          sessionId: session.id,
          isLiveOrTestKey: true,
        });
      } catch (stripeErr: unknown) {
        console.warn("Stripe Checkout Session notice:", stripeErr);
        return NextResponse.json({
          client_secret: `cs_slh_${Date.now()}_secret_${Math.random().toString(36).substring(2)}`,
          sessionId: `cs_slh_${Date.now()}`,
          isLiveOrTestKey: false,
          error: stripeErr instanceof Error ? stripeErr.message : "Stripe session error",
        });
      }
    }

    return NextResponse.json({
      client_secret: `cs_slh_${Date.now()}_secret_${Math.random().toString(36).substring(2)}`,
      sessionId: `cs_slh_${Date.now()}`,
      isLiveOrTestKey: false,
      message: "Stripe key not configured or in standby mode.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

