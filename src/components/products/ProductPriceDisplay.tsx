"use client";

import { useStore } from "@/components/providers/StoreProvider";

export default function ProductPriceDisplay({
  price,
  originalPrice,
  priceFrom,
}: {
  price: number;
  originalPrice?: number | null;
  priceFrom?: boolean;
}) {
  const { formatPrice, currency } = useStore();

  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[22px] md:text-[24px] font-bold text-[#111111]">
        {priceFrom && <span className="font-normal text-sm text-black/60">from </span>}
        {formatPrice(price)}
        <span className="ml-1.5 text-xs font-normal text-black/50">{currency}</span>
      </span>
      {originalPrice && (
        <span className="text-sm text-black/50 line-through">
          {formatPrice(originalPrice)}
        </span>
      )}
    </div>
  );
}
