import type { Product } from "@/types";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, showNewBadge = false }: { products: Product[]; showNewBadge?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 sm:grid-cols-3 sm:gap-x-3.5 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-[17px] lg:gap-y-10">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} isNew={showNewBadge} />
      ))}
    </div>
  );
}
