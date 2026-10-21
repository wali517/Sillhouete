"use client";

import { useEffect, useRef, useState } from "react";
import { ANNOUNCEMENTS } from "@/data/site";

export default function AnnouncementBar() {
  const extended = [...ANNOUNCEMENTS, ANNOUNCEMENTS[0]];
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
    if (currentIndex >= ANNOUNCEMENTS.length) {
      setWithTransition(false);
      setCurrentIndex(0);
    }
  };

  return (
    <div
      className="relative bg-[#0f0f0f] text-white overflow-hidden py-2 select-none border-b border-white/5"
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
