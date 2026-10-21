import { NextResponse } from "next/server";
import { getContactMessages, saveContactMessage } from "@/lib/db";

export async function GET() {
  try {
    const messages = await getContactMessages();
    return NextResponse.json({ messages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch contact messages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: "Name, email, and message are required fields" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const saved = await saveContactMessage({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || "",
      subject: body.subject?.trim() || "Customer Inquiry",
      message: body.message.trim(),
    });

    return NextResponse.json({ success: true, message: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
