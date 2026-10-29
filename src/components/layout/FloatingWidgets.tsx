"use client";

import { useEffect, useRef, useState } from "react";
import { Tag, X } from "lucide-react";
import { useStore, type CurrencyCode } from "@/components/providers/StoreProvider";
import Flag, { type FlagKey } from "./CurrencyFlags";

const CURRENCY_LIST: { code: CurrencyCode; flag: FlagKey; label: string }[] = [
  { code: "PKR", flag: "AUTO", label: "Auto Location" },
  { code: "USD", flag: "USD", label: "US Dollar (USD)" },
  { code: "EUR", flag: "EUR", label: "Euro (EUR)" },
  { code: "GBP", flag: "GBP", label: "British Pound (GBP)" },
  { code: "CAD", flag: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "AED", flag: "AED", label: "UAE Dirham (AED)" },
];

function Chevron({ up }: { up: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 text-[#b4b4b4] transition-transform duration-200 ${up ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 6l4.5 4.5L12.5 6" />
    </svg>
  );
}

export default function FloatingWidgets() {
  const { currency, setCurrency } = useStore();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [showDiscountPill, setShowDiscountPill] = useState(true); // not shown on the reference storefront
  const wrapRef = useRef<HTMLDivElement>(null);

  const currentFlag: FlagKey = CURRENCY_LIST.find((c) => c.code === currency)?.code ?? "PKR";

  // Close on outside click / Escape
  useEffect(() => {
    if (!currencyOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setCurrencyOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCurrencyOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [currencyOpen]);

  const openDiscount = () => {
    window.dispatchEvent(new CustomEvent("open-newsletter-popup"));
  };

  return (
    <>
      {/* Bottom-Left Floating Controls */}
      <div className="fixed bottom-2 left-4 z-40 flex flex-col items-start gap-2.5 md:left-[45px]">
        {/* Get 5% Off Box */}
        {showDiscountPill && (
          <div className="group relative flex items-center overflow-hidden rounded border border-white/10 bg-black text-[11px] font-semibold uppercase tracking-wider text-white shadow-2xl">
            <button
              type="button"
              onClick={openDiscount}
              className="flex items-center gap-2 px-3.5 py-2 transition-colors hover:bg-neutral-900"
              aria-label="Get 5% discount"
            >
              <Tag className="h-3 w-3 text-yellow-400 transition-transform group-hover:rotate-12" />
              <span>Get 5% Off</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDiscountPill(false)}
              className="border-l border-white/15 px-2 py-2 text-white/60 transition-colors hover:bg-neutral-900 hover:text-white"
              aria-label="Close discount badge"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Currency switcher */}
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setCurrencyOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={currencyOpen}
            aria-label="Change currency"
            className="flex h-12 items-center gap-2.5 rounded-md bg-white px-3 shadow-[0_0_14px_rgba(255,255,255,0.8)] transition-shadow hover:shadow-[0_0_18px_rgba(255,255,255,0.95)]"
          >
            <Flag code={currentFlag} size={28} />
            <span className="text-[13px] tracking-wide text-neutral-800">{currency}</span>
            <Chevron up={currencyOpen} />
          </button>

          {currencyOpen && (
            <div
              role="listbox"
              aria-label="Currency"
              className="currency-list absolute bottom-full left-0 mb-2.5 max-h-[238px] w-[205px] overflow-y-auto rounded-md bg-white shadow-[0_4px_22px_rgba(0,0,0,0.2)]"
            >
              <ul>
                {CURRENCY_LIST.map((c) => (
                  <li key={c.label} className="border-b border-neutral-200/80 last:border-b-0">
                    <button
                      type="button"
                      role="option"
                      aria-selected={c.code === currency}
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyOpen(false);
                      }}
                      className="flex h-[46px] w-full items-center gap-3 px-3.5 text-left text-[12.5px] tracking-wide text-neutral-700 transition-colors hover:bg-neutral-50"
                    >
                      <Flag code={c.flag} size={24} />
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
