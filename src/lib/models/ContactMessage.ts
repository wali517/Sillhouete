import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContactMessage extends Document {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: "unread" | "read" | "replied";
  replyNotes?: string;
  createdAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String },
    subject: { type: String, default: "General Inquiry" },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["unread", "read", "replied"],
      default: "unread",
    },
    replyNotes: { type: String },
  },
  { timestamps: true }
);

export const ContactMessageModel: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);
