import { NextResponse } from "next/server";
import { deleteContactMessage, updateMessageStatus } from "@/lib/db";
import { sendCustomerReplyEmail } from "@/lib/email";

type Props = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { to, customerName, subject, replyText, originalMessage } = body;

    if (!to || !replyText?.trim()) {
      return NextResponse.json({ error: "Customer email and reply message are required" }, { status: 400 });
    }

    // 1. Send direct email to customer
    const emailResult = await sendCustomerReplyEmail({
      to,
      customerName,
      subject: subject || "Response from Sillhouete Support",
      replyText: replyText.trim(),
      originalMessage,
    });

    // 2. Mark message as replied and persist note
    const updated = await updateMessageStatus(id, "replied", replyText.trim());

    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        warning: `Email sending issue: ${emailResult.error || "Please verify SMTP credentials in Admin Settings"}`,
        message: updated,
      });
    }

    return NextResponse.json({ success: true, message: updated, emailResult });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateMessageStatus(id, body.status, body.replyNotes);
    if (!updated) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const deleted = await deleteContactMessage(id);
    if (!deleted) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
