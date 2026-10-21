"use client";

import { useState } from "react";
import { Maximize2, Volume2, VolumeX, X, Play } from "lucide-react";

interface ProductVideoReelProps {
  videoId?: string;
  videoUrl?: string;
  productTitle: string;
}

export default function ProductVideoReel({
  videoId = "SK1-CnWBQpo",
  videoUrl,
  productTitle,
}: ProductVideoReelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const effectiveId = videoId || "SK1-CnWBQpo";
  const embedUrl = `https://www.youtube-nocookie.com/embed/${effectiveId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${effectiveId}&playsinline=1&modestbranding=1&rel=0&showinfo=0&disablekb=1&iv_load_policy=3`;
  const modalEmbedUrl = `https://www.youtube-nocookie.com/embed/${effectiveId}?autoplay=1&mute=0&controls=1&loop=1&playlist=${effectiveId}&playsinline=1&modestbranding=1&rel=0`;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-black/90 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-xl hover:bg-black transition-all hover:scale-105"
        aria-label={`Watch ${productTitle} video`}
      >
        <Play className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
        <span>Watch Reel</span>
      </button>
    );
  }

  return (
    <>
      {/* Floating Mini Video Reel (as shown in real website product view) */}
      <div className="fixed bottom-24 right-5 z-40 hidden sm:block animate-fade-in">
        <div className="group relative h-[250px] w-[140px] overflow-hidden rounded-2xl border-2 border-white/90 bg-black shadow-[0_10px_35px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:scale-[1.02]">
          {/* Dismiss button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="absolute right-2 top-2 z-20 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black transition-colors"
            aria-label="Close video reel"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Video iframe / player */}
          <div className="h-full w-full pointer-events-none scale-[1.35] origin-center">
            {videoUrl ? (
              <video
                src={videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <iframe
                src={embedUrl}
                title={`${productTitle} showcase reel`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="h-full w-full border-0 pointer-events-none"
                tabIndex={-1}
              />
            )}
          </div>

          {/* Click to expand overlay */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="absolute inset-0 z-10 flex flex-col justify-between p-2 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-90 group-hover:opacity-100 transition-opacity"
            aria-label={`Expand ${productTitle} video reel`}
          >
            <span />
            <div className="flex w-full items-center justify-between">
              <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                Reel
              </span>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white hover:text-black transition-colors">
                <Maximize2 className="h-3 w-3" />
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Expanded Modal Video Player */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] grid place-items-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl bg-black shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Title and Close */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
              <div className="text-white">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                  Sillhouete Official Reel
                </p>
                <h3 className="font-serif text-sm tracking-wide font-medium truncate max-w-[220px]">
                  {productTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white hover:text-black transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Main Video View */}
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  autoPlay
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <iframe
                  src={modalEmbedUrl}
                  title={`${productTitle} video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
