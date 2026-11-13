"use client";

import { useState, useRef, useCallback, useEffect, type TouchEvent } from "react";
import Image from "next/image";
import type { Product } from "@/types";
import { ChevronUp, ChevronDown, Play } from "lucide-react";
import { parseVideoSource } from "@/lib/video";

export default function ProductGallery({ product }: { product: Product }) {
  const rawList = [
    ...(product.images || []),
    product.image,
    product.hoverImage,
  ].filter(Boolean) as string[];
  const images = Array.from(new Set(rawList));

  const parsedVideo = parseVideoSource(product.videoUrl, product.videoId);

  type MediaItem =
    | { type: "image"; src: string }
    | {
        type: "video";
        video: NonNullable<ReturnType<typeof parseVideoSource>>;
        poster: string;
      };

  const mediaItems: MediaItem[] = [];
  if (images.length > 0) {
    mediaItems.push({ type: "image", src: images[0] });
    if (parsedVideo) {
      mediaItems.push({
        type: "video",
        video: parsedVideo,
        poster: images[1] || images[0],
      });
    }
    for (let i = 1; i < images.length; i++) {
      mediaItems.push({ type: "image", src: images[i] });
    }
  } else if (parsedVideo) {
    mediaItems.push({
      type: "video",
      video: parsedVideo,
      poster: product.image || "",
    });
  }

  const [currentIndex, setCurrentIndex] = useState(0);

  const thumbsContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const totalSlides = mediaItems.length;

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

  const isCurrentVideo = mediaItems[currentIndex]?.type === "video";

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full select-none">
      {/* Thumbnails Column (Desktop Only: Vertical strip on left) */}
      <div className="hidden md:flex flex-col items-center shrink-0">
        {/* UP ARROW */}
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
              aria-label="Previous media (Up)"
            >
              <ChevronUp className="h-4 w-4 stroke-[1.8]" />
            </button>
          )}
        </div>

        {/* Thumbnails Scroll Container */}
        <div
          ref={thumbsContainerRef}
          className="flex w-[68px] max-h-[540px] flex-col overflow-y-auto scrollbar-none py-1 px-0.5 gap-2.5"
        >
          {mediaItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`relative h-[96px] w-[64px] transition-all overflow-hidden cursor-pointer shrink-0 opacity-100 ${
                currentIndex === idx
                  ? "border border-black"
                  : "border border-transparent hover:border-neutral-300"
              }`}
              aria-label={item.type === "video" ? "View product video" : `View photo ${idx + 1}`}
            >
              <Image
                src={item.type === "video" ? item.poster : item.src}
                alt={`${product.title} angle ${idx + 1}`}
                fill
                sizes="64px"
                loading="lazy"
                decoding="async"
                className="object-cover"
              />
              {item.type === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/35 transition-colors group-hover:bg-black/20">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-black shadow-sm">
                    <Play className="h-3 w-3 fill-black ml-0.5" />
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* DOWN ARROW */}
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
              aria-label="Next media (Down)"
            >
              <ChevronDown className="h-4 w-4 stroke-[1.8]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Image/Video Slider Frame */}
      <div className="relative flex-1 bg-white overflow-hidden">
        {/* Main Aspect Container */}
        <div
          className="relative w-full aspect-[2/3] overflow-hidden bg-neutral-50"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Horizontal Slide Track */}
          <div
            className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {mediaItems.map((item, idx) => {
              if (item.type === "video") {
                const isActive = currentIndex === idx;
                return (
                  <div
                    key={`video-${idx}`}
                    className="relative h-full w-full shrink-0 aspect-[2/3] overflow-hidden bg-black select-none"
                  >
                    {item.video.type === "youtube" ? (
                      <iframe
                        src={
                          isActive
                            ? `https://www.youtube-nocookie.com/embed/${item.video.youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&loop=1&playlist=${item.video.youtubeId}`
                            : ""
                        }
                        title={`${product.title} video`}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full border-0 object-cover"
                      />
                    ) : (
                      <video
                        src={item.video.src}
                        autoPlay
                        muted
                        loop
                        controls
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={`img-${idx}`}
                  className="relative h-full w-full shrink-0 aspect-[2/3] overflow-hidden select-none"
                >
                  <Image
                    src={item.src}
                    alt={`${product.title} view ${idx + 1}`}
                    fill
                    priority={idx === 0}
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover pointer-events-none select-none"
                  />
                </div>
              );
            })}
          </div>

          {/* Interactive Left & Right Click-to-Slide Zones (only on images, allowing video controls on video) */}
          {!isCurrentVideo && currentIndex > 0 && (
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

          {!isCurrentVideo && currentIndex < totalSlides - 1 && (
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

        {/* Mobile Pagination Dots */}
        {totalSlides > 1 && (
          <div className="flex md:hidden items-center justify-center gap-2 pt-3 pb-1">
            {mediaItems.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? "w-6 bg-black"
                    : "w-2 bg-neutral-300 hover:bg-neutral-400"
                }`}
                aria-label={`Go to media ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
