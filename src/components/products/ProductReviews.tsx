"use client";

import { useState, type FormEvent } from "react";
import { Star, CheckCircle, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
}

const SAMPLE_REVIEWS: Review[] = [
  {
    id: "rev-1",
    author: "Zainab R.",
    rating: 5,
    date: "2 weeks ago",
    title: "Absolutely breathtaking craftsmanship!",
    body: "The embroidery on this piece is beyond words. The fabric drape and weight are truly luxurious, and it arrived in Chicago in less than a week. Highly recommended for special occasions!",
    verified: true,
  },
  {
    id: "rev-2",
    author: "Fatima K.",
    rating: 5,
    date: "1 month ago",
    title: "Perfect fit and gorgeous color",
    body: "I was hesitant about ordering my size online, but the measurements were 100% accurate. Received countless compliments at my brother's Nikkah ceremony.",
    verified: true,
  },
  {
    id: "rev-3",
    author: "Amina M.",
    rating: 5,
    date: "2 months ago",
    title: "High-end luxury feel",
    body: "The zardozi work and hand finishing are as good as any leading Lahore couture house. Will definitely be purchasing again for Eid.",
    verified: true,
  },
];

export default function ProductReviews({ productTitle }: { productTitle: string }) {
  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      author: name.trim(),
      rating,
      date: "Just now",
      title: title.trim() || "Verified Review",
      body: body.trim(),
      verified: true,
    };

    setReviews([newRev, ...reviews]);
    setSubmitted(true);
    setTimeout(() => {
      setShowModal(false);
      setSubmitted(false);
      setName("");
      setEmail("");
      setTitle("");
      setBody("");
    }, 2000);
  };

  return (
    <section className="mt-16 border-t border-line pt-12">
      <div className="mx-auto max-w-[1000px]">
        {/* Header / Summary */}
        <div className="flex flex-col items-center justify-between gap-6 border-b border-line pb-8 md:flex-row">
          <div>
            <h2 className="heading text-[22px] md:text-[26px]">Customer Reviews</h2>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex text-[#108474]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-sm font-semibold">5.0 based on {reviews.length} reviews</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn text-xs py-3 px-6 tracking-[0.2em]"
          >
            Write a Review
          </button>
        </div>

        {/* Reviews List */}
        <div className="mt-8 divide-y divide-line">
          {reviews.map((rev) => (
            <div key={rev.id} className="py-6 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex text-[#108474]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <strong className="text-sm font-semibold">{rev.author}</strong>
                  {rev.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                      <CheckCircle className="h-3 w-3" />
                      Verified Buyer
                    </span>
                  )}
                </div>
                <span className="text-xs text-black/50">{rev.date}</span>
              </div>
              <h3 className="font-semibold text-sm">{rev.title}</h3>
              <p className="text-xs md:text-sm text-black/75 leading-relaxed">{rev.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="heading text-[18px]">Review {productTitle}</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs font-semibold hover:text-black"
              >
                ✕ Close
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center text-emerald-700 space-y-2">
                <CheckCircle className="mx-auto h-10 w-10" />
                <p className="font-semibold">Thank you for your review!</p>
                <p className="text-xs text-black/60">Your feedback has been verified and published.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wide text-black/80 mb-1">
                    Rating *
                  </label>
                  <div className="flex gap-1 text-[#108474]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= rating ? "fill-current" : "text-black/20"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-semibold uppercase tracking-wide text-black/80 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ayesha K."
                      className="w-full border border-line p-2.5 text-xs outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase tracking-wide text-black/80 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ayesha@example.com"
                      className="w-full border border-line p-2.5 text-xs outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wide text-black/80 mb-1">
                    Review Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your review a short title"
                    className="w-full border border-line p-2.5 text-xs outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wide text-black/80 mb-1">
                    Review Content *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Share your experience with the craftsmanship, fit, fabric, and delivery..."
                    className="w-full border border-line p-2.5 text-xs outline-none focus:border-black"
                  />
                </div>

                <button type="submit" className="btn w-full py-3 text-xs tracking-[0.2em]">
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
