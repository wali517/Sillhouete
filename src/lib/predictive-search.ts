import { COLLECTION_TITLES } from "@/data/site";
import type { Product } from "@/types";

export interface PredictiveResult {
  suggestions: string[];
  pages: { label: string; href: string }[];
  collections: { label: string; href: string }[];
  products: Product[];
}

export const SEARCH_PAGES: { label: string; href: string }[] = [
  { label: "Spotted", href: "/pages/spot" },
  { label: "Shipping Policy.", href: "/pages/shipping-policy" },
  { label: "Brand Story", href: "/pages/brand-story" },
  { label: "Contact Us.", href: "/pages/contact-us" },
  { label: "FAQs.", href: "/pages/faqs" },
  { label: "Privacy Policy", href: "/pages/privacy-policy" },
  { label: "Terms and Conditions", href: "/pages/terms-and-conditions" },
  { label: "Made-to-Order Policy", href: "/pages/policies" },
  { label: "Exchange, Refund & Cancelation Policy", href: "/pages/policies" },
  { label: "Blog & News", href: "/blogs/news" },
];

export const SEARCH_COLLECTIONS: { label: string; href: string }[] = (() => {
  const seen = new Set<string>();
  const out: { label: string; href: string }[] = [];
  for (const [handle, rawLabel] of Object.entries(COLLECTION_TITLES)) {
    if (handle === "1") continue;
    const label = (rawLabel || "").trim();
    const key = label.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ label, href: `/collections/${handle}` });
  }
  return out;
})();

const STOP_WORDS = new Set([
  "in",
  "to",
  "of",
  "at",
  "by",
  "for",
  "with",
  "a",
  "an",
  "the",
  "is",
  "on",
  "or",
  "ii",
  "and",
]);

export const tokenize = (s: string): string[] =>
  (s || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);

/**
 * High-performance relevance scoring and prediction algorithm.
 * Dynamically processes any catalog of products (e.g. from MongoDB).
 */
export function executePredictiveSearch(
  raw: string,
  catalog: Product[] = [],
  productLimit = 6
): PredictiveResult {
  const q = raw.trim().toLowerCase();
  if (!q) {
    return { suggestions: [], pages: [], collections: [], products: [] };
  }

  // 1. Pages matching
  const matchedPages = SEARCH_PAGES
    .map((page) => {
      const lower = page.label.toLowerCase();
      const words = tokenize(lower);
      let score = -1;
      if (lower.startsWith(q)) score = 0;
      else if (words.some((w) => w.startsWith(q))) score = 1;
      else if (lower.includes(q)) score = 2;
      return { page, score };
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => item.page);

  // 2. Collections matching
  const matchedCollections = SEARCH_COLLECTIONS
    .map((col) => {
      const lower = col.label.toLowerCase();
      const words = tokenize(lower);
      let score = -1;
      if (lower.startsWith(q)) score = 0;
      else if (words.some((w) => w.startsWith(q))) score = 1;
      else if (lower.includes(q)) score = 2;
      return { col, score };
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((item) => item.col);

  // 3. Products matching & keyword extraction
  const scoredProducts: { product: Product; score: number }[] = [];
  const tokenCount = new Map<string, number>();

  for (const p of catalog) {
    const title = (p.title || "").toLowerCase();
    const handle = (p.handle || "").toLowerCase();
    const category = (p.category || "").toLowerCase();
    const sku = (p.sku || "").toLowerCase();
    const color = (p.color || "").toLowerCase();
    const colls = Array.isArray(p.collections) ? p.collections.join(" ").toLowerCase() : "";
    const desc = (p.description || "").toLowerCase();

    const titleWords = tokenize(title);
    const extraWords = tokenize(`${handle} ${category} ${sku} ${color} ${colls}`);

    let score = -1;
    if (title.startsWith(q)) {
      score = 0;
    } else if (titleWords.some((w) => w.startsWith(q))) {
      score = 1;
    } else if (title.includes(q)) {
      score = 2;
    } else if (handle.startsWith(q)) {
      score = 3;
    } else if (extraWords.some((w) => w.startsWith(q))) {
      score = 4;
    } else if (category.includes(q) || colls.includes(q)) {
      score = 5;
    } else if (desc.includes(q)) {
      score = 6;
    }

    if (score >= 0) {
      scoredProducts.push({ product: p, score });
    }

    // Token frequency count for suggestions
    for (const token of [...titleWords, ...extraWords]) {
      if (token.startsWith(q) && token.length >= q.length) {
        if (STOP_WORDS.has(token) && token !== q) continue;
        tokenCount.set(token, (tokenCount.get(token) || 0) + 1);
      }
    }
  }

  // Also include collection tokens
  for (const col of SEARCH_COLLECTIONS) {
    const colWords = tokenize(col.label);
    for (const token of colWords) {
      if (token.startsWith(q) && token.length >= q.length) {
        if (STOP_WORDS.has(token) && token !== q) continue;
        tokenCount.set(token, (tokenCount.get(token) || 0) + 2);
      }
    }
  }

  // Rank suggestions
  const suggestions = [...tokenCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
    .slice(0, 5)
    .map(([token]) => token);

  // If no single token started with q, but products matched, use top product titles
  if (suggestions.length === 0 && scoredProducts.length > 0) {
    for (const sp of scoredProducts.slice(0, 3)) {
      const lower = sp.product.title.toLowerCase();
      if (!suggestions.includes(lower)) {
        suggestions.push(lower);
      }
    }
  }

  scoredProducts.sort((a, b) => a.score - b.score);

  return {
    suggestions,
    pages: matchedPages,
    collections: matchedCollections,
    products: scoredProducts.slice(0, productLimit).map((s) => s.product),
  };
}

export function predictiveSearch(
  raw: string,
  catalog: Product[] = [],
  productLimit = 4
): PredictiveResult {
  return executePredictiveSearch(raw, catalog, productLimit);
}
