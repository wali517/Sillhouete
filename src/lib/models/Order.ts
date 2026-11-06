import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrder extends Document {
  id: string;
  orderNumber: string;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    id: string;
    handle: string;
    title: string;
    price: number;
    size: string;
    quantity: number;
    image: string;
    dupatta?: string;
    adOn?: string;
    customSizeNote?: string;
  }>;
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode?: string;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: "pending" | "processing" | "succeeded" | "paid" | "failed" | "cancelled" | "partially_refunded" | "refunded";
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  trackingNumber?: string;
  courier?: string;
  trackingUrl?: string;
  shippingDate?: Date;
  estimatedDeliveryDate?: string;

  // Stripe Payment History & Auditing Fields
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  stripeEventIds?: string[];
  amountPaid?: number;
  paidAt?: Date;
  paymentDetails?: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    funding?: string;
  };
  failureReason?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  refundAmount?: number;
  refundStatus?: "none" | "pending" | "processing" | "partially_refunded" | "refunded" | "refund_failed";
  refundId?: string;
  refundedAt?: Date;
  refundFailureReason?: string;
  paymentTimeline?: Array<{
    title: string;
    date: string;
    details?: string;
  }>;
  refundTimeline?: Array<{
    title: string;
    date: string;
    details?: string;
    amount?: number;
    refundId?: string;
  }>;
}

const OrderSchema = new Schema<IOrder>(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, index: true },
      phone: { type: String, default: "" },
    },
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
      address: { type: String, required: true },
      apartment: String,
      city: { type: String, required: true },
      state: String,
      postalCode: { type: String, default: "" },
      country: { type: String, required: true },
    },
    billingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      apartment: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    items: [
      {
        id: { type: String, required: true },
        handle: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String, default: "" },
        dupatta: String,
        adOn: String,
        customSizeNote: { type: String, default: "" },
      },
    ],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountCode: String,
    total: { type: Number, required: true },
    currency: { type: String, default: "PKR" },
    paymentMethod: { type: String, default: "stripe" },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "succeeded", "paid", "failed", "cancelled", "partially_refunded", "refunded"],
      default: "pending",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    notes: String,
    trackingNumber: String,
    courier: String,
    trackingUrl: String,
    shippingDate: Date,
    estimatedDeliveryDate: String,

    // Stripe transaction records
    stripeSessionId: { type: String, index: true },
    stripePaymentIntentId: { type: String, index: true },
    stripeCustomerId: String,
    stripeEventIds: [{ type: String }],
    amountPaid: Number,
    paidAt: Date,
    paymentDetails: {
      brand: String,
      last4: String,
      expMonth: Number,
      expYear: Number,
      funding: String,
    },
    failureReason: String,
    cancellationReason: String,
    cancelledAt: Date,
    refundAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "processing", "partially_refunded", "refunded", "refund_failed"],
      default: "none",
    },
    refundId: String,
    refundedAt: Date,
    refundFailureReason: String,
    paymentTimeline: [
      {
        title: { type: String, required: true },
        date: { type: String, required: true },
        details: String,
      },
    ],
    refundTimeline: [
      {
        title: { type: String, required: true },
        date: { type: String, required: true },
        details: String,
        amount: Number,
        refundId: String,
      },
    ],
  },
  { timestamps: true }
);

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
