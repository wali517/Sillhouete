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
        <h2 className="font-serif text-[24px] md:text-[18px] font-semibold uppercase tracking-[0.05em] text-[#111111]">
          {title}
        </h2>
      </div>

      <ProductGrid products={displayedProducts} />

      {href && (
        <div className="mt-8 md:mt-10 text-center">
          <Link
            href={href}
            className="inline-block border border-black bg-white hover:bg-black text-black hover:text-white px-9 py-3 text-[12px] uppercase tracking-[0.2em] font-medium transition-colors duration-200 shadow-xs"
          >
            View all
          </Link>
        </div>
      )}
    </section>
  );
}
