"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProductGrid from "./ProductGrid";
import { bestSellers } from "@/data/products";

/* Shows a row of products at the bottom of pages that would otherwise have none
   (policy pages, blog, search, cart, account, FAQ, contact). */
const SKIP: string[] = [];

export default function PageProducts() {
  const path = usePathname() || "/";
  if (SKIP.some((s) => (s === "/" ? path === "/" : path === s || path.startsWith(s + "/")))) return null;
  return (
    <section aria-label="Featured products" className="mx-auto w-full max-w-[1420px] px-2.5 pb-14 pt-4 md:px-10">
      <h2 className="heading mb-6 text-center text-[25px]">Best Sellers</h2>
      <ProductGrid products={bestSellers.slice(0, 4)} />
      <div className="mt-8 text-center">
        <Link href="/collections/best-sellers" className="btn">View all</Link>
      </div>
    </section>
  );
}
