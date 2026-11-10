"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { SITE } from "@/data/site";
import { useStore } from "@/components/providers/StoreProvider";
// Styles moved to globals.css to avoid Turbopack PostCSS worker spawn issue on Windows

const HANDLE = "sillhouete.official";

/**
 * The 12 posts shown in the feed. Images live in /public/instagram (4:5, the
 * same pictures used in the reference recordings). The grid crops them to 3:4,
 * the popup shows them uncropped at 4:5.
 */
type FeedPost = {
  image: string;
  alt: string;
  caption: string;
  date: string;
};

const COLLECTION_URL = "https://sillhouete.com/collections/maahi-ii-luxury-eid-pret";
const TAGS = "#Sillhouete #luxurypret #Silkpret #maahiluxestudio";

const caption = (title: string, body: string, url: string, tags: string) =>
  `${title}\n\n${body}\n\nAvailable Now: ${url}\n\n${tags}`;

const LIVIA = "A vision in butter yellow. Featuring a luxe Korean raw silk long shirt and culottes, paired with a flowing organza dupatta and delicate Swarovski, naqshi, dabka and sequin embellishments. Effortlessly refined, beautifully luminous.";
const VIENNA = "A vision of understated opulence in shaded metallic grey, featuring a front-open short shirt, classic farshi shalwar, and flowing chiffon dupatta, elevated with delicate Swarovski embellishments.";
const BLUE = "Elegance in Royal Blue. Intricate hand embellishments, a flowy chiffon dupatta, and a graceful sharara made to make your festive moments shine.";
const IVY = "Pastel pistachio perfection, elevated with exquisite hand-embellishment and timeless couture elegance.";
const FREYA = "Delicately hand-embellished with Swarovski crystals, sequins, resham and stones, this graceful ensemble is designed to make every detail feel special. Paired with elegant culottes and a sheer organza dupatta for a look that moves effortlessly from intimate gatherings to festive evenings.";

const BLUE_URL = "https://sillhouete.com/products/iris-1";
const BLUE_TAGS = "#Sillhouete #luxurypret #Silkpret #maahiluxe";

const POSTS: FeedPost[] = [
  { image: "/instagram/ig-01.jpg", alt: "Maahi II Luxury Pret Livia in butter yellow with embroidered neckline", caption: caption("Maahi |I Luxury Pret | Livia", LIVIA, COLLECTION_URL, TAGS), date: "29 October" },
  { image: "/instagram/ig-02.jpg", alt: "Maahi II Luxury Pret Vienna in shaded metallic grey, front view", caption: caption("Maahi || Luxury Pret | Vienna", VIENNA, COLLECTION_URL, TAGS), date: "28 October" },
  { image: "/instagram/ig-03.jpg", alt: "Maahi II Luxury Pret Vienna, three-quarter view with hand on hip", caption: caption("Maahi || Luxury Pret | Vienna", VIENNA, COLLECTION_URL, TAGS), date: "28 October" },
  { image: "/instagram/ig-04.jpg", alt: "Maahi II Luxury Pret Vienna collage of embroidery details", caption: caption("Maahi || Luxury Pret | Vienna", VIENNA, COLLECTION_URL, TAGS), date: "27 October" },
  { image: "/instagram/ig-05.jpg", alt: "Maahi II Luxury Pret in royal blue with chiffon dupatta", caption: caption("Maahi II Luxury Pret", BLUE, BLUE_URL, BLUE_TAGS), date: "26 October" },
  { image: "/instagram/ig-06.jpg", alt: "Royal blue embroidered neckline and sleeve detail", caption: caption("Maahi II Luxury Pret", BLUE, BLUE_URL, BLUE_TAGS), date: "26 October" },
  { image: "/instagram/ig-07.jpg", alt: "Royal blue kurta with sharara and sheer dupatta", caption: caption("Maahi II Luxury Pret", BLUE, BLUE_URL, BLUE_TAGS), date: "25 October" },
  { image: "/instagram/ig-08.jpg", alt: "Maahi II Luxury Pret IVY in pistachio green, skirt detail", caption: caption("Maahi |I Luxury Pret | IVY", IVY, COLLECTION_URL, TAGS), date: "24 October" },
  { image: "/instagram/ig-09.jpg", alt: "Maahi II Luxury Pret IVY in pistachio green, seated pose", caption: caption("Maahi II Luxury Pret | IVY", IVY, COLLECTION_URL, TAGS), date: "23 October" },
  { image: "/instagram/ig-10.jpg", alt: "Maahi II Luxury Pret IVY in pistachio green, back view", caption: caption("Maahi II Luxury Pret | IVY", IVY, COLLECTION_URL, TAGS), date: "23 October" },
  { image: "/instagram/ig-11.jpg", alt: "Maahi II Luxury Pret Freya in lilac with beaded embroidery", caption: caption("Maahi || Luxury Pret | Freya", FREYA, COLLECTION_URL, TAGS), date: "22 October" },
  { image: "/instagram/ig-12.jpg", alt: "Maahi II Luxury Pret Freya in black and white", caption: caption("Maahi || Luxury Pret | Freya", FREYA, COLLECTION_URL, TAGS), date: "22 October" },
];

/* ───────────── icons ───────────── */

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5.2" />
    <circle cx="12" cy="12" r="4.1" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const CloseIcon = () => (
  <svg className="igf-ico" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 4l16 16M20 4L4 20" />
  </svg>
);

const ChevronIcon = ({ dir }: { dir: "left" | "right" }) => (
  <svg className="igf-ico" viewBox="0 0 13 22" aria-hidden="true">
    <path d={dir === "left" ? "M11.5 1.5L2 11l9.5 9.5" : "M1.5 1.5L11 11l-9.5 9.5"} />
  </svg>
);

const CartIcon = ({ count }: { count: number }) => (
  <svg viewBox="0 0 32 34" aria-hidden="true">
    <path d="M1 3.2h6.2l3.5 8.3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
    <path d="M8.2 9h23.3l-4.3 15.2H12.6z" fill="currentColor" />
    <circle cx="14.5" cy="30" r="2.5" fill="currentColor" />
    <circle cx="26" cy="30" r="2.5" fill="currentColor" />
    {count > 0 && (
      <text x="20.2" y="20" textAnchor="middle" fontSize="11">
        {count > 99 ? "99+" : count}
      </text>
    )}
  </svg>
);

/* ───────────── viewport helper ───────────── */

const DESKTOP_QUERY = "(min-width: 1200px)";

function useIsDesktop() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(DESKTOP_QUERY);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  );
}

/* ───────────── component ───────────── */

export default function InstagramFeed() {
  const { count, setCartOpen } = useStore();
  const isDesktop = useIsDesktop();
  const [active, setActive] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement | null>(null);
  const isOpen = active !== null;

  const openPost = (index: number, trigger: HTMLElement) => {
    opener.current = trigger;
    setActive(index);
  };

  const close = useCallback(() => {
    setActive(null);
    opener.current?.focus?.();
  }, []);

  const step = useCallback((direction: number) => {
    setActive((current) =>
      current === null ? current : (current + direction + POSTS.length) % POSTS.length
    );
  }, []);

  const openCart = useCallback(() => {
    setActive(null);
    setCartOpen(true);
  }, [setCartOpen]);

  // Lock page scroll, handle the keyboard and put focus inside the popup.
  useEffect(() => {
    if (!isOpen) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    closeBtn.current?.focus({ preventScroll: true });

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, close, step]);

  // Every new post starts at the top of the popup.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [active]);

  const post = active === null ? null : POSTS[active];

  const avatar = (
    <span className="igf-avatar">
      <Image src={SITE.logo} alt="" fill sizes="60px" />
    </span>
  );

  return (
    <section id="instagram-feed-section" className="igf" aria-label="Follow Sillhouete on Instagram">
      <h2 className="igf-title">Follow us on Instagram</h2>

      <div className="igf-grid">
        {POSTS.map((item, index) => (
          <button
            key={item.image}
            type="button"
            className="igf-tile"
            aria-haspopup="dialog"
            aria-label={`Open Instagram post ${index + 1} of ${POSTS.length}`}
            onClick={(event) => openPost(index, event.currentTarget)}
          >
            <Image
              className="igf-tile__img"
              src={item.image}
              alt={item.alt}
              fill
              unoptimized
              loading="lazy"
              decoding="async"
              sizes="(min-width: 1200px) 16vw, (min-width: 640px) 33vw, 50vw"
            />
            <span className="igf-tile__veil">
              <InstagramIcon />
            </span>
          </button>
        ))}
      </div>

      {post && active !== null && isDesktop && (
        <div
          className="igf-pop igf-d"
          role="dialog"
          aria-modal="true"
          aria-label={`Instagram post from ${HANDLE}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="igf-d__card">
            <div className="igf-media igf-d__media">
              <Image src={post.image} alt={post.alt} fill unoptimized sizes="40vw" />
            </div>
            <div className="igf-d__side">
              <div className="igf-d__head">
                {avatar}
                <span className="igf-handle">{HANDLE}</span>
              </div>
              <div className="igf-d__scroll" ref={scroller}>
                <p className="igf-text igf-d__text">{post.caption}</p>
              </div>
              <div className="igf-d__date">{post.date}</div>
            </div>
          </div>

          <button ref={closeBtn} type="button" className="igf-d__close" onClick={close} aria-label="Close">
            <CloseIcon />
          </button>
          <button type="button" className="igf-d__arrow igf-d__arrow--prev" onClick={() => step(-1)} aria-label="Previous post">
            <ChevronIcon dir="left" />
          </button>
          <button type="button" className="igf-d__arrow igf-d__arrow--next" onClick={() => step(1)} aria-label="Next post">
            <ChevronIcon dir="right" />
          </button>
        </div>
      )}

      {post && active !== null && !isDesktop && (
        <div
          className="igf-pop igf-m"
          role="dialog"
          aria-modal="true"
          aria-label={`Instagram post from ${HANDLE}`}
        >
          <div className="igf-m__head">
            {avatar}
            <span className="igf-handle">{HANDLE}</span>
            <button type="button" className="igf-m__cart" onClick={openCart} aria-label={`Cart, ${count} items`}>
              <CartIcon count={count} />
            </button>
          </div>

          <div className="igf-m__scroll" ref={scroller}>
            <div className="igf-media">
              <Image src={post.image} alt={post.alt} fill unoptimized sizes="100vw" />
            </div>
            <p className="igf-text igf-m__text">{post.caption}</p>
          </div>

          <div className="igf-m__bar">
            <button ref={closeBtn} type="button" className="igf-m__btn" onClick={close} aria-label="Close">
              <CloseIcon />
            </button>
            <div className="igf-m__nav">
              <button type="button" className="igf-m__btn igf-m__btn--arrow" onClick={() => step(-1)} aria-label="Previous post">
                <ChevronIcon dir="left" />
              </button>
              <button type="button" className="igf-m__btn igf-m__btn--arrow" onClick={() => step(1)} aria-label="Next post">
                <ChevronIcon dir="right" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
