"use client";

import { useState } from "react";

export function ContactInquiryForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry");
      }

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "General Inquiry",
        message: "",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-line bg-soft p-6 md:p-8 rounded-sm shadow-sm">
      <div className="mb-6">
        <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#9b8065] block mb-1">
          Direct Customer Service
        </span>
        <h3 className="heading text-[22px] md:text-[24px]">Send Us an Inquiry</h3>
        <p className="text-xs text-black/60 mt-1">
          Have a question about an outfit, bridal booking, custom sizing, or your order? Write to us directly and our team will get back to you via email.
        </p>
      </div>

      {success ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-sm text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl">
            ✓
          </div>
          <h4 className="font-medium text-base">Inquiry Sent Successfully</h4>
          <p className="text-xs text-emerald-700 leading-relaxed max-w-md mx-auto">
            Thank you for contacting Sillhouete. Your message has been routed to our studio team, and we will reply to your email address shortly.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="mt-3 text-xs uppercase tracking-widest font-bold underline text-emerald-800 hover:text-emerald-950"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-black/75 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ayesha Khan"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-line focus:outline-none focus:border-black transition"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-black/75 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. ayesha@example.com"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-line focus:outline-none focus:border-black transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-black/75 mb-1.5">
                Phone / WhatsApp (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+92 300 1234567"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-line focus:outline-none focus:border-black transition"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-black/75 mb-1.5">
                Inquiry Topic
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-line focus:outline-none focus:border-black transition"
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Bridal Customization & Studio Appointment">Bridal Customization &amp; Studio Appointment</option>
                <option value="Order Status & Delivery Tracking">Order Status &amp; Delivery Tracking</option>
                <option value="Custom Size & Tailoring Advice">Custom Size &amp; Tailoring Advice</option>
                <option value="Exchange, Return & Policies">Exchange, Return &amp; Policies</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-black/75 mb-1.5">
              Your Message *
            </label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please provide details about your inquiry or dress of interest..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-line focus:outline-none focus:border-black transition resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-8 py-3 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-black/85 disabled:opacity-50 transition"
            >
              {submitting ? "Sending Message..." : "Submit Inquiry"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

