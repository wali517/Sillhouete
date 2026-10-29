"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ABOUT_TEXT, FOOTER_LINKS, PAYMENT_IMAGES, SITE } from "@/data/site";
import Socials from "@/components/ui/Socials";
import {
  AmexBadge,
  DinersBadge,
  DiscoverBadge,
  JcbBadge,
  MastercardBadge,
  VisaBadge,
} from "@/components/ui/CardBadges";

function Column({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line py-4 md:border-0 md:py-0">
      <h2 className="hidden text-[13px] font-bold uppercase tracking-[0.12em] text-black md:block">
        {title}
      </h2>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-[13px] font-bold uppercase tracking-[0.12em] text-black md:hidden"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`${open ? "mt-3 block" : "hidden"} md:mt-4 md:block`}>
        {children}
      </div>
    </div>
  );
}

const Badge = ({
  label,
  bg,
  fg = "#fff",
}: {
  label: string;
  bg: string;
  fg?: string;
}) => (
  <li
    aria-label={label}
    className="grid h-6 w-[38px] place-items-center rounded-[3px] border border-black/10 text-[8px] font-bold shadow-xs select-none"
    style={{ background: bg, color: fg }}
  >
    {label}
  </li>
);

export default function Footer() {
  const [footerEmail, setFooterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!footerEmail.trim()) return;
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Footer Subscriber",
          email: footerEmail.trim(),
          subject: "Newsletter Subscription",
          message: "Subscribed via footer form",
        }),
      });
      setSubscribed(true);
      setFooterEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    } catch {
      setSubscribed(true);
      setFooterEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="border-t border-line bg-white text-black text-[12px] leading-[1.6]">
      {/* 4 Columns matching Image 2 */}
      <div className="mx-auto grid max-w-[1420px] gap-0 px-5 py-8 md:grid-cols-4 md:gap-8 md:px-10 md:py-12">
        {/* Col 1: ABOUT US */}
        <Column title="ABOUT US">
          <div className="relative mb-3 h-14 w-[130px]">
            <Image
              src={SITE.logo}
              alt="Sillhouete Calligraphic Logo"
              fill
              sizes="130px"
              className="object-contain object-left"
            />
          </div>
          <p className="text-[12.75px]px] text-black/85 leading-relaxed">
            {ABOUT_TEXT}
          </p>
        </Column>

        {/* Col 2: HELP & INFO */}
        <Column title="HELP & INFO">
          <ul className="space-y-1.5 text-[12.75px]px] uppercase tracking-wide text-black/90">
            {FOOTER_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </Column>

        {/* Col 3: CONTACT INFO */}
        <Column title="CONTACT INFO">
          <div className="space-y-3 text-[12.75px]px] text-black/85 leading-relaxed">
            <div>
              <strong className="block font-semibold text-black">
                Pakistan (Office &amp; Studio):
              </strong>
              <p>
                <strong>Office Address:</strong> 327-B, Street 7, Lane 15,
                Cavalry Ground, Lahore
              </p>
              <p>
                <strong>Studio Address:</strong> Sillhouete, Almas Tower, MM
                Alam Rd, Block T, Gulberg 2, Lahore
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                <a href="tel:+923310397865" className="hover:underline">
                  +92 331 0397865
                </a>
              </p>
            </div>

            <div className="pt-1">
              <strong className="block font-semibold text-black">
                USA Office:
              </strong>
              <p className="font-semibold text-black/90">
                ADVENT BUSINESS CONSULTAX LLC
              </p>
              <p>
                18w100 22nd St, Ste 124, Oakbrook Terrace, IL, Zip Code 60181
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                <a href="tel:+12172909383" className="hover:underline">
                  +1 217 2909383
                </a>
              </p>
            </div>

            <p className="pt-1">
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${SITE.email}`}
                className="underline hover:text-black"
              >
                {SITE.email}
              </a>
            </p>
          </div>
        </Column>

        {/* Col 4: SIGN UP AND SAVE */}
        <Column title="SIGN UP AND SAVE">
          <p className="mb-3 text-[12.75px]px] text-black/85 leading-relaxed">
            Subscribe to get special offers, free giveaways, and
            once-in-a-lifetime deals.
          </p>

          <form onSubmit={handleSubscribe} className="mt-3">
            <div className="flex items-center border-b pb-1.5 focus-within:outline-none focus-within:ring-0">
              <input
                type="email"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="min-w-0 flex-1 border-0 bg-transparent text-xs text-black outline-none ring-0 shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none placeholder:text-neutral-500"
              />

              <button
                type="submit"
                aria-label="Subscribe"
                className="p-1 text-black hover:opacity-75 transition-opacity cursor-pointer"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  role="presentation"
                  className="h-5 w-5"
                  viewBox="0 0 64 64"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M63 52H1V12h62ZM1 12l25.68 24h9.72L63 12M21.82 31.68 1.56 51.16m60.78.78L41.27 31.68" />
                </svg>
              </button>
            </div>
            {subscribed && (
              <p className="mt-1 text-[12px] text-emerald-700 font-medium">
                Thank you for subscribing!
              </p>
            )}
          </form>

          <Socials className="mt-4" />
        </Column>
      </div>

      {/* Centered Payment Badges Row matching real site SVGs */}
      <div className="mx-auto max-w-[1420px] px-5 pt-1 pb-3 md:px-10">
        <ul className="mb-2 flex items-center justify-center gap-1.5 flex-wrap">
          <li><AmexBadge className="h-5 w-8" /></li>
          <li><DinersBadge className="h-5 w-8" /></li>
          <li><DiscoverBadge className="h-5 w-8" /></li>
          <li><JcbBadge className="h-5 w-8" /></li>
          <li><MastercardBadge className="h-5 w-8" /></li>
          <li><VisaBadge className="h-5 w-8" /></li>
        </ul>

        {/* Bottom Bar: Currency + Powered By on Left, Card Badges on Right matching Image 2 */}
        <div className="flex flex-col items-center justify-between gap-2 pt-1 md:flex-row">
          <div className="flex items-center gap-4">
            <p className="text-[12px] text-black/75">
              <Link href="/" className="hover:underline">
                Powered by Sillhouete
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {PAYMENT_IMAGES.map((p) => (
              <div
                key={p.alt}
                className="grid h-7 w-11 place-items-center rounded border border-neutral-200 bg-white shadow-2xs"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={34}
                  height={22}
                  unoptimized
                  className="h-[18px] w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
