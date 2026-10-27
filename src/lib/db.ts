/**
 * db.ts â€” MongoDB-backed data layer for Sillhouete
 * Drop-in replacement for the previous JSON flat-file implementation.
 * All public function signatures are identical so no other file needs changing.
 */

import connectDB from "./mongodb";
import { ProductModel } from "./models/Product";
import { OrderModel } from "./models/Order";
import { CustomerModel } from "./models/Customer";
import { ContactMessageModel } from "./models/ContactMessage";
import { BlogPostModel } from "./models/BlogPost";
import { SiteSettingsModel } from "./models/SiteSettings";

import type {
  Product,
  Order,
  Customer,
  ContactMessage,
  BlogPost,
  SiteSettings,
  OrderStatus,
  PaymentStatus,
} from "@/types";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function toPlain<T>(doc: unknown): T | undefined {
  if (!doc) return undefined;
  const obj = JSON.parse(JSON.stringify(doc));
  // Expose Mongoose _id as id if our own id field is missing
  if (!obj.id && obj._id) obj.id = String(obj._id);
  delete obj._id;
  delete obj.__v;
  return obj as T;
}

function toPlainArray<T>(docs: unknown[]): T[] {
  return docs.map((d) => toPlain<T>(d)!);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ PRODUCTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export async function getProducts(): Promise<Product[]> {
  await connectDB();
  const docs = await ProductModel.find({}).sort({ createdAt: -1 }).lean();
  return toPlainArray<Product>(docs );
}

export async function getProductByHandle(handle: string): Promise<Product | undefined> {
  await connectDB();
  const doc = await ProductModel.findOne({ handle }).lean();
  return toPlain<Product>(doc);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await connectDB();
  const doc = await ProductModel.findOne({ id }).lean();
  return toPlain<Product>(doc);
}

export async function saveProduct(
  product: Partial<Product> & { title: string; price: number }
): Promise<Product> {
  await connectDB();

  const handle =
    product.handle ||
    product.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const id = product.id || `prod-${Date.now()}`;

  const fullProduct = {
    id,
    handle,
    title: product.title,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
    priceFrom: !!product.priceFrom,
    image: product.image || "https://sillhouete.com/cdn/shop/files/sillhouete_logo_1.png",
    hoverImage:
      product.hoverImage ||
      product.image ||
      "https://sillhouete.com/cdn/shop/files/sillhouete_logo_1.png",
    images:
      product.images && product.images.length
        ? product.images
        : [product.image || "", product.hoverImage || ""].filter(Boolean),
    alt: product.alt || product.title,
    ratio: product.ratio || 1.5,
    isNew: product.isNew ?? true,
    category: product.category || "Luxury Pret",
    description: product.description || `${product.title} luxury designer dress.`,
    inStock: product.inStock ?? true,
    sizes:
      product.sizes && product.sizes.length
        ? product.sizes
        : ["XS", "S", "M", "L", "XL"],
    fabric: product.fabric || "Pure Silk / Chiffon",
    sku: product.sku || `SLH-${handle.toUpperCase()}`,
    fabricDetail: product.fabricDetail,
    priceIncludes: product.priceIncludes,
    customization: product.customization,
    dupattaOptions: product.dupattaOptions,
    adOnOptions: product.adOnOptions,
    videoId: product.videoId,
    videoUrl: product.videoUrl,
    variants: product.variants,
    color: product.color,
    rating: product.rating,
    reviewCount: product.reviewCount,
    isSale: product.isSale ?? false,
    isBestSeller: product.isBestSeller ?? false,
  };

  await ProductModel.findOneAndUpdate(
    { $or: [{ id }, { handle }] },
    { $set: fullProduct },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return fullProduct as Product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  await connectDB();
  const result = await ProductModel.deleteOne({ $or: [{ id }, { handle: id }] });
  return result.deletedCount > 0;
}

export async function searchProducts(query: string): Promise<Product[]> {
  await connectDB();
  const regex = new RegExp(query, "i");
  const docs = await ProductModel.find({
    $or: [{ title: regex }, { category: regex }, { sku: regex }, { description: regex }],
  })
    .limit(50)
    .lean();
  return toPlainArray<Product>(docs );
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  await connectDB();
  const docs = await ProductModel.find({ category: new RegExp(category, "i") })
    .sort({ createdAt: -1 })
    .lean();
  return toPlainArray<Product>(docs );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ORDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export async function getOrders(): Promise<Order[]> {
  await connectDB();
  const docs = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
  return toPlainArray<Order>(docs );
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  await connectDB();
  const doc = await OrderModel.findOne({
    $or: [{ id }, { orderNumber: id }],
  }).lean();
  return toPlain<Order>(doc);
}

export async function createOrder(
  data: Omit<Order, "id" | "orderNumber" | "createdAt">
): Promise<Order> {
  await connectDB();

  const id = `ord-${Date.now()}`;
  const orderNumber = `SLH-${Math.floor(10000 + Math.random() * 90000)}`;

  const newOrder = {
    ...data,
    id,
    orderNumber,
    createdAt: new Date().toISOString(),
  };

  await OrderModel.create(newOrder);

  // Update or create customer
  await recordCustomerFromOrder(newOrder as Order);

  return newOrder as Order;
}

export async function updateOrderStatus(
  id: string,
  updates: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    trackingNumber?: string;
    courier?: string;
  }
): Promise<Order | null> {
  await connectDB();

  const updateFields: Record<string, unknown> = {};
  if (updates.status) updateFields.status = updates.status;
  if (updates.paymentStatus) updateFields.paymentStatus = updates.paymentStatus;
  if (updates.trackingNumber !== undefined) updateFields.trackingNumber = updates.trackingNumber;
  if (updates.courier !== undefined) updateFields.courier = updates.courier;

  const doc = await OrderModel.findOneAndUpdate(
    { $or: [{ id }, { orderNumber: id }] },
    { $set: updateFields },
    { new: true }
  ).lean();

  return toPlain<Order>(doc) ?? null;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ CUSTOMERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export async function getCustomers(): Promise<Customer[]> {
  await connectDB();
  const docs = await CustomerModel.find({}).sort({ createdAt: -1 }).lean();
  return toPlainArray<Customer>(docs );
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  await connectDB();
  const doc = await CustomerModel.findOne({ $or: [{ id }, { email: id }] }).lean();
  return toPlain<Customer>(doc);
}

async function recordCustomerFromOrder(order: Order) {
  await connectDB();

  const email = order.customer.email.toLowerCase();
  const existing = await CustomerModel.findOne({ email });

  if (existing) {
    existing.ordersCount += 1;
    existing.totalSpent += order.total;
    if (order.customer.phone && !existing.phone) {
      existing.phone = order.customer.phone;
    }
    await existing.save();
  } else {
    await CustomerModel.create({
      id: `cust-${Date.now()}`,
      name: order.customer.name,
      email,
      phone: order.customer.phone || "",
      ordersCount: 1,
      totalSpent: order.total,
    });
  }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ CONTACT MESSAGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export async function getContactMessages(): Promise<ContactMessage[]> {
  await connectDB();
  const docs = await ContactMessageModel.find({}).sort({ createdAt: -1 }).lean();
  return toPlainArray<ContactMessage>(docs );
}

export async function saveContactMessage(
  data: Omit<ContactMessage, "id" | "createdAt" | "status">
): Promise<ContactMessage> {
  await connectDB();

  const newMessage = {
    id: `msg-${Date.now()}`,
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    subject: data.subject || "General Inquiry",
    message: data.message,
    status: "unread" as const,
  };

  const doc = await ContactMessageModel.create(newMessage);
  return toPlain<ContactMessage>(doc.toObject())!;
}

export async function updateMessageStatus(
  id: string,
  status: "unread" | "read" | "replied",
  replyNotes?: string
): Promise<ContactMessage | null> {
  await connectDB();

  const updateFields: Record<string, unknown> = { status };
  if (replyNotes !== undefined) updateFields.replyNotes = replyNotes;

  const doc = await ContactMessageModel.findOneAndUpdate(
    { id },
    { $set: updateFields },
    { new: true }
  ).lean();

  return toPlain<ContactMessage>(doc) ?? null;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  await connectDB();
  const result = await ContactMessageModel.deleteOne({ id });
  return result.deletedCount > 0;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ BLOGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export async function getBlogs(): Promise<BlogPost[]> {
  await connectDB();
  const docs = await BlogPostModel.find({}).sort({ createdAt: -1 }).lean();
  return toPlainArray<BlogPost>(docs );
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | undefined> {
  await connectDB();
  const doc = await BlogPostModel.findOne({ slug }).lean();
  return toPlain<BlogPost>(doc);
}

export async function saveBlog(
  blog: Partial<BlogPost> & { title: string; content: string }
): Promise<BlogPost> {
  await connectDB();

  const slug =
    blog.slug ||
    blog.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const id = blog.id || `blog-${Date.now()}`;

  const fullBlog = {
    id,
    slug,
    title: blog.title,
    excerpt: blog.excerpt || blog.content.slice(0, 160) + "...",
    content: blog.content,
    coverImage:
      blog.coverImage ||
      "https://sillhouete.com/cdn/shop/articles/muslim_wedding_rituals_34c9db87-5834-4bff-a661-55201ade3345.png?v=1789022954&width=900",
    author: blog.author || "Sillhouete Editorial",
    publishedAt: blog.publishedAt || new Date().toISOString().split("T")[0],
    category: blog.category || "Fashion & Style",
    tags: blog.tags && blog.tags.length ? blog.tags : ["Fashion", "Sillhouete"],
    readTime: blog.readTime || "5 min read",
  };

  await BlogPostModel.findOneAndUpdate(
    { $or: [{ id }, { slug }] },
    { $set: fullBlog },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return fullBlog as BlogPost;
}

export async function deleteBlog(id: string): Promise<boolean> {
  await connectDB();
  const result = await BlogPostModel.deleteOne({ $or: [{ id }, { slug: id }] });
  return result.deletedCount > 0;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ SETTINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const DEFAULT_SETTINGS: Partial<SiteSettings> = {
  storeName: "Sillhouete",
  title: "Shop Pakistani Designer Dresses for Women Online â€“ Sillhouete",
  description: "Shop Pakistan designer dresses for women at Sillhouete.",
  email: "info@sillhouete.com",
  phone: "+92 331 0397865",
  whatsapp: "+923310397865",
  studioAddress: "Sillhouete, Almas Tower, MM Alam Rd, Block T, Gulberg 2, Lahore",
  officeAddress: "327-B, Street 7, Lane 15, Cavalry Ground, Lahore",
  usaOfficeAddress:
    "ADVENT BUSINESS CONSULTAX LLC, 18w100 22nd St, Ste 124, Oakbrook Terrace, IL, Zip Code 60181",
  announcements: [
    "FREE DELIVERY ON ORDERS ABOVE PKR 14,000",
    "INTERNATIONAL SHIPPING AVAILABLE",
    "NEW ARRIVALS: MAAHI II LUXURY EID PRET",
  ],
  freeShippingThreshold: 140000,
  standardShippingFee: 250,
  stripePublishableKey: "",
  stripeSecretKey: "",
  stripeEnabled: true,
  currency: "PKR",
  adminPasswordHash: "admin123",
};

export async function getSettings(): Promise<SiteSettings> {
  await connectDB();

  let doc = await SiteSettingsModel.findOne({}).lean();

  if (!doc) {
    // Create default settings document
    const created = await SiteSettingsModel.create(DEFAULT_SETTINGS);
    doc = created.toObject();
  }

  const settings = toPlain<SiteSettings>(doc)!;

  // Environment variables always override stored values
  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    settings.stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  }
  if (process.env.STRIPE_SECRET_KEY) {
    settings.stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  }

  return settings;
}

export async function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  await connectDB();

  const doc = await SiteSettingsModel.findOneAndUpdate(
    {},
    { $set: updates },
    { upsert: true, new: true }
  ).lean();

  return toPlain<SiteSettings>(doc)!;
}

