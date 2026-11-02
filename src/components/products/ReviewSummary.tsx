"use client";

import { Star } from "lucide-react";
import { INITIAL_REVIEWS } from "./ProductReviews";

/** Star rating + review count shown under the share links (Judge.me teal, links down to the reviews). */
export default function ReviewSummary() {
  const n = INITIAL_REVIEWS.length;
  if (n === 0) return null;
  const avg = INITIAL_REVIEWS.reduce((t, r) => t + r.rating, 0) / n;
  const filled = Math.round(avg);
  return (
    <a href="#judgeme_product_reviews" className="mt-3 flex items-center gap-1.5 text-[13px] text-black">
      <span className="flex" aria-label={`${avg.toFixed(2)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="h-[14px] w-[14px] text-[#108474]" strokeWidth={1.5} fill={i <= filled ? "#108474" : "none"} />
        ))}
      </span>
      <span>{n} reviews</span>
    </a>
  );
}
