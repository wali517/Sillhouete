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
          className="h-8 w-8 fill-white relative z-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.406 0 0 5.405 0 12.05c0 2.125.556 4.202 1.613 6.02L0 24l6.133-1.59a11.8 11.8 0 005.913 1.582h.005c6.643 0 12.049-5.405 12.049-12.05 0-3.225-1.256-6.254-3.535-8.533z"/>
        </svg>

        {/* Hover pill */}
        <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-black px-3 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100 hidden md:block">
          Order on WhatsApp
        </span>
      </a>
    </aside>
  );
}
