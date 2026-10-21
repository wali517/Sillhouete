"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Do you deliver worldwide?",
    answer: "Yes, we deliver all over the world including the USA, UK, Canada, UAE, Saudi Arabia, Australia, and Europe via DHL Express and FedEx.",
  },
  {
    question: "What is your delivery time?",
    answer: "Ready-to-deliver orders take 3-5 business days across Pakistan through registered courier services. International deliveries arrive within 7-14 business days after dispatch. For Bridal Wear and custom Made-to-Order articles, delivery times are determined after reviewing your custom requirements and wedding date.",
  },
  {
    question: "How can I make a payment?",
    answer: "We accept payments directly on our website via Credit/Debit Cards (Visa, MasterCard, American Express powered securely by Stripe), Cash on Delivery (available within Pakistan), Direct Bank Transfer (HBL / Meezan Bank), and Zelle for USA clients.",
  },
  {
    question: "How can I cancel my order?",
    answer: "Ready-to-deliver orders can be cancelled within 24 hours of purchase before they are shipped (subject to 10% processing fee). Made-to-order and bespoke bridal articles cannot be cancelled once the advance deposit is paid, as fabrics and artisans are dedicated immediately.",
  },
  {
    question: "How do you confirm shipping time for made-to-order?",
    answer: "Our bridal concierge team will connect with you via WhatsApp or phone right after receiving your order to confirm your exact measurements, color preferences, and schedule a delivery timeline aligned with your celebrations.",
  },
  {
    question: "How do I choose my size?",
    answer: "Please refer to our Size Guide on each product page. If your body measurements do not align with standard sizes (XS to XL), simply choose 'Custom Size' and enter your measurements in the order instructions box at checkout or WhatsApp them to us (+92 331 0397865).",
  },
  {
    question: "Can I visit your studio for bridal consultations?",
    answer: "Yes! You are warmly welcome to visit our studio at Sillhouete, Almas Tower, MM Alam Rd, Block T, Gulberg 2, Lahore. We recommend scheduling an appointment in advance via phone or WhatsApp (+92 331 0397865 / +92 315 4204981).",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="border border-line divide-y divide-line">
      {FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={faq.question} className="bg-white">
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-soft"
            >
              <span className="font-semibold text-sm md:text-base text-black pr-4">
                {faq.question}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 text-black/70 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-black/75 leading-relaxed bg-soft/50 border-t border-line/40">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
