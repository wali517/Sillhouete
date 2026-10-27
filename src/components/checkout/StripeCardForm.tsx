"use client";

import { useState } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Lock } from "lucide-react";

const ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: "14px",
      color: "#333333",
      fontFamily: "inherit",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#ef4444" },
  },
};

interface StripeCardFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
  amount: number;
  currency: string;
  customerEmail: string;
  items: Array<{ title: string; quantity: number }>;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

export default function StripeCardForm({
  onSuccess,
  onError,
  amount,
  currency,
  customerEmail,
  items,
  isProcessing,
  setIsProcessing,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardName, setCardName] = useState("");
  const [cardError, setCardError] = useState("");

  const handlePayment = async (): Promise<boolean> => {
    if (!stripe || !elements) {
      onError("Payment not ready. Please refresh and try again.");
      return false;
    }

    setCardError("");
    setIsProcessing(true);

    try {
      // 1. Create payment intent on server
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, items, customerEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment initialization failed");

      const { clientSecret, isLiveOrTestKey } = data;

      // 2. If not a real Stripe key (mock mode), skip confirmation
      if (!isLiveOrTestKey) {
        // Mock success for demo without real keys
        onSuccess(`pi_mock_${Date.now()}`);
        return true;
      }

      // 3. Confirm card payment using Stripe Elements
      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) {
        throw new Error("Card element not found. Please refresh.");
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: cardName || customerEmail,
            email: customerEmail,
          },
        },
      });

      if (error) {
        throw new Error(error.message || "Card payment failed");
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
        return true;
      }

      throw new Error("Payment did not complete. Please try again.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      setCardError(msg);
      onError(msg);
      setIsProcessing(false);
      return false;
    }
  };

  // Expose handlePayment to parent via a ref-free pattern
  // Parent calls this via the form submit
  (StripeCardForm as { _currentHandler?: () => Promise<boolean> })._currentHandler = handlePayment;

  return (
    <div className="border-t border-neutral-200 bg-[#fbfbfb] p-4 space-y-3">
      {/* Card Number */}
      <div className="relative">
        <div className="w-full h-11 px-3.5 pr-10 border border-neutral-300 rounded-[5px] bg-white flex items-center focus-within:border-[#005bd3] focus-within:ring-1 focus-within:ring-[#005bd3] transition-all">
          <CardNumberElement className="w-full" options={ELEMENT_STYLE} />
        </div>
        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-11 px-3.5 border border-neutral-300 rounded-[5px] bg-white flex items-center focus-within:border-[#005bd3] focus-within:ring-1 focus-within:ring-[#005bd3] transition-all">
          <CardExpiryElement className="w-full" options={ELEMENT_STYLE} />
        </div>
        <div className="h-11 px-3.5 border border-neutral-300 rounded-[5px] bg-white flex items-center focus-within:border-[#005bd3] focus-within:ring-1 focus-within:ring-[#005bd3] transition-all">
          <CardCvcElement className="w-full" options={ELEMENT_STYLE} />
        </div>
      </div>

      {/* Name on card */}
      <input
        type="text"
        placeholder="Name on card"
        value={cardName}
        onChange={(e) => setCardName(e.target.value)}
        className="w-full h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] bg-white"
      />

      {cardError && (
        <p className="text-xs text-red-600 mt-1">{cardError}</p>
      )}

      <p className="text-[11px] text-neutral-500 flex items-center gap-1">
        <Lock className="h-3 w-3" />
        Secured by Stripe. Test card: 4242 4242 4242 4242
      </p>
    </div>
  );
}
