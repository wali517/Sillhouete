"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, X, Globe, User } from "lucide-react";
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
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="heading text-sm">Navigation</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-8 w-8 place-items-center text-black/70 hover:text-black"
              >
                <X className="h-5 w-5" />
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
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            expanded === item.label ? "rotate-180" : ""
                          }`}
                        />
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
              <li className="py-3 flex items-center gap-2">
                <User className="h-4 w-4 text-black/70" />
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
