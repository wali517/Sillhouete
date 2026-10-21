import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/format";

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <article className="group relative animate-fade-in">
      <div className="relative">
        <Link href={`/products/${product.handle}`} className="block" aria-label={product.title}>
          <div className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: `1 / ${product.ratio}` }}>
            <Image
              src={product.image}
              alt={product.alt}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              priority={priority}
              className="object-cover"
            />
            <Image
              src={product.hoverImage}
              alt=""
              fill
              sizes="25vw"
              className="hidden object-cover opacity-0 transition-opacity duration-500 motion-reduce:transition-none md:block md:group-hover:opacity-100"
            />
          </div>
        </Link>
        {/* NEW tag shown at top-right corner on mouse hover (no favorite icon on bottom-left) */}
        <span className="pointer-events-none absolute right-[3px] top-[10px] z-10 rounded-[3px] bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-black opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100">
          NEW
        </span>
      </div>
      <Link href={`/products/${product.handle}`} className="mt-3 block text-center">
        <h3 className="font-serif text-[14px] md:text-[15px] font-semibold uppercase tracking-[0.04em] text-[#111111]">
          {product.title}
        </h3>
        <p className="mt-1 text-[15px] md:text-[16px] text-black font-normal">
          {product.priceFrom && <span className="text-black/60">from </span>}
          {formatPrice(product.price)}
        </p>
      </Link>
    </article>
  );
}
