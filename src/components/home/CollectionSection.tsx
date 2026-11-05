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
  viewAllRed?: boolean;
  hideViewAll?: boolean;
}

export default function CollectionSection({
  title,
  products,
  href,
  totalCount,
  showViewAll = false,
  showNewBadge = false,
  viewAllRed = false,
  hideViewAll = false,
}: Props) {
  const shouldShowViewAll = !hideViewAll && showViewAll && Boolean(href);
  const displayedProducts = products.slice(0, 8);

  return (
    <section className="mx-auto w-full max-w-355 px-3.5 py-8 sm:px-6 sm:py-10 md:px-10 md:py-12">
      <div className="mb-6 text-center md:mb-8">
        <h2 className="text-[16px] font-semibold uppercase leading-none tracking-wider text-[#111111] sm:text-[17px] md:text-[20px]">
          {title}
        </h2>
      </div>

      <ProductGrid products={displayedProducts} showNewBadge={showNewBadge} />

      {shouldShowViewAll && href && (
        <div className="mt-10 md:mt-12 mb-2 text-center">
          <Link
            href={href}
            className={`btn inline-flex items-center justify-center bg-[#111111] px-6 py-[11px] text-[11px] font-bold uppercase tracking-[0.25em] rounded-none border border-[#111111] hover:bg-[#222222] transition-colors shadow-none ${
              viewAllRed ? "view-all-red !text-[#ff0000]" : "!text-white"
            }`}
          >
            View all
          </Link>
        </div>
      )}
    </section>
  );
}
