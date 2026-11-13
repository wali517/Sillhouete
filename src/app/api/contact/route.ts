import { NextResponse } from "next/server";
import { getContactMessages, saveContactMessage, getSettings } from "@/lib/db";
import { sendDiscountCodeEmail, sendContactFormNotification, isValidEmail } from "@/lib/email";

export async function GET() {
  try {
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
    const cleanEmail = (body.email || "").toString().toLowerCase().trim();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    const name = (body.name || "Subscriber").toString().trim();
    const phone = (body.phone || "").toString().trim();
    const subject = (body.subject || (body.isDiscount ? "Newsletter Discount Voucher" : "Customer Inquiry")).toString().trim();
    const message = (body.message || (body.isDiscount ? "Subscribed to newsletter and requested discount voucher" : "Inquiry submitted")).toString().trim();

    // 1. Persist contact message in database
    const savedMessage = await saveContactMessage({
      name,
      email: cleanEmail,
      phone,
      subject,
      message,
    });

    // 2. Check if this request is for a newsletter subscription or discount voucher
    const isDiscountRequest =
      Boolean(body.isDiscount) ||
      subject.toLowerCase().includes("newsletter") ||
      subject.toLowerCase().includes("discount") ||
      subject.toLowerCase().includes("voucher") ||
      subject.toLowerCase().includes("5% off") ||
      subject.toLowerCase().includes("10% off");

    let hasActiveDiscount = false;
    let sentDiscountCode = "";

    if (isDiscountRequest) {
      try {
        const settings = await getSettings();
        const discountCodes = settings.discountCodes;

        let activeDiscount = (discountCodes || []).find((d) => d.active);

        // Fallback only if discountCodes was never configured in MongoDB
        if (!activeDiscount && (!discountCodes || discountCodes.length === 0)) {
          activeDiscount = { code: "WELCOME5", percent: 5, active: true };
        }

        // Only send voucher if discount is actively enabled!
        if (activeDiscount && activeDiscount.active !== false) {
          hasActiveDiscount = true;
          sentDiscountCode = activeDiscount.code;

          console.log(`🎟️ [DISCOUNT DISPATCH] Sending ${activeDiscount.percent}% voucher (${activeDiscount.code}) to ${cleanEmail}`);
          await sendDiscountCodeEmail({
            email: cleanEmail,
            code: activeDiscount.code,
            percent: activeDiscount.percent,
          });
        } else {
          console.log(`ℹ️ [DISCOUNT SKIPPED] No active discount code in settings.`);
        }
      } catch (emailErr) {
        console.warn("📧 [DISCOUNT EMAIL DISPATCH ERROR]:", emailErr);
      }
    } else {
      // For general customer inquiries, notify admin & send receipt auto-reply
      try {
        await sendContactFormNotification({
          name,
          email: cleanEmail,
          phone,
          subject,
          message,
        });
      } catch (contactEmailErr) {
        console.warn("📧 [CONTACT NOTIFICATION ERROR]:", contactEmailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: savedMessage,
      discountActive: hasActiveDiscount,
      discountSent: hasActiveDiscount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process request";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
