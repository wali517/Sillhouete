"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  date: string;
  text: string;
  image?: string;
  productName: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Israt Sufian",
    location: "London, UK",
    rating: 5,
    date: "1 week ago",
    text: "I got so many compliments on my dress! The quality and details are amazing. Thank you Sillhouete for the timely delivery and excellent customer service.",
    image: "https://sillhouete.com/cdn/shop/files/7_a8eeb295-8bc2-4eeb-b6ae-222a009ecfa3.jpg?v=1778077595",
    productName: "Aurene Luxury Formal",
  },
  {
    name: "Bibi Fatima Hedari",
    location: "Toronto, Canada",
    rating: 5,
    date: "2 weeks ago",
    text: "The packaging, fabric, and handwork were absolutely stunning. Delivered right on time for the wedding event. The fit was true to size and the colors were so rich.",
    image: "https://sillhouete.com/cdn/shop/files/1000x1500_0006_052A6061.jpg?v=1758177457",
    productName: "Iris Royal Blue Sharara",
  },
  {
    name: "Jovaria Naeem",
    location: "Lahore, Pakistan",
    rating: 5,
    date: "3 weeks ago",
    text: "Exceeded my expectations! Sillhouete is now my go-to brand for Pakistani luxury wear. The zardozi embroidery and custom slip fit were perfection.",
    image: "https://sillhouete.com/cdn/shop/files/DSC01646_00a12cf2-4bc0-4e12-b5e1-5dbd8a1db560.jpg?v=1778077594",
    productName: "Solara Embroidered Formal",
  },
  {
    name: "Caitlin Hartley",
    location: "Manchester, UK",
    rating: 5,
    date: "1 month ago",
    text: "Ordered from the UK and received it in 4 days via DHL Express. Absolutely gorgeous outfit, fits impeccably! Everyone at the party was asking where I got it.",
    image: "https://sillhouete.com/cdn/shop/files/DSC01736.jpg?v=1778077594",
    productName: "Nyah Mint Green Ensemble",
  },
];

export default function CustomerTestimonials() {
  const [startIndex, setStartIndex] = useState(0);

  const prev = () => {
    setStartIndex((i) => (i === 0 ? TESTIMONIALS.length - 1 : i - 1));
  };

  const next = () => {
    setStartIndex((i) => (i + 1) % TESTIMONIALS.length);
  };

  // Visible items (up to 3 on desktop)
  const visible = [
    TESTIMONIALS[startIndex],
    TESTIMONIALS[(startIndex + 1) % TESTIMONIALS.length],
    TESTIMONIALS[(startIndex + 2) % TESTIMONIALS.length],
  ];

  return (
    <section className="my-16 border-t border-black/10 pt-12">
      <div className="mx-auto max-w-[1300px] px-4">
        {/* Header matching real site */}
        <div className="text-center mb-10">
          <h2 className="heading text-[22px] md:text-[28px] uppercase tracking-[0.2em] text-[#111111]">
            Let Customers Speak For Us
          </h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex text-[#108474]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-4 w-4 fill-current stroke-none" />
              ))}
            </div>
            <span className="text-xs font-semibold text-black/80">
              4.9 out of 5 stars based on 85 reviews
            </span>
          </div>
        </div>

        {/* Carousel Slider */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visible.map((t, idx) => (
              <div
                key={t.name + idx}
                className="flex flex-col justify-between border border-black/10 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Stars and Verified */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-[#108474]">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current stroke-none" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle className="h-2.5 w-2.5" />
                      Verified Buyer
                    </span>
                  </div>

                  {/* Customer quote */}
                  <p className="text-xs md:text-sm text-black/80 leading-relaxed italic mb-4">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </div>

                {/* Bottom author with thumbnail */}
                <div className="pt-4 border-t border-black/5 flex items-center gap-3">
                  {t.image && (
                    <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0 border border-black/10">
                      <Image
                        src={t.image}
                        alt={t.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <strong className="block text-xs font-bold uppercase tracking-wider text-black">
                      {t.name}
                    </strong>
                    <span className="block text-[11px] text-black/55">
                      {t.location} · {t.productName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Arrows */}
          <div className="mt-8 flex justify-center items-center gap-3">
            <button
              type="button"
              onClick={prev}
              className="grid h-10 w-10 place-items-center rounded-full border border-black/20 hover:border-black hover:bg-neutral-100 transition-colors"
              aria-label="Previous review"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="grid h-10 w-10 place-items-center rounded-full border border-black/20 hover:border-black hover:bg-neutral-100 transition-colors"
              aria-label="Next review"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
