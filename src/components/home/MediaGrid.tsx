"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MEDIA_IMAGE, VIDEO_URL } from "@/data/campaigns";

export default function MediaGrid() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setInView(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "60px 0px 0px 0px", threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const videos = videoRefs.current.filter(
      (video): video is HTMLVideoElement => video !== null,
    );
    if (videos.length < 2) return;
    let animationFrame = 0;
    let lastSync = 0;
    const synchronizeVideos = () => {
      const [master, ...slaves] = videos;
      if (master.readyState >= 2) {
        slaves.forEach((video) => {
          if (Math.abs(video.currentTime - master.currentTime) > 0.15) {
            video.currentTime = master.currentTime;
          }
          if (master.paused && !video.paused) {
            video.pause();
          } else if (!master.paused && video.paused) {
            void video.play().catch(() => {});
          }
        });
      }
      const now = performance.now();
      if (now - lastSync > 250) {
        lastSync = now;
      }
      animationFrame = requestAnimationFrame(synchronizeVideos);
    };
    animationFrame = requestAnimationFrame(synchronizeVideos);
    return () => cancelAnimationFrame(animationFrame);
  }, []);
  const renderVideo = (index: number) => (
    <video
      ref={(el) => {
        videoRefs.current[index] = el;
      }}
      className="absolute inset-0 h-full w-full object-cover"
      playsInline
      autoPlay
      muted
      loop
      preload="metadata"
      aria-label="Sillhouete campaign film"
    >
      <source src={VIDEO_URL} type="video/mp4" />
    </video>
  );
  return (
    <section
      ref={sectionRef}
      aria-label="Campaign film"
      className="w-full bg-black overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-0 w-full">
        <div className="relative w-full aspect-9/16 lg:aspect-auto lg:min-h-140 overflow-hidden">
          {renderVideo(0)}
        </div>
        <div className="relative w-full aspect-9/16 lg:aspect-auto lg:min-h-140 overflow-hidden">
          <div
            className={`image-reveal-mask h-full w-full ${
              inView ? "is-revealed" : ""
            }`}
            style={{ transitionDelay: "120ms" }}
          >
            <Image
              src={MEDIA_IMAGE}
              alt="Blush pink bridal lehenga with heavy silver embroidery"
              fill
              sizes="(max-width: 1023px) 100vw, 33vw"
              loading="lazy"
              decoding="async"
              className="object-cover"
            />
          </div>
        </div>
        <div className="hidden lg:block relative w-full lg:min-h-140 overflow-hidden">
          {renderVideo(1)}
        </div>
      </div>
    </section>
  );
}
