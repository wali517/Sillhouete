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
  const { tick } = useStore();
  const n = ANNOUNCEMENTS.length;
  const [current, setCurrent] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const lastTick = useRef(tick);

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
      className="relative z-[45] select-none overflow-hidden bg-[#0f0f0f] py-2 text-white"
      role="region"
      aria-label="Announcements"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 text-center">
        <div className="relative h-5 w-full overflow-hidden" aria-live="off">
          {leaving !== null && (
            <p
              key={`out-${leaving}-${tick}`}
              aria-hidden="true"
              onAnimationEnd={() => setLeaving(null)}
              className="ann-out absolute inset-0 flex items-center justify-center truncate px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white md:text-[12px]"
            >
              {ANNOUNCEMENTS[leaving]}
            </p>
          )}
          <p
            key={`in-${current}-${tick}`}
            className={`absolute inset-0 flex items-center justify-center truncate px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white md:text-[12px] ${
              leaving !== null ? "ann-in" : ""
            }`}
          >
            {ANNOUNCEMENTS[current]}
          </p>
        </div>
      </div>
    </div>
  );
}
