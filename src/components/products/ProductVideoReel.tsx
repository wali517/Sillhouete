"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { SITE } from "@/data/site";

interface ProductVideoReelProps {
  videoId?: string;
  videoUrl?: string;
  productTitle: string;
}

const DEFAULT_VIDEO_URL = "https://cdn.shopify.com/videos/c/o/v/061ca40eef70464293b2a672d62f7b0a.mp4";

export default function ProductVideoReel({
  videoId,
  videoUrl,
  productTitle,
}: ProductVideoReelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // If YouTube ID is SK1-CnWBQpo (which was removed from YouTube and causes black screen),
  // we use the real Shopify MP4 video so it plays fluidly and never breaks.
  const hasValidYouTube = Boolean(
    videoId &&
    videoId.length > 5 &&
    videoId !== "SK1-CnWBQpo" &&
    !videoUrl
  );

  const effectiveVideoSrc = videoUrl || DEFAULT_VIDEO_URL;

  // Close modal on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    },
    [isModalOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        void videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else if (iframeRef.current) {
      try {
        const cmd = isPlaying
          ? '{"event":"command","func":"pauseVideo","args":""}'
          : '{"event":"command","func":"playVideo","args":""}';
        iframeRef.current.contentWindow?.postMessage(cmd, "*");
      } catch {}
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // When user closes the reel, completely remove from page (no button left on page)
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Floating Video Reel Widget (Matching live site .pv-float and Images 4 & 5) */}
      <aside
        aria-label="Product video preview"
        className="fixed bottom-[80px] right-3 sm:bottom-[92px] sm:right-4 z-[9998] w-[108px] sm:w-[132px] select-none animate-fade-in"
      >
        <div
          onClick={() => setIsModalOpen(true)}
          className="group relative w-full aspect-[9/16] overflow-hidden rounded-[14px] border-2 border-white bg-[#111] shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label={`Play ${productTitle} video reel full screen`}
        >
          {/* Fluid Video Background */}
          <div className="h-full w-full overflow-hidden bg-black pointer-events-none">
            {hasValidYouTube ? (
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${videoId}&disablekb=1&enablejsapi=1`}
                title={`${productTitle} video reel`}
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                className="h-full w-full object-cover scale-[1.35] origin-center border-0 pointer-events-none"
                tabIndex={-1}
              />
            ) : (
              <video
                ref={videoRef}
                src={effectiveVideoSrc}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* Top Bar: Gold Arabic Logo Avatar + "New..." + "sill..." + White Close 'X' */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-start justify-between p-1.5 sm:p-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
            <div className="flex items-center gap-1.5 overflow-hidden">
              {/* Circular Avatar with official brand logo */}
              <div className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white border border-[#d4af37]/70 flex items-center justify-center shrink-0 shadow-md overflow-hidden p-0.5">
                <Image
                  src={SITE.logo}
                  alt="Sillhouete"
                  fill
                  sizes="32px"
                  className="object-contain p-0.5"
                />
              </div>

              {/* Text: New... / sill... */}
              <div className="flex flex-col overflow-hidden">
                <span className="text-[11px] sm:text-[12px] font-bold text-white truncate max-w-[48px] sm:max-w-[60px] leading-tight drop-shadow-md">
                  New...
                </span>
                <span className="text-[9px] sm:text-[10px] font-normal text-white/90 truncate max-w-[48px] sm:max-w-[60px] leading-none drop-shadow-md">
                  sill...
                </span>
              </div>
            </div>

            {/* Top Right White Close Button (Matching live site SVG & completely closes the reel) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center rounded-full bg-black/40 text-white hover:bg-black transition-colors cursor-pointer filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]"
              aria-label="Close video reel"
            >
              <svg viewBox="0 0 16 16" className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M3.2 3.2l9.6 9.6M12.8 3.2l-9.6 9.6" />
              </svg>
            </button>
          </div>

          {/* Center Play/Pause Indicator (Semi-transparent circular overlay matching Images 4 & 5) */}
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 z-15 flex items-center justify-center cursor-pointer border-0 p-0 bg-transparent"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            <span className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur-xs transition-transform hover:scale-105 shadow-lg border border-white/20">
              {isPlaying ? (
                <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                  <span className="h-3.5 w-1 sm:h-4 sm:w-1 rounded-xs bg-white" />
                  <span className="h-3.5 w-1 sm:h-4 sm:w-1 rounded-xs bg-white" />
                </div>
              ) : (
                <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-white ml-0.5" />
              )}
            </span>
          </button>

          {/* Bottom Bar: YouTube White Pill on Left + Expand Button on Right (Matching live site) */}
          <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between p-1.5 sm:p-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
            {/* White YouTube Pill Button */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-white text-black px-1.5 py-0.5 sm:px-2 rounded-[3px] sm:rounded-[4px] shadow-sm">
              <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-black" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-tight text-black font-sans">
                YouTube
              </span>
            </div>

            {/* Expand Button (Matching live site 4-arrow icon) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-[6px] bg-[#111]/75 text-white hover:bg-black transition-colors cursor-pointer border border-white/20 shadow-xs"
              aria-label={`Expand ${productTitle} video`}
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.2 2.2H13.8V6.8M6.8 13.8H2.2V9.2M13.5 2.5L9.2 6.8M2.5 13.5L6.8 9.2" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Expanded Modal Video Player (Full-screen overlay matching live site .pv-float-modal) */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-[380px] aspect-[9/16] max-h-[calc(100vh-48px)] overflow-hidden rounded-[16px] bg-black shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Title and Close Button */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/90 to-transparent">
              <div className="flex items-center gap-2">
                <div className="relative h-7 w-7 rounded-full bg-white border border-[#d4af37]/70 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                  <Image
                    src={SITE.logo}
                    alt="Sillhouete"
                    fill
                    sizes="28px"
                    className="object-contain p-0.5"
                  />
                </div>
                <div className="text-white">
                  <h3 className="font-serif text-sm tracking-wide font-medium truncate max-w-[200px]">
                    {productTitle}
                  </h3>
                  <p className="text-[10px] text-neutral-400 leading-none">
                    sillhouete
                  </p>
                </div>
              </div>

              {/* Close button inside modal (White circle with black X matching live site) */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                aria-label="Close modal video"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M3.2 3.2l9.6 9.6M12.8 3.2l-9.6 9.6" />
                </svg>
              </button>
            </div>

            {/* Main Video View in 9/16 aspect ratio */}
            <div className="relative h-full w-full overflow-hidden bg-black">
              {hasValidYouTube ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${videoId}`}
                  title={`${productTitle} video modal`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : (
                <video
                  ref={modalVideoRef}
                  src={effectiveVideoSrc}
                  autoPlay
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
