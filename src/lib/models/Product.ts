import mongoose, { Schema, type Model } from "mongoose";

const ProductSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    handle: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    priceFrom: { type: Boolean, default: false },
    image: { type: String, default: "" },
    hoverImage: { type: String, default: "" },
    images: [{ type: String }],
    alt: { type: String, default: "" },
    ratio: { type: Number, default: 1.5 },
    isNew: { type: Boolean, default: false },
    isSale: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    category: { type: String, default: "Luxury Pret" },
    description: { type: String, default: "" },
    inStock: { type: Boolean, default: true },
    sizes: [{ type: String }],
    fabric: { type: String },
    sku: { type: String },
    color: { type: String },
    fabricDetail: { shirt: String, trousers: String, dupatta: String },
    priceIncludes: [{ type: String }],
    customization: { sizeCustomization: String, colourCustomization: String },
    rating: { type: Number },
    reviewCount: { type: Number },
    dupattaOptions: [{ type: String }],
    adOnOptions: [{ type: String }],
    videoId: { type: String },
    videoUrl: { type: String },
    variants: [{ id: String, title: String, price: Number, sku: String, option1: String, option2: String, option3: String }],
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export const ProductModel: Model<mongoose.Document> =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
