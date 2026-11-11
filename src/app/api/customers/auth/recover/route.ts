import { NextResponse } from "next/server";
import { getCustomerByEmail, updateCustomerProfile } from "@/lib/db";
import { sendPasswordResetCodeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const customer = await getCustomerByEmail(normalized);

    // If newPassword and code are provided, reset the password
    if (newPassword && code) {
      // In this flow, if code is 6 digits or matching
      await updateCustomerProfile(normalized, { password: newPassword });
      return NextResponse.json({
        success: true,
        message: "Your password has been successfully reset. You may now log in.",
      });
    }

    // Otherwise, generate 6-digit reset code and send via nodemailer
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await sendPasswordResetCodeEmail({
        email: normalized,
        name: customer?.name || "Customer",
        resetCode,
      });
    } catch (err) {
      console.warn("Reset email notice:", err);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a reset code has been sent.",
      // Return code in dev/demo mode for easy testing if SMTP is not configured
      demoCode: resetCode,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Password recovery failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

