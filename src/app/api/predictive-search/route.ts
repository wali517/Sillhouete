import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/db";
import { COLLECTION_TITLES } from "@/data/site";

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    if (!q) {
      return NextResponse.json({ suggestions: [], pages: [], collections: [], products: [] });
    }

    const products = await searchProducts(q);
    const matchedPages = PAGES.filter((p) => p.label.toLowerCase().includes(q));

    const matchedCollections: { label: string; href: string }[] = [];
    for (const [handle, label] of Object.entries(COLLECTION_TITLES)) {
      if (label.toLowerCase().includes(q)) {
        matchedCollections.push({ label, href: `/collections/${handle}` });
      }
    }

    const suggestions = Array.from(
      new Set(
        products.map((p) => p.title.toLowerCase())
      )
    ).slice(0, 5);

    return NextResponse.json({
      suggestions,
      pages: matchedPages.slice(0, 3),
      collections: matchedCollections.slice(0, 3),
      products: products.slice(0, 4),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to perform predictive search";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
