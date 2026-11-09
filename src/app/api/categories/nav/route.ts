import { NextResponse } from "next/server";
import { getNavigationMenu } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const nav = await getNavigationMenu();
    return NextResponse.json({ success: true, nav });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load navigation menu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
