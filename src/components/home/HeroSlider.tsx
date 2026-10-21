"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HeroSlide } from "@/types";

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  // Append first slide to end for seamless continuous forward loop
  const extendedSlides = [...slides, slides[0]];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [withTransition, setWithTransition] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setWithTransition(true);
      setCurrentIndex((prev) => prev + 1);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleTransitionEnd = () => {
    // When finished sliding into the duplicated first slide, immediately jump to slide 0 without backward rewind
    if (currentIndex >= slides.length) {
      setWithTransition(false);
      setCurrentIndex(0);
    }
  };

  const activeIndicatorIndex = currentIndex >= slides.length ? 0 : currentIndex;

  const goToSlide = (i: number) => {
    setWithTransition(true);
    setCurrentIndex(i);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Campaigns"
      className="relative w-full overflow-hidden select-none"
    >
      {/* Continuous One-Way Right-to-Left Sliding Track */}
      <div
        onTransitionEnd={handleTransitionEnd}
        className="flex w-full"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: withTransition ? "transform 700ms cubic-bezier(0.25, 1, 0.5, 1)" : "none",
        }}
      >
        {extendedSlides.map((s, i) => {
          const content = (
            <div className="relative aspect-[4/5] w-full overflow-hidden md:aspect-[2400/987.5]">
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
              key={`${s.id}-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${(i % slides.length) + 1} of ${slides.length}`}
              className="w-full shrink-0 relative"
            >
              {s.href ? (
                <Link href={s.href} className="block w-full">
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>

      {/* Slide Indicators matching real site */}
      <ol className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
        {slides.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === activeIndicatorIndex}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === activeIndicatorIndex ? "w-8 bg-white shadow" : "w-2.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
