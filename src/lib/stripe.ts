import Stripe from "stripe";

let stripeServerInstance: Stripe | null = null;

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
  "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

/**
 * Checks whether Stripe Test Mode is enforced.
 * Defaults to TRUE for strict safety. Live mode must never run unless explicitly permitted.
 */
export function isStripeTestMode(): boolean {
  return process.env.STRIPE_TEST_MODE !== "false";
}

/**
 * Validates Stripe configuration for strict Test Mode safety.
 * Rejects live keys and mismatched key types.
 */
export function validateStripeTestConfig(): { valid: boolean; error?: string } {
  const testMode = isStripeTestMode();
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

  if (testMode) {
    if (secretKey.startsWith("sk_live_") || pubKey.startsWith("pk_live_")) {
      return {
        valid: false,
        error:
          "Stripe Live Mode is strictly disabled. Current configuration requires Stripe TEST MODE only. Replace sk_live_ / pk_live_ with test credentials (sk_test_ / pk_test_).",
      };
    }
  }

  if (secretKey && pubKey) {
    const isSecretTest = secretKey.startsWith("sk_test_");
    const isPubTest = pubKey.startsWith("pk_test_");
    if (isSecretTest !== isPubTest) {
      return {
        valid: false,
        error: `Stripe key mode mismatch: Secret Key is ${isSecretTest ? "test" : "live"} mode while Publishable Key is ${isPubTest ? "test" : "live"} mode. Both must match.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Resolves the server-side Stripe secret key.
 * Checks process.env.STRIPE_SECRET_KEY first, and falls back to
 * MongoDB SiteSettings if not defined (crucial for live Vercel deployments
 * where environment variables might not yet be configured).
 */
export async function resolveStripeSecretKey(): Promise<string> {
  if (process.env.STRIPE_SECRET_KEY) {
    return process.env.STRIPE_SECRET_KEY;
  }
  try {
    const { getSettings } = await import("./db");
    const settings = await getSettings();
    if (settings.stripeSecretKey) {
      process.env.STRIPE_SECRET_KEY = settings.stripeSecretKey;
      return settings.stripeSecretKey;
    }
  } catch (err) {
    console.warn("[Stripe] Failed to fallback to MongoDB settings for secret key:", err);
  }
  return "";
}

/**
 * Returns a configured server-side Stripe SDK instance.
 * Throws an explicit error if STRIPE_SECRET_KEY is missing, invalid, or violates Test Mode.
 */
export function getStripeServer(): Stripe {
  const testMode = isStripeTestMode();
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not defined. Please set STRIPE_SECRET_KEY in Vercel Environment Variables or in .env.local."
    );
  }

  if (testMode && secretKey.startsWith("sk_live_")) {
    throw new Error(
      "Stripe Live Mode is strictly disabled. Project configuration requires Stripe TEST MODE only (STRIPE_TEST_MODE=true). Please provide a test secret key starting with 'sk_test_'."
    );
  }

  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    throw new Error(
      "Invalid STRIPE_SECRET_KEY format. Key must start with 'sk_test_'."
    );
  }

  // Validate mode matching with publishable key if present
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (pubKey && testMode && pubKey.startsWith("pk_live_")) {
    throw new Error(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is in Live mode (pk_live_) while project is restricted to Stripe TEST MODE. Please use a test key (pk_test_)."
    );
  }

  if (!stripeServerInstance) {
    stripeServerInstance = new Stripe(secretKey, {
      apiVersion: "2026-09-30.endive" as Stripe.LatestApiVersion,
      appInfo: {
        name: "Sillhouete Ecommerce",
        version: "1.0.0",
      },
    });
  }

  return stripeServerInstance;
}

/**
 * Returns the Stripe Webhook Signing Secret.
 */
export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not configured in environment variables. Required for webhook signature verification."
    );
  }
  return secret;
}

/**
 * Resolves the application base URL for Stripe redirect return_urls.
 */
export function getSiteUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (req) {
    const origin = req.headers.get("origin") || req.headers.get("host");
    if (origin) {
      const protocol = origin.includes("localhost") ? "http" : "https";
      const host = origin.replace(/^[a-zA-Z]+:\/\//, "");
      return `${protocol}://${host}`.replace(/\/+$/, "");
    }
  }
  return "http://localhost:3000";
}

/**
 * Converts a standard currency amount (e.g. 37900 PKR or 10.50 USD)
 * to Stripe's required smallest currency unit (e.g. 3790000 paisas or 1050 cents).
 */
export function toStripeAmount(amount: number, currency: string): number {
  const upper = currency.toUpperCase().trim();
  if (ZERO_DECIMAL_CURRENCIES.has(upper)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

/**
 * Converts Stripe's smallest currency unit back to standard amount.
 */
export function fromStripeAmount(stripeAmount: number, currency: string): number {
  const upper = currency.toUpperCase().trim();
  if (ZERO_DECIMAL_CURRENCIES.has(upper)) {
    return stripeAmount;
  }
  return stripeAmount / 100;
}

