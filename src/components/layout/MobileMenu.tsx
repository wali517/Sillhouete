"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Globe } from "lucide-react";
import { NAV } from "@/data/site";
import Socials from "@/components/ui/Socials";
import { useStore, type CurrencyCode } from "@/components/providers/StoreProvider";

const CURRENCIES: CurrencyCode[] = ["PKR", "USD", "GBP", "EUR", "CAD", "AED"];

export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { currency, setCurrency } = useStore();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="fixed bottom-0 right-0 top-0 z-[100] flex w-[85%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            <div className="flex items-center justify-between border-b border-[#e8e8e1] px-5 py-4">
              <span className="text-sm font-bold uppercase tracking-wider">Navigation</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-8 w-8 place-items-center text-black hover:opacity-70 transition-opacity"
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
                  <path d="m19 17.61 27.12 27.13m0-27.12L19 44.74" />
                </svg>
              </button>
            </div>

            <ul className="flex-1 px-5 divide-y divide-line">
              {NAV.map((item) => (
                <li key={item.label}>
                  <div className="flex items-center justify-between">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex-1 py-3 text-[16px] uppercase tracking-wide font-semibold ${
                        item.sale ? "text-[red] animate-blinks sale-menu font-bold" : "text-black"
                      }`}
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        type="button"
                        aria-expanded={expanded === item.label}
                        aria-label={`Toggle ${item.label}`}
                        onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                        className="grid h-10 w-10 place-items-center"
                      >
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          role="presentation"
                          className={`h-3 w-3.5 transition-transform ${
                            expanded === item.label ? "rotate-180" : ""
                          }`}
                          viewBox="0 0 28 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="m1.57 1.59 12.76 12.77L27.1 1.59" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {item.children && expanded === item.label && (
                    <ul className="pb-3 pl-4 space-y-1 bg-soft/50 rounded p-2 mb-2">
                      {item.children.map((c) => (
                        <li key={c.label}>
                          <Link
                            href={c.href}
                            onClick={onClose}
                            className="block py-1.5 text-xs text-black/80 hover:text-black hover:underline"
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              <li className="py-3 flex items-center gap-2.5">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  role="presentation"
                  className="h-5 w-5 text-black"
                  viewBox="0 0 64 64"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M35 39.84v-2.53c3.3-1.91 6-6.66 6-11.41 0-7.63 0-13.82-9-13.82s-9 6.19-9 13.82c0 4.75 2.7 9.51 6 11.41v2.53c-10.18.85-18 6-18 12.16h42c0-6.19-7.82-11.31-18-12.16Z" />
                </svg>
                <Link href="/account" onClick={onClose} className="text-sm uppercase font-semibold">
                  Customer Account
                </Link>
              </li>
            </ul>

            {/* Currency Selector on Mobile */}
            <div className="border-t border-line px-5 py-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/60 mb-2 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                <span>Select Currency</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {CURRENCIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`rounded border py-1.5 text-xs font-semibold uppercase ${
                      currency === c
                        ? "border-black bg-black text-white"
                        : "border-line bg-soft text-black/70"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <Socials className="px-5 pb-6 border-t border-line pt-4" />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
