import Link from "next/link";
import { notFound } from "next/navigation";
import { allProducts, COLLECTION_PRODUCTS } from "@/data/products";
import { COLLECTION_TITLES } from "@/data/site";
import CollectionViewer from "./CollectionViewer";

type Props = { params: Promise<{ handle: string }> };

export function generateStaticParams() {
  const handles = new Set([
    ...Object.keys(COLLECTION_TITLES),
    ...Object.keys(COLLECTION_PRODUCTS),
    "1",
    "all",
    "shop-all",
  ]);
  return Array.from(handles).map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const title =
    COLLECTION_TITLES[handle] ||
    handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: `${title} – Sillhouete` };
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  const rawTitle = COLLECTION_TITLES[handle];
  const title =
    rawTitle ||
    handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Retrieve products for this handle or generate appropriate collection
  let products = COLLECTION_PRODUCTS[handle] ? [...COLLECTION_PRODUCTS[handle]] : [];

  if (handle === "1" || handle === "all" || handle === "shop-all") {
    products = [...allProducts];
  } else if (products.length === 0) {
    const term = handle.replace(/-/g, " ").toLowerCase();
    const matched = allProducts.filter((p) => {
      const cat = (p.category || "").toLowerCase();
      const t = p.title.toLowerCase();
      return cat.includes(term) || t.includes(term);
    });
    products = matched.length >= 8 ? matched : [...matched, ...allProducts.slice(0, 16 - matched.length)];
  } else if (products.length < 8) {
    // If collection has fewer than 8 items, supplement with related styles from allProducts
    const existingIds = new Set(products.map((p) => p.id));
    const extra = allProducts.filter((p) => !existingIds.has(p.id)).slice(0, 8 - products.length);
    products = [...products, ...extra];
  }

  return (
    <section className="mx-auto w-full max-w-[1420px] px-2.5 py-10 md:px-10">
      <header className="mb-6 text-center">
        <h1 className="heading text-[26px] md:text-[34px]">{title}</h1>
        <p className="mt-2 text-xs uppercase tracking-widest text-black/60">
          Handcrafted Luxury Pakistani Pret &amp; Couture
        </p>
      </header>

      <CollectionViewer
        title={title}
        initialProducts={products}
        isSalePage={handle === "sale-1" || handle === "sale"}
      />
    </section>
  );
}
