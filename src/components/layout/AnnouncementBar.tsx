"use client";

import { useEffect, useRef, useState } from "react";
import { ANNOUNCEMENTS } from "@/data/site";
import { useStore } from "@/components/providers/StoreProvider";

/**
 * Announcement ticker, timed to match the reference storefront:
 * every 5s (shared with the hero slider) the current message slides out to the left while the
 * next slides in from the right — ~0.6s with a fast ease-out (see `.ann-in` / `.ann-out`).
 */
export default function AnnouncementBar() {
  const extended = [...ANNOUNCEMENTS, ANNOUNCEMENTS[0]];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [withTransition, setWithTransition] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (tick === lastTick.current) return;
    lastTick.current = tick;
    setCurrent((c) => {
      setLeaving(c);
      return (c + 1) % n;
    });
  }, [tick, n]);

  return (
    <div
      className="relative z-[45] select-none overflow-hidden bg-[#0f0f0f] py-[11.5px] text-white"
      role="region"
      aria-label="Announcements"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 text-center">
        <div className="relative h-5 w-full overflow-hidden">
          <div
            onTransitionEnd={handleTransitionEnd}
            className="flex w-full h-full"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: withTransition ? "transform 700ms cubic-bezier(0.25, 1, 0.5, 1)" : "none",
            }}
          >
            {extended.map((text, i) => (
              <div
                key={`${text}-${i}`}
                className="w-full shrink-0 flex items-center justify-center text-center"
              >
                <p className="text-[12px] md:text-[13px] font-medium tracking-[0.16em] uppercase truncate px-2 text-white/95">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
