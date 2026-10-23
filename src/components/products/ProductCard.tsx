import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/format";

export default function ProductCard({
  product,
  priority = false,
  isSale = false,
}: {
  product: Product;
  priority?: boolean;
  isSale?: boolean;
}) {
  const showSaleBadge = isSale || product.isSale || !!product.originalPrice;

  return (
    <article className="group relative animate-fade-in">
      <div className="relative">
        <Link href={`/products/${product.handle}`} className="block" aria-label={product.title}>
          <div
            className="relative w-full overflow-hidden bg-white"
            style={{ aspectRatio: `1 / ${product.ratio || 1.35}` }}
          >
            <Image
              src={product.image}
              alt={product.alt || product.title}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              priority={priority}
              className="object-cover"
            />
            {product.hoverImage && (
              <Image
                src={product.hoverImage}
                alt=""
                fill
                sizes="25vw"
                className="hidden object-cover opacity-0 transition-opacity duration-500 motion-reduce:transition-none md:block md:group-hover:opacity-100"
              />
            )}
          </div>
        </Link>

        {/* Black Sale badge in top-left corner matching media_1792667744429_6e8096fb.png */}
        {showSaleBadge && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 bg-black text-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider shadow-sm">
            Sale
          </span>
        )}

        {/* NEW badge – hidden until hover, appears top‑right on product image */}
        {!showSaleBadge && product.isNew && (
          <span className="pointer-events-none absolute right-2.5 top-2.5 z-10 border border-black/20 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
            NEW
          </span>
        )}
      </div>

      <Link href={`/products/${product.handle}`} className="mt-3 block text-center">
        <h3 className="font-serif text-[14px] md:text-[15px] font-semibold uppercase tracking-[0.04em] text-[#111111]">
          {product.title}
        </h3>
        <p className="mt-1 text-[15px] md:text-[16px] text-black font-normal flex items-center justify-center gap-2">
          {product.priceFrom && <span className="text-black/60">from </span>}
          <span>{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-black/40 line-through text-[13px] md:text-[14px]">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </p>
      </Link>
    </article>
  );
}
