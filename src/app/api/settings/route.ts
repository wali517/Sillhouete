import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";

export async function GET() {
  try {
    const settings = await getSettings();
    // Don't leak raw admin password or full secret key in public get
    return NextResponse.json({
      settings: {
        ...settings,
        adminPasswordHash: undefined,
        stripeSecretKeyConfigured: !!(process.env.STRIPE_SECRET_KEY || settings.stripeSecretKey),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateSettings(body);
    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        adminPasswordHash: undefined,
        stripeSecretKeyConfigured: !!(process.env.STRIPE_SECRET_KEY || updated.stripeSecretKey),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
