"use client";

import { useState } from "react";
import { ChevronDown, Tag, X } from "lucide-react";
import { useStore, type CurrencyCode } from "@/components/providers/StoreProvider";

const CURRENCY_LIST: { code: CurrencyCode; flag: string; label: string }[] = [
  { code: "PKR", flag: "🇵🇰", label: "Auto Location" },
  { code: "USD", flag: "🇺🇸", label: "US Dollar (USD)" },
  { code: "EUR", flag: "🇪🇺", label: "Euro (EUR)" },
  { code: "GBP", flag: "🇬🇧", label: "British Pound (GBP)" },
  { code: "CAD", flag: "🇨🇦", label: "Canadian Dollar (CAD)" },
  { code: "AED", flag: "🇦🇪", label: "UAE Dirham (AED)" },
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
            <div className="absolute bottom-full left-0 mb-2 w-[250px] max-h-[290px] overflow-y-auto rounded-md bg-white shadow-[0_4px_20px_rgba(0,0,0,0.18)] z-50 font-serif text-[14px] text-neutral-800">
              <ul>
                {CURRENCY_LIST.map((c) => (
                  <li key={c.label} className="border-b border-neutral-200 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left tracking-wide hover:bg-neutral-50 transition-colors"
                    >
                      <span className="text-xl leading-none">{c.flag}</span>
                      <span>{c.label}</span>
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
