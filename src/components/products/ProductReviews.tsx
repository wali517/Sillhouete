"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Star, Check } from "lucide-react";

interface ReviewItem {
  id: string;
  name: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "r1",
    name: "Anu",
    rating: 5,
    date: "10/12/2024",
    title: "Gorgeous outfit ! Such a beautiful soothing colour",
    body: "Gorgeous outfit ! Such a beautiful soothing colour. The handwork and stitching exceeded my expectations completely.",
    verified: true,
  },
  {
    id: "r2",
    name: "Laiba",
    rating: 5,
    date: "09/28/2024",
    title: "I loved my dress",
    body: "I loved my dress, the quality of the fabric and work was to the point. Will definitely order again for my family as well.",
    verified: true,
  },
  {
    id: "r3",
    name: "Anonymous",
    rating: 5,
    date: "09/15/2024",
    title: "Beautiful dress",
    body: "Beautiful dress. They have great customer service and answered all my questions on WhatsApp promptly.",
    verified: true,
  },
];

export default function ProductReviews({ productTitle }: { productTitle: string }) {
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;

    const newRev: ReviewItem = {
      id: `r-${Date.now()}`,
      name: name.trim(),
      rating,
      date: "Today",
      title: title.trim() || "Customer Review",
      body: body.trim(),
      verified: true,
    };

    setReviews([newRev, ...reviews]);
    setSubmitted(true);
    setTimeout(() => {
      setShowForm(false);
      setSubmitted(false);
      setName("");
      setEmail("");
      setTitle("");
      setBody("");
    }, 2200);
  };

  return (
    <section className="mt-16 border-t border-black/10 pt-12 font-serif text-black">
      <div className="mx-auto max-w-[1100px] px-4">
        {/* CUSTOMER REVIEWS Title */}
        <h2 className="text-center font-serif text-[20px] md:text-[24px] uppercase tracking-[0.2em] font-semibold text-[#111111] mb-8">
          Customer Reviews
        </h2>

        {/* Top Summary Bar matching frame_21_42.0s.jpg */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-10">
          {/* Left: Star rating & Be the first to write a review */}
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex gap-1 text-[#108474]">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className="h-4 w-4 fill-none stroke-[#108474] stroke-2"
                  viewBox="0 0 24 24"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-[12px] text-black/70 mt-1 font-sans">
              Be the first to write a review
            </span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-10 w-px bg-neutral-300" />

          {/* Right: Write a review Button in #108474 */}
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="bg-[#108474] hover:bg-[#0c6b5e] text-white px-8 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-none cursor-pointer font-sans shadow-none"
          >
            Write a review
          </button>
        </div>

        {/* Interactive Write a review Form Dropdown */}
        {showForm && (
          <div className="mb-12 border border-neutral-300 bg-neutral-50 p-6 max-w-xl mx-auto text-xs font-sans">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-black">
                Write a review for {productTitle}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs text-neutral-500 hover:text-black cursor-pointer font-bold"
              >
                ✕ Cancel
              </button>
            </div>

            {submitted ? (
              <div className="py-6 text-center text-[#108474] font-medium">
                Thank you! Your review has been submitted successfully.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Rating
                  </label>
                  <div className="flex gap-1 text-[#108474]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            star <= rating ? "fill-[#108474]" : "text-neutral-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Display Name"
                      className="w-full border border-neutral-300 bg-white p-2 text-xs outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      className="w-full border border-neutral-300 bg-white p-2 text-xs outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Review Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your review a title"
                    className="w-full border border-neutral-300 bg-white p-2 text-xs outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Review Content *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Start writing here..."
                    className="w-full border border-neutral-300 bg-white p-2 text-xs outline-none focus:border-black"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#108474] hover:bg-[#0c6b5e] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        )}

        {/* Reviews List */}
        <div className="divide-y divide-neutral-200 border-t border-neutral-200">
          {reviews.map((r) => (
            <div key={r.id} className="py-6 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex text-[#108474]">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#108474] text-[#108474]" />
                  ))}
                </div>
                <span className="text-xs font-bold text-black">{r.name}</span>
                {r.verified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 font-sans font-medium">
                    <Check className="h-3 w-3" />
                    Verified
                  </span>
                )}
                <span className="text-[11px] text-neutral-400 font-sans ml-auto">{r.date}</span>
              </div>
              <h4 className="font-bold text-xs uppercase tracking-wide text-black pt-1">
                {r.title}
              </h4>
              <p className="text-xs text-neutral-700 leading-relaxed font-sans">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
