import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlogPost extends Document {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  readTime: string;
  createdAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: "" },
    content: { type: String, required: true },
    coverImage: { type: String, default: "" },
    author: { type: String, default: "Sillhouete Editorial" },
    publishedAt: { type: String },
    category: { type: String, default: "Fashion & Style" },
    tags: [{ type: String }],
    readTime: { type: String, default: "5 min read" },
  },
  { timestamps: true }
);

export const BlogPostModel: Model<IBlogPost> =
  mongoose.models.BlogPost ||
  mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);
