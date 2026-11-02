"use client";

import { useState, useEffect, useRef, useCallback, type TouchEvent } from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  name: string;
  rating: number;
  title?: string;
  text: string;
  image?: string;
}

// Exactly matching Image 1 from user screenshot & authentic Sillhouete customer reviews
const TESTIMONIALS: Testimonial[] = [
  {
    name: "Salma Jabeen",
    rating: 5,
    title: "Great experience",
    text: "Great experience, good quality,...",
    image:
      "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/sillhouete-formal-dress-ayzel-ivory-delicate-embroidery_70x70.jpg?v=1768978410",
  },
  {
    name: "ISRAT SUFIAN",
    rating: 5,
    title: "Beautiful",
    text: "Beautiful outfit",
    image:
      "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/sillhouete-formal-dress-layal-red-exquisite-embroidery-front_70x70.jpg?v=1768978807",
  },
  {
    name: "bibi fatima hedari",
    rating: 5,
    title: "🥰 🫰",
    text: "🤩 🌸",
    image:
      "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/sillhouete-formal-iris-royal-blue-intricate-embroidery_70x70.jpg?v=1776742287",
  },
  {
    name: "Laiba",
    rating: 5,
    title: "Loved my dress",
    text: "I loved my dress, the quality of the fabric and work was to the point. Will definitely order again for my family as well.",
    image:
      "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/webimages_0038_DSC07835_70x70.jpg?v=1767273372",
  },
  {
    name: "Anonymous",
    rating: 5,
    title: "Beautiful dress",
    text: "Beautiful dress. They have great customer service",
  },
  {
    name: "Anu",
    rating: 5,
    title: "Gorgeous outfit !",
    text: "Gorgeous outfit ! Such a beautiful soothing colour. The stitching and hand embellishments are so refined and exquisite.",
    image:
      "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/sillhouete-formal-dress-Noah-mint-green-Sequins-front_70x70.jpg?v=1769436697",
  },
  {
    name: "Jovaria Naeem",
    rating: 5,
    title: "Very chic outfit",
    text: "Loved the outfit, very chic, looks exactly like in picture! Sillhouete customer care on WhatsApp was super supportive.",
    image:
      "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/web_images_0006_2_70x70.jpg?v=1758812672",
  },
  {
    name: "Caitlin Hartley",
    rating: 5,
    title: "Excellent fit",
    text: "Beautifully made with an excellent fit! The delivery was fast and hassle-free, and I can't wait to wear it to my sister's wedding.",
    image:
      "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/webimages_0077_DSC07132_70x70.jpg?v=1767278193",
  },
  {
    name: "Rida Aslam",
    rating: 5,
    title: "Premium velvet finish",
    text: "The dress colour is nice with beautiful embellishments. Premium velvet finish and top tier craftsmanship. Thank you!",
    image:
      "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/5_70x70.jpg?v=1758105373",
  },
];

export default function CustomerTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const total = TESTIMONIALS.length;

  // Manual Click: Slides ONE by ONE ("wo jab slide karta ha to slide hoti ha one by one")
  const nextOne = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevOne = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  // Auto Timer: After some time, slides THREE by THREE ("wasa kuch time bad tino slide ho jati ha")
  const nextThree = useCallback(() => {
    setCurrentIndex((prev) => (prev + 3) % total);
  }, [total]);

  // Auto slide interval: on mobile advances by 1, on desktop advances by 3
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        nextOne();
      } else {
        nextThree();
      }
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, nextOne, nextThree]);

  // Touch Swipe on mobile
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextOne();
      } else {
        prevOne();
      }
    }
  };

  // We render 3 items visible at a time on desktop, 1 on mobile
  // Creating circular triple array for seamless wrap-around rendering
  const extendedList = [...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS];
  const activeOffset = total + currentIndex;

  return (
    <section
      className="my-16 pt-10 bg-white select-none overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-[1240px] px-4">
        {/* Title & Overall Rating matching Screenshot 1 */}
        <div className="text-center mb-10">
          <h2 className="font-serif text-[20px] md:text-[24px] uppercase tracking-[0.2em] font-bold text-[#111111]">
            LET CUSTOMERS SPEAK FOR US
          </h2>

          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[#108474]">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-4 w-4 fill-[#108474] stroke-none" />
            ))}
          </div>

          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[12.5px] font-sans text-neutral-700">
            <span>from 62 reviews</span>
            {/* Teal checkmark in square icon matching Screenshot 1 */}
            <svg
              className="h-3.5 w-3.5 text-[#108474] fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-9 14-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
          </div>
        </div>

        {/* Sliding Carousel Track (Smooth horizontal slide transition) */}
        <div
          className="relative w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Track on Desktop (shifts by 33.333% per step) */}
          <div
            className="hidden md:flex transition-transform duration-600 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              transform: `translateX(-${(activeOffset * 100) / 3}%)`,
            }}
          >
            {extendedList.map((item, idx) => (
              <div
                key={`desk-${idx}-${item.name}`}
                className="w-1/3 shrink-0 px-6 flex flex-col items-center justify-start text-center"
              >
                {/* 5 solid teal stars */}
                <div className="flex items-center justify-center gap-1 text-[#108474] mb-2.5">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#108474] stroke-none" />
                  ))}
                </div>

                {/* Review Title (bold) */}
                {item.title && (
                  <h3 className="font-bold text-[14px] text-black mb-1.5 font-serif min-h-[22px]">
                    {item.title}
                  </h3>
                )}

                {/* Review Body */}
                <p className="text-[13px] text-neutral-700 leading-relaxed max-w-[300px] mx-auto font-sans mb-3 min-h-[40px]">
                  {item.text}
                </p>

                {/* Author Name */}
                <span className="text-[12px] text-neutral-500 font-serif mb-2.5">
                  {item.name}
                </span>

                {/* Product Dress Thumbnail (Centered below author, clean rectangular frame) */}
                {item.image ? (
                  <div className="relative h-[56px] w-[38px] border border-neutral-200 overflow-hidden shrink-0 mt-1 shadow-2xs">
                    <Image
                      src={item.image}
                      alt={`${item.name} dress`}
                      fill
                      sizes="38px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-[56px] w-[38px] mt-1" />
                )}
              </div>
            ))}
          </div>

          {/* Track on Mobile (shifts by 100% per step) */}
          <div
            className="flex md:hidden transition-transform duration-600 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              transform: `translateX(-${activeOffset * 100}%)`,
            }}
          >
            {extendedList.map((item, idx) => (
              <div
                key={`mob-${idx}-${item.name}`}
                className="w-full shrink-0 px-4 flex flex-col items-center justify-start text-center"
              >
                {/* 5 solid teal stars */}
                <div className="flex items-center justify-center gap-1 text-[#108474] mb-2.5">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#108474] stroke-none" />
                  ))}
                </div>

                {/* Review Title */}
                {item.title && (
                  <h3 className="font-bold text-[14px] text-black mb-1.5 font-serif">
                    {item.title}
                  </h3>
                )}

                {/* Review Body */}
                <p className="text-[13px] text-neutral-700 leading-relaxed max-w-[300px] mx-auto font-sans mb-3">
                  {item.text}
                </p>

                {/* Author Name */}
                <span className="text-[12px] text-neutral-500 font-serif mb-2.5">
                  {item.name}
                </span>

                {/* Product Dress Thumbnail */}
                {item.image && (
                  <div className="relative h-[56px] w-[38px] border border-neutral-200 overflow-hidden shrink-0 mt-1 shadow-2xs">
                    <Image
                      src={item.image}
                      alt={`${item.name} dress`}
                      fill
                      sizes="38px"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Centered Chevron Arrows matching Screenshot 1 */}
        <div className="mt-8 flex justify-center items-center gap-4 text-neutral-300">
          <button
            type="button"
            onClick={prevOne}
            className="p-1.5 text-neutral-400 hover:text-black transition-colors cursor-pointer"
            aria-label="Previous customer review"
          >
            <ChevronLeft className="h-6 w-6 stroke-[1.8]" />
          </button>
          <button
            type="button"
            onClick={nextOne}
            className="p-1.5 text-neutral-400 hover:text-black transition-colors cursor-pointer"
            aria-label="Next customer review"
          >
            <ChevronRight className="h-6 w-6 stroke-[1.8]" />
          </button>
        </div>
      </div>
    </section>
  );
}
