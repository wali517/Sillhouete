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

/** Search products by title, handle, alt text, category, or description. */
export async function searchProducts(query: string): Promise<Product[]> {
  const term = query.trim().toLowerCase();
  const products = await getProducts();

  if (!term) return [];

  return products.filter((product) =>
    [product.title, product.handle, product.alt, product.category, product.description]
      .some((value) => value?.toLowerCase().includes(term)),
  );
}

export async function getProductByHandle(handle: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.handle === handle);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.id === id);
}
