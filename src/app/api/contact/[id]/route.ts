import { NextResponse } from "next/server";
import { deleteContactMessage, updateMessageStatus } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

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
