import { COLLECTION_PRODUCTS } from "@/data/products";
import type { Product } from "@/types";

/**
 * Frontend-only helper: resolves a collection handle to its real product list.
 *
 * Membership + ordering come from COLLECTION_PRODUCTS (the supplied Shopify
 * collection data). Each entry is resolved against the live catalog returned by
 * the existing data layer (`getProducts`) so price/image/stock stay current;
 * if a product is not in the live catalog the supplied record is used as-is.
 *
 * Returns `undefined` when there is no membership data for the handle. It never
 * pads the list with unrelated products.
 */
export function getCollectionProducts(
  handle: string,
  catalog: Product[]
): Product[] | undefined {
  const members = COLLECTION_PRODUCTS[handle];
  if (!members) return undefined;

  const byHandle = new Map(catalog.map((p) => [p.handle, p]));
  const seen = new Set<string>();
  const result: Product[] = [];

  for (const m of members) {
    if (seen.has(m.handle)) continue;
    seen.add(m.handle);
    result.push(byHandle.get(m.handle) ?? m);
  }
  return result;
}
