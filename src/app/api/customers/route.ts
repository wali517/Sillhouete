import { NextResponse } from "next/server";
import { getCustomers } from "@/lib/db";
import { runSeedIfEmpty } from "@/lib/seed";

export async function GET() {
  try {
    await runSeedIfEmpty();
    const customers = await getCustomers();
    return NextResponse.json({ customers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch customers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
