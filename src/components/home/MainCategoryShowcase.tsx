"use client";

import Image from "next/image";
import Link from "next/link";
import { Layers } from "lucide-react";
import type { CategoryItem } from "@/types";

interface Props {
  categories: CategoryItem[];
}

export default function MainCategoryShowcase({ categories }: Props) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-355 px-3.5 py-8 md:px-10 md:py-12">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-[16px] font-semibold uppercase leading-none tracking-wider text-[#111111] sm:text-[17px] md:text-[20px] font-serif">
          CATEGORIES
        </h2>
        <div className="mx-auto mt-2 h-[1px] w-12 bg-black/30" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-5">
        {categories.map((cat) => {
          const hasImage = Boolean(cat.image && cat.image.trim().length > 0);
          return (
            <Link
              key={cat.handle}
              href={`/collections/${cat.handle}`}
              className="group relative block overflow-hidden rounded-xs bg-[#f7f6f3] border border-gray-100/80 shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f3f2ee]">
                {hasImage ? (
                  <Image
                    src={cat.image!}
                    alt={cat.title}
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-4 text-gray-400">
                    <Layers className="h-10 w-10 stroke-[1.2] opacity-60 mb-2 group-hover:text-black transition-colors" />
                    <span className="text-[11px] uppercase tracking-wider font-serif text-gray-500 text-center">
                      {cat.title}
                    </span>
                  </div>
                )}

                {/* Subtle dark overlay on hover */}
                <div className="pointer-events-none absolute inset-0 z-10 bg-black/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              {/* Title label badge at bottom */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[90%] text-center">
                <span className="inline-block w-full truncate bg-white/95 px-3 py-2 text-[11px] md:text-[12px] font-medium uppercase tracking-[0.1em] text-[#111111] shadow-xs transition-colors group-hover:bg-black group-hover:text-white font-serif">
                  {cat.title}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
