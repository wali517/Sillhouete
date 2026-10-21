"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ABOUT_TEXT, FOOTER_LINKS, PAYMENT_IMAGES, SITE } from "@/data/site";
import NewsletterForm from "@/components/ui/NewsletterForm";
import Socials from "@/components/ui/Socials";

function Column({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line py-4 md:border-0 md:py-0">
      <h2 className="heading hidden text-[17px] md:block">{title}</h2>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="heading flex w-full items-center justify-between text-[17px] md:hidden">
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`${open ? "mt-4 block" : "hidden"} md:mt-5 md:block`}>{children}</div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white text-black">
      <div className="mx-auto grid max-w-[1420px] gap-0 px-5 py-8 md:grid-cols-4 md:gap-10 md:px-10 md:py-14">
        <Column title="About Us">
          <div className="relative mb-4 h-14 w-32">
            <Image src={SITE.logo} alt="sillhouete logo" fill sizes="128px" className="object-contain object-left" />
          </div>
          <p>{ABOUT_TEXT}</p>
        </Column>

        <Column title="HELP & INFO">
          <ul className="space-y-2">
            {FOOTER_LINKS.map((l) => (
              <li key={l.label}><Link href={l.href} className="hover:underline">{l.label}</Link></li>
            ))}
          </ul>
        </Column>

        <Column title="Contact Info">
          <div className="space-y-4 text-[15px]">
            <p>
              <strong>Pakistan (Office &amp; Studio):</strong><br />
              <strong>Office Address: </strong>327-B, Street 7, Lane 15, Cavalry Ground, Lahore<br />
              <strong>Studio Address: </strong>Sillhouete, Almas Tower, MM Alam Rd, Block T, Gulberg 2, Lahore<br />
              <strong>Phone:</strong> <a href="tel:+923310397865">+92 331 0397865</a>
            </p>
            <p>
              <strong>USA Office:</strong><br />
              <strong>ADVENT BUSINESS CONSULTAX LLC</strong><br />
              18w100 22nd St, Ste 124, Oakbrook Terrace, IL, Zip Code 60181<br />
              <strong>Phone:</strong> <a href="tel:+12172909383">+1 217 2909383</a>
            </p>
            <p><strong>Email:</strong> <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a></p>
          </div>
        </Column>

        <Column title="Sign up and save">
          <p className="mb-3">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
          <NewsletterForm id="newsletter-footer" />
          <Socials className="mt-3" />
        </Column>
      </div>

      <div className="mx-auto flex max-w-[1420px] flex-col items-center justify-between gap-4 border-t border-line px-5 py-5 md:flex-row md:px-10">
        <p className="text-xs text-black/60 flex items-center gap-2">
          <Link href="/" className="hover:underline">Powered by Sillhouete</Link>
          <span>•</span>
          <Link href="/admin/login" className="text-black/40 hover:text-black hover:underline" title="Store Administration">Staff Portal</Link>
        </p>
        <ul className="flex items-center gap-3">
          {PAYMENT_IMAGES.map((p) => (
            <li key={p.alt}><Image src={p.src} alt={p.alt} width={46} height={30} unoptimized className="h-[30px] w-auto" /></li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
