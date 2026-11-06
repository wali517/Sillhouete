import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICollection extends Document {
  handle: string;
  title: string;
  description?: string;
  image?: string;
  productCount?: number;
  isMainCategory?: boolean;
  parentHandle?: string;
  showOnHomepage?: boolean;
  order?: number;
}

const CollectionSchema = new Schema<ICollection>(
  {
    handle: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    productCount: { type: Number, default: 0 },
    isMainCategory: { type: Boolean, default: false },
    parentHandle: { type: String, default: "" },
    showOnHomepage: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CollectionModel: Model<ICollection> =
  mongoose.models.Collection ||
  mongoose.model<ICollection>("Collection", CollectionSchema);

