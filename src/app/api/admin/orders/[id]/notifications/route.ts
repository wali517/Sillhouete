import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { NotificationModel } from "@/lib/models/Notification";
import { sendEmail } from "@/lib/email";
import connectDB from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const AUTH_COOKIE = "slh_admin_token";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (token !== "authenticated_admin_session") {
      return NextResponse.json(
        { error: "Unauthorized. Administrator session required." },
        { status: 401 }
      );
    }

    await connectDB();
    const notifications = await NotificationModel.find({
      $or: [{ orderId: id }, { orderNumber: id }],
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        orderId: n.orderId,
        orderNumber: n.orderNumber,
        type: n.type,
        recipient: n.recipient,
        subject: n.subject,
        status: n.status,
        messageId: n.messageId,
        attempts: n.attempts,
        lastError: n.lastError,
        sentAt: n.sentAt ? n.sentAt.toISOString() : undefined,
        createdAt: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch notification history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (token !== "authenticated_admin_session") {
      return NextResponse.json(
        { error: "Unauthorized. Administrator session required to retry notifications." },
        { status: 401 }
      );
    }

    const { notificationId } = await req.json();
    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId is required to retry delivery." },
        { status: 400 }
      );
    }

    await connectDB();
    const notif = await NotificationModel.findOne({ id: notificationId });
    if (!notif) {
      return NextResponse.json(
        { error: "Notification record not found." },
        { status: 404 }
      );
    }

    // Attempt delivery via Nodemailer
    const result = await sendEmail({
      to: notif.recipient,
      subject: notif.subject,
      html: notif.html,
      text: notif.text,
    });

    notif.attempts = (notif.attempts || 0) + 1;
    notif.status = result.status;
    notif.messageId = result.messageId;
    notif.lastError = result.error;
    if (result.status === "sent") {
      notif.sentAt = new Date();
    }

    await notif.save();

    return NextResponse.json({
      success: result.success,
      status: result.status,
      message:
        result.status === "sent"
          ? "Notification sent successfully."
          : `Delivery failed: ${result.error || "Could not dispatch email."}`,
      notification: {
        id: notif.id,
        status: notif.status,
        attempts: notif.attempts,
        lastError: notif.lastError,
        sentAt: notif.sentAt?.toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retry notification delivery.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

