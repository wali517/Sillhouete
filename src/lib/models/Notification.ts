import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "order_confirmation"
  | "payment_failure"
  | "order_cancellation"
  | "refund_initiated"
  | "refund_successful"
  | "refund_failed"
  | "shipping_update"
  | "login_alert"
  | "password_reset"
  | "profile_updated"
  | "contact_form"
  | "discount_code"
  | "support_reply";

export type NotificationDeliveryStatus = "sent" | "failed" | "simulated" | "queued";

export interface INotification extends Document {
  id: string;
  orderId?: string;
  orderNumber?: string;
  type: NotificationType;
  recipient: string;
  subject: string;
  html: string;
  text?: string;
  status: NotificationDeliveryStatus;
  messageId?: string;
  attempts: number;
  lastError?: string;
  sentAt?: Date;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, index: true },
    orderNumber: { type: String, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        "order_confirmation",
        "payment_failure",
        "order_cancellation",
        "refund_initiated",
        "refund_successful",
        "refund_failed",
        "shipping_update",
        "login_alert",
        "password_reset",
        "profile_updated",
        "contact_form",
        "discount_code",
        "support_reply",
      ],
      index: true,
    },
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    html: { type: String, required: true },
    text: String,
    status: {
      type: String,
      enum: ["sent", "failed", "simulated", "queued"],
      default: "queued",
      index: true,
    },
    messageId: String,
    attempts: { type: Number, default: 0 },
    lastError: String,
    sentAt: Date,
    idempotencyKey: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

export const NotificationModel: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

