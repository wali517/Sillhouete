"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ABOUT_TEXT, FOOTER_LINKS, SITE } from "@/data/site";
import { useStore } from "@/components/providers/StoreProvider";
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
    <div className="border-b border-[#e8e8e1] py-4 text-center md:border-0 md:py-0 md:text-left">
      <h2 className="hidden text-[13px] font-bold uppercase tracking-[0.2em] text-black md:block mb-4">
        {title}
      </h2>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="relative flex w-full items-center justify-center text-[13px] font-bold uppercase tracking-[0.2em] text-black md:hidden"
      >
        <span>{title}</span>
        <ChevronDown
          className={`absolute right-0 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`${open ? "mt-3 block" : "hidden"} md:block`}>
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  const { settings } = useStore();
  const [footerEmail, setFooterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const officeAddress = settings?.officeAddress || "327-B, Street 7, Lane 15, Cavalry Ground, Lahore";
  const studioAddress = settings?.studioAddress || "Sillhouete, Almas Tower, MM Alam Rd, Block T, Gulberg 2, Lahore";
  const usaOfficeAddress = settings?.usaOfficeAddress || "ADVENT BUSINESS CONSULTAX LLC, 18w100 22nd St, Ste 124, Oakbrook Terrace, IL, Zip Code 60181";
  const phone = settings?.phone || "+92 331 0397865";
  const email = settings?.email || SITE.email;
  const description = settings?.description || ABOUT_TEXT;

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
          isDiscount: true,
          subject: "Newsletter Discount Voucher",
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
    <footer className="site-footer border-t border-[#e8e8e1] bg-white text-black text-[12px] leading-[1.6] py-10 md:py-16">
      {/* 4 Columns matching Image 2 & live site */}
      <div className="mx-auto grid max-w-355 gap-0 px-4 md:grid-cols-4 md:gap-10 md:px-10">
        {/* Col 1: ABOUT US */}
        <Column title="ABOUT US">
          <div className="relative mx-auto mb-4 aspect-[2.2/1] w-full max-w-[90%] md:mx-0 md:aspect-auto md:h-12 md:w-[140px] md:max-w-none">
            <Image
              src={SITE.logo}
              alt="Sillhouete Calligraphic Logo"
              fill
              sizes="(min-width: 768px) 140px, 90vw"
              className="object-contain object-center md:object-left"
            />
          </div>
          <p className="text-[12.75px] text-[#222222] leading-relaxed">
            {description}
          </p>
        </Column>

        {/* Col 2: HELP & INFO */}
        <Column title="HELP & INFO">
          <ul className="space-y-2 text-[12.75px] uppercase tracking-wide text-[#222222]">
            {FOOTER_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:underline hover:text-black transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </Column>

        {/* Col 3: CONTACT INFO */}
        <Column title="CONTACT INFO">
          <div className="space-y-3 text-[12.75px] text-[#222222] leading-relaxed">
            <div>
              <strong className="block font-semibold text-black">
                Pakistan (Office &amp; Studio):
              </strong>
              <p>
                <strong>Office Address: </strong>{officeAddress}
              </p>
              <p>
                <strong>Studio Address: </strong>{studioAddress}
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:underline">
                  {phone}
                </a>
              </p>
            </div>

            <div className="pt-1">
              <strong className="block font-semibold text-black">
                USA Office:
              </strong>
              <p className="font-semibold text-black">
                ADVENT BUSINESS CONSULTAX LLC
              </p>
              <p>
                {usaOfficeAddress}
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
                href={`mailto:${email}`}
                className="underline hover:text-black"
              >
                {email}
              </a>
            </p>
          </div>
        </Column>

        {/* Col 4: SIGN UP AND SAVE */}
        <Column title="SIGN UP AND SAVE">
          <p className="mb-3 text-[12.75px] text-[#222222] leading-relaxed">
            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
          </p>

          <form onSubmit={handleSubscribe} className="mt-4">
            <div className="footer__newsletter relative max-w-[300px] border-b-2 border-black pb-1">
              <input
                type="email"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-transparent pr-10 text-[13px] text-black placeholder:text-[#222222]/70 outline-none border-0 focus:outline-none"
              />

              <button
                type="submit"
                aria-label="Subscribe"
                className="footer__newsletter-btn absolute right-0 top-0 bottom-0 flex items-center justify-end text-black cursor-pointer bg-transparent border-0 p-1"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  role="presentation"
                  className="h-4 w-4"
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
              <p className="mt-2 text-[12px] text-emerald-700 font-medium">
                Thank you for subscribing!
              </p>
            )}
          </form>

          <Socials className="mt-5 justify-center md:justify-start" />
        </Column>
      </div>

      {/* Centered Payment Badges Row matching real site SVGs */}
      <div className="mx-auto max-w-355 px-4 pt-8 pb-3 md:px-10">
        <ul className="mb-4 flex items-center justify-center gap-2 flex-wrap">
          <li><AmexBadge className="h-6 w-[38px]" /></li>
          <li><DinersBadge className="h-6 w-[38px]" /></li>
          <li><DiscoverBadge className="h-6 w-[38px]" /></li>
          <li><JcbBadge className="h-6 w-[38px]" /></li>
          <li><MastercardBadge className="h-6 w-[38px]" /></li>
          <li><VisaBadge className="h-6 w-[38px]" /></li>
        </ul>

        {/* Bottom Bar: Currency + Powered By on Left, Card Badges on Right matching Image 2 */}
        <div className="footer-end flex flex-col items-center justify-between gap-3 pt-3 md:flex-row">
          <p className="footer__small-text text-[12px] text-black/75">
            <Link href="/" className="hover:underline">
              Powered by Sillhouete
            </Link>
          </p>

          <div className="payment-icon flex items-center gap-1.5">
            <div className="img-pay">
              <Image
                src="https://cdn.shopify.com/s/files/1/0709/7755/2627/files/mastercard.png?v=1742200774"
                alt="master-card"
                width={50}
                height={30}
                unoptimized
                className="h-[26px] w-auto rounded-[5px] border border-[#dddddd94] object-contain p-0.5"
              />
            </div>
            <div className="img-pay">
              <Image
                src="https://cdn.shopify.com/s/files/1/0709/7755/2627/files/visa_484e9393-90e0-4d52-8eae-51193a00143d.png?v=1742200775"
                alt="visa-card"
                width={50}
                height={30}
                unoptimized
                className="h-[26px] w-auto rounded-[5px] border border-[#dddddd94] object-contain p-0.5"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
