import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStripeEvent extends Document {
  eventId: string;
  eventType: string;
  orderId?: string;
  sessionId?: string;
  paymentIntentId?: string;
  processedAt: Date;
}

const StripeEventSchema = new Schema<IStripeEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true },
    orderId: { type: String, index: true },
    sessionId: { type: String, index: true },
    paymentIntentId: { type: String, index: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const StripeEventModel: Model<IStripeEvent> =
  mongoose.models.StripeEvent ||
  mongoose.model<IStripeEvent>("StripeEvent", StripeEventSchema);

