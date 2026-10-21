"use client";

import { Heart } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";

export default function WishlistButton({ id, title }: { id: string; title: string }) {
  const { wishlist, toggleWishlist } = useStore();
  const active = wishlist.includes(id);
  return (
    <button
      type="button"
      onClick={() => toggleWishlist(id)}
      aria-pressed={active}
      aria-label={active ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
      className="absolute bottom-2 left-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
    >
      <Heart className={`h-4 w-4 ${active ? "fill-black" : ""}`} />
    </button>
  );
}
