import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrder extends Document {
  id: string;
  orderNumber: string;
  createdAt: Date;
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
  }>;
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode?: string;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes?: string;
  trackingNumber?: string;
  courier?: string;
  stripePaymentIntentId?: string;
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
        id: String,
        handle: String,
        title: String,
        price: Number,
        size: String,
        quantity: Number,
        image: String,
        dupatta: String,
        adOn: String,
      },
    ],
    subtotal: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountCode: String,
    total: { type: Number, default: 0 },
    currency: { type: String, default: "PKR" },
    paymentMethod: { type: String, default: "cod" },
    paymentStatus: { type: String, default: "pending" },
    status: { type: String, default: "pending" },
    notes: String,
    trackingNumber: String,
    courier: String,
    stripePaymentIntentId: String,
  },
  { timestamps: true }
);

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
