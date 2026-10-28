import { NextResponse } from "next/server";
import { runSeedIfEmpty } from "@/lib/seed";

export async function GET() {
  try {
    await runSeedIfEmpty();
    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
