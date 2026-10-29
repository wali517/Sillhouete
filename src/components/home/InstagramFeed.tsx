
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Layers, X } from "lucide-react";
import { INSTAGRAM_POSTS } from "@/data/campaigns";

const HANDLE = "sillhouete.official";

const INSTAGRAM_ICON =
  "https://instafeed.nfcube.com/assets/img/instagram-icon-v2.svg";

const INSTAGRAM_POSTS_LIST = [
  {
    id: 1,
    date: "October 18",
    image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-nisa-black-Refined-embroidery.jpg?v=1768978207",
    caption:
      "Raha Pret | RSP-03\n\nA timeless black ensemble featuring a long A-line shirt adorned with refined embroidery. Paired with tailored culottes and a coordinating dupatta, this look embodies modern elegance and effortless sophistication.\n\nShop Now: https://sillhouete.com/collections/raha-eid-pret26\n\n#Sillhouete #luxurypret #formals #festive #livenow",
  },
  {
    id: 2,
    date: "October 14",
    image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-erza-mint-green-delicate-embroidery-model.jpg?v=1768978680",
    caption:
      "Pret | RSP-03\n\nAn ode to graceful tradition, this mint green ensemble features a front-open short shirt with delicate embroidery, paired with a regal farshi shalwar and a sheer organza dupatta for an ethereal finish.\n\nShop Now: https://sillhouete.com/collections/raha-eid-pret26",
  },
  {
    id: 3,
    date: "October 13",
    image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-erza-mint-green-delicate-embroidery-front-closeup.jpg?v=1768978836",
    caption:
      "Pret | RSP-03\n\nIntricate details of hand-crafted motifs and delicate embroidery on premium fabrics.\n\nShop Now: https://sillhouete.com/collections/raha-eid-pret26",
  },
  {
    id: 4,
    date: "October 12",
    image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-amavi-bottle-green-delicate-embroidery-front.jpg?v=1768978581",
    caption:
      "Pret | RSP-02\n\nA vision of modern regality, this emerald green outfit showcases a front-open short shirt delicately embroidered, paired with flowing sharara pants and a matching dupatta.\n\nShop Now: https://sillhouete.com/collections/raha-eid-pret26",
  },
  {
    id: 5,
    date: "October 11",
    image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-amavi-bottle-green-delicate-embroidery-front-closeup.jpg?v=1768978581",
    caption:
      "Pret | RSP-02\n\nClose-up view of delicate hand embroidery on lush emerald green.\n\nShop Now: https://sillhouete.com/collections/raha-eid-pret26",
  },
  {
    id: 6,
    date: "October 10",
    image: "https://sillhouete.com/cdn/shop/files/1000x1500_0006_052A6061.jpg?v=1758177457",
    caption:
      "Bridal Couture | Nikkah Collection\n\nGold embroidered bridal gown with sheer sleeves, matching dupatta, and detailed embellishments.\n\nShop Now: https://sillhouete.com/collections/nikkah-dresses",
  },
  {
    id: 7,
    date: "October 08",
    image: "https://sillhouete.com/cdn/shop/files/1000x1500_0012_052A5865.jpg?v=1756903506",
    caption:
      "Bridal Couture | Barat Collection\n\nRed bridal lehenga with heavy gold embroidery, full-sleeve embellished blouse, and matching ornate dupatta.\n\nShop Now: https://sillhouete.com/collections/barat-dresses",
  },
  {
    id: 8,
    date: "October 05",
    image: "https://sillhouete.com/cdn/shop/files/05.png?v=1758725288",
    caption:
      "Bridal Couture | Walima Collection\n\nBlush pink bridal lehenga with heavy silver embroidery, sheer embellished blouse, and matching dupatta.\n\nShop Now: https://sillhouete.com/collections/walima-dresses",
  },
];

export default function InstagramFeed() {
  const [open, setOpen] = useState<number | null>(null);
  const posts = INSTAGRAM_POSTS_LIST;
  const post = open === null ? null : posts[open];

  useEffect(() => {
    if (open === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);

      if (e.key === "ArrowDown") {
        setOpen((current) =>
          current === null ? current : (current + 1) % posts.length
        );
      }

      if (e.key === "ArrowUp") {
        setOpen((current) =>
          current === null
            ? current
            : (current - 1 + posts.length) % posts.length
        );
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, posts.length]);

  return (
    <section
      aria-label="Follow us on Instagram"
      className="mx-auto w-full max-w-[1400px] px-0 py-8 sm:py-10"
    >
      <h2 className="mb-5 text-center text-[22px] font-semibold">
        Follow us on Instagram
      </h2>

      {/* Mobile & Tablet: Horizontal swipeable scroll */}
      <div className="md:hidden flex w-full gap-2.5 overflow-x-auto snap-x snap-mandatory px-4 pb-3 no-scrollbar touch-pan-x">
        {posts.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpen(i)}
            aria-haspopup="dialog"
            aria-label={`Open Instagram post from ${p.date}`}
            className="group relative w-[65vw] sm:w-[42vw] shrink-0 aspect-square snap-center overflow-hidden bg-neutral-100"
          >
            <Image
              src={p.image}
              alt={`Instagram post: ${p.caption.split("\n")[0]}`}
              fill
              sizes="(min-width: 640px) 42vw, 65vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <Image
                src={INSTAGRAM_ICON}
                alt=""
                width={34}
                height={34}
                unoptimized
                className="brightness-0 invert"
              />
            </span>
          </button>
        ))}
      </div>

      {/* Desktop: 4x2 Grid of 8 Instagram photos */}
      <div className="hidden md:grid md:grid-cols-4 gap-[2px]">
        {posts.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpen(i)}
            aria-haspopup="dialog"
            aria-label={`Open Instagram post from ${p.date}`}
            className="group relative block aspect-square w-full overflow-hidden bg-neutral-100"
          >
            <Image
              src={p.image}
              alt={`Instagram post: ${p.caption.split("\n")[0]}`}
              fill
              sizes="25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Image
                src={INSTAGRAM_ICON}
                alt=""
                width={34}
                height={34}
                unoptimized
                className="brightness-0 invert"
              />
            </span>
          </button>
        ))}
      </div>

      {post && open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Instagram post ${open + 1}`}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-3 sm:p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden bg-white md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square w-full shrink-0 bg-black md:aspect-[3/4] md:w-1/2">
              <Image
                src={post.image}
                alt={`Instagram post: ${post.caption.split("\n")[0]}`}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-5">
              <a
                href={`https://www.instagram.com/${HANDLE}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold"
              >
                {HANDLE}
              </a>

              <p className="mt-4 whitespace-pre-line break-words text-sm">
                {post.caption}
              </p>

              <p className="mt-4 text-xs text-black/60">{post.date}</p>

              <div className="mt-auto flex items-center justify-between pt-6">
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  aria-label="Close post"
                  className="grid h-9 w-9 place-items-center border border-black/20"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Previous post"
                    onClick={() =>
                      setOpen((open - 1 + posts.length) % posts.length)
                    }
                    className="grid h-9 w-9 place-items-center border border-black/20"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    aria-label="Next post"
                    onClick={() => setOpen((open + 1) % posts.length)}
                    className="grid h-9 w-9 place-items-center border border-black/20"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}