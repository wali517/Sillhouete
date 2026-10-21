"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { POPUP_IMAGE } from "@/data/campaigns";
import NewsletterForm from "@/components/ui/NewsletterForm";
import Socials from "@/components/ui/Socials";

const KEY = "sillhouete-popup-dismissed";
const DELAY_MS = 800; // Opens promptly when user visits website
const HIDE_DAYS = 1;

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"subscribe" | "login">("subscribe");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMsg, setLoginMsg] = useState("");

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
    try { sessionStorage.setItem(KEY, String(Date.now())); } catch {}
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoginMsg("Logged in successfully!");
    setTimeout(() => {
      close();
    }, 1000);
  };

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome Popup"
      className="fixed inset-0 z-[110] grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={close}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-y-auto bg-white shadow-2xl md:flex-row border border-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative hidden w-2/5 md:block bg-neutral-100">
          <Image
            src={POPUP_IMAGE}
            alt="Sillhouete Haute Couture Model"
            fill
            sizes="300px"
            className="object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-8 text-center">
          {/* Top Toggle: Newsletter vs Sign In */}
          <div className="flex items-center gap-4 mb-4 border-b border-black/10 pb-2 w-full justify-center text-xs uppercase tracking-wider font-semibold">
            <button
              type="button"
              onClick={() => setView("subscribe")}
              className={`pb-1 transition-colors ${view === "subscribe" ? "border-b-2 border-black text-black font-bold" : "text-black/50 hover:text-black"}`}
            >
              Get 5% Off
            </button>
            <span className="text-black/30">|</span>
            <button
              type="button"
              onClick={() => setView("login")}
              className={`pb-1 transition-colors ${view === "login" ? "border-b-2 border-black text-black font-bold" : "text-black/50 hover:text-black"}`}
            >
              Sign In / Log In
            </button>
          </div>

          {view === "subscribe" ? (
            <div className="flex flex-col items-center gap-3 w-full">
              <h2 className="heading text-[20px] md:text-[22px] leading-tight text-black">
                Subscribe Our newsletter to get 5% off
              </h2>
              <p className="text-xs md:text-sm text-black/70 max-w-sm">
                Sign up to our newsletter today and get exclusive access to our upcoming collections, deals and discounts.
              </p>
              <NewsletterForm id="newsletter-popup" className="w-full text-left my-2" />
              <div className="flex items-center gap-2 pt-1 w-full justify-center">
                <Link
                  href="/collections/1"
                  onClick={close}
                  className="btn text-xs py-2.5 px-6 tracking-widest uppercase font-bold bg-black text-white hover:bg-neutral-800"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="flex flex-col items-center gap-3 w-full">
              <h2 className="heading text-[20px] md:text-[22px] leading-tight text-black">
                Welcome Back to Sillhouete
              </h2>
              <p className="text-xs text-black/70 max-w-sm mb-1">
                Enter your credentials to access your order history and saved wishlist.
              </p>
              <div className="w-full space-y-2 text-left">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-black/60 mb-0.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full border border-black/20 p-2 text-xs outline-none focus:border-black font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-black/60 mb-0.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full border border-black/20 p-2 text-xs outline-none focus:border-black font-medium"
                  />
                </div>
              </div>
              {loginMsg ? (
                <p className="text-xs text-green-700 font-bold">{loginMsg}</p>
              ) : (
                <button
                  type="submit"
                  className="btn w-full mt-2 text-xs py-3 tracking-widest uppercase font-bold"
                >
                  Sign In
                </button>
              )}
              <div className="text-xs text-black/60 mt-1">
                New customer?{" "}
                <Link href="/account" onClick={close} className="underline text-black font-semibold">
                  Create account
                </Link>
              </div>
            </form>
          )}

          <Socials className="mt-4 pt-3 border-t border-black/10 w-full justify-center" />
        </div>

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center bg-white/90 text-black/70 hover:text-black rounded-full shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
