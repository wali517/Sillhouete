import { NextResponse } from "next/server";
import { getCustomers } from "@/lib/db";

export async function GET() {
  try {
    const customers = await getCustomers();
    return NextResponse.json({ customers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch customers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
