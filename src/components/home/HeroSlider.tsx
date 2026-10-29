"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HeroSlide } from "@/types";
import { useStore } from "@/components/providers/StoreProvider";

/**
 * Hero slideshow, timed to match the reference storefront:
 *  - advances every 5s, in lock-step with the announcement bar (shared `tick`)
 *  - the previous slide disappears at once; the next one fades in from black while drifting
 *    in from the right (~0.65s, ease-out) — see `.hero-slide-active` in globals.css
 */
export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const { tick, resetTick } = useStore();
  const [current, setCurrent] = useState(0);
  const [hasChanged, setHasChanged] = useState(false); // no entrance animation on first paint
  const lastTick = useRef(tick);

  // Advance whenever the shared 5s heartbeat ticks.
  useEffect(() => {
    if (tick === lastTick.current) return;
    lastTick.current = tick;
    setHasChanged(true);
    setCurrent((c) => (c + 1) % slides.length);
  }, [tick, slides.length]);

  const goToSlide = (i: number) => {
    if (i === current) return;
    setHasChanged(true);
    setCurrent(i);
    resetTick(); // restart the 5s countdown from this click
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Campaigns"
      className="relative w-full select-none overflow-hidden bg-black"
    >
      <div className="relative aspect-[4/5] w-full md:aspect-[2400/987.5]">
        {slides.map((s, i) => {
          const active = i === current;
          const content = (
            <div className="relative h-full w-full">
              <Image
                src={s.mobile}
                alt={s.mobileAlt}
                fill
                sizes="100vw"
                priority={i === 0}
                className="object-cover md:hidden"
              />
              <Image
                src={s.desktop}
                alt={s.alt}
                fill
                sizes="100vw"
                priority={i === 0}
                className="hidden object-cover md:block"
              />
            </div>
          );

          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              aria-hidden={!active}
              className={`absolute inset-0 ${active ? (hasChanged ? "hero-slide-active" : "") : "invisible pointer-events-none"}`}
            >
              {s.href ? (
                <Link href={s.href} tabIndex={active ? 0 : -1} className="block h-full w-full">
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>

      {/* Slide dots: small translucent dots, the active one larger and solid */}
      <ol className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-[10px] md:bottom-7">
        {slides.map((s, i) => (
          <li key={s.id} className="flex h-5 w-5 items-center justify-center">
            <button
              type="button"
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current}
              className="hero-dot rounded-full bg-white transition-[width,height,opacity] duration-300"
              style={{
                width: i === current ? 11 : 7,
                height: i === current ? 11 : 7,
                opacity: i === current ? 1 : 0.55,
                padding: 0,
                border: 0,
              }}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
