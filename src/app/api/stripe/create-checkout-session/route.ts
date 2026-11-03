import { NextResponse } from "next/server";

/**
 * Stripe Checkout Sessions have been deprecated in Sillhouete.
 * Payment is processed exclusively using direct Stripe Elements + PaymentIntent
 * via POST /api/stripe/create-payment-intent on the checkout page.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Stripe Checkout Sessions have been deprecated. Use POST /api/stripe/create-payment-intent.",
    },
    { status: 410 }
  );
}

