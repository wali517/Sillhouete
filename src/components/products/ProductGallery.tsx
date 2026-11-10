"use client";

import { useState, useRef, useCallback, useEffect, type TouchEvent } from "react";
import Image from "next/image";
import type { Product } from "@/types";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function ProductGallery({ product }: { product: Product }) {
  const rawList = [
    ...(product.images || []),
    product.image,
    product.hoverImage,
  ].filter(Boolean) as string[];
  const images = Array.from(new Set(rawList));

  const [currentIndex, setCurrentIndex] = useState(0);

  const thumbsContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const totalSlides = images.length;

  const goToSlide = useCallback(
    (index: number) => {
      const nextIdx = Math.max(0, Math.min(totalSlides - 1, index));
      setCurrentIndex(nextIdx);

      // Scroll thumbnail into view smoothly
      if (thumbsContainerRef.current) {
        const activeThumb = thumbsContainerRef.current.children[nextIdx] as HTMLElement | undefined;
        if (activeThumb) {
          activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
      }
    },
    [totalSlides]
  );

  // Strictly stops at first image and last image ("image bi ruk jati ha slide karna sa")
  const nextSlide = useCallback(() => {
    if (currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1);
    }
  }, [currentIndex, totalSlides, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }, [currentIndex, goToSlide]);

  // Touch swipe handling on mobile
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && currentIndex < totalSlides - 1) {
        nextSlide();
      } else if (diff < 0 && currentIndex > 0) {
        prevSlide();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) prevSlide();
      if (e.key === "ArrowRight" && currentIndex < totalSlides - 1) nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, totalSlides, nextSlide, prevSlide]);

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full select-none">
      {/* Thumbnails Column (Desktop Only: Vertical strip on left) */}
      <div className="hidden md:flex flex-col items-center shrink-0">
        {/* UP ARROW (Desktop only: Hidden on the first image, visible when currentIndex > 0) */}
        <div className="h-7 w-full flex items-center justify-center">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevSlide();
              }}
              className="flex h-7 w-full items-center justify-center text-neutral-500 hover:text-black cursor-pointer transition-colors py-1 hover:bg-neutral-100/50"
              aria-label="Previous image (Up)"
            >
              <ChevronUp className="h-4 w-4 stroke-[1.8]" />
            </button>
          )}
        </div>

        {/* Thumbnails Scroll Container:
            - Active thumbnail: crisp 1px black border
            - Inactive thumbnails: border-transparent (0 border opacity) & opacity-100 (full clarity, no dimmed look)
        */}
        <div
          ref={thumbsContainerRef}
          className="flex w-[68px] max-h-[540px] flex-col overflow-y-auto scrollbar-none py-1 px-0.5 gap-2.5"
        >
          {images.map((img, idx) => (
            <button
              key={img + idx}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`relative h-[96px] w-[64px] transition-all overflow-hidden cursor-pointer shrink-0 opacity-100 ${
                currentIndex === idx
                  ? "border border-black"
                  : "border border-transparent hover:border-neutral-300"
              }`}
              aria-label={`View photo ${idx + 1}`}
            >
              <Image
                src={img}
                alt={`${product.title} angle ${idx + 1}`}
                fill
                sizes="64px"
                loading="lazy"
                decoding="async"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {/* DOWN ARROW (Desktop only: Hidden on the last image, visible when currentIndex < totalSlides - 1) */}
        <div className="h-7 w-full flex items-center justify-center">
          {currentIndex < totalSlides - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextSlide();
              }}
              className="flex h-7 w-full items-center justify-center text-neutral-500 hover:text-black cursor-pointer transition-colors py-1 hover:bg-neutral-100/50"
              aria-label="Next image (Down)"
            >
              <ChevronDown className="h-4 w-4 stroke-[1.8]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Image Slider Frame + Mobile Dots */}
      <div className="relative flex-1 bg-white overflow-hidden">
        {/* Main Image Aspect Container */}
        <div
          className="relative w-full aspect-[2/3] overflow-hidden bg-neutral-50"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Horizontal Slide Track:
              Translates smoothly along X-axis with cubic-bezier easing matching Flickity
          */}
          <div
            className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {images.map((src, idx) => (
              <div
                key={src + idx}
                className="relative h-full w-full shrink-0 aspect-[2/3] overflow-hidden select-none"
              >
                <Image
                  src={src}
                  alt={`${product.title} view ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover pointer-events-none select-none"
                />
              </div>
            ))}
          </div>

          {/* Interactive Left & Right Click-to-Slide Zones:
              - Left half: active ONLY when currentIndex > 0 (stops sliding on first image)
              - Right half: active ONLY when currentIndex < totalSlides - 1 (stops sliding on last image)
          */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute inset-y-0 left-0 w-1/2 z-20 cursor-pointer md:cursor-w-resize outline-none bg-transparent hover:bg-transparent"
              aria-label="Previous slide"
              title="Click left to view previous image"
            />
          )}

          {currentIndex < totalSlides - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute inset-y-0 right-0 w-1/2 z-20 cursor-pointer md:cursor-e-resize outline-none bg-transparent hover:bg-transparent"
              aria-label="Next slide"
              title="Click right to view next image"
            />
          )}
        </div>

        {/* Mobile Pagination Dots ("mobile pa image gallery nahi dot show hota ha") */}
        {totalSlides > 1 && (
          <div className="flex md:hidden items-center justify-center gap-2 pt-3 pb-1">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? "w-6 bg-black"
                    : "w-2 bg-neutral-300 hover:bg-neutral-400"
                }`}
                aria-label={`Go to photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
