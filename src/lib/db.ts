import fs from "fs/promises";
import path from "path";
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
import { allProducts as initialProducts } from "@/data/products";
import { SEED_BLOGS } from "@/data/seed-blogs";
import { ANNOUNCEMENTS, SITE } from "@/data/site";

const DATA_DIR = path.join(process.cwd(), "data");

const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const BLOGS_FILE = path.join(DATA_DIR, "blogs.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

// Ensure data directory exists
async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Already exists
  }
}

// File write safe for Windows
async function writeJsonAtomic(filePath: string, data: unknown) {
  await ensureDir();
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, "utf8");
}

async function readJsonSafe<T>(filePath: string, fallback: T): Promise<T> {
  try {
    await ensureDir();
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    // If file doesn't exist or during parallel build, return fallback without writing
    return fallback;
  }
}

/* ──────────────── PRODUCTS ──────────────── */

function enrichInitialProducts(prods: typeof initialProducts): Product[] {
  return prods.map((p) => ({
    ...p,
    category: p.category || (p.handle.includes("rm") || p.handle.includes("formal") ? "Formal" : "Luxury Pret"),
    description:
      p.description ||
      `${p.alt}. Crafted from premium fabrics with bespoke hand embroidery, fine zardozi detailing, and artisanal tailoring. Perfect for festive ceremonies, weddings, and formal celebrations.`,
    inStock: true,
    sizes: p.sizes || ["XS", "S", "M", "L", "XL"],
    images: [p.image, p.hoverImage],
    sku: p.sku || `SLH-${p.handle.toUpperCase()}`,
  }));
}

export async function getProducts(): Promise<Product[]> {
  const enriched = enrichInitialProducts(initialProducts);
  return readJsonSafe<Product[]>(PRODUCTS_FILE, enriched);
}

export async function getProductByHandle(handle: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.handle === handle);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.id === id);
}

export async function saveProduct(product: Partial<Product> & { title: string; price: number }): Promise<Product> {
  const products = await getProducts();
  const handle =
    product.handle ||
    product.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const id = product.id || `prod-${Date.now()}`;
  const existingIndex = products.findIndex((p) => p.id === id || p.handle === handle);

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
  };

  if (existingIndex >= 0) {
    products[existingIndex] = fullProduct;
  } else {
    products.unshift(fullProduct);
  }

  await writeJsonAtomic(PRODUCTS_FILE, products);
  return fullProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await getProducts();
  const filtered = products.filter((p) => p.id !== id && p.handle !== id);
  if (filtered.length === products.length) return false;
  await writeJsonAtomic(PRODUCTS_FILE, filtered);
  return true;
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
  return readJsonSafe<Order[]>(ORDERS_FILE, INITIAL_ORDERS);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await getOrders();
  return orders.find((o) => o.id === id || o.orderNumber === id);
}

export async function createOrder(
  data: Omit<Order, "id" | "orderNumber" | "createdAt">,
): Promise<Order> {
  const orders = await getOrders();
  const id = `ord-${Date.now()}`;
  const orderNumber = `SLH-${Math.floor(10000 + Math.random() * 90000)}`;
  const newOrder: Order = {
    ...data,
    id,
    orderNumber,
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  await writeJsonAtomic(ORDERS_FILE, orders);

  // Update or create customer
  await recordCustomerFromOrder(newOrder);

  return newOrder;
}

export async function updateOrderStatus(
  id: string,
  updates: { status?: OrderStatus; paymentStatus?: PaymentStatus; trackingNumber?: string; courier?: string },
): Promise<Order | null> {
  const orders = await getOrders();
  const order = orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) return null;

  if (updates.status) order.status = updates.status;
  if (updates.paymentStatus) order.paymentStatus = updates.paymentStatus;
  if (updates.trackingNumber !== undefined) order.trackingNumber = updates.trackingNumber;
  if (updates.courier !== undefined) order.courier = updates.courier;

  await writeJsonAtomic(ORDERS_FILE, orders);
  return order;
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
  return readJsonSafe<Customer[]>(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
}

async function recordCustomerFromOrder(order: Order) {
  const customers = await getCustomers();
  const existing = customers.find((c) => c.email.toLowerCase() === order.customer.email.toLowerCase());
  if (existing) {
    existing.ordersCount += 1;
    existing.totalSpent += order.total;
    if (order.customer.phone && !existing.phone) existing.phone = order.customer.phone;
  } else {
    customers.unshift({
      id: `cust-${Date.now()}`,
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      createdAt: new Date().toISOString(),
      ordersCount: 1,
      totalSpent: order.total,
    });
  }
  await writeJsonAtomic(CUSTOMERS_FILE, customers);
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
  return readJsonSafe<ContactMessage[]>(MESSAGES_FILE, INITIAL_MESSAGES);
}

export async function saveContactMessage(data: Omit<ContactMessage, "id" | "createdAt" | "status">): Promise<ContactMessage> {
  const messages = await getContactMessages();
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
  messages.unshift(newMessage);
  await writeJsonAtomic(MESSAGES_FILE, messages);
  return newMessage;
}

export async function updateMessageStatus(id: string, status: "unread" | "read" | "replied", replyNotes?: string): Promise<ContactMessage | null> {
  const messages = await getContactMessages();
  const msg = messages.find((m) => m.id === id);
  if (!msg) return null;
  msg.status = status;
  if (replyNotes !== undefined) msg.replyNotes = replyNotes;
  await writeJsonAtomic(MESSAGES_FILE, messages);
  return msg;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const messages = await getContactMessages();
  const filtered = messages.filter((m) => m.id !== id);
  if (filtered.length === messages.length) return false;
  await writeJsonAtomic(MESSAGES_FILE, filtered);
  return true;
}

/* ──────────────── BLOGS ──────────────── */

export async function getBlogs(): Promise<BlogPost[]> {
  return readJsonSafe<BlogPost[]>(BLOGS_FILE, SEED_BLOGS);
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | undefined> {
  const blogs = await getBlogs();
  return blogs.find((b) => b.slug === slug);
}

export async function saveBlog(blog: Partial<BlogPost> & { title: string; content: string }): Promise<BlogPost> {
  const blogs = await getBlogs();
  const slug =
    blog.slug ||
    blog.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const id = blog.id || `blog-${Date.now()}`;
  const existingIndex = blogs.findIndex((b) => b.id === id || b.slug === slug);

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

  if (existingIndex >= 0) {
    blogs[existingIndex] = fullBlog;
  } else {
    blogs.unshift(fullBlog);
  }

  await writeJsonAtomic(BLOGS_FILE, blogs);
  return fullBlog;
}

export async function deleteBlog(id: string): Promise<boolean> {
  const blogs = await getBlogs();
  const filtered = blogs.filter((b) => b.id !== id && b.slug !== id);
  if (filtered.length === blogs.length) return false;
  await writeJsonAtomic(BLOGS_FILE, filtered);
  return true;
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
  adminPasswordHash: "admin123", // Default admin password
};

export async function getSettings(): Promise<SiteSettings> {
  const settings = await readJsonSafe<SiteSettings>(SETTINGS_FILE, INITIAL_SETTINGS);
  return {
    ...INITIAL_SETTINGS,
    ...settings,
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || settings.stripePublishableKey,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || settings.stripeSecretKey,
  };
}

export async function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const updated: SiteSettings = {
    ...current,
    ...updates,
  };
  await writeJsonAtomic(SETTINGS_FILE, updated);
  return updated;
}
