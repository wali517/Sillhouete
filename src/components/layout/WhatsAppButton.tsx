"use client";

import { SITE } from "@/data/site";

export default function WhatsAppButton() {
  return (
    <aside aria-label="Customer Support" className="fixed bottom-6 right-5 z-50">
      <a
        href={`https://wa.me/${SITE.whatsapp}?text=Hi%20Sillhouete%2C%20I%20have%20an%20inquiry%20regarding%20your%20dresses.`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp +92 331 0397865"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#10c379] text-white shadow-xl hover:scale-105 transition-transform"
      >
        {/* Pulse effect rings */}
        <span className="absolute -inset-1 rounded-full bg-[#10c379] opacity-30 animate-ping pointer-events-none" />

        {/* WhatsApp SVG Icon */}
        <svg
          className="h-7 w-7 fill-white relative z-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.053-1.077-.091-.659-.214-1.52-.777-2.34-1.597-.938-.938-1.571-2.072-1.748-2.375-.178-.303-.021-.468.125-.615.132-.132.294-.343.441-.515.147-.172.196-.293.294-.49.098-.196.049-.368-.025-.515s-.686-1.654-.94-2.267c-.247-.597-.499-.516-.686-.525l-.586-.01c-.201 0-.528.076-.804.377-.276.302-1.054 1.03-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.151.201 2.123 3.242 5.144 4.547 2.51 1.084 3.02.868 3.568.818.549-.051 1.765-.722 2.015-1.42.25-.698.25-1.296.175-1.42-.075-.125-.276-.201-.58-.353z" />
          <path d="M12 0c-6.627 0-12 5.373-12 12 0 2.22.607 4.303 1.666 6.104l-1.666 6.074 6.223-1.633c1.734.945 3.72 1.455 5.777 1.455 6.627 0 12-5.373 12-12s-5.373-12-12-12zm0 21.6c-1.874 0-3.666-.527-5.202-1.47l-.373-.228-3.693.969.986-3.6-.25-.398c-1.037-1.652-1.588-3.562-1.588-5.513 0-5.79 4.71-10.5 10.5-10.5 5.79 0 10.5 4.71 10.5 10.5s-4.71 10.5-10.5 10.5z" />
        </svg>

        {/* Hover pill */}
        <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-black px-3 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100 hidden md:block">
          Order on WhatsApp
        </span>
      </a>
    </aside>
  );
}
