import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/format";

export default function ProductCard({
  product,
  priority = false,
  isSale = false,
  isNew = false,
}: {
  product: Product;
  priority?: boolean;
  isSale?: boolean;
  isNew?: boolean;
}) {
  const showSaleBadge = isSale || product.isSale || !!product.originalPrice;
  const showNewBadge = !showSaleBadge && (isNew || product.isNew);

  return (
    <article className="group relative animate-fade-in">
      <div className="relative">
        <Link href={`/products/${product.handle}`} className="block" aria-label={product.title}>
          <div
            className="relative w-full overflow-hidden bg-[#f7f6f3]"
            style={{ aspectRatio: `1 / ${product.ratio || 1.35}` }}
          >
            <Image
              src={product.image}
              alt={product.alt || product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
              className="object-cover"
            />
            {product.hoverImage && (
              <Image
                src={product.hoverImage}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
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

        {/* Keep collection labels visible, as on the reference storefront. */}
        {showNewBadge && (
          <span className="pointer-events-none absolute left-2 top-2 z-10 bg-white/95 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-black shadow-sm md:left-3 md:top-3 md:text-[10px]">
            New
          </span>
        )}
      </div>

      <Link
  href={`/products/${product.handle}`}
  className="mt-2.5 block text-center md:mt-3"
>
  <h3 className="line-clamp-2 text-center font-serif text-[13px] font-medium leading-relaxed text-[#111111] md:text-[15px]">
    {product.title}
  </h3>

  <p className="mt-2 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5 text-center text-[13px] font-normal text-black md:text-[15px]">
    {product.priceFrom && (
      <span className="text-black/65">from</span>
    )}

    <span>{formatPrice(product.price)}</span>

    {product.originalPrice && product.originalPrice > product.price && (
      <span className="text-[11px] text-black/45 line-through md:text-[13px]">
        {formatPrice(product.originalPrice)}
      </span>
    )}
  </p>

      </Link>
    </article>
  );
}
