# Stripe Checkout Integration Guide

This document is the reference guide for the production-ready Stripe Embedded Checkout integration on Sillhouete.

## Architecture Overview

The payment system uses **Stripe Embedded Checkout Sessions** (`ui_mode: "embedded"`) with server-side validation and automated webhook verification:

1. **Customer Checkout Submission**: The customer fills out delivery information on `/checkout`.
2. **Server-Side Validation**: `/api/orders` verifies product availability, stock, and calculates subtotal, discounts, and shipping fee server-side.
3. **Pending Order Stored**: An order with `paymentStatus: "pending"` is created in MongoDB Atlas.
4. **Checkout Session Creation**: `/api/stripe/create-checkout-session` generates a Stripe Embedded Checkout session with smallest currency units (`paisas` for PKR, `cents` for USD) and associates `session.id` with the MongoDB order.
5. **Embedded Checkout Rendered**: The `@stripe/react-stripe-js` component mounts the payment form directly into the checkout page.
6. **Payment & Redirect**: The customer enters card details and completes payment. Stripe redirects to `/order-confirmation/{orderId}?session_id={CHECKOUT_SESSION_ID}`.
7. **Webhook Verification**: `/api/stripe/webhook` verifies the raw Stripe webhook signature using `stripe.webhooks.constructEvent()`, validates amount and currency, enforces event idempotency via `StripeEventModel`, marks the order as `"paid"`, saves transaction metadata, and dispatches customer confirmation email.
8. **Admin Dashboard & Refunds**: `/admin/orders` and `/admin/orders/[id]` display full payment history and allow authorized administrators to issue partial or full refunds via Stripe Server SDK.

---

## Required Environment Variables

Configure in `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Security Note**: Never commit live or real test keys (`sk_test_...` / `sk_live_...`) to version control. If a key was previously committed to git, rotate it in the Stripe Dashboard immediately.

---

## Testing Credit Card Numbers (Stripe Test Mode)

Use official Stripe test card numbers:
- **Card Number**: `4242 4242 4242 4242`
- **Expiration Date**: Any future date (e.g., `12/30`)
- **CVC**: Any 3 digits (e.g., `123`)
- **Postal Code**: Any valid postal code (e.g., `54000` or `10001`)

---

## Local Webhook Testing with Stripe CLI

1. Install the Stripe CLI or use portable binary:
   ```bash
   stripe login
   ```
2. Forward events to the local webhook endpoint:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Copy the output signing secret (`whsec_...`) and update `STRIPE_WEBHOOK_SECRET` in `.env.local`.
4. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   ```
