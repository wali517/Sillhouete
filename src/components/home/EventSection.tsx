"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EVENTS } from "@/data/campaigns";

export default function EventSection() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "60px 0px 0px 0px", threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="mx-auto w-full max-w-355 px-3.5 py-8 md:px-10 md:py-12">
      <h2 className="mb-6 text-center text-[16px] font-semibold uppercase leading-none tracking-wider text-[#111111] sm:text-[17px] md:mb-8 md:text-[20px]">
        SHOP BY EVENT
      </h2>
      <div className="grid grid-cols-2 gap-[10px] md:grid-cols-5 md:gap-[1.8vw]">
        {EVENTS.map((e) => (
          <Link
            key={e.label}
            href={e.href}
            data-aos="row-of-5"
            className="group relative block overflow-hidden"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#f7f6f3]">
              <div className={`image-reveal-mask h-full w-full ${inView ? "is-revealed" : ""}`}>
                <Image
                  src={e.image}
                  alt={e.alt}
                  fill
                  sizes="(min-width: 768px) 20vw, 50vw"
                  loading="lazy"
                  decoding="async"
                  className="object-cover"
                />
              </div>
              {/* Subtle darkening overlay on hover / touch on desktop & tablet without moving the image */}
              <div className="pointer-events-none absolute inset-0 z-10 bg-black/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100" />
            </div>
            <span className="absolute bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-20 bg-white text-black px-4 py-2 md:px-5 md:py-2.5 text-[12px] md:text-[13px] font-medium uppercase tracking-[0.1em] shadow-none rounded-none whitespace-nowrap pointer-events-none">
              {e.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
