import type { Product } from "@/types";
import ProductCard from "./ProductCard";

/**
 * Live-site behaviour: below 768px the products sit in one horizontal swipeable row with the next card
 * peeking in (~2.3 cards on a phone / tablet) and the browser's own scrollbar underneath; from 768px up
 * it is a 4-column grid.
 */
export default function ProductGrid({
  products,
  showNewBadge = false,
  priorityFirst = false,
}: {
  products: Product[];
  showNewBadge?: boolean;
  priorityFirst?: boolean;
}) {
  return (
    <div className="flex snap-x gap-3 overflow-x-auto pb-3 md:grid md:snap-none md:grid-cols-4 md:gap-x-[17px] md:gap-y-10 md:overflow-visible md:pb-0">
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          index={i}
          priority={priorityFirst && i < 2}
          isNew={showNewBadge}
          className="w-[43vw] shrink-0 snap-start sm:w-[37.6vw] md:w-auto"
        />
      ))}
    </div>
  );
}
