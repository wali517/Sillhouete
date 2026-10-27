"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/types";
import { ZoomIn, Play, Film } from "lucide-react";

export default function ProductGallery({ product }: { product: Product }) {
  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image, product.hoverImage].filter(Boolean);

  const [activeIndex, setActiveIndex] = useState(0); // 0+ for images, -1 for video
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const isVideoActive = activeIndex === -1;
  const activeImage = !isVideoActive ? (images[activeIndex] || product.image) : product.image;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isVideoActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const videoId = product.videoId || "SK1-CnWBQpo";
  const galleryEmbedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&rel=0`;

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {/* Thumbnails */}
      {(images.length > 1 || product.videoId) && (
        <div className="flex gap-2 overflow-x-auto md:w-20 md:flex-col md:overflow-visible shrink-0">
          {images.map((img, idx) => (
            <button
              key={img + idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative h-24 w-18 md:h-24 md:w-full border transition-all overflow-hidden ${
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
              className={`relative h-24 w-18 md:h-24 md:w-full border transition-all overflow-hidden bg-black flex flex-col items-center justify-center text-white ${
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
          <span className="absolute left-3 top-3 z-10 bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            NEW
          </span>
        )}
        {product.originalPrice && (
          <span className="absolute right-3 top-3 z-10 bg-[#ff4f33] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            SALE
          </span>
        )}

        {isVideoActive ? (
          <div
            className="relative w-full bg-black overflow-hidden"
            style={{ aspectRatio: `1 / ${product.ratio || 1.5}` }}
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
            style={{ aspectRatio: `1 / ${product.ratio || 1.5}` }}
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
            />

            <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/80 p-1.5 text-black shadow backdrop-blur-sm">
              <ZoomIn className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
