
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

// Ensure data directory exists.
async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// Write JSON data to a file.
async function writeJsonAtomic(
  filePath: string,
  data: unknown,
): Promise<void> {
  await ensureDir();

  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, "utf8");
}

// Read JSON safely, returning fallback data if the file is missing.
async function readJsonSafe<T>(
  filePath: string,
  fallback: T,
): Promise<T> {
  try {
    await ensureDir();
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

/* ───────────────── PRODUCTS ───────────────── */

function enrichInitialProducts(
  products: typeof initialProducts,
): Product[] {
  return products.map((product) => ({
    ...product,
    category:
      product.category ||
      (product.handle.includes("rm") ||
      product.handle.includes("formal")
        ? "Formal"
        : "Luxury Pret"),
    description:
      product.description ||
      `${product.alt}. Crafted from premium fabrics with bespoke hand embroidery, fine zardozi detailing, and artisanal tailoring. Perfect for festive ceremonies, weddings, and formal celebrations.`,
    inStock: true,
    sizes: product.sizes || ["XS", "S", "M", "L", "XL"],
    images: [product.image, product.hoverImage],
    sku: product.sku || `SLH-${product.handle.toUpperCase()}`,
  }));
}

export async function getProducts(): Promise<Product[]> {
  const fallback = enrichInitialProducts(initialProducts);
  return readJsonSafe<Product[]>(PRODUCTS_FILE, fallback);
}

/**
 * Create or update a product.
 * A matching ID or handle updates the existing product.
 */
export async function saveProduct(
  product: Product,
): Promise<Product> {
  const products = await getProducts();

  const existingIndex = products.findIndex(
    (item) =>
      item.id === product.id ||
      item.handle === product.handle,
  );

  if (existingIndex >= 0) {
    products[existingIndex] = {
      ...products[existingIndex],
      ...product,
    };
  } else {
    products.push(product);
  }

  await writeJsonAtomic(PRODUCTS_FILE, products);

  return product;
}

/** Search products by title, handle, alt text, category, or description. */
export async function searchProducts(
  query: string,
): Promise<Product[]> {
  const term = query.trim().toLowerCase();

  if (!term) {
    return [];
  }

  const products = await getProducts();

  return products.filter((product) =>
    [
      product.title,
      product.handle,
      product.alt,
      product.category,
      product.description,
    ].some((value) =>
      value?.toLowerCase().includes(term),
    ),
  );
}

export async function getProductByHandle(
  handle: string,
): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((product) => product.handle === handle);
}

export async function getProductById(
  id: string,
): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((product) => product.id === id);
}

/* ───────────────── CUSTOMERS ───────────────── */

export async function getCustomers(): Promise<Customer[]> {
  return readJsonSafe<Customer[]>(CUSTOMERS_FILE, []);
}

export async function getCustomerById(
  id: string,
): Promise<Customer | undefined> {
  const customers = await getCustomers();
  return customers.find((customer) => customer.id === id);
}

/* ───────────────── ORDERS ───────────────── */

// These functions use the existing types and JSON files.
// Add or retain any additional order functions your API routes require.

export async function getOrders(): Promise<Order[]> {
  return readJsonSafe<Order[]>(ORDERS_FILE, []);
}

/* ───────────────── CONTACT MESSAGES ───────────────── */

export async function getContactMessages(): Promise<ContactMessage[]> {
  return readJsonSafe<ContactMessage[]>(MESSAGES_FILE, []);
}

/* ───────────────── BLOGS ───────────────── */

export async function getBlogs(): Promise<BlogPost[]> {
  return readJsonSafe<BlogPost[]>(BLOGS_FILE, SEED_BLOGS);
}

/* ───────────────── SITE SETTINGS ───────────────── */

export async function getSiteSettings(): Promise<SiteSettings> {
  return readJsonSafe<SiteSettings>(SETTINGS_FILE, {
    announcements: ANNOUNCEMENTS,
    ...SITE,
  } as SiteSettings);
}
