import { allProducts } from "@/data/products";
import { COLLECTION_TITLES } from "@/data/site";
import type { Product } from "@/types";

export interface PredictiveResult {
  suggestions: string[];
  pages: { label: string; href: string }[];
  collections: { label: string; href: string }[];
  products: Product[];
}

const PAGES = [
  { label: "Spotted", href: "/pages/spot" },
  { label: "Shipping Policy.", href: "/pages/shipping-policy" },
  { label: "Brand Story", href: "/pages/brand-story" },
  { label: "Contact Us.", href: "/pages/contact-us" },
  { label: "FAQs.", href: "/pages/faqs" },
  { label: "Privacy Policy", href: "/pages/privacy-policy" },
  { label: "Terms and Conditions", href: "/pages/terms-and-conditions" },
  { label: "Made-to-Order Policy", href: "/pages/policies" },
];

// Collections (label + href), de-duplicated, built once.
const COLLECTIONS = (() => {
  const seen = new Set<string>();
  const out: { label: string; href: string }[] = [];
  for (const [handle, label] of (Object.entries(COLLECTION_TITLES) as [string, string][])) {
    if (handle === "1") continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, href: `/collections/${handle}` });
  }
  return out;
})();

const tokenize = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1);

// Per-product search text, built once.
const INDEX = allProducts.map((p) => ({
  p,
  title: p.title.toLowerCase(),
  words: tokenize(p.title),
  extra: `${p.handle} ${p.category || ""} ${p.color || ""} ${p.sku || ""}`.toLowerCase(),
}));

export function predictiveSearch(raw: string, productLimit = 4): PredictiveResult {
  const q = raw.trim().toLowerCase();
  if (!q) return { suggestions: [], pages: [], collections: [], products: [] };

  const scored: { p: Product; score: number }[] = [];
  const tokenCount = new Map<string, number>();

  for (const e of INDEX) {
    let score = -1;
    if (e.words.some((w) => w.startsWith(q))) score = 0;
    else if (e.title.includes(q)) score = 1;
    else if (e.extra.includes(q)) score = 2;
    if (score >= 0) scored.push({ p: e.p, score });

    for (const t of [...e.words, ...tokenize(e.extra)]) {
      if (t.startsWith(q)) tokenCount.set(t, (tokenCount.get(t) || 0) + 1);
    }
  }

  scored.sort((a, b) => a.score - b.score);

  const suggestions = [...tokenCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
    .slice(0, 3)
    .map(([t]) => t);

  return {
    suggestions,
    pages: PAGES.filter((x) => x.label.toLowerCase().includes(q)).slice(0, 3),
    collections: COLLECTIONS.filter((x) => x.label.toLowerCase().includes(q)).slice(0, 3),
    products: scored.slice(0, productLimit).map((s) => s.p),
  };
}
