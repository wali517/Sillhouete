import type { Product } from "@/types";

/**
 * Hardcoded products data has been migrated to MongoDB Atlas.
 * All dynamic products, collections, and inventory are served directly from MongoDB.
 */
export const allProducts: Product[] = [];
export const COLLECTION_HANDLES: Record<string, string[]> = {};
export const COLLECTION_PRODUCTS: Record<string, Product[]> = {};

export const bestSellers: Product[] = [];
export const formals: Product[] = [];
export const maahiII: Product[] = [];
export const rahaPret: Product[] = [];
export const silkSolids: Product[] = [];

export const getProduct = (_handle: string): Product | undefined => undefined;
