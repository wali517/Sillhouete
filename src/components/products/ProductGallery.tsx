"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { Product } from "@/types";
import { ZoomIn, Play, ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({ product }: { product: Product }) {
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image, product.hoverImage].filter(Boolean);

  const [activeIndex, setActiveIndex] = useState(0); // 0+ for images, -1 for video
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const isVideoActive = activeIndex === -1;
  const activeImage = !isVideoActive ? images[activeIndex] || product.image : product.image;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isVideoActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const newIdx = Math.round(scrollLeft / clientWidth);
    if (newIdx !== activeIndex && newIdx >= 0 && newIdx < images.length) {
      setActiveIndex(newIdx);
    }
  };

  const scrollToSlide = (idx: number) => {
    setActiveIndex(idx);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: idx * scrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  const videoId = product.videoId || "SK1-CnWBQpo";
  const galleryEmbedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&rel=0`;

  return (
    <div className="w-full">
      {/* ─── MOBILE & TABLET: Swipeable Horizontal Scroll Snap Gallery (visible up to md) ─── */}
      <div className="md:hidden relative w-full">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar touch-pan-x"
          style={{ aspectRatio: `1 / ${product.ratio || 1.35}` }}
        >
          {images.map((img, idx) => (
            <div
              key={img + idx}
              className="relative w-full h-full shrink-0 snap-center bg-[#f9f9f9]"
            >
              <Image
                src={img}
                alt={`${product.title} view ${idx + 1}`}
                fill
                priority={idx === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}

          {/* Video slide on mobile if present */}
          {product.videoId && (
            <div className="relative w-full h-full shrink-0 snap-center bg-black">
              <iframe
                src={galleryEmbedUrl}
                title={`${product.title} fashion video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          )}
        </div>

        {/* Badges on mobile */}
        {product.isNew && (
          <span className="absolute left-3 top-3 z-10 bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">
            NEW
          </span>
        )}
        {product.originalPrice && (
          <span className="absolute right-3 top-3 z-10 bg-[#ff4f33] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">
            SALE
          </span>
        )}

        {/* Swipe arrow controls (subtle) */}
        {images.length > 1 && (
          <>
            {activeIndex > 0 && (
              <button
                type="button"
                onClick={() => scrollToSlide(activeIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm grid place-items-center shadow text-black"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {activeIndex < images.length - 1 && (
              <button
                type="button"
                onClick={() => scrollToSlide(activeIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm grid place-items-center shadow text-black"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}

        {/* Slide Counter / Dots Pill matching real Shopify store */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToSlide(i)}
                className={`transition-all rounded-full ${
                  activeIndex === i ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── DESKTOP: Thumbnails + High-res Zoom Display (visible on md+) ─── */}
      <div className="hidden md:flex gap-4">
        {/* Thumbnails list */}
        {(images.length > 1 || product.videoId) && (
          <div className="flex flex-col gap-2 w-20 shrink-0">
            {images.map((img, idx) => (
              <button
                key={img + idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative h-24 w-full border transition-all overflow-hidden ${
                  activeIndex === idx
                    ? "border-black ring-1 ring-black"
                    : "border-black/10 hover:border-black/40 opacity-70 hover:opacity-100"
                }`}
                aria-label={`View photo ${idx + 1}`}
              >
                <Image
                  src={img}
                  alt={`${product.title} angle ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}

            {/* Video Thumbnail Button */}
            {product.videoId && (
              <button
                type="button"
                onClick={() => setActiveIndex(-1)}
                className={`relative h-24 w-full border transition-all overflow-hidden bg-black flex flex-col items-center justify-center text-white ${
                  isVideoActive
                    ? "border-black ring-2 ring-black"
                    : "border-black/20 hover:border-black/60 opacity-80 hover:opacity-100"
                }`}
                aria-label="View product video reel"
              >
                <Image
                  src={product.image}
                  alt={`${product.title} video preview`}
                  fill
                  sizes="80px"
                  className="object-cover opacity-50"
                />
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-black shadow">
                    <Play className="h-3.5 w-3.5 fill-black ml-0.5" />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white drop-shadow">
                    Video
                  </span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Main Media Display */}
        <div className="relative flex-1 bg-[#f9f9f9] border border-black/10 overflow-hidden">
          {product.isNew && (
            <span className="absolute left-3 top-3 z-10 bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">
              NEW
            </span>
          )}
          {product.originalPrice && (
            <span className="absolute right-3 top-3 z-10 bg-[#ff4f33] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">
              SALE
            </span>
          )}

          {isVideoActive ? (
            <div
              className="relative w-full bg-black overflow-hidden"
              style={{ aspectRatio: `1 / ${product.ratio || 1.35}` }}
            >
              {product.videoUrl ? (
                <video
                  src={product.videoUrl}
                  autoPlay
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <iframe
                  src={galleryEmbedUrl}
                  title={`${product.title} fashion video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              )}
            </div>
          ) : (
            <div
              className="relative w-full cursor-zoom-in overflow-hidden"
              style={{ aspectRatio: `1 / ${product.ratio || 1.35}` }}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={activeImage}
                alt={product.alt || product.title}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={`object-cover transition-transform duration-300 ${
                  isZoomed ? "scale-150" : "scale-100"
                }`}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      }
                    : undefined
                }
              />

              <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/80 p-1.5 text-black shadow backdrop-blur-sm">
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
