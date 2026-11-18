import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPage extends Document {
  slug: string;
  title: string;
  html: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PageSchema = new Schema<IPage>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    html: { type: String, required: true },
  },
  { timestamps: true }
);

export const PageModel: Model<IPage> =
  mongoose.models.Page || mongoose.model<IPage>("Page", PageSchema);

