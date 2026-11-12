import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Stripe Checkout Sessions have been deprecated. Use POST /api/stripe/create-payment-intent.",
    },
    { status: 410 }
  );
}

