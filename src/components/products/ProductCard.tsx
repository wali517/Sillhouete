"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/format";

export default function ProductCard({
  product,
  priority = false,
  isSale = false,
  isNew = false,
  showFrom = false,
  isThreeColumn = false,
  index = 0,
  className = "",
}: {
  product: Product;
  priority?: boolean;
  isSale?: boolean;
  isNew?: boolean;
  showFrom?: boolean;
  isThreeColumn?: boolean;
  index?: number;
  className?: string;
}) {
  const [inView, setInView] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  // Stagger reveal delay across columns
  const colModulo = isThreeColumn ? 3 : 4;
  const colIndex = index % colModulo;
  const delayMs = colIndex * 120;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "60px 0px 0px 0px", threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showSaleBadge = isSale || product.isSale || !!product.originalPrice;
  // In collection pages matching reference storefront, products display NEW badge unless on sale
  const showNewBadge = !showSaleBadge && (isNew || product.isNew !== false);

  // Aspect ratio: exactly 2/3 (150% height matching Shopify collection grid)
  const imageAspect = isThreeColumn ? "aspect-[2/3]" : "aspect-[2/3]";

  return (
    <article
      ref={cardRef}
      data-aos={isThreeColumn ? "row-of-3" : "row-of-4"}
      className={`group relative ${className}`}
    >
      <div className="relative">
        <Link href={`/products/${product.handle}`} className="block" aria-label={product.title}>
          <div
            className={`relative w-full overflow-hidden bg-[#f7f6f3] ${imageAspect} image-reveal-mask ${
              inView ? "is-revealed" : ""
            }`}
          >
            <Image
              src={product.image}
              alt={product.alt || product.title}
              fill
              sizes={
                isThreeColumn
                  ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
                  : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              }
              priority={priority && index < 3}
              loading={priority && index < 3 ? "eager" : "lazy"}
              decoding="async"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            {product.hoverImage && (
              <Image
                src={product.hoverImage}
                alt=""
                fill
                sizes={
                  isThreeColumn
                    ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
                    : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                }
                loading="lazy"
                decoding="async"
                className="hidden object-cover object-center opacity-0 transition-opacity duration-500 motion-reduce:transition-none md:block md:group-hover:opacity-100"
              />
            )}
          </div>
        </Link>

        {/* Black Sale badge in top-left corner */}
        {showSaleBadge && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 bg-black text-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider shadow-sm">
            Sale
          </span>
        )}

        {/* NEW Badge matching live site and reference images */}
        {showNewBadge && (
          <span className="pointer-events-none absolute right-2 top-2 z-10 bg-white border border-black/80 px-2 py-0.5 text-[9px] md:text-[10px] font-bold uppercase leading-none tracking-wider text-black md:right-3 md:top-3">
            NEW
          </span>
        )}
      </div>

      <Link
        href={`/products/${product.handle}`}
        className="mt-3 block text-center md:mt-3.5"
      >
        <h3 className="line-clamp-2 text-center text-[12px] sm:text-[13px] md:text-[14px] font-medium uppercase leading-relaxed tracking-[0.12em] text-[#111111] hover:text-black">
          {product.title}
        </h3>

        <p className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5 text-center text-[12px] sm:text-[13px] md:text-[13.5px] font-normal text-[#111111]">
          {(showFrom || product.priceFrom || product.handle === "bella") && (
            <span className="text-black/65 font-serif mr-0.5">from</span>
          )}

          <span className="font-serif">{formatPrice(product.price)}</span>

          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[11px] text-black/45 line-through md:text-[12.5px] ml-1">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </p>
      </Link>
    </article>
  );
}
