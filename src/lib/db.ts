import { cache } from "react";
import mongoose from "mongoose";
import connectDB from "./mongodb";
import { ProductModel } from "./models/Product";
import { OrderModel } from "./models/Order";
import { CustomerModel } from "./models/Customer";
import { ContactMessageModel } from "./models/ContactMessage";
import { BlogPostModel } from "./models/BlogPost";
import { SiteSettingsModel } from "./models/SiteSettings";
import { CollectionModel } from "./models/Collection";
import { executePredictiveSearch, tokenize } from "./predictive-search";
import { ANNOUNCEMENTS, SITE, NAV } from "@/data/site";
import {
  sendOrderConfirmationEmail,
  sendPaymentFailureEmail,
  sendOrderCancellationEmail,
  sendRefundInitiatedEmail,
  sendRefundSuccessfulEmail,
  sendRefundFailedEmail,
  sendShippingUpdateEmail,
  sendContactFormNotification,
} from "./email";
import { getStripeServer, toStripeAmount, fromStripeAmount } from "./stripe";
import type {
  Product,
  CategoryItem,
  NavLink,
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
  if (obj._id) {
    obj._id = String(obj._id);
    if (!obj.id) obj.id = obj._id;
  }
  delete obj.__v;
  return obj as T;
}

function toPlainArray<T>(docs: unknown[]): T[] {
  return (docs || []).map((d) => toPlain<T>(d)!).filter(Boolean);
}

/* ──────────────── PRODUCTS ──────────────── */

let cachedAllProducts: { data: Product[]; expiresAt: number } | null = null;

export async function getProducts(): Promise<Product[]> {
  if (cachedAllProducts && Date.now() < cachedAllProducts.expiresAt) {
    return cachedAllProducts.data;
  }
  try {
    await connectDB();
    const docs = await ProductModel.find({}).sort({ createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      const plain = toPlainArray<Product>(docs);
      cachedAllProducts = { data: plain, expiresAt: Date.now() + 60_000 };
      return plain;
    }
  } catch (err) {
    console.warn("MongoDB getProducts error:", err);
  }
  return [];
}

/** Automatically derive matching collection slugs from category and attributes */
export function deriveCollectionsFromCategory(
  category: string = "",
  existingCollections: string[] = []
): string[] {
  const set = new Set(existingCollections.map((c) => c.toLowerCase().trim()).filter(Boolean));
  const cat = (category || "").toLowerCase().trim();

  // Homepage sections & core collections
  if (cat.includes("maahi")) {
    set.add("maahi-ii-luxury-eid-pret");
    set.add("luxury-pret");
  }
  if (cat.includes("silk") || cat.includes("solids")) {
    set.add("silk-solids26");
  }
  if (cat.includes("raha")) {
    set.add("raha-eid-pret26");
    set.add("luxury-pret");
  }
  if (cat.includes("formal")) {
    set.add("formal-dresses");
  }
  if (
    cat.includes("bridal") ||
    cat.includes("barat") ||
    cat.includes("walima") ||
    cat.includes("nikkah") ||
    cat.includes("farshi") ||
    cat.includes("lehnga")
  ) {
    set.add("bridal-dresses");
  }
  if (cat.includes("luxury pret") || cat.includes("pret")) {
    set.add("luxury-pret");
  }
  if (cat.includes("best") || cat.includes("seller")) {
    set.add("best-sellers");
  }
  if (cat.includes("new") || cat.includes("arrival")) {
    set.add("new-arrivals");
  }
  if (cat.includes("sale")) {
    set.add("sale-1");
    set.add("sale");
  }
  if (
    cat.includes("accessory") ||
    cat.includes("accessories") ||
    cat.includes("clutch") ||
    cat.includes("pouch")
  ) {
    set.add("accessories");
    set.add("pouches-clutches");
  }

  // Also include slugified category name
  const slug = cat.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (slug && slug.length > 2) {
    set.add(slug);
  }

  return Array.from(set);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let cachedAllCollections: { data: any[]; expiresAt: number } | null = null;

async function getAllCollectionsCached(): Promise<any[]> {
  if (cachedAllCollections && Date.now() < cachedAllCollections.expiresAt) {
    return cachedAllCollections.data;
  }
  await connectDB();
  const docs = await CollectionModel.find({ isActive: { $ne: false } }).lean();
  cachedAllCollections = { data: docs, expiresAt: Date.now() + 60_000 };
  return docs;
}

/** Fetch products by collection handle dynamically from MongoDB */
export async function getProductsByCollection(
  collectionSlug: string,
  options?: { limit?: number; lightweight?: boolean }
): Promise<Product[]> {
  try {
    await connectDB();
    if (collectionSlug === "all" || collectionSlug === "1") {
      return getProducts();
    }

    const slug = collectionSlug.toLowerCase().trim();
    const orConditions: any[] = [
      { collections: slug },
      { mainCategorySlug: slug },
      { subcategorySlug: slug },
      { mainCategoryId: slug },
      { subcategoryId: slug },
    ];

    // Look up the collection in memory cache (0ms, no network round-trips)
    try {
      const allCols = await getAllCollectionsCached();
      const colDoc = allCols.find(
        (c) => c.handle === slug || c.handle?.toLowerCase() === slug
      );

      if (colDoc) {
        const colIdStr = String(colDoc._id);
        orConditions.push({ collections: colDoc.handle });
        orConditions.push({ mainCategorySlug: colDoc.handle });
        orConditions.push({ subcategorySlug: colDoc.handle });
        orConditions.push({ mainCategoryId: colIdStr });
        orConditions.push({ subcategoryId: colIdStr });

        if (colDoc.title) {
          const escTitle = escapeRegex(colDoc.title.trim());
          orConditions.push({ category: { $regex: new RegExp(`^${escTitle}$`, "i") } });
          orConditions.push({ mainCategoryName: { $regex: new RegExp(`^${escTitle}$`, "i") } });
          orConditions.push({ subcategoryName: { $regex: new RegExp(`^${escTitle}$`, "i") } });
        }

        // If this is a main category, also include products from any of its subcategories
        const isMain = colDoc.isMainCategory || !colDoc.parentHandle;
        if (isMain) {
          const subcats = allCols.filter(
            (c) => c.parentHandle === colDoc.handle || String(c.mainCategoryId) === colIdStr
          );

          for (const sub of subcats) {
            if (sub.handle) {
              orConditions.push({ collections: sub.handle });
              orConditions.push({ subcategorySlug: sub.handle });
            }
            if (sub._id) {
              orConditions.push({ subcategoryId: String(sub._id) });
            }
            if (sub.title) {
              const escSubTitle = escapeRegex(sub.title.trim());
              orConditions.push({ category: { $regex: new RegExp(`^${escSubTitle}$`, "i") } });
              orConditions.push({ subcategoryName: { $regex: new RegExp(`^${escSubTitle}$`, "i") } });
            }
          }
        }
      }
    } catch {
      // non-blocking
    }

    if (slug === "formal-dresses" || slug === "formal" || slug === "formals") {
      orConditions.push({ collections: { $in: ["formal-dresses", "formal", "formals"] } });
      orConditions.push({ category: { $regex: /formal/i } });
    } else if (slug === "silk-solids26" || slug === "silk-solids" || slug === "silk") {
      orConditions.push({ collections: { $in: ["silk-solids26", "silk-solids"] } });
      orConditions.push({ category: { $regex: /silk/i } });
    } else if (slug === "maahi-ii-luxury-eid-pret" || slug === "maahi") {
      orConditions.push({ collections: { $in: ["maahi-ii-luxury-eid-pret", "maahi-luxury-pret25"] } });
      orConditions.push({ category: { $regex: /maahi/i } });
    } else if (slug === "raha-eid-pret26" || slug === "raha") {
      orConditions.push({ collections: { $in: ["raha-eid-pret26", "raha"] } });
      orConditions.push({ category: { $regex: /raha/i } });
    } else if (slug === "best-sellers") {
      orConditions.push({ collections: "best-sellers" });
      orConditions.push({ isBestSeller: true });
      orConditions.push({ category: { $regex: /best seller/i } });
    } else if (slug === "bridal-dresses" || slug === "bridal" || slug === "bridals") {
      orConditions.push({ collections: { $in: ["bridal-dresses", "bridal", "bridals"] } });
      orConditions.push({ category: { $regex: /bridal|barat|walima|nikkah/i } });
    } else if (slug === "luxury-pret" || slug === "pret") {
      orConditions.push({ collections: { $in: ["luxury-pret", "pret"] } });
      orConditions.push({ category: { $regex: /pret/i } });
    } else if (slug === "new-arrivals") {
      orConditions.push({ collections: "new-arrivals" });
      orConditions.push({ isNew: true });
    } else if (slug === "sale-1" || slug === "sale") {
      orConditions.push({ collections: { $in: ["sale-1", "sale"] } });
      orConditions.push({ isSale: true });
      orConditions.push({ originalPrice: { $gt: 0 } });
      orConditions.push({ category: { $regex: /sale/i } });
    } else if (slug === "accessories" || slug === "pouches-clutches") {
      orConditions.push({ collections: { $in: ["accessories", "pouches-clutches"] } });
      orConditions.push({ category: { $regex: /accessor|clutch|pouch/i } });
    } else {
      const words = slug.split(/[^a-z0-9]+/).filter(Boolean);
      if (words.length > 0) {
        orConditions.push({ category: { $regex: new RegExp(words.join(".*"), "i") } });
      }
    }

    const projection = options?.lightweight
      ? "id handle title price originalPrice priceFrom image hoverImage images alt ratio category collections isNew isBestSeller isSale sizes createdAt"
      : undefined;

    const docs = await ProductModel.find({ $or: orConditions }, projection)
      .sort({ createdAt: -1 })
      .limit(options?.limit && options.limit > 0 ? options.limit : 0)
      .lean();
    if (docs && docs.length > 0) {
      return toPlainArray<Product>(docs);
    }
  } catch (err) {
    console.warn(`MongoDB getProductsByCollection(${collectionSlug}) error:`, err);
  }
  return [];
}

/** Fetch all collections from MongoDB */
export async function getCollections(): Promise<CategoryItem[]> {
  try {
    await connectDB();
    const docs = await CollectionModel.find({}).sort({ order: 1, productCount: -1 }).lean();
    if (docs && docs.length > 0) {
      return toPlainArray(docs);
    }
  } catch (err) {
    console.warn("MongoDB getCollections error:", err);
  }
  return [];
}

/** Fetch a single collection by handle or ID from MongoDB (deduplicated per request) */
export const getCollectionByHandle = cache(async function getCollectionByHandle(
  handleOrId: string
): Promise<CategoryItem | undefined> {
  try {
    await connectDB();
    const isObjectId = mongoose.isValidObjectId(handleOrId);
    const query = isObjectId
      ? { $or: [{ _id: handleOrId }, { handle: handleOrId }] }
      : { handle: handleOrId };
    const doc = await CollectionModel.findOne(query).lean();
    if (doc) return toPlain(doc);
  } catch (err) {
    console.warn(`MongoDB getCollectionByHandle(${handleOrId}) error:`, err);
  }
  return undefined;
});

/**
 * Get all Main Categories
 * @param onlyActive if true, filters only active main categories (isActive !== false)
 */
export async function getMainCategories(onlyActive = false): Promise<CategoryItem[]> {
  try {
    await connectDB();
    const filter: Record<string, unknown> = {
      $or: [
        { isMainCategory: true },
        { parentHandle: "" },
        { parentHandle: null },
        { parentHandle: { $exists: false } },
      ],
    };
    if (onlyActive) {
      filter.isActive = { $ne: false };
    }

    const docs = await CollectionModel.find(filter).sort({ order: 1, title: 1 }).lean();
    if (!docs || docs.length === 0) return [];

    const plainDocs = toPlainArray<CategoryItem>(docs);

    // Compute live subcategory and product counts for each main category
    for (const cat of plainDocs) {
      try {
        const idStr = String(cat._id || cat.id || "");
        const subCount = await CollectionModel.countDocuments({
          $or: [
            { parentHandle: cat.handle },
            ...(idStr ? [{ mainCategoryId: idStr }] : []),
          ],
        });
        const prodCount = await ProductModel.countDocuments({
          $or: [
            { mainCategorySlug: cat.handle },
            ...(idStr ? [{ mainCategoryId: idStr }] : []),
            { collections: cat.handle },
          ],
        });
        cat.subcategoriesCount = subCount;
        cat.productCount = prodCount;
      } catch {
        // fallback
      }
    }

    return plainDocs;
  } catch (err) {
    console.warn("MongoDB getMainCategories error:", err);
  }
  return [];
}

/**
 * Get all Subcategories for a given Main Category
 * @param mainHandleOrId Handle or ID of the parent Main Category
 * @param onlyActive if true, filters only active subcategories
 */
export async function getSubcategories(
  mainHandleOrId: string,
  onlyActive = false
): Promise<CategoryItem[]> {
  try {
    await connectDB();
    const filter: Record<string, unknown> = {
      $or: [{ parentHandle: mainHandleOrId }, { mainCategoryId: mainHandleOrId }],
    };
    if (onlyActive) {
      filter.isActive = { $ne: false };
    }

    const docs = await CollectionModel.find(filter).sort({ order: 1, title: 1 }).lean();
    if (!docs || docs.length === 0) return [];

    const plainDocs = toPlainArray<CategoryItem>(docs);

    for (const sub of plainDocs) {
      try {
        const idStr = String(sub._id || sub.id || "");
        const prodCount = await ProductModel.countDocuments({
          $or: [
            { subcategorySlug: sub.handle },
            ...(idStr ? [{ subcategoryId: idStr }] : []),
            { collections: sub.handle },
          ],
        });
        sub.productCount = prodCount;
      } catch {
        // fallback
      }
    }

    return plainDocs;
  } catch (err) {
    console.warn(`MongoDB getSubcategories(${mainHandleOrId}) error:`, err);
  }
  return [];
}

/** Create or update a collection / category in MongoDB */
export async function saveCollection(col: {
  _id?: string;
  handle?: string;
  title: string;
  description?: string;
  image?: string;
  productCount?: number;
  isMainCategory?: boolean;
  parentHandle?: string;
  mainCategoryId?: string;
  isActive?: boolean;
  showOnHomepage?: boolean;
  order?: number;
}): Promise<CategoryItem> {
  await connectDB();

  const handle =
    col.handle?.trim() ||
    col.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const isMain =
    col.isMainCategory !== undefined
      ? Boolean(col.isMainCategory)
      : !col.parentHandle || col.parentHandle.trim() === "";

  let parentHandle = isMain ? "" : col.parentHandle?.trim() || "";
  let mainCategoryId = isMain ? "" : col.mainCategoryId?.trim() || "";

  // If subcategory has parentHandle but no mainCategoryId, look up parent
  if (!isMain && parentHandle && !mainCategoryId) {
    const parentDoc = await CollectionModel.findOne({ handle: parentHandle }).lean();
    if (parentDoc) {
      mainCategoryId = String(parentDoc._id);
    }
  }

  const update: Record<string, unknown> = {
    handle,
    title: col.title.trim(),
    description: col.description || "",
    image: col.image || "",
    isMainCategory: isMain,
    parentHandle,
    mainCategoryId,
    isActive: col.isActive !== undefined ? Boolean(col.isActive) : true,
    showOnHomepage: isMain ? (col.showOnHomepage !== undefined ? Boolean(col.showOnHomepage) : true) : false,
    order: col.order !== undefined ? Number(col.order) : 0,
  };

  if (col.productCount !== undefined) {
    update.productCount = col.productCount;
  }

  let doc;
  if (col._id && mongoose.isValidObjectId(col._id)) {
    doc = await CollectionModel.findByIdAndUpdate(
      col._id,
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  } else {
    doc = await CollectionModel.findOneAndUpdate(
      { handle },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  }

  cachedNav = null;
  cachedAllCollections = null;
  return toPlain(doc) as CategoryItem;
}

/** Safe deletion of category/subcategory with relationship integrity checks */
export async function deleteCategorySafely(handleOrId: string): Promise<{ success: boolean; message?: string }> {
  await connectDB();
  const isObjectId = mongoose.isValidObjectId(handleOrId);
  const query = isObjectId
    ? { $or: [{ _id: handleOrId }, { handle: handleOrId }] }
    : { handle: handleOrId };

  const cat = await CollectionModel.findOne(query).lean();
  if (!cat) {
    throw new Error("Category not found.");
  }

  const catIdStr = String(cat._id);
  const isMain = cat.isMainCategory || !cat.parentHandle;

  if (isMain) {
    // 1. Check for child subcategories
    const subCount = await CollectionModel.countDocuments({
      $or: [{ parentHandle: cat.handle }, { mainCategoryId: catIdStr }],
    });
    if (subCount > 0) {
      throw new Error(
        `Cannot delete Main Category "${cat.title}": It contains ${subCount} subcategory(s). Please delete or reassign them first.`
      );
    }

    // 2. Check for assigned products
    const prodCount = await ProductModel.countDocuments({
      $or: [
        { mainCategorySlug: cat.handle },
        { mainCategoryId: catIdStr },
        { collections: cat.handle },
      ],
    });
    if (prodCount > 0) {
      throw new Error(
        `Cannot delete Main Category "${cat.title}": It has ${prodCount} product(s) assigned. Please reassign the products first.`
      );
    }
  } else {
    // Subcategory check: check for assigned products
    const prodCount = await ProductModel.countDocuments({
      $or: [
        { subcategorySlug: cat.handle },
        { subcategoryId: catIdStr },
        { collections: cat.handle },
      ],
    });
    if (prodCount > 0) {
      throw new Error(
        `Cannot delete Subcategory "${cat.title}": It has ${prodCount} product(s) assigned. Please reassign the products first.`
      );
    }
  }

  await CollectionModel.deleteOne({ _id: cat._id });
  cachedNav = null;
  cachedAllCollections = null;
  return { success: true };
}

/** Delete a collection / category from MongoDB (backward compatibility) */
export async function deleteCollection(handle: string): Promise<boolean> {
  try {
    const res = await deleteCategorySafely(handle);
    return res.success;
  } catch (err) {
    console.warn(`MongoDB deleteCollection(${handle}) error:`, err);
    throw err;
  }
}

/** Build dynamic Header navigation tree with Parent Categories and Child Category dropdowns */
let cachedNav: { data: NavLink[]; expiresAt: number } | null = null;
let cachedSettings: { data: SiteSettings; expiresAt: number } | null = null;

export const getNavigationMenu = cache(async function getNavigationMenu(): Promise<NavLink[]> {
  if (cachedNav && Date.now() < cachedNav.expiresAt) {
    return cachedNav.data;
  }

  try {
    await connectDB();

    // Defined canonical order for Sillhouete's official top-level navigation
    const OFFICIAL_ORDER = [
      "sale-1",
      "sale",
      "maahi-ii-luxury-eid-pret",
      "new-arrivals",
      "bridal-dresses",
      "formal-dresses",
      "luxury-pret",
      "pret",
      "shop-by-events",
      "best-sellers",
      "spotted",
      "accessories",
    ];

    // 1. Fetch ALL verified active categories from MongoDB in ONE single fast query
    const allDocs = await CollectionModel.find({
      isActive: { $ne: false },
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const mainDocs: any[] = [];
    const mainMap = new Map<string, any>();
    const childrenByParent = new Map<string, any[]>();
    const childrenByMainId = new Map<string, any[]>();

    for (const d of allDocs) {
      if (d.isMainCategory) {
        mainDocs.push(d);
        mainMap.set(d.handle, d);
      } else {
        if (d.parentHandle) {
          const list = childrenByParent.get(d.parentHandle) || [];
          list.push(d);
          childrenByParent.set(d.parentHandle, list);
        }
        if (d.mainCategoryId) {
          const list = childrenByMainId.get(String(d.mainCategoryId)) || [];
          list.push(d);
          childrenByMainId.set(String(d.mainCategoryId), list);
        }
      }
    }

    // Fast in-memory resolution (0ms, no extra database round-trips)
    const getChildrenFor = (handle: string, id: string): NavLink[] => {
      const byParent = childrenByParent.get(handle) || [];
      const byId = childrenByMainId.get(id) || [];
      const mergedMap = new Map<string, any>();
      for (const item of [...byParent, ...byId]) {
        if (item.isMainCategory) continue;
        mergedMap.set(String(item._id), item);
      }

      const list = Array.from(mergedMap.values());
      return list
        .filter((sub) => sub.title && sub.title.toLowerCase().trim() !== "view all" && sub.handle !== "view-all")
        .map((sub) => ({
          label: sub.title,
          href: `/collections/${sub.handle}`,
          blink: sub.handle.includes("meeras") || sub.title.toLowerCase().includes("meeras"),
          highlight: sub.handle.includes("raha") || sub.title.toLowerCase().includes("raha"),
        }));
    };

    const navItems: NavLink[] = [];

    // 1. Sale
    const saleDoc = mainMap.get("sale-1") || mainMap.get("sale");
    let saleChildren: NavLink[] | undefined = undefined;
    if (saleDoc) {
      const dynamicChildren = getChildrenFor(saleDoc.handle, String(saleDoc._id));
      if (dynamicChildren.length > 0) saleChildren = dynamicChildren;
    }
    navItems.push({
      label: "Sale",
      href: "/collections/sale-1",
      sale: true,
      blink: true,
      children: saleChildren,
    });

    // 2. Maahi II Luxury Eid Pret
    const maahiDoc = mainMap.get("maahi-ii-luxury-eid-pret");
    let maahiChildren: NavLink[] | undefined = undefined;
    if (maahiDoc) {
      const dynamicChildren = getChildrenFor("maahi-ii-luxury-eid-pret", String(maahiDoc._id));
      if (dynamicChildren.length > 0) maahiChildren = dynamicChildren;
    }
    navItems.push({
      label: "Maahi II Luxury Eid Pret",
      href: "/collections/maahi-ii-luxury-eid-pret",
      children: maahiChildren,
    });

    // 3. New Arrivals (dropdown: Maahi II, Silk Solids'26, Raha Eid Pret'26, Lumiere)
    const newArrivalsDoc = mainMap.get("new-arrivals");
    let newArrivalsChildren: NavLink[] = [
      { label: "Maahi II Luxury Eid Pret", href: "/collections/maahi-ii-luxury-eid-pret" },
      { label: "Silk Solids'26", href: "/collections/silk-solids26" },
      { label: "Raha Eid Pret'26", href: "/collections/raha-eid-pret26", highlight: true },
      { label: "Lumiere Luxury Formals'26", href: "/collections/lumiere-luxury-formals26" },
    ];
    if (newArrivalsDoc) {
      const dynamicChildren = getChildrenFor("new-arrivals", String(newArrivalsDoc._id));
      if (dynamicChildren.length > 0) {
        newArrivalsChildren = dynamicChildren;
      }
    }
    navItems.push({
      label: "New Arrivals",
      href: "/collections/new-arrivals",
      children: newArrivalsChildren,
    });

    // 4. Bridals (strictly 4 children: Husan ara, Anarkali, Noor Jahn, Roshanara)
    const bridalDoc = mainMap.get("bridal-dresses");
    let bridalChildren: NavLink[] = [
      { label: "Husan ara - Birdal '25", href: "/collections/husan-ara-birdal-25" },
      { label: "Anarkali - Birdal '24", href: "/collections/anarkali-birdal-24" },
      { label: "Noor Jahn Bridal '23", href: "/collections/noor-jahn-bridal-23" },
      { label: "Roshanara Bridal '22", href: "/collections/roshanara-bridal-22" },
    ];
    if (bridalDoc) {
      const dynamicChildren = getChildrenFor("bridal-dresses", String(bridalDoc._id));
      if (dynamicChildren.length > 0) {
        bridalChildren = dynamicChildren;
      }
    }
    navItems.push({
      label: "Bridals",
      href: "/collections/bridal-dresses",
      children: bridalChildren,
    });

    // 5. Formal (strictly 7 children: Lumiere, Meeras, Zarqaa, Riwaj Formals, Rang e Bahar, Tosha Kinari, Shawl Collection - no View All)
    const formalDoc = mainMap.get("formal-dresses");
    let formalChildren: NavLink[] = [
      { label: "Lumiere Luxury Formals'26", href: "/collections/lumiere-luxury-formals26" },
      { label: "Meeras", href: "/collections/meeras", blink: true },
      { label: "Zarqaa", href: "/collections/zarqaa" },
      { label: "Riwaj Formals", href: "/collections/riwaj-formals" },
      { label: "Rang e Bahar", href: "/collections/rang-e-bahar" },
      { label: "Tosha Kinari", href: "/collections/tosha-kinari" },
      { label: "Shawl Collection", href: "/collections/luxury-shawl" },
    ];
    if (formalDoc) {
      const dynamicChildren = getChildrenFor("formal-dresses", String(formalDoc._id));
      if (dynamicChildren.length > 0) {
        formalChildren = dynamicChildren;
      }
    }
    navItems.push({
      label: "Formal",
      href: "/collections/formal-dresses",
      children: formalChildren,
    });

    // 6. Luxury Pret (strictly 6 children: Maahi II, Silk Solids'26, Maahi Luxury Pret'25, Luxe, Opal, Riwaj Luxury Pret - no View All)
    const luxPretDoc = mainMap.get("luxury-pret");
    let luxPretChildren: NavLink[] = [
      { label: "Maahi II Luxury Eid Pret", href: "/collections/maahi-ii-luxury-eid-pret" },
      { label: "Silk Solids'26", href: "/collections/silk-solids26" },
      { label: "Maahi Luxury Pret'25", href: "/collections/maahi-luxury-pret25" },
      { label: "Luxe", href: "/collections/luxe" },
      { label: "Opal", href: "/collections/opal" },
      { label: "Riwaj Luxury Pret", href: "/collections/riwaj-luxury-pret" },
    ];
    if (luxPretDoc) {
      const dynamicChildren = getChildrenFor("luxury-pret", String(luxPretDoc._id));
      if (dynamicChildren.length > 0) {
        // Prepend Maahi II Luxury Eid Pret if not already included
        const hasMaahi = dynamicChildren.some((c) => c.href.includes("maahi-ii"));
        luxPretChildren = hasMaahi
          ? dynamicChildren
          : [
              { label: "Maahi II Luxury Eid Pret", href: "/collections/maahi-ii-luxury-eid-pret" },
              ...dynamicChildren,
            ];
      }
    }
    navItems.push({
      label: "Luxury Pret",
      href: "/collections/luxury-pret",
      children: luxPretChildren,
    });

    // 7. Pret (strictly 1 child: Raha Eid Pret'26 - no View All)
    const pretDoc = mainMap.get("pret");
    let pretChildren: NavLink[] = [
      { label: "Raha Eid Pret'26", href: "/collections/raha-eid-pret26", highlight: true },
    ];
    if (pretDoc) {
      const dynamicChildren = getChildrenFor("pret", String(pretDoc._id));
      if (dynamicChildren.length > 0) {
        pretChildren = dynamicChildren;
      }
    }
    navItems.push({
      label: "Pret",
      href: "/collections/pret",
      children: pretChildren,
    });

    // 8. Shop By Events (strictly 5 children: Engagement, Mehndi, Nikkah, Barat, Walima - no View All)
    const sbeDoc = mainMap.get("shop-by-events");
    let sbeChildren: NavLink[] = [
      { label: "Engagement", href: "/collections/engagement-dresses" },
      { label: "Mehndi", href: "/collections/mehndi-dresses" },
      { label: "Nikkah", href: "/collections/nikkah-dresses" },
      { label: "Barat", href: "/collections/barat-dresses" },
      { label: "Walima", href: "/collections/walima-dresses" },
    ];
    if (sbeDoc) {
      const dynamicChildren = getChildrenFor("shop-by-events", String(sbeDoc._id));
      if (dynamicChildren.length > 0) {
        sbeChildren = dynamicChildren;
      }
    }
    navItems.push({
      label: "Shop By Events",
      href: "#",
      children: sbeChildren,
    });

    // 9. Best Sellers
    const bsDoc = mainMap.get("best-sellers");
    let bsChildren: NavLink[] | undefined = undefined;
    if (bsDoc) {
      const dynamicChildren = getChildrenFor("best-sellers", String(bsDoc._id));
      if (dynamicChildren.length > 0) bsChildren = dynamicChildren;
    }
    navItems.push({
      label: "Best Sellers",
      href: "/collections/best-sellers",
      children: bsChildren,
    });

    // 10. Spotted
    const spottedDoc = mainMap.get("spotted");
    let spottedChildren: NavLink[] | undefined = undefined;
    if (spottedDoc) {
      const dynamicChildren = getChildrenFor("spotted", String(spottedDoc._id));
      if (dynamicChildren.length > 0) spottedChildren = dynamicChildren;
    }
    navItems.push({
      label: "Spotted",
      href: "/pages/spot",
      children: spottedChildren,
    });

    // 11. Accessories (strictly 1 child: Pouches & Clutches - no View All)
    const accDoc = mainMap.get("accessories");
    let accChildren: NavLink[] = [
      { label: "Pouches & Clutches", href: "/collections/pouches-clutches" },
    ];
    if (accDoc) {
      const dynamicChildren = getChildrenFor("accessories", String(accDoc._id));
      if (dynamicChildren.length > 0) {
        accChildren = dynamicChildren;
      }
    }
    navItems.push({
      label: "Accessories",
      href: "/collections/accessories",
      children: accChildren,
    });

    // 12. Add any additional custom Main Categories created in Admin Panel
    for (const main of mainDocs) {
      if (OFFICIAL_ORDER.includes(main.handle)) continue;
      const children = getChildrenFor(main.handle, String(main._id));
      navItems.push({
        label: main.title,
        href: `/collections/${main.handle}`,
        children: children.length > 0 ? children : undefined,
      });
    }

    cachedNav = { data: navItems, expiresAt: Date.now() + 60_000 };
    return navItems;
  } catch (err) {
    console.warn("getNavigationMenu error:", err);
    return NAV;
  }
});

/** Exact / full match search filter for main search (when Enter is pressed). */
export function matchExactProducts(query: string, catalog: Product[]): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const qWords = tokenize(q);
  if (qWords.length === 0) return [];

  return catalog.filter((p) => {
    const title = (p.title || "").toLowerCase();
    const handle = (p.handle || "").toLowerCase();
    const sku = (p.sku || "").toLowerCase();
    const color = (p.color || "").toLowerCase();
    const category = (p.category || "").toLowerCase();
    const colls = (p.collections || []).map((c) => c.toLowerCase());

    // 1. Exact full field match
    if (title === q || handle === q || sku === q || color === q || category === q) return true;

    // 2. Exact word boundaries in title, category, color, sku, collections
    const titleWords = tokenize(title);
    if (qWords.length === 1) {
      if (titleWords.includes(qWords[0])) return true;
      if (color === qWords[0] || category === qWords[0] || sku === qWords[0]) return true;
      if (colls.some((c) => tokenize(c).includes(qWords[0]))) return true;
    } else {
      // Multi-word: exact phrase in title or all words match exactly in title
      if (title.includes(q)) return true;
      if (qWords.every((w) => titleWords.includes(w))) return true;
    }

    return false;
  });
}

/** Search products with full/exact word match for main search. */
export async function searchProducts(query: string): Promise<Product[]> {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  try {
    const products = await getProducts();
    return matchExactProducts(term, products);
  } catch (err) {
    console.warn("MongoDB searchProducts error:", err);
    return [];
  }
}

export async function getProductByHandle(handle: string): Promise<Product | undefined> {
  try {
    await connectDB();
    const doc = await ProductModel.findOne({ handle }).lean();
    const prod = toPlain<Product>(doc);
    if (prod) return prod;
  } catch (err) {
    console.warn("MongoDB getProductByHandle error:", err);
  }
  return undefined;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    await connectDB();
    const doc = await ProductModel.findOne({ $or: [{ id }, { handle: id }] }).lean();
    const prod = toPlain<Product>(doc);
    if (prod) return prod;
  } catch (err) {
    console.warn("MongoDB getProductById error:", err);
  }
  return undefined;
}

export async function saveProduct(product: Partial<Product> & { title: string; price: number }): Promise<Product> {
  const handle =
    product.handle ||
    product.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const id = product.id || `prod-${Date.now()}`;
  
  // Category determination
  const category =
    product.subcategoryName ||
    product.category ||
    product.mainCategoryName ||
    "Luxury Pret";

  const derivedCollections = deriveCollectionsFromCategory(category, product.collections || []);
  const collSet = new Set(derivedCollections);
  if (product.mainCategorySlug) collSet.add(product.mainCategorySlug);
  if (product.subcategorySlug) collSet.add(product.subcategorySlug);
  const collections = Array.from(collSet);

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
    isSale: product.isSale ?? (!!product.originalPrice && product.originalPrice > product.price),
    isBestSeller: product.isBestSeller ?? false,
    category,
    mainCategoryId: product.mainCategoryId || "",
    mainCategorySlug: product.mainCategorySlug || "",
    mainCategoryName: product.mainCategoryName || "",
    subcategoryId: product.subcategoryId || "",
    subcategorySlug: product.subcategorySlug || "",
    subcategoryName: product.subcategoryName || "",
    collections,
    color: product.color,
    description: product.description || `${product.title} luxury designer dress.`,
    inStock: product.inStock ?? true,
    sizes: product.sizes && product.sizes.length ? product.sizes : ["XS", "S", "M", "L", "XL"],
    fabric: product.fabric || "Pure Silk / Chiffon",
    sku: product.sku || `SLH-${handle.toUpperCase()}`,
    customSizeImage: product.customSizeImage,
    videoId: product.videoId,
    videoUrl: product.videoUrl,
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
    cachedAllProducts = null;
  } catch (err) {
    console.warn("MongoDB saveProduct fallback:", err);
  }

  return fullProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await connectDB();
    const res = await ProductModel.deleteOne({ $or: [{ id }, { handle: id }] });
    cachedAllProducts = null;
    return res.deletedCount > 0;
  } catch (err) {
    console.warn("MongoDB deleteProduct error:", err);
    return false;
  }
}

/* ──────────────── ORDER VALIDATION & PRICING ──────────────── */

export interface CartInputItem {
  id?: string;
  handle?: string;
  size?: string;
  quantity?: number;
  dupatta?: string;
  adOn?: string;
  customSizeNote?: string;
}

export interface ValidatedCartCalculation {
  items: Array<{
    id: string;
    handle: string;
    title: string;
    price: number;
    size: string;
    quantity: number;
    image: string;
    dupatta?: string;
    adOn?: string;
    customSizeNote?: string;
  }>;
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode?: string;
  total: number;
  currency: string;
}

/**
 * Server-side trusted calculation of order total, prices, stock, and discounts.
 * NEVER trusts frontend prices, subtotals, discounts, shipping fees, or totals.
 */
export async function validateAndCalculateOrder(
  rawItems: CartInputItem[],
  discountCodeInput?: string
): Promise<ValidatedCartCalculation> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("Cart must contain at least one item.");
  }

  const settings = await getSettings();
  const validatedItems: ValidatedCartCalculation["items"] = [];
  let subtotal = 0;

  for (const item of rawItems) {
    const lookupId = item.id || item.handle;
    if (!lookupId) {
      throw new Error("Invalid cart item: missing product identifier.");
    }

    const product = (await getProductById(lookupId)) || (await getProductByHandle(lookupId));
    if (!product) {
      throw new Error(`Product not found or no longer available: ${lookupId}`);
    }

    if (product.inStock === false) {
      throw new Error(`Item "${product.title}" is currently out of stock.`);
    }

    const quantity = Math.max(1, Math.min(50, Math.floor(Number(item.quantity) || 1)));
    const size = (item.size || "M").trim();

    // Check size validity if defined on product
    if (product.sizes && product.sizes.length > 0 && !product.sizes.includes(size)) {
      // Allow custom size
      const isCustom = size.toLowerCase().includes("custom");
      const isCustomAllowed = isCustom || product.customization?.sizeCustomization?.toLowerCase().includes("yes");
      if (!isCustomAllowed && !product.sizes.includes(size)) {
        throw new Error(`Selected size "${size}" is not available for "${product.title}".`);
      }
    }

    // Always fetch trusted price from database / product record
    const trustedUnitPrice = Number(product.price);
    if (isNaN(trustedUnitPrice) || trustedUnitPrice <= 0) {
      throw new Error(`Invalid catalog price for item "${product.title}".`);
    }

    subtotal += trustedUnitPrice * quantity;

    validatedItems.push({
      id: product.id,
      handle: product.handle,
      title: product.title,
      price: trustedUnitPrice,
      size,
      quantity,
      image: product.image || product.images?.[0] || "",
      dupatta: item.dupatta,
      adOn: item.adOn,
      customSizeNote: item.customSizeNote,
    });
  }

  // Validate discount code against server-stored active codes
  let discount = 0;
  let validCode: string | undefined = undefined;

  if (discountCodeInput && discountCodeInput.trim()) {
    const code = discountCodeInput.trim().toUpperCase();
    let discountPercent = 0;

    const availableCodes = (settings.discountCodes || []).filter((c) => c.active === true);

    const match = availableCodes.find((c) => c.code.toUpperCase() === code);
    if (match) {
      discountPercent = match.percent;
      validCode = match.code;
    }

    if (discountPercent > 0) {
      discount = Math.round((subtotal * discountPercent) / 100);
    }
  }

  // Calculate shipping charges server-side
  const freeThreshold = Number(settings.freeShippingThreshold) || 140000;
  const standardFee = Number(settings.standardShippingFee) || 250;
  const shipping = subtotal >= freeThreshold ? 0 : standardFee;

  const total = Math.max(0, subtotal - discount + shipping);

  return {
    items: validatedItems,
    subtotal,
    shipping,
    discount,
    discountCode: validCode,
    total,
    currency: "PKR",
  };
}

/* ──────────────── ORDERS & DASHBOARD ──────────────── */

export interface DashboardSummary {
  totalRevenue: number;
  totalOrdersCount: number;
  pendingOrdersCount: number;
  totalProductsCount: number;
  inStockProductsCount: number;
  totalMessagesCount: number;
  unreadMessagesCount: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    customer: { name: string; email: string };
    shippingAddress: { city: string; country: string };
    itemsCount: number;
    total: number;
    status: string;
    paymentStatus: string;
  }>;
  recentMessages: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    status: string;
    createdAt: string;
  }>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await connectDB();

  const [
    productsCount,
    inStockCount,
    ordersCount,
    pendingOrdersCount,
    revenueAgg,
    recentOrderDocs,
    messagesCount,
    unreadMessagesCount,
    recentMessageDocs,
  ] = await Promise.all([
    ProductModel.countDocuments({}),
    ProductModel.countDocuments({ inStock: { $ne: false } }),
    OrderModel.countDocuments({}),
    OrderModel.countDocuments({ status: "pending" }),
    OrderModel.aggregate([
      { $match: { paymentStatus: { $in: ["paid", "succeeded"] } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    OrderModel.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("id orderNumber createdAt customer shippingAddress items total status paymentStatus")
      .lean(),
    ContactMessageModel.countDocuments({}),
    ContactMessageModel.countDocuments({ status: "unread" }),
    ContactMessageModel.find({})
      .sort({ createdAt: -1 })
      .limit(4)
      .select("id name email phone subject message status createdAt")
      .lean(),
  ]);

  const totalRevenue = revenueAgg?.[0]?.total || 0;

  const recentOrders = (recentOrderDocs || []).map((o: any) => ({
    id: o.id || String(o._id),
    orderNumber: o.orderNumber || "0000",
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
    customer: {
      name: o.customer?.name || "Customer",
      email: o.customer?.email || "",
    },
    shippingAddress: {
      city: o.shippingAddress?.city || "Lahore",
      country: o.shippingAddress?.country || "Pakistan",
    },
    itemsCount: Array.isArray(o.items) ? o.items.length : 1,
    total: Number(o.total || 0),
    status: o.status || "pending",
    paymentStatus: o.paymentStatus || "pending",
  }));

  const recentMessages = (recentMessageDocs || []).map((m: any) => ({
    id: m.id || String(m._id),
    name: m.name || "Anonymous",
    email: m.email || "",
    phone: m.phone || "",
    subject: m.subject || "General Inquiry",
    message: m.message || "",
    status: m.status || "unread",
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
  }));

  return {
    totalRevenue,
    totalOrdersCount: ordersCount || 0,
    pendingOrdersCount: pendingOrdersCount || 0,
    totalProductsCount: productsCount || 0,
    inStockProductsCount: inStockCount || 0,
    totalMessagesCount: messagesCount || 0,
    unreadMessagesCount: unreadMessagesCount || 0,
    recentOrders,
    recentMessages,
  };
}

export async function getOrders(limit?: number): Promise<Order[]> {
  await connectDB();
  const query = OrderModel.find({}).sort({ createdAt: -1 });
  if (limit && limit > 0) {
    query.limit(limit);
  }
  const docs = await query.lean();
  return toPlainArray<Order>(docs);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  await connectDB();
  const doc = await OrderModel.findOne({ $or: [{ id }, { orderNumber: id }] }).lean();
  return toPlain<Order>(doc);
}

export async function getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined> {
  await connectDB();
  const doc = await OrderModel.findOne({ stripeSessionId: sessionId }).lean();
  return toPlain<Order>(doc);
}

export async function getOrderByStripePaymentIntentId(piId: string): Promise<Order | undefined> {
  await connectDB();
  const doc = await OrderModel.findOne({ stripePaymentIntentId: piId }).lean();
  return toPlain<Order>(doc);
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

  await connectDB();
  await OrderModel.create(newOrder);
  await recordCustomerFromOrder(newOrder);

  // For card / Stripe orders, NEVER send confirmation email at creation (order is unpaid/pending).
  // Confirmation emails for card orders are triggered strictly when payment is verified by the Stripe webhook.
  if (
    newOrder.paymentMethod === "bank_transfer" ||
    newOrder.paymentMethod === "bank_deposit" ||
    newOrder.paymentMethod === "cod"
  ) {
    try {
      await sendOrderConfirmationEmail(newOrder, newOrder.paymentMethod === "cod");
    } catch (err) {
      console.warn("[Email Notification Error] Order confirmation dispatch:", err);
    }
  }

  return newOrder;
}

export async function recordOrderStripeSession(orderId: string, stripeSessionId: string): Promise<Order | null> {
  await connectDB();
  const doc = await OrderModel.findOneAndUpdate(
    { $or: [{ id: orderId }, { orderNumber: orderId }] },
    { $set: { stripeSessionId } },
    { new: true }
  ).lean();
  return toPlain<Order>(doc) || null;
}

export async function recordOrderPaymentAttempt(orderId: string, paymentIntentId: string): Promise<void> {
  await connectDB();
  const now = new Date().toISOString();
  await OrderModel.findOneAndUpdate(
    { $or: [{ id: orderId }, { orderNumber: orderId }] },
    {
      $set: { stripePaymentIntentId: paymentIntentId },
      $push: {
        paymentTimeline: {
          title: "Payment Intent Created",
          date: now,
          details: `Stripe PaymentIntent ${paymentIntentId} created for verified order amount.`,
        },
      },
    }
  );
}

export async function markOrderPaidByStripe(params: {
  orderId?: string;
  sessionId?: string;
  paymentIntentId?: string;
  customerId?: string;
  amountPaid: number;
  currency: string;
  eventId?: string;
  paymentDetails?: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    funding?: string;
  };
}): Promise<Order | null> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (params.orderId) {
    query.$or = [{ id: params.orderId }, { orderNumber: params.orderId }];
  } else if (params.sessionId) {
    query.stripeSessionId = params.sessionId;
  } else if (params.paymentIntentId) {
    query.stripePaymentIntentId = params.paymentIntentId;
  } else {
    throw new Error("markOrderPaidByStripe requires orderId, sessionId, or paymentIntentId");
  }

  const existing = await OrderModel.findOne(query);
  if (!existing) {
    return null;
  }

  const alreadyPaid = existing.paymentStatus === "paid" || existing.paymentStatus === "succeeded";

  existing.paymentStatus = "paid";
  if (existing.status === "pending") {
    existing.status = "processing";
  }
  if (params.sessionId) existing.stripeSessionId = params.sessionId;
  if (params.paymentIntentId) existing.stripePaymentIntentId = params.paymentIntentId;
  if (params.customerId) existing.stripeCustomerId = params.customerId;
  if (params.amountPaid) existing.amountPaid = params.amountPaid;
  existing.paidAt = new Date();
  if (params.paymentDetails) existing.paymentDetails = params.paymentDetails;
  if (params.eventId) {
    existing.stripeEventIds = existing.stripeEventIds || [];
    if (!existing.stripeEventIds.includes(params.eventId)) {
      existing.stripeEventIds.push(params.eventId);
    }
  }

  existing.paymentTimeline = existing.paymentTimeline || [];
  existing.paymentTimeline.push({
    title: "Payment Succeeded & Verified",
    date: new Date().toISOString(),
    details: `Stripe verified payment of Rs. ${params.amountPaid.toLocaleString()} (${params.currency.toUpperCase()}). Card: ${
      params.paymentDetails?.brand ? params.paymentDetails.brand.toUpperCase() : "Card"
    } •••• ${params.paymentDetails?.last4 || "****"}.`,
  });

  await existing.save();
  const plain = toPlain<Order>(existing.toObject())!;

  // Send confirmation email upon first verified successful payment
  if (!alreadyPaid) {
    try {
      await sendOrderConfirmationEmail(plain);
    } catch (err) {
      console.warn("Nodemailer payment confirmation email notice:", err);
    }
  }

  return plain;
}

export async function markOrderPaymentFailed(params: {
  orderId?: string;
  paymentIntentId?: string;
  reason: string;
  eventId?: string;
}): Promise<Order | null> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (params.orderId) query.$or = [{ id: params.orderId }, { orderNumber: params.orderId }];
  else if (params.paymentIntentId) query.stripePaymentIntentId = params.paymentIntentId;
  else return null;

  const order = await OrderModel.findOne(query);
  if (!order) return null;

  order.paymentStatus = "failed";
  order.failureReason = params.reason;
  order.paymentTimeline = order.paymentTimeline || [];
  order.paymentTimeline.push({
    title: "Payment Failed / Declined",
    date: new Date().toISOString(),
    details: params.reason,
  });

  if (params.eventId) {
    order.stripeEventIds = order.stripeEventIds || [];
    if (!order.stripeEventIds.includes(params.eventId)) {
      order.stripeEventIds.push(params.eventId);
    }
  }

  await order.save();
  const plain = toPlain<Order>(order.toObject()) || null;
  if (plain) {
    try {
      await sendPaymentFailureEmail(plain, params.reason);
    } catch (err) {
      console.warn("[Email Notification Error] Payment failure notice:", err);
    }
  }
  return plain;
}

export async function cancelOrderAndProcessRefund(params: {
  orderId: string;
  reason?: string;
  cancelledBy?: string;
}): Promise<Order | null> {
  await connectDB();
  const order = await OrderModel.findOne({
    $or: [{ id: params.orderId }, { orderNumber: params.orderId }],
  });
  if (!order) return null;

  const now = new Date();
  const isoNow = now.toISOString();
  const reasonText = params.reason || `Cancelled by ${params.cancelledBy || "admin"}`;

  order.cancellationReason = reasonText;
  order.cancelledAt = now;
  order.status = "cancelled";

  // Scenario B: Order is PAID -> Process automatic refund via Stripe
  if (order.paymentStatus === "paid" || order.paymentStatus === "succeeded") {
    const totalPaid = Number(order.amountPaid || order.total || 0);
    const alreadyRefunded = Number(order.refundAmount || 0);
    const refundableAmount = Math.max(0, totalPaid - alreadyRefunded);

    if (refundableAmount > 0 && order.stripePaymentIntentId) {
      try {
        const stripe = getStripeServer();
        const currency = (order.currency || "PKR").toLowerCase();
        const stripeUnitAmount = toStripeAmount(refundableAmount, currency);

        // Safe idempotency key to prevent duplicate refunds
        const idempotencyKey = `refund_auto_${order.id}_${Math.round(refundableAmount * 100)}`;

        const refund = await stripe.refunds.create(
          {
            payment_intent: order.stripePaymentIntentId,
            amount: stripeUnitAmount,
            reason: "requested_by_customer",
          },
          { idempotencyKey }
        );

        order.refundAmount = alreadyRefunded + refundableAmount;
        order.refundId = refund.id;
        order.refundedAt = now;
        order.refundStatus = "refunded";
        order.paymentStatus = "refunded";

        order.refundTimeline = order.refundTimeline || [];
        order.refundTimeline.push({
          title: "Automatic Refund Initiated",
          date: isoNow,
          details: `Automatic full refund of Rs. ${refundableAmount.toLocaleString()} initiated via Stripe (Refund ID: ${
            refund.id
          }). Note: Funds will reflect in customer's bank account in 5-10 business days.`,
          amount: refundableAmount,
          refundId: refund.id,
        });
      } catch (refundErr: unknown) {
        const errMsg = refundErr instanceof Error ? refundErr.message : "Stripe refund creation failed";
        console.error(`[Auto-Refund Error for Order ${order.id}]:`, errMsg);
        order.refundStatus = "refund_failed";
        order.refundFailureReason = errMsg;
        order.refundTimeline = order.refundTimeline || [];
        order.refundTimeline.push({
          title: "Automatic Refund Failed",
          date: isoNow,
          details: `Automatic refund could not be completed by Stripe: ${errMsg}. An authorized administrator can review and retry.`,
          amount: refundableAmount,
        });
      }
    } else {
      order.refundStatus = alreadyRefunded > 0 ? "refunded" : "none";
    }
  } else {
    // Scenario A: Order cancelled before payment
    if (order.stripePaymentIntentId) {
      try {
        const stripe = getStripeServer();
        const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
        if (
          pi.status === "requires_payment_method" ||
          pi.status === "requires_confirmation" ||
          pi.status === "requires_action" ||
          pi.status === "requires_capture"
        ) {
          await stripe.paymentIntents.cancel(order.stripePaymentIntentId, {
            cancellation_reason: "requested_by_customer",
          });
        }
      } catch (cancelErr) {
        console.warn("[PaymentIntent Cancel Warning]:", cancelErr);
      }
    }

    order.paymentStatus = "cancelled";
    order.paymentTimeline = order.paymentTimeline || [];
    order.paymentTimeline.push({
      title: "Order & Payment Cancelled",
      date: isoNow,
      details: "Order cancelled before payment completion. No refund required.",
    });
  }

  await order.save();
  const plain = toPlain<Order>(order.toObject()) || null;
  if (plain) {
    try {
      await sendOrderCancellationEmail(plain, reasonText);
    } catch (err) {
      console.warn("[Email Notification Error] Order cancellation notice:", err);
    }
    if (order.refundAmount && order.refundAmount > 0) {
      try {
        await sendRefundInitiatedEmail(plain, order.refundAmount, true, order.refundId);
      } catch (err) {
        console.warn("[Email Notification Error] Refund initiated notice:", err);
      }
    }
  }
  return plain;
}

export async function processPartialRefund(params: {
  orderId: string;
  amount: number;
  reason?: string;
  initiatedBy?: string;
}): Promise<Order | null> {
  await connectDB();
  const order = await OrderModel.findOne({
    $or: [{ id: params.orderId }, { orderNumber: params.orderId }],
  });
  if (!order) throw new Error("Order not found.");

  if (!order.stripePaymentIntentId) {
    throw new Error("No Stripe PaymentIntent associated with this order.");
  }

  const totalPaid = Number(order.amountPaid || order.total || 0);
  const alreadyRefunded = Number(order.refundAmount || 0);
  const remainingRefundable = Math.max(0, totalPaid - alreadyRefunded);

  if (params.amount <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  if (params.amount > remainingRefundable) {
    throw new Error(
      `Cannot refund Rs. ${params.amount}. Maximum remaining refundable amount is Rs. ${remainingRefundable}.`
    );
  }

  const now = new Date();
  const isoNow = now.toISOString();
  const stripe = getStripeServer();
  const currency = (order.currency || "PKR").toLowerCase();
  const stripeUnitAmount = toStripeAmount(params.amount, currency);

  const idempotencyKey = `refund_part_${order.id}_${Math.round(params.amount * 100)}_${Date.now()}`;

  const refund = await stripe.refunds.create(
    {
      payment_intent: order.stripePaymentIntentId,
      amount: stripeUnitAmount,
      reason: "requested_by_customer",
    },
    { idempotencyKey }
  );

  const newTotalRefunded = alreadyRefunded + params.amount;
  const isFull = newTotalRefunded >= totalPaid;

  order.refundAmount = newTotalRefunded;
  order.refundId = refund.id;
  order.refundedAt = now;
  order.refundStatus = isFull ? "refunded" : "partially_refunded";
  order.paymentStatus = isFull ? "refunded" : "partially_refunded";

  order.refundTimeline = order.refundTimeline || [];
  order.refundTimeline.push({
    title: isFull ? "Full Refund Completed" : "Partial Refund Issued",
    date: isoNow,
    details: `${isFull ? "Full" : "Partial"} refund of Rs. ${params.amount.toLocaleString()} processed via Stripe (Refund ID: ${
      refund.id
    }). Reason: ${params.reason || "Customer request"}.`,
    amount: params.amount,
    refundId: refund.id,
  });

  await order.save();
  const plain = toPlain<Order>(order.toObject()) || null;
  if (plain) {
    try {
      await sendRefundInitiatedEmail(plain, params.amount, isFull, refund.id);
    } catch (err) {
      console.warn("[Email Notification Error] Partial refund notice:", err);
    }
  }
  return plain;
}

export async function recordOrderRefund(params: {
  orderId?: string;
  paymentIntentId?: string;
  refundId: string;
  refundAmount: number;
  isFullRefund: boolean;
  eventId?: string;
}): Promise<Order | null> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (params.orderId) {
    query.$or = [{ id: params.orderId }, { orderNumber: params.orderId }];
  } else if (params.paymentIntentId) {
    query.stripePaymentIntentId = params.paymentIntentId;
  } else {
    throw new Error("recordOrderRefund requires orderId or paymentIntentId");
  }

  const order = await OrderModel.findOne(query);
  if (!order) return null;

  order.refundId = params.refundId;
  order.refundAmount = (order.refundAmount || 0) + params.refundAmount;
  order.refundStatus = params.isFullRefund ? "refunded" : "partially_refunded";
  order.paymentStatus = params.isFullRefund ? "refunded" : "partially_refunded";
  order.refundedAt = new Date();

  order.refundTimeline = order.refundTimeline || [];
  order.refundTimeline.push({
    title: params.isFullRefund ? "Full Refund Verified via Webhook" : "Partial Refund Verified via Webhook",
    date: new Date().toISOString(),
    details: `Stripe webhook confirmed refund of Rs. ${params.refundAmount.toLocaleString()} (Refund ID: ${
      params.refundId
    }).`,
    amount: params.refundAmount,
    refundId: params.refundId,
  });

  if (params.eventId) {
    order.stripeEventIds = order.stripeEventIds || [];
    if (!order.stripeEventIds.includes(params.eventId)) {
      order.stripeEventIds.push(params.eventId);
    }
  }

  await order.save();
  const plain = toPlain<Order>(order.toObject()) || null;
  if (plain) {
    try {
      await sendRefundSuccessfulEmail(plain, params.refundAmount, params.isFullRefund, params.refundId);
    } catch (err) {
      console.warn("[Email Notification Error] Refund confirmation notice:", err);
    }
  }
  return plain;
}

export async function deleteOrder(id: string): Promise<boolean> {
  try {
    await connectDB();
    const res = await OrderModel.deleteOne({ $or: [{ id }, { orderNumber: id }] });
    return res.deletedCount > 0;
  } catch (err) {
    console.warn("MongoDB deleteOrder error:", err);
    return false;
  }
}

export async function updateOrderStatus(
  id: string,
  updates: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    trackingNumber?: string;
    courier?: string;
    trackingUrl?: string;
    shippingDate?: Date;
    estimatedDeliveryDate?: string;
  },
): Promise<Order | null> {
  // If order is transitioning to cancelled, execute complete automatic cancellation & refund logic!
  if (updates.status === "cancelled") {
    return cancelOrderAndProcessRefund({ orderId: id, reason: "Order cancelled by administrator" });
  }

  try {
    await connectDB();
    const doc = await OrderModel.findOneAndUpdate(
      { $or: [{ id }, { orderNumber: id }] },
      { $set: updates },
      { new: true }
    ).lean();
    if (doc) {
      const plainOrder = toPlain<Order>(doc)!;
      // Send shipping / tracking update email via nodemailer
      if (updates.status || updates.trackingNumber || updates.trackingUrl) {
        try {
          await sendShippingUpdateEmail(plainOrder);
        } catch (err) {
          console.warn("[Email Notification Error] Shipping update notice:", err);
        }
      }
      return plainOrder;
    }
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

export async function getCustomerByEmail(email: string): Promise<Customer | undefined> {
  const normalized = email.toLowerCase().trim();
  try {
    await connectDB();
    const doc = await CustomerModel.findOne({ email: normalized }).lean();
    if (doc) return toPlain<Customer>(doc);
  } catch (err) {
    console.warn("MongoDB getCustomerByEmail fallback:", err);
  }
  return INITIAL_CUSTOMERS.find((customer) => customer.email.toLowerCase().trim() === normalized);
}

export async function createCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}): Promise<Customer> {
  const normalized = data.email.toLowerCase().trim();
  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    name: data.name.trim(),
    email: normalized,
    phone: data.phone?.trim() || "",
    password: data.password || "",
    createdAt: new Date().toISOString(),
    ordersCount: 0,
    totalSpent: 0,
    addresses: [],
  };

  try {
    await connectDB();
    await CustomerModel.create(newCustomer);
  } catch (err) {
    console.warn("MongoDB createCustomer error:", err);
  }

  return newCustomer;
}

export async function updateCustomerProfile(
  idOrEmail: string,
  updates: { name?: string; email?: string; phone?: string; password?: string }
): Promise<Customer | null> {
  try {
    await connectDB();
    const query = {
      $or: [
        { id: idOrEmail },
        { email: idOrEmail.toLowerCase().trim() },
      ],
    };

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.email !== undefined) updateData.email = updates.email.toLowerCase().trim();
    if (updates.phone !== undefined) updateData.phone = updates.phone.trim();
    if (updates.password !== undefined && updates.password.length > 0) updateData.password = updates.password;

    const doc = await CustomerModel.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    ).lean();

    if (doc) {
      return toPlain<Customer>(doc)!;
    }
  } catch (err) {
    console.warn("MongoDB updateCustomerProfile error:", err);
  }
  return null;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  try {
    await connectDB();
    const res = await CustomerModel.deleteOne({ id });
    return res.deletedCount > 0;
  } catch (err) {
    console.warn("MongoDB deleteCustomer error:", err);
    return false;
  }
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
  return [];
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
    // Send email notification via nodemailer
    try {
      await sendContactFormNotification({
        name: newMessage.name,
        email: newMessage.email,
        phone: newMessage.phone,
        subject: newMessage.subject,
        message: newMessage.message,
      });
    } catch (err) {
      console.warn("Nodemailer contact notification notice:", err);
    }
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
    console.warn("MongoDB getBlogs error:", err);
  }
  return [];
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    await connectDB();
    const doc = await BlogPostModel.findOne({ $or: [{ slug }, { id: slug }] }).lean();
    const b = toPlain<BlogPost>(doc);
    if (b) return b;
  } catch (err) {
    console.warn("MongoDB getBlogBySlug error:", err);
  }
  return undefined;
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
  adminEmail: "admin@sillhouete.com",
  adminPasswordHash: "admin123",
  bankName: "Meezan Bank",
  bankAccountTitle: "SILLHOUETE",
  bankIban: "PK80MEZN0002160109517881",
  discountCodes: [
    { code: "WELCOME5", percent: 5, active: true },
    { code: "EID2026", percent: 10, active: true },
  ],
  campaignVideoUrl: "https://cdn.shopify.com/videos/c/o/v/061ca40eef70464293b2a672d62f7b0a.mp4",
  defaultProductVideoUrl: "https://cdn.shopify.com/videos/c/o/v/061ca40eef70464293b2a672d62f7b0a.mp4",
};

export const getSettings = cache(async function getSettings(): Promise<SiteSettings> {
  if (cachedSettings && Date.now() < cachedSettings.expiresAt) {
    return cachedSettings.data;
  }

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

  cachedSettings = { data: settings, expiresAt: Date.now() + 60_000 };
  return settings;
});

export async function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  cachedSettings = null;
  try {
    await connectDB();
    const cleanUpdates = { ...updates };
    delete (cleanUpdates as Record<string, unknown>).id;
    delete (cleanUpdates as Record<string, unknown>)._id;
    delete (cleanUpdates as Record<string, unknown>).__v;
    delete (cleanUpdates as Record<string, unknown>).stripeSecretKeyConfigured;

    const doc = await SiteSettingsModel.findOneAndUpdate(
      {},
      { $set: cleanUpdates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    const plain = toPlain<SiteSettings>(doc);
    if (plain) return plain;
  } catch (err) {
    console.error("MongoDB updateSettings error:", err);
    throw err;
  }

  return { ...INITIAL_SETTINGS, ...updates };
}
