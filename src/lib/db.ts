import connectDB from "./mongodb";
import { ProductModel } from "./models/Product";
import { OrderModel } from "./models/Order";
import { CustomerModel } from "./models/Customer";
import { ContactMessageModel } from "./models/ContactMessage";
import { BlogPostModel } from "./models/BlogPost";
import { SiteSettingsModel } from "./models/SiteSettings";
import { allProducts as initialProducts } from "@/data/products";
import { SEED_BLOGS } from "@/data/seed-blogs";
import { ANNOUNCEMENTS, SITE } from "@/data/site";
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

/* ──────────────── SERIALIZATION HELPERS ──────────────── */

function toPlain<T>(doc: unknown): T | undefined {
  if (!doc) return undefined;
  const obj = JSON.parse(JSON.stringify(doc));
  if (!obj.id && obj._id) obj.id = String(obj._id);
  delete obj._id;
  delete obj.__v;
  return obj as T;
}

function toPlainArray<T>(docs: unknown[]): T[] {
  return (docs || []).map((d) => toPlain<T>(d)!).filter(Boolean);
}

/* ──────────────── PRODUCTS ──────────────── */

function enrichInitialProducts(prods: typeof initialProducts): Product[] {
  return prods.map((p) => ({
    ...p,
    category: p.category || (p.handle.includes("rm") || p.handle.includes("formal") ? "Formal" : "Luxury Pret"),
    description:
      p.description ||
      `${p.alt}. Crafted from premium fabrics with bespoke hand embroidery, fine zardozi detailing, and artisanal tailoring. Perfect for festive ceremonies, weddings, and formal celebrations.`,
    inStock: p.inStock ?? true,
    sizes: p.sizes || ["XS", "S", "M", "L", "XL"],
    images: p.images && p.images.length ? p.images : [p.image, p.hoverImage].filter(Boolean),
    sku: p.sku || `SLH-${p.handle.toUpperCase()}`,
  }));
}

export async function getProducts(): Promise<Product[]> {
  try {
    await connectDB();
    const docs = await ProductModel.find({}).sort({ createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      return toPlainArray<Product>(docs);
    }
  } catch (err) {
    console.warn("MongoDB getProducts fallback:", err);
  }
  return enrichInitialProducts(initialProducts);
}

/** Search products by title, handle, alt text, category, or description. */
export async function searchProducts(query: string): Promise<Product[]> {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const products = await getProducts();
  return products.filter((product) =>
    [
      product.title,
      product.handle,
      product.alt,
      product.category,
      product.description,
    ].some((value) => value?.toLowerCase().includes(term)),
  );
}

export async function getProductByHandle(handle: string): Promise<Product | undefined> {
  try {
    await connectDB();
    const doc = await ProductModel.findOne({ handle }).lean();
    const prod = toPlain<Product>(doc);
    if (prod) return prod;
  } catch (err) {
    console.warn("MongoDB getProductByHandle fallback:", err);
  }
  const enriched = enrichInitialProducts(initialProducts);
  return enriched.find((p) => p.handle === handle);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    await connectDB();
    const doc = await ProductModel.findOne({ $or: [{ id }, { handle: id }] }).lean();
    const prod = toPlain<Product>(doc);
    if (prod) return prod;
  } catch (err) {
    console.warn("MongoDB getProductById fallback:", err);
  }
  const enriched = enrichInitialProducts(initialProducts);
  return enriched.find((p) => p.id === id || p.handle === id);
}

export async function saveProduct(product: Partial<Product> & { title: string; price: number }): Promise<Product> {
  const handle =
    product.handle ||
    product.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const id = product.id || `prod-${Date.now()}`;

  const fullProduct: Product = {
    id,
    handle,
    title: product.title,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
    priceFrom: !!product.priceFrom,
    image: product.image || "https://sillhouete.com/cdn/shop/files/sillhouete_logo_1.png",
    hoverImage: product.hoverImage || product.image || "https://sillhouete.com/cdn/shop/files/sillhouete_logo_1.png",
    images: product.images && product.images.length ? product.images : [product.image || "", product.hoverImage || ""].filter(Boolean),
    alt: product.alt || product.title,
    ratio: product.ratio || 1.5,
    isNew: product.isNew ?? true,
    category: product.category || "Luxury Pret",
    description: product.description || `${product.title} luxury designer dress.`,
    inStock: product.inStock ?? true,
    sizes: product.sizes && product.sizes.length ? product.sizes : ["XS", "S", "M", "L", "XL"],
    fabric: product.fabric || "Pure Silk / Chiffon",
    sku: product.sku || `SLH-${handle.toUpperCase()}`,
    dupattaOptions: product.dupattaOptions,
    adOnOptions: product.adOnOptions,
    variants: product.variants,
  };

  try {
    await connectDB();
    await ProductModel.findOneAndUpdate(
      { $or: [{ id }, { handle }] },
      { $set: fullProduct },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.warn("MongoDB saveProduct fallback:", err);
  }

  return fullProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await connectDB();
    const res = await ProductModel.deleteOne({ $or: [{ id }, { handle: id }] });
    return res.deletedCount > 0;
  } catch (err) {
    console.warn("MongoDB deleteProduct error:", err);
    return false;
  }
}

/* ──────────────── ORDERS ──────────────── */

const INITIAL_ORDERS: Order[] = [
  {
    id: "ord-1001",
    orderNumber: "SLH-10480",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    customer: {
      name: "Ayesha Khan",
      email: "ayesha.khan@example.com",
      phone: "+92 300 1234567",
    },
    shippingAddress: {
      firstName: "Ayesha",
      lastName: "Khan",
      email: "ayesha.khan@example.com",
      phone: "+92 300 1234567",
      address: "House 42, Block C, Phase 5 DHA",
      city: "Lahore",
      state: "Punjab",
      postalCode: "54000",
      country: "Pakistan",
    },
    items: [
      {
        id: "iris-rm-03",
        handle: "iris-rm-03",
        title: "Iris",
        price: 44900,
        size: "M",
        quantity: 1,
        image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-iris-royal-blue-intricate-embroidery.jpg?v=1776742287",
      },
    ],
    subtotal: 44900,
    shipping: 0,
    discount: 0,
    total: 44900,
    currency: "PKR",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    status: "processing",
    trackingNumber: "TCS-98421049",
    courier: "TCS Express",
  },
  {
    id: "ord-1002",
    orderNumber: "SLH-10481",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    customer: {
      name: "Fatima Zahra",
      email: "fatima.z@example.com",
      phone: "+92 321 9876543",
    },
    shippingAddress: {
      firstName: "Fatima",
      lastName: "Zahra",
      email: "fatima.z@example.com",
      phone: "+92 321 9876543",
      address: "Apt 4B, Clifton Block 2",
      city: "Karachi",
      state: "Sindh",
      postalCode: "75600",
      country: "Pakistan",
    },
    items: [
      {
        id: "maraki",
        handle: "maraki",
        title: "Maraki",
        price: 32900,
        size: "S",
        quantity: 1,
        image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-meraki-light-grey-sequins.jpg?v=1769691351",
      },
    ],
    subtotal: 32900,
    shipping: 250,
    discount: 0,
    total: 33150,
    currency: "PKR",
    paymentMethod: "cod",
    paymentStatus: "pending",
    status: "pending",
  },
];

export async function getOrders(): Promise<Order[]> {
  try {
    await connectDB();
    const docs = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      return toPlainArray<Order>(docs);
    }
  } catch (err) {
    console.warn("MongoDB getOrders fallback:", err);
  }
  return INITIAL_ORDERS;
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  try {
    await connectDB();
    const doc = await OrderModel.findOne({ $or: [{ id }, { orderNumber: id }] }).lean();
    const o = toPlain<Order>(doc);
    if (o) return o;
  } catch (err) {
    console.warn("MongoDB getOrderById fallback:", err);
  }
  return INITIAL_ORDERS.find((o) => o.id === id || o.orderNumber === id);
}

export async function createOrder(
  data: Omit<Order, "id" | "orderNumber" | "createdAt">,
): Promise<Order> {
  const id = `ord-${Date.now()}`;
  const orderNumber = `SLH-${Math.floor(10000 + Math.random() * 90000)}`;
  const newOrder: Order = {
    ...data,
    id,
    orderNumber,
    createdAt: new Date().toISOString(),
  };

  try {
    await connectDB();
    await OrderModel.create(newOrder);
    await recordCustomerFromOrder(newOrder);
  } catch (err) {
    console.warn("MongoDB createOrder error:", err);
  }

  return newOrder;
}

export async function updateOrderStatus(
  id: string,
  updates: { status?: OrderStatus; paymentStatus?: PaymentStatus; trackingNumber?: string; courier?: string },
): Promise<Order | null> {
  try {
    await connectDB();
    const doc = await OrderModel.findOneAndUpdate(
      { $or: [{ id }, { orderNumber: id }] },
      { $set: updates },
      { new: true }
    ).lean();
    if (doc) return toPlain<Order>(doc)!;
  } catch (err) {
    console.warn("MongoDB updateOrderStatus error:", err);
  }
  return null;
}

/* ──────────────── CUSTOMERS ──────────────── */

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Ayesha Khan",
    email: "ayesha.khan@example.com",
    phone: "+92 300 1234567",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    ordersCount: 1,
    totalSpent: 44900,
  },
  {
    id: "cust-2",
    name: "Fatima Zahra",
    email: "fatima.z@example.com",
    phone: "+92 321 9876543",
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    ordersCount: 1,
    totalSpent: 33150,
  },
];

export async function getCustomers(): Promise<Customer[]> {
  try {
    await connectDB();
    const docs = await CustomerModel.find({}).sort({ createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      return toPlainArray<Customer>(docs);
    }
  } catch (err) {
    console.warn("MongoDB getCustomers fallback:", err);
  }
  return INITIAL_CUSTOMERS;
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  try {
    await connectDB();
    const doc = await CustomerModel.findOne({ id }).lean();
    if (doc) return toPlain<Customer>(doc);
  } catch (err) {
    console.warn("MongoDB getCustomerById fallback:", err);
  }
  return INITIAL_CUSTOMERS.find((customer) => customer.id === id);
}

async function recordCustomerFromOrder(order: Order) {
  try {
    await connectDB();
    const email = order.customer.email.toLowerCase().trim();
    const existing = await CustomerModel.findOne({ email });

    if (existing) {
      existing.ordersCount = (existing.ordersCount || 0) + 1;
      existing.totalSpent = (existing.totalSpent || 0) + order.total;
      if (order.customer.phone && !existing.phone) {
        existing.phone = order.customer.phone;
      }
      if (order.shippingAddress) {
        existing.addresses = existing.addresses || [];
        existing.addresses.push(order.shippingAddress);
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
        addresses: order.shippingAddress ? [order.shippingAddress] : [],
      });
    }
  } catch (err) {
    console.warn("recordCustomerFromOrder error:", err);
  }
}

/* ──────────────── CONTACT MESSAGES ──────────────── */

const INITIAL_MESSAGES: ContactMessage[] = [
  {
    id: "msg-1",
    name: "Mahnoor Tariq",
    email: "mahnoor@example.com",
    phone: "+92 333 4567890",
    subject: "Bridal Customization Appointment",
    message: "Hi, I am interested in customizing the Husan Ara Bridal dress for my wedding in December. Can I book a studio appointment at MM Alam Road?",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: "read",
    replyNotes: "Customer invited to MM Alam studio for consultation.",
  },
  {
    id: "msg-2",
    name: "Zainab Chaudhry",
    email: "zainab.c@example.com",
    phone: "+1 312 555 0192",
    subject: "International Shipping to Chicago",
    message: "Hello! I live in Chicago and would like to know if the Maahi II collection can be delivered within 8 days for an Eid gathering?",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: "unread",
  },
];

export async function getContactMessages(): Promise<ContactMessage[]> {
  try {
    await connectDB();
    const docs = await ContactMessageModel.find({}).sort({ createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      return toPlainArray<ContactMessage>(docs);
    }
  } catch (err) {
    console.warn("MongoDB getContactMessages fallback:", err);
  }
  return INITIAL_MESSAGES;
}

export async function saveContactMessage(data: Omit<ContactMessage, "id" | "createdAt" | "status">): Promise<ContactMessage> {
  const newMessage: ContactMessage = {
    id: `msg-${Date.now()}`,
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    subject: data.subject || "General Inquiry",
    message: data.message,
    createdAt: new Date().toISOString(),
    status: "unread",
  };

  try {
    await connectDB();
    await ContactMessageModel.create(newMessage);
  } catch (err) {
    console.warn("MongoDB saveContactMessage error:", err);
  }

  return newMessage;
}

export async function updateMessageStatus(id: string, status: "unread" | "read" | "replied", replyNotes?: string): Promise<ContactMessage | null> {
  try {
    await connectDB();
    const doc = await ContactMessageModel.findOneAndUpdate(
      { id },
      { $set: { status, ...(replyNotes !== undefined ? { replyNotes } : {}) } },
      { new: true }
    ).lean();
    if (doc) return toPlain<ContactMessage>(doc)!;
  } catch (err) {
    console.warn("MongoDB updateMessageStatus error:", err);
  }
  return null;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  try {
    await connectDB();
    const res = await ContactMessageModel.deleteOne({ id });
    return res.deletedCount > 0;
  } catch (err) {
    console.warn("MongoDB deleteContactMessage error:", err);
    return false;
  }
}

/* ──────────────── BLOGS ──────────────── */

export async function getBlogs(): Promise<BlogPost[]> {
  try {
    await connectDB();
    const docs = await BlogPostModel.find({}).sort({ publishedAt: -1, createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      return toPlainArray<BlogPost>(docs);
    }
  } catch (err) {
    console.warn("MongoDB getBlogs fallback:", err);
  }
  return SEED_BLOGS;
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    await connectDB();
    const doc = await BlogPostModel.findOne({ $or: [{ slug }, { id: slug }] }).lean();
    const b = toPlain<BlogPost>(doc);
    if (b) return b;
  } catch (err) {
    console.warn("MongoDB getBlogBySlug fallback:", err);
  }
  return SEED_BLOGS.find((b) => b.slug === slug || b.id === slug);
}

export async function saveBlog(blog: Partial<BlogPost> & { title: string; content: string }): Promise<BlogPost> {
  const slug =
    blog.slug ||
    blog.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const id = blog.id || `blog-${Date.now()}`;

  const fullBlog: BlogPost = {
    id,
    slug,
    title: blog.title,
    excerpt: blog.excerpt || blog.content.slice(0, 160) + "...",
    content: blog.content,
    coverImage: blog.coverImage || "https://sillhouete.com/cdn/shop/articles/muslim_wedding_rituals_34c9db87-5834-4bff-a661-55201ade3345.png?v=1789022954&width=900",
    author: blog.author || "Sillhouete Editorial",
    publishedAt: blog.publishedAt || new Date().toISOString().split("T")[0],
    category: blog.category || "Fashion & Style",
    tags: blog.tags && blog.tags.length ? blog.tags : ["Fashion", "Sillhouete"],
    readTime: blog.readTime || "5 min read",
  };

  try {
    await connectDB();
    await BlogPostModel.findOneAndUpdate(
      { $or: [{ id }, { slug }] },
      { $set: fullBlog },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.warn("MongoDB saveBlog error:", err);
  }

  return fullBlog;
}

export async function deleteBlog(id: string): Promise<boolean> {
  try {
    await connectDB();
    const res = await BlogPostModel.deleteOne({ $or: [{ id }, { slug: id }] });
    return res.deletedCount > 0;
  } catch (err) {
    console.warn("MongoDB deleteBlog error:", err);
    return false;
  }
}

/* ──────────────── SETTINGS ──────────────── */

const INITIAL_SETTINGS: SiteSettings = {
  storeName: SITE.name,
  title: SITE.title,
  description: SITE.description,
  email: SITE.email,
  phone: "+92 331 0397865",
  whatsapp: SITE.whatsapp,
  studioAddress: "Sillhouete, Almas Tower, MM Alam Rd, Block T, Gulberg 2, Lahore",
  officeAddress: "327-B, Street 7, Lane 15, Cavalry Ground, Lahore",
  usaOfficeAddress: "ADVENT BUSINESS CONSULTAX LLC, 18w100 22nd St, Ste 124, Oakbrook Terrace, IL, Zip Code 60181",
  announcements: ANNOUNCEMENTS,
  freeShippingThreshold: 140000, // ~ $500 in PKR
  standardShippingFee: 250,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeEnabled: true,
  currency: "PKR",
  adminPasswordHash: "admin123",
  bankName: "Meezan Bank",
  bankAccountTitle: "SILLHOUETE",
  bankIban: "PK80MEZN0002160109517881",
  discountCodes: [
    { code: "WELCOME5", percent: 5, active: true },
    { code: "EID2026", percent: 10, active: true },
  ],
};

export async function getSettings(): Promise<SiteSettings> {
  let settings: SiteSettings = {
    ...INITIAL_SETTINGS,
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  };

  try {
    await connectDB();
    let doc = await SiteSettingsModel.findOne({}).lean();
    if (!doc) {
      const created = await SiteSettingsModel.create(INITIAL_SETTINGS);
      doc = created.toObject();
    }
    const dbSettings = toPlain<SiteSettings>(doc);
    if (dbSettings) {
      settings = { ...settings, ...dbSettings };
    }
  } catch (err) {
    console.warn("MongoDB getSettings fallback:", err);
  }

  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    settings.stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  }
  if (process.env.STRIPE_SECRET_KEY) {
    settings.stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  }

  return settings;
}

export async function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  try {
    await connectDB();
    const doc = await SiteSettingsModel.findOneAndUpdate(
      {},
      { $set: updates },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    if (doc) {
      const plain = toPlain<SiteSettings>(doc);
      if (plain) return plain;
    }
  } catch (err) {
    console.warn("MongoDB updateSettings fallback:", err);
  }

  return { ...INITIAL_SETTINGS, ...updates };
}
