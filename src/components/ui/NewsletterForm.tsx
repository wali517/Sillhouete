"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

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
      // Send to contact API to record newsletter lead in backend
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter Subscriber",
          email: cleanEmail,
          subject: "Newsletter Subscription",
          message: `Subscribed to newsletter on ${new Date().toLocaleDateString()}`,
        }),
      });

      setStatus("done");
      setMessage("Thank you for subscribing! Welcome to the Sillhouete inner circle.");
      setEmail("");
    } catch {
      setStatus("done");
      setMessage("Thank you for subscribing! You will receive our latest collections.");
      setEmail("");
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <label htmlFor={id} className="sr-only">
        Enter your email
      </label>
      <div className="flex border border-black/20 focus-within:border-black transition-colors">
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
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-black/60"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn border-0 px-5"
        >
          <span className="hidden sm:inline">
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </span>
          <ArrowRight className="h-4 w-4 sm:hidden" aria-label="Subscribe" />
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
