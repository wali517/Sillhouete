"use client";

import { useState } from "react";
import { ChevronDown, Tag, X } from "lucide-react";
import { useStore, type CurrencyCode, CURRENCY_RATES } from "@/components/providers/StoreProvider";

const CURRENCY_LIST: { code: CurrencyCode; flag: string; label: string }[] = [
  { code: "PKR", flag: "🇵🇰", label: "Pakistan (PKR Rs.)" },
  { code: "USD", flag: "🇺🇸", label: "United States (USD $)" },
  { code: "GBP", flag: "🇬🇧", label: "United Kingdom (GBP £)" },
  { code: "EUR", flag: "🇪🇺", label: "European Union (EUR €)" },
  { code: "CAD", flag: "🇨🇦", label: "Canada (CAD CA$)" },
  { code: "AED", flag: "AED", label: "United Arab Emirates (AED)" },
];

export default function FloatingWidgets() {
  const { currency, setCurrency } = useStore();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [showDiscountPill, setShowDiscountPill] = useState(true);

  const currentFlag = CURRENCY_LIST.find((c) => c.code === currency)?.flag || "🇵🇰";

  const openDiscount = () => {
    window.dispatchEvent(new CustomEvent("open-newsletter-popup"));
  };

  return (
    <>
      {/* Bottom-Left Floating Controls */}
      <div className="fixed bottom-6 left-5 z-40 flex flex-col items-start gap-2.5">
        {/* Get 5% Off Box */}
        {showDiscountPill && (
          <div className="relative flex items-center bg-black text-white text-[11px] font-semibold tracking-wider uppercase rounded shadow-2xl overflow-hidden border border-white/10 group">
            <button
              type="button"
              onClick={openDiscount}
              className="flex items-center gap-2 px-3.5 py-2 hover:bg-neutral-900 transition-colors"
              aria-label="Get 5% discount"
            >
              <Tag className="h-3 w-3 text-yellow-400 group-hover:rotate-12 transition-transform" />
              <span>Get 5% Off</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDiscountPill(false)}
              className="px-2 py-2 text-white/60 hover:text-white hover:bg-neutral-900 border-l border-white/15 transition-colors"
              aria-label="Close discount badge"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Currency Switcher Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCurrencyOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-black shadow-md backdrop-blur hover:bg-neutral-50 transition-all"
            aria-label="Change currency"
          >
            <span className="text-sm">{currentFlag}</span>
            <span>{currency}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {currencyOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-black/10 bg-white p-1.5 shadow-2xl z-50 text-xs">
              <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-[11px] text-black/60 border-b border-black/5">
                Select Currency
              </div>
              <ul className="py-1">
                {CURRENCY_LIST.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left rounded transition-colors ${
                        currency === c.code ? "bg-black text-white font-semibold" : "hover:bg-neutral-100 text-black/90"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span>{c.code}</span>
                      </span>
                      <span className="text-[11px] opacity-70">
                        {CURRENCY_RATES[c.code]?.symbol}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
