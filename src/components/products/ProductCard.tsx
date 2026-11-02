"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/format";

export default function ProductCard({
  product,
  priority = true,
  isSale = false,
  isNew = false,
  showFrom = false,
  index = 0,
  className = "",
}: {
  product: Product;
  priority?: boolean;
  isSale?: boolean;
  isNew?: boolean;
  showFrom?: boolean;
  index?: number;
  className?: string;
}) {
  const [inView, setInView] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  // Stagger reveal delay across columns (left to right: col 0 = 0ms, col 1 = 120ms, col 2 = 240ms, col 3 = 360ms)
  const colIndex = index % 4;
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
  const showNewBadge = !showSaleBadge && (isNew || product.isNew);

  return (
    <article ref={cardRef} data-aos="row-of-4" className={`group relative ${className}`}>
      <div className="relative">
        <Link href={`/products/${product.handle}`} className="block" aria-label={product.title}>
          <div
            className={`relative w-full overflow-hidden bg-[#f7f6f3] image-reveal-mask ${
              inView ? "is-revealed" : ""
            }`}
            style={{ aspectRatio: `1 / ${product.ratio || 1.35}` }}
          >
            <Image
              src={product.image}
              alt={product.alt || product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={true}
              loading="eager"
              className="object-cover"
            />
            {product.hoverImage && (
              <Image
                src={product.hoverImage}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                loading="eager"
                className="hidden object-cover opacity-0 transition-opacity duration-500 motion-reduce:transition-none md:block md:group-hover:opacity-100"
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

        {/* Keep collection labels visible, as on the reference storefront */}
        {showNewBadge && (
          <span className="pointer-events-none absolute right-2 top-2 z-10 bg-white px-[7px] py-[5px] font-[Arial,Helvetica,sans-serif] text-[9px] font-bold uppercase leading-none tracking-[0.02em] text-black md:right-3 md:top-3 md:text-[10px]">
            NEW
          </span>
        )}
      </div>

      <Link
        href={`/products/${product.handle}`}
        className="mt-2.5 block text-center md:mt-3"
      >
        <h3 className="line-clamp-2 text-center text-[11px] font-semibold uppercase leading-relaxed tracking-[0.1em] text-[#111111] md:text-[14px]">
          {product.title}
        </h3>

        <p className="mt-2 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5 text-center text-[11px] font-normal text-black md:text-[13px]">
          {showFrom && product.priceFrom && (
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
