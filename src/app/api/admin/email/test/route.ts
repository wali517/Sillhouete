import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendEmail, verifySmtpConnection } from "@/lib/email";

export const dynamic = "force-dynamic";

const AUTH_COOKIE = "slh_admin_token";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (token !== "authenticated_admin_session") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const verification = await verifySmtpConnection();
    return NextResponse.json(verification);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to verify SMTP.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (token !== "authenticated_admin_session") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const recipient = body.recipient?.trim();

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient email is required for test email." },
        { status: 400 }
      );
    }

    const testSubject = "SILLHOUETE – Live SMTP Email Verification Test";
    const testHtml = `
      <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; padding: 28px; color: #1a1a1a; border: 1px solid #e5e5e5; background: #ffffff;">
        <h2 style="font-size: 22px; font-weight: normal; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 16px; color: #111;">
          SILLHOUETE
        </h2>
        <div style="background: #e8f5e9; border: 1px solid #c8e6c9; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; color: #2e7d32;">
          <strong>✓ SMTP Email Verification Successful!</strong><br />
          Your automated email notification system is properly connected and functioning.
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #444;">
          This message confirms that your store email delivery settings (via Gmail / SMTP) are actively dispatching notifications to customers.
        </p>
        <p style="font-size: 13px; color: #777; margin-top: 24px; border-top: 1px solid #eee; padding-top: 14px;">
          Sent on: ${new Date().toLocaleString()} (PKT)
        </p>
      </div>
    `;

    const result = await sendEmail({
      to: recipient,
      subject: testSubject,
      html: testHtml,
      text: "SILLHOUETE - SMTP Email Verification Successful! Your email system is working properly.",
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to deliver test email.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Test email successfully sent to ${recipient}!`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send test email.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

