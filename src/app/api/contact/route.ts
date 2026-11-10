import { NextResponse } from "next/server";
import { getContactMessages, saveContactMessage, getSettings } from "@/lib/db";
import { runSeedIfEmpty } from "@/lib/seed";
import { sendDiscountCodeEmail } from "@/lib/email";

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
      email: body.email.toLowerCase().trim(),
      phone: body.phone || "",
      subject: body.subject || "General Inquiry",
      message: body.message,
    });

    // Check if this inquiry is for a newsletter subscription or discount
    const isDiscountRequest =
      body.isDiscount ||
      (body.subject &&
        (body.subject.toLowerCase().includes("newsletter") ||
          body.subject.toLowerCase().includes("discount") ||
          body.subject.toLowerCase().includes("5% off") ||
          body.subject.toLowerCase().includes("10% off")));

    let hasActiveDiscount = false;

    if (isDiscountRequest) {
      try {
        const settings = await getSettings();
        const activeCodes = (settings.discountCodes || []).filter((d) => d.active);
        const activeDiscount = activeCodes.length > 0 ? activeCodes[0] : null;

        if (activeDiscount) {
          hasActiveDiscount = true;
          // Send the discount code email via nodemailer directly to user's inbox
          await sendDiscountCodeEmail({
            email: body.email.toLowerCase().trim(),
            code: activeDiscount.code,
            percent: activeDiscount.percent,
          });
        }
      } catch (emailErr) {
        console.warn("Discount email dispatch error:", emailErr);
      }
    }

    // Do NOT expose the discount code on the screen or in response JSON; delivered strictly to user's email
    return NextResponse.json({
      success: true,
      message,
      emailSent: hasActiveDiscount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
