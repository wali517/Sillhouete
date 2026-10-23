"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowRight, CheckCircle2 } from "lucide-react";
import { POPUP_IMAGE } from "@/data/campaigns";
import Socials from "@/components/ui/Socials";

const KEY = "sillhouete-popup-dismissed";
const DELAY_MS = 2500; // Opens gently when user visits the site
const HIDE_DAYS = 1;

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "loading" | "done">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let skip = false;
    try {
      const t = Number(sessionStorage.getItem(KEY));
      skip = !!t && Date.now() - t < 3600_000;
    } catch {}
    if (skip) return;
    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-newsletter-popup", handleOpen);
    return () => window.removeEventListener("open-newsletter-popup", handleOpen);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {}
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter Subscriber",
          email: cleanEmail,
          subject: "Newsletter 5% Off Subscription",
          message: `Subscribed on ${new Date().toLocaleDateString()}`,
        }),
      });
      setStatus("done");
      setMessage("Thank you! Use code SILLHOUETE5 for 5% off.");
      setEmail("");
      setTimeout(() => close(), 2500);
    } catch {
      setStatus("done");
      setMessage("Thank you for subscribing!");
      setEmail("");
      setTimeout(() => close(), 2500);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Subscribe Newsletter"
      className="fixed inset-0 z-[110] grid place-items-center bg-black/60 backdrop-blur-[2px] p-4 animate-fade-in"
      onClick={close}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-visible bg-white shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Circular close button matching Image 1 */}
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-neutral-100 transition-colors"
        >
          <X className="h-4 w-4 stroke-[2]" />
        </button>

        {/* Left Content Column matching Image 1 */}
        <div className="flex flex-1 flex-col items-center justify-center p-8 md:p-10 text-center">
          <h2 className="font-serif text-[20px] md:text-[23px] font-bold uppercase tracking-[0.05em] text-[#111111] leading-snug">
            SUBSCRIBE OUR NEWSLETTER TO GET 5% OFF
          </h2>
          <p className="mt-3 text-xs md:text-sm text-neutral-600 max-w-sm leading-relaxed">
            Sign up to our newsletter today and get exclusive access to our upcoming collections, deals and discounts.
          </p>

          {/* Email input with attached black arrow submit button matching Image 1 */}
          <form onSubmit={handleSubmit} className="mt-6 w-full max-w-sm">
            <div className="flex items-stretch border border-black/30 focus-within:border-black transition-colors">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setStatus("idle");
                  setMessage("");
                }}
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="min-w-0 flex-1 bg-white px-3.5 py-2.5 text-xs outline-none text-black placeholder:text-neutral-500"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                aria-label="Subscribe"
                className="bg-[#111111] hover:bg-black text-white px-5 flex items-center justify-center transition-colors shrink-0"
              >
                <ArrowRight className="h-4 w-4 text-white stroke-[2]" />
              </button>
            </div>

            {status === "error" && (
              <p className="mt-2 text-xs text-red-600 font-medium">{message}</p>
            )}
            {status === "done" && (
              <p className="mt-2 text-xs text-emerald-700 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{message}</span>
              </p>
            )}

            {/* Solid Black SHOP NOW button matching Image 1 */}
            <Link
              href="/collections/1"
              onClick={close}
              className="mt-4 block w-full bg-[#111111] hover:bg-black text-white py-3 text-xs font-bold uppercase tracking-[0.25em] transition-colors text-center"
            >
              SHOP NOW
            </Link>

            {/* Social Icons matching Image 1 */}
            <div className="mt-6 flex items-center justify-center">
              <Socials />
            </div>
          </form>
        </div>

        {/* Right Model Image matching Image 1 */}
        <div className="relative hidden w-[45%] md:block bg-neutral-100 min-h-[460px]">
          <Image
            src={POPUP_IMAGE}
            alt="Sillhouete Haute Couture Model"
            fill
            sizes="400px"
            priority
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
