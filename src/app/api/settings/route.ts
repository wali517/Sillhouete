import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSettings, updateSettings } from "@/lib/db";

const AUTH_COOKIE = "slh_admin_token";

export async function GET() {
  try {
    const settings = await getSettings();

    // Securely sanitize public settings response - never expose secret keys or admin password hash
    const sanitized = {
      ...settings,
      adminPasswordHash: undefined,
      stripeSecretKey: undefined,
      stripeSecretKeyConfigured: !!(process.env.STRIPE_SECRET_KEY || settings.stripeSecretKey),
    };
    delete (sanitized as Record<string, unknown>).stripeSecretKey;
    delete (sanitized as Record<string, unknown>).adminPasswordHash;

    return NextResponse.json({
      settings: sanitized,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    // Only authenticated administrators may modify store settings
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (token !== "authenticated_admin_session") {
      return NextResponse.json(
        { error: "Unauthorized. Administrator session required to modify settings." },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Prevent overwriting secret key via settings if configured in environment
    if (body.stripeSecretKey && process.env.STRIPE_SECRET_KEY) {
      delete body.stripeSecretKey;
    }

    const updated = await updateSettings(body);

    const sanitized = {
      ...updated,
      adminPasswordHash: undefined,
      stripeSecretKey: undefined,
      stripeSecretKeyConfigured: !!(process.env.STRIPE_SECRET_KEY || updated.stripeSecretKey),
    };
    delete (sanitized as Record<string, unknown>).stripeSecretKey;
    delete (sanitized as Record<string, unknown>).adminPasswordHash;

    return NextResponse.json({
      success: true,
      settings: sanitized,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
