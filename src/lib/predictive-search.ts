import type { Product } from "@/types";

export interface PredictiveResult {
  suggestions: string[];
  pages: { label: string; href: string }[];
  collections: { label: string; href: string }[];
  products: Product[];
}

export function predictiveSearch(_raw: string, _productLimit = 4): PredictiveResult {
  return { suggestions: [], pages: [], collections: [], products: [] };
}
