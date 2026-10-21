"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Layers, Play, X } from "lucide-react";
import { INSTAGRAM_POSTS } from "@/data/campaigns";

const HANDLE = "sillhouete.official";

export default function InstagramFeed() {
  const [open, setOpen] = useState<number | null>(null);
  const post = open === null ? null : INSTAGRAM_POSTS[open];

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowDown") setOpen((o) => (o === null ? o : (o + 1) % INSTAGRAM_POSTS.length));
      if (e.key === "ArrowUp") setOpen((o) => (o === null ? o : (o - 1 + INSTAGRAM_POSTS.length) % INSTAGRAM_POSTS.length));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <section className="mx-auto w-full max-w-[669px] px-2.5 py-10">
      <h2 className="mb-6 text-center text-[22px] font-semibold">Follow us on Instagram</h2>
      <div className="grid grid-cols-3 gap-[2px]">
        {INSTAGRAM_POSTS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpen(i)}
            aria-haspopup="dialog"
            aria-label={`Open Instagram post from ${p.date}`}
            className="group relative aspect-[3/4] overflow-hidden"
          >
            <Image src={p.image} alt={`Instagram post: ${p.caption.split("\n")[0]}`} fill sizes="223px" className="object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {p.kind === "video" ? <Play className="h-8 w-8 fill-white text-white" /> : <Layers className="h-8 w-8 text-white" />}
            </span>
          </button>
        ))}
      </div>

      {post && open !== null && (
        <div role="dialog" aria-modal="true" aria-label={`Instagram post ${open + 1}`} className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4" onClick={() => setOpen(null)}>
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden bg-white md:flex-row" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[3/4] w-full bg-black md:w-1/2">
              <Image src={post.image} alt="" fill sizes="(min-width: 768px) 450px, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto p-5">
              <a href={`https://www.instagram.com/${HANDLE}`} target="_blank" rel="noopener noreferrer" className="font-semibold">{HANDLE}</a>
              <p className="mt-4 whitespace-pre-line break-words text-sm">{post.caption}</p>
              <p className="mt-4 text-xs text-black/60">{post.date}</p>
              <div className="mt-auto flex items-center justify-between pt-6">
                <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="grid h-9 w-9 place-items-center border border-black/20"><X className="h-4 w-4" /></button>
                <div className="flex gap-2">
                  <button type="button" aria-label="Previous post" onClick={() => setOpen((open - 1 + INSTAGRAM_POSTS.length) % INSTAGRAM_POSTS.length)} className="grid h-9 w-9 place-items-center border border-black/20"><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" aria-label="Next post" onClick={() => setOpen((open + 1) % INSTAGRAM_POSTS.length)} className="grid h-9 w-9 place-items-center border border-black/20"><ChevronDown className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
