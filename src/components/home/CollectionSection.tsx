import Link from "next/link";
import type { Product } from "@/types";
import ProductGrid from "@/components/products/ProductGrid";

interface Props {
  title: string;
  products: Product[];
  href?: string;
  totalCount?: number;
  showViewAll?: boolean;
  showNewBadge?: boolean;
}

export default function CollectionSection({ title, products, href, totalCount, showViewAll = false, showNewBadge = false }: Props) {
  const actualCount = totalCount !== undefined ? totalCount : products.length;
  const hasMoreThanEight = actualCount > 8 || products.length > 8 || showViewAll;
  const displayedProducts = products.slice(0, 8);

  return (
    <section className="mx-auto w-full max-w-[1440px] px-3 py-8 sm:px-5 sm:py-9 md:px-8 md:py-12 lg:px-10 lg:py-14">
      <div className="mb-5 text-center sm:mb-6 md:mb-8">
        <h2 className="font-serif text-[20px] font-medium uppercase tracking-[0.07em] text-[#111111] sm:text-[22px] md:text-[26px] lg:text-[28px]">
          {title}
        </h2>
      </div>

      <ProductGrid products={displayedProducts} showNewBadge={showNewBadge} />

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
