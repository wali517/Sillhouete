"use client";

import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { Lock, HelpCircle } from "lucide-react";

const STRIPE_ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: "14px",
      color: "#1a1a1a",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      "::placeholder": {
        color: "#a3a3a3",
      },
    },
    invalid: {
      color: "#dc2626",
    },
  },
};

export default function StripeCardForm() {
  return (
    <div className="space-y-3">
      <div className="relative border border-[#d9d9d9] rounded-[5px] bg-white px-3.5 pt-5 pb-2 transition-all focus-within:border-[#005bd3] focus-within:ring-1 focus-within:ring-[#005bd3]">
        <label className="absolute left-3.5 top-1.5 text-[10.5px] text-[#707070] select-none pointer-events-none">
          Card number
        </label>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardNumberElement options={STRIPE_ELEMENT_STYLE} />
          </div>
          <Lock className="w-4 h-4 text-[#707070] shrink-0 ml-2" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="relative border border-[#d9d9d9] rounded-[5px] bg-white px-3.5 pt-5 pb-2 transition-all focus-within:border-[#005bd3] focus-within:ring-1 focus-within:ring-[#005bd3]">
          <label className="absolute left-3.5 top-1.5 text-[10.5px] text-[#707070] select-none pointer-events-none">
            Expiration date (MM / YY)
          </label>
          <CardExpiryElement options={STRIPE_ELEMENT_STYLE} />
        </div>

        <div className="relative border border-[#d9d9d9] rounded-[5px] bg-white px-3.5 pt-5 pb-2 transition-all focus-within:border-[#005bd3] focus-within:ring-1 focus-within:ring-[#005bd3]">
          <label className="absolute left-3.5 top-1.5 text-[10.5px] text-[#707070] select-none pointer-events-none">
            Security code
          </label>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardCvcElement options={STRIPE_ELEMENT_STYLE} />
            </div>
            <HelpCircle className="w-4 h-4 text-[#707070] shrink-0 ml-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
