"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import Image from "next/image";
import { Star, CheckCircle2, ChevronDown, Trash2, User, CheckSquare } from "lucide-react";

export interface ReviewItem {
  id: string;
  name: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
  images?: string[];
}

// Exactly matching Image 2 from live site
export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    name: "Anonymous",
    rating: 5,
    date: "06/05",
    title: "Very Pretty as shown in",
    body: "Very Pretty as shown in picture",
    verified: true,
  },
];

export default function ProductReviews({ productTitle }: { productTitle: string }) {
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [sortOrder, setSortOrder] = useState<"recent" | "highest" | "lowest">("recent");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setMediaFiles((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (idx: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      name: name.trim(),
      rating: rating || 5,
      date: "Just now",
      title: title.trim() || "Customer Review",
      body: body.trim(),
      verified: true,
      images: mediaFiles.length > 0 ? [...mediaFiles] : undefined,
    };

    setReviews([newRev, ...reviews]);
    setSubmitted(true);

    setTimeout(() => {
      setShowForm(false);
      setSubmitted(false);
      setTitle("");
      setBody("");
      setName("");
      setEmail("");
      setRating(5);
      setMediaFiles([]);
    }, 2000);
  };

  const totalReviews = reviews.length;
  const currentScore =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(2)
      : "5.00";

  // Histogram counts
  const starCounts = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { stars, count, pct };
  });

  return (
    <section id="judgeme_product_reviews" className="mt-16 pt-10 text-[#111111]">
      <div className="mx-auto max-w-[1080px] px-4">
        {/* CUSTOMER REVIEWS Header (Centered uppercase serif font) */}
        <h2 className="text-center font-serif text-[22px] md:text-[24px] uppercase tracking-[0.2em] font-bold text-[#111111] mb-8">
          Customer Reviews
        </h2>

        {/* Top Summary Bar - Exactly matching Image 2 */}
        <div className="flex flex-col md:flex-row items-center justify-between border-y border-[#e8e8e1] py-6 gap-6">
          {/* Col 1: Star Rating + Based on reviews + Checkmark */}
          <div className="flex flex-col items-center md:items-start justify-center flex-1 py-1 text-center md:text-left">
            <div className="flex items-center gap-2">
              <div className="flex text-[#108474]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-[#108474] stroke-none" />
                ))}
              </div>
              <span className="text-[13px] font-bold text-black font-sans">
                {currentScore} out of 5
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-neutral-600 font-sans">
              <span>Based on {totalReviews} review{totalReviews > 1 ? "s" : ""}</span>
              <svg className="h-3.5 w-3.5 text-[#108474] fill-current" viewBox="0 0 24 24">
                <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-9 14-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
            </div>
          </div>

          {/* Col 2: Histogram Bars matching Image 2 */}
          <div className="w-full max-w-[280px] space-y-1.5 font-sans text-[11px] text-neutral-600">
            {starCounts.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-2">
                <div className="flex text-[#108474] shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${
                        s <= stars ? "fill-[#108474] stroke-none" : "stroke-[#108474] stroke-[1.2] fill-none"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex-1 h-2 bg-[#eeeeee] overflow-hidden rounded-[1px]">
                  <div
                    className="h-full bg-[#108474] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-3 text-right text-[11px] text-neutral-500 font-sans">{count}</span>
              </div>
            ))}
          </div>

          {/* Col 3: Write a review button matching Image 2 */}
          <div className="w-full md:w-auto flex items-center justify-center md:justify-end flex-1 md:border-l md:border-[#e8e8e1] py-2 md:pl-8">
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="w-full sm:w-auto text-center bg-[#108474] hover:bg-[#0c6b5e] text-white px-8 py-2.5 text-[13px] font-medium tracking-wide transition-colors rounded-[2px] cursor-pointer font-sans shadow-xs shrink-0"
            >
              {showForm ? "Cancel review" : "Write a review"}
            </button>
          </div>
        </div>

        {/* Write A Review Form - Opened when user clicks button */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-10 mx-auto max-w-[720px] space-y-6 pt-4 animate-fade-in border-b border-[#e8e8e1] pb-10"
          >
            <h3 className="text-center font-serif text-[22px] md:text-[26px] font-normal text-[#111111] mb-6">
              Write a review
            </h3>

            {/* RATING */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <label className="text-center font-serif text-[11px] font-bold uppercase tracking-[0.25em] text-[#111111]">
                Rating
              </label>
              <div className="flex gap-2 text-[#108474] cursor-pointer">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          filled
                            ? "fill-[#108474] text-[#108474]"
                            : "stroke-[#108474] stroke-[1.6] fill-none"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* REVIEW TITLE */}
            <div className="space-y-1.5">
              <label className="block text-center font-serif text-[11px] font-bold uppercase tracking-[0.22em] text-[#111111]">
                Review Title <span className="font-normal text-neutral-400 font-sans">(100)</span>
              </label>
              <input
                type="text"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your review a title"
                className="w-full h-[44px] px-3.5 border border-[#108474] bg-white text-[13px] text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#108474]"
              />
            </div>

            {/* REVIEW CONTENT */}
            <div className="space-y-1.5">
              <label className="block text-center font-serif text-[11px] font-bold uppercase tracking-[0.22em] text-[#111111]">
                Review Content
              </label>
              <textarea
                rows={5}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Start writing here..."
                className="w-full p-3.5 border border-[#d1d5db] focus:border-[#108474] bg-white text-[13px] text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#108474]"
              />
            </div>

            {/* PICTURE/VIDEO (OPTIONAL) */}
            <div className="space-y-2">
              <label className="block text-center font-serif text-[11px] font-bold uppercase tracking-[0.22em] text-[#111111]">
                Picture/Video (Optional)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mx-auto flex h-28 w-28 flex-col items-center justify-center border border-[#d1d5db] hover:border-[#108474] bg-white cursor-pointer transition-colors"
                role="button"
                tabIndex={0}
                aria-label="Upload photo or video"
              >
                <div className="text-neutral-600">
                  <svg
                    className="h-10 w-10 stroke-current text-neutral-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {mediaFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {mediaFiles.map((src, i) => (
                    <div key={i} className="relative h-16 w-16 border border-neutral-300 overflow-hidden">
                      {src.startsWith("data:video") ? (
                        <video src={src} className="h-full w-full object-cover" />
                      ) : (
                        <Image src={src} alt="Uploaded preview" fill className="object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute top-0 right-0 bg-black/70 p-0.5 text-white hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DISPLAY NAME */}
            <div className="space-y-1.5">
              <label className="block text-center font-serif text-[11px] font-bold uppercase tracking-[0.22em] text-[#111111]">
                Display Name <span className="font-normal text-neutral-500 font-sans">(Displayed Publicly like <span className="text-[#108474]">John Smith <ChevronDown className="inline h-3 w-3" /></span> )</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Display name"
                className="w-full h-[44px] px-3.5 border border-[#d1d5db] focus:border-[#108474] bg-white text-[13px] text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#108474]"
              />
            </div>

            {/* EMAIL ADDRESS */}
            <div className="space-y-1.5">
              <label className="block text-center font-serif text-[11px] font-bold uppercase tracking-[0.22em] text-[#111111]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full h-[44px] px-3.5 border border-[#d1d5db] focus:border-[#108474] bg-white text-[13px] text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#108474]"
              />
            </div>

            {/* Disclaimer Text */}
            <p className="text-center text-[11.5px] leading-relaxed text-neutral-600 px-4 font-sans">
              How we use your data: We&apos;ll only contact you about the review you left, and only if necessary. By submitting your review, you agree to Judge.me&apos;s terms, privacy and content policies.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-[#108474] text-[#108474] hover:bg-[#108474]/5 px-8 py-2.5 text-[13px] font-medium tracking-wide transition-colors rounded-[2px] cursor-pointer font-sans bg-white"
              >
                Cancel review
              </button>
              <button
                type="submit"
                className="bg-[#108474] hover:bg-[#0c6b5e] text-white px-8 py-2.5 text-[13px] font-medium tracking-wide transition-colors rounded-[2px] cursor-pointer font-sans shadow-xs"
              >
                Submit Review
              </button>
            </div>

            {submitted && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Thank you! Your review for {productTitle} has been submitted.</span>
              </div>
            )}
          </form>
        )}

        {/* Filter Dropdown Row matching Image 2 */}
        <div className="py-4 border-b border-[#e8e8e1]">
          <button
            type="button"
            className="flex items-center gap-1.5 text-[13px] text-[#108474] font-sans hover:text-[#0c6b5e] cursor-pointer"
          >
            <span>Most Recent</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#108474]" />
          </button>
        </div>

        {/* Existing Reviews List - Matching Image 2 */}
        <div className="space-y-6 pt-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="border-b border-[#e8e8e1] pb-6 space-y-2">
              {/* Row 1: Star Rating on Left + Date on Right matching Image 2 */}
              <div className="flex items-center justify-between">
                <div className="flex text-[#108474]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < rev.rating
                          ? "fill-[#108474] text-[#108474]"
                          : "stroke-[#108474] stroke-[1.4] fill-none"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[12px] text-neutral-400 font-sans">
                  {rev.date}
                </span>
              </div>

              {/* Row 2: Author Row with Avatar Badge, Name, and Verified pill matching Image 2 */}
              <div className="flex items-center gap-2 pt-0.5">
                  {/* User Icon Badge matching Image 2 */}
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                    <User className="h-4 w-4" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#108474] text-white">
                      <svg className="h-2 w-2 fill-current" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    </span>
                  </div>

                  <strong className="text-[13px] font-bold text-black font-sans">
                    {rev.name}
                  </strong>

                  {rev.verified && (
                    <span className="rounded-[2px] bg-[#108474] px-1.5 py-0.5 text-[10.5px] font-bold text-white uppercase tracking-wider font-sans">
                      Verified
                    </span>
                  )}
                </div>

              {/* Title matching Image 2: "Very Pretty as shown in" */}
              {rev.title && (
                <h4 className="font-bold text-[13.5px] text-black font-sans pt-1">
                  {rev.title}
                </h4>
              )}

              {/* Body matching Image 2: "Very Pretty as shown in picture" */}
              <p className="text-[13px] text-neutral-700 leading-relaxed font-sans">
                {rev.body}
              </p>

              {rev.images && rev.images.length > 0 && (
                <div className="flex gap-2 pt-2">
                  {rev.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative h-16 w-16 border border-neutral-200 overflow-hidden"
                    >
                      <Image
                        src={img}
                        alt="Customer review photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
