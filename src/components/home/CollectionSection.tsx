import Link from "next/link";
import type { Product } from "@/types";
import ProductGrid from "@/components/products/ProductGrid";

interface Props {
  title: string;
  products: Product[];
  href?: string;
  totalCount?: number;
}

export default function CollectionSection({ title, products, href, totalCount }: Props) {
  const actualCount = totalCount !== undefined ? totalCount : products.length;
  const hasMoreThanEight = actualCount > 8 || products.length > 8;
  const displayedProducts = products.slice(0, 8);

  return (
    <section className="mx-auto w-full max-w-[1440px] px-2.5 py-10 md:px-10 md:py-14">
      <div className="mb-6 text-center md:mb-8">
        <h2 className="font-serif text-[24px] md:text-[28px] font-semibold uppercase tracking-[0.05em] text-[#111111]">
          {title}
        </h2>
      </div>

      <ProductGrid products={displayedProducts} />

      {hasMoreThanEight && href && (
        <div className="mt-10 text-center">
          <Link
            href={href}
            className="inline-block border border-black bg-black px-8 py-3.5 text-xs font-bold uppercase tracking-[0.25em] text-white transition-all hover:bg-neutral-800 shadow-sm"
          >
            View all
          </Link>
        </div>
      )}
    </section>
  );
}
