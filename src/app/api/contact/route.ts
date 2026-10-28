import { NextResponse } from "next/server";
import { getContactMessages, saveContactMessage } from "@/lib/db";
import { runSeedIfEmpty } from "@/lib/seed";

export async function GET() {
  try {
    await runSeedIfEmpty();
    const messages = await getContactMessages();
    return NextResponse.json({ messages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch messages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }
    const message = await saveContactMessage({
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      subject: body.subject || "General Inquiry",
      message: body.message,
    });
    return NextResponse.json({ success: true, message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
