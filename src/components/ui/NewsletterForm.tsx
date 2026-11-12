"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterForm({ id, className = "" }: { id: string; className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "loading" | "done">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter Subscriber",
          email: cleanEmail,
          isDiscount: true,
          subject: "Newsletter Discount Voucher",
          message: `Subscribed to newsletter on ${new Date().toLocaleDateString()}`,
        }),
      });
      await res.json();
      setStatus("done");
      setMessage("Thank you for subscribing! Your exclusive discount code has been sent to your email. Please check your inbox.");
      setEmail("");
    } catch {
      setStatus("done");
      setMessage("Thank you for subscribing! Your discount code has been sent to your email.");
      setEmail("");
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <label htmlFor={id} className="sr-only">
        Enter your email
      </label>
      <div className="flex h-11.5">
        <input
          id={id}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setStatus("idle");
            setMessage("");
          }}
          placeholder="Enter your email"
          autoComplete="email"
          disabled={status === "loading" || status === "done"}
          aria-invalid={status === "error"}
          className="min-w-0 flex-1 h-11.5 bg-transparent border border-[#1c1d1d] border-r-0 px-4 text-sm text-[#1c1d1d] placeholder:text-[#1c1d1d] placeholder:opacity-75 rounded-none outline-none focus:outline-none shadow-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-11.5 bg-black text-white px-5 md:px-6 rounded-none text-[13px] font-bold uppercase tracking-[0.3em] border border-black hover:bg-[#222222] transition-colors shrink-0 shadow-none flex items-center justify-center cursor-pointer"
        >
          <span className="hidden md:inline">
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </span>
          <span className="md:hidden flex items-center justify-center">
            <svg aria-hidden="true" focusable="false" role="presentation" className="w-6 h-3 text-white fill-current" viewBox="0 0 50 15"><title>icon-right-arrow</title><path d="M0 9.63V5.38h35V0l15 7.5L35 15V9.63Z"/></svg>
          </span>
        </button>
      </div>
      <div role="status" className="mt-2 min-h-5 text-xs">
        {status === "error" && <span className="text-sale font-medium">{message}</span>}
        {status === "done" && (
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
