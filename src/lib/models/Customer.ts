import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  ordersCount: number;
  totalSpent: number;
  addresses?: Array<{
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
  }>;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, default: "" },
    ordersCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    addresses: [
      {
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
    ],
  },
  { timestamps: true }
);

export const CustomerModel: Model<ICustomer> =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);
