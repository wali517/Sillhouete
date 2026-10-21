"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";

export default function ContactFormSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill out your name, email, and message.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit message");
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded border border-emerald-300 bg-emerald-50 p-6 text-center space-y-3">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h3 className="heading text-[18px] text-emerald-900">Message Received</h3>
        <p className="text-xs text-emerald-800">
          Thank you for reaching out to Sillhouete. Our concierge team has received your inquiry and will respond within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="btn btn-outline text-xs mt-3 py-2 px-4"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
          Full Name *
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ayesha Khan"
          className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ayesha@example.com"
            className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
            Phone / WhatsApp
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 331 0397865"
            className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Bridal Consultation / Order Inquiry"
          className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
          Your Message *
        </label>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we assist you with our designer dresses or custom tailoring?"
          className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded border border-sale/40 bg-sale/5 p-3 text-xs text-sale font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn w-full py-3.5 text-xs tracking-[0.25em] flex items-center justify-center gap-2"
      >
        <Send className="h-3.5 w-3.5" />
        <span>{loading ? "Sending Message..." : "Submit Inquiry"}</span>
      </button>
    </form>
  );
}
