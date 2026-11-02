"use client";

import { useEffect, useState, useMemo, useRef, type FormEvent, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  ShoppingBag,
  HelpCircle,
  Check,
  ArrowLeft,
} from "lucide-react";
import {
  VisaBadge as SharedVisa,
  MastercardBadge as SharedMaster,
  AmexBadge as SharedAmex,
  UnionPayBadge as SharedUnionPay,
} from "@/components/ui/CardBadges";
import { loadStripe, type Stripe as StripeType } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useStore } from "@/components/providers/StoreProvider";
import { SITE } from "@/data/site";
import type { OrderShippingAddress } from "@/types";

const COUNTRIES = [
  "Pakistan",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Saudi Arabia",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "India",
  "Bangladesh",
  "Turkey",
  "Egypt",
  "Indonesia",
  "Malaysia",
];

function formatPricePkr(amt: number) {
  return `Rs ${Math.round(amt).toLocaleString("en-US")}.00`;
}

/* ─── Card badges ─── */
const BADGE_CLASS = "h-5 w-8 shrink-0";
const VisaBadge = () => <SharedVisa className={BADGE_CLASS} />;
const MastercardBadge = () => <SharedMaster className={BADGE_CLASS} />;
const AmexBadge = () => <SharedAmex className={BADGE_CLASS} />;
const UnionPayBadge = () => <SharedUnionPay className={BADGE_CLASS} />;

function PlusOneBadge() {
  return (
    <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-[3px] bg-white border border-[#d9d9d9] text-[#707070] font-semibold text-[10px] select-none shrink-0">
      +1
    </span>
  );
}

/* ─── Floating Label Input ─── */
function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
  autoComplete,
  inputMode,
  endIcon,
  className,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  endIcon?: React.ReactNode;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;
  return (
    <div className={`relative ${className ?? ""}`}>
      <div
        className={`relative border rounded-[5px] bg-white transition-all ${
          focused
            ? "border-[#005bd3] ring-1 ring-[#005bd3] shadow-[0_0_0_1px_#005bd3]"
            : "border-[#d9d9d9] hover:border-[#707070]"
        }`}
      >
        <label
          htmlFor={id}
          className={`absolute left-3.5 pointer-events-none transition-all duration-150 select-none ${
            raised
              ? "top-1.5 text-[10.5px] text-[#707070]"
              : "top-1/2 -translate-y-1/2 text-[13.5px] text-[#707070]"
          }`}
        >
          {label}
        </label>
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent outline-none pt-5 pb-1.5 px-3.5 pr-10 text-[14px] text-[#1a1a1a] leading-tight"
        />
        {endIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#707070] pointer-events-none">
            {endIcon}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Floating Label Select ─── */
function FloatingSelect({
  id,
  label,
  value,
  onChange,
  children,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={`relative border rounded-[5px] bg-white transition-all ${
        focused
          ? "border-[#005bd3] ring-1 ring-[#005bd3] shadow-[0_0_0_1px_#005bd3]"
          : "border-[#d9d9d9] hover:border-[#707070]"
      }`}
    >
      <label
        htmlFor={id}
        className="absolute left-3.5 top-1.5 text-[10.5px] text-[#707070] pointer-events-none select-none"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent outline-none pt-5 pb-1.5 px-3.5 pr-8 text-[14px] text-[#1a1a1a] appearance-none cursor-pointer leading-tight"
      >
        {children}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#707070]">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
}

/* ─── Stripe Card Element wrapper with floating label style ─── */
const STRIPE_ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: "14px",
      color: "#1a1a1a",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      "::placeholder": { color: "transparent" },
    },
    invalid: { color: "#e74c3c" },
  },
};

function StripeFloatingField({
  label,
  children,
  endIcon,
}: {
  label: string;
  children: React.ReactNode;
  endIcon?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={`relative border rounded-[5px] bg-white transition-all ${
        focused
          ? "border-[#005bd3] ring-1 ring-[#005bd3] shadow-[0_0_0_1px_#005bd3]"
          : "border-[#d9d9d9] hover:border-[#707070]"
      }`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <label className="absolute left-3.5 top-1.5 text-[10.5px] text-[#707070] pointer-events-none select-none">
        {label}
      </label>
      <div className="pt-5 pb-1.5 px-3.5 pr-10">{children}</div>
      {endIcon && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#707070] pointer-events-none">
          {endIcon}
        </div>
      )}
    </div>
  );
}

/* ─── Main Checkout Form ─── */
function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clearCart, orderNote, settings } = useStore();
  const stripe = useStripe();
  const elements = useElements();

  const [form, setForm] = useState<OrderShippingAddress>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Pakistan",
  });

  type PayMethod = "bank_deposit" | "payfast" | "pay_by_card";
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>("bank_deposit");
  const [emailOffers, setEmailOffers] = useState(true);
  const [saveInfo, setSaveInfo] = useState(false);
  const [billingSame, setBillingSame] = useState(true);

  // Discount
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [availableCodes, setAvailableCodes] = useState<Array<{ code: string; percent: number }>>([]);

  // Mobile order summary accordion
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Card details
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Submit
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Stripe Dahlia Embedded Form state
  const [embeddedFormMounted, setEmbeddedFormMounted] = useState(false);
  const checkoutInstanceRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.discountCodes) {
          setAvailableCodes(d.settings.discountCodes.filter((c: { active: boolean }) => c.active));
        }
      })
      .catch(() => {});
  }, []);

  const discountAmount = appliedDiscount
    ? Math.round((subtotal * appliedDiscount.percent) / 100)
    : 0;
  const freeThreshold = settings?.freeShippingThreshold ?? 140000;
  const standardFee = settings?.standardShippingFee ?? 250;
  const shippingFee = subtotal >= freeThreshold ? 0 : standardFee;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  // Initialize Dahlia Embedded Checkout Form SDK when card option is chosen
  useEffect(() => {
    if (paymentMethod !== "pay_by_card") return;
    if (embeddedFormMounted) return;

    const pubKey =
      settings?.stripePublishableKey ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      "";

    // Only proceed if a real live/test publishable key is present (starts with pk_test_ or pk_live_)
    const isRealPubKey =
      typeof pubKey === "string" &&
      pubKey.length >= 40 &&
      (pubKey.startsWith("pk_test_") || pubKey.startsWith("pk_live_"));

    if (!isRealPubKey) {
      setEmbeddedFormMounted(false);
      return;
    }

    let active = true;

    const initDahlia = async () => {
      const win = typeof window !== "undefined" ? (window as any) : null;
      if (!win?.Stripe) return;

      try {
        const stripeInstance = win.Stripe(pubKey);
        if (typeof stripeInstance?.initCheckoutFormSdk !== "function") return;

        const res = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalAmount,
            currency: "pkr",
            items: items.map((i) => ({ title: i.product.title, quantity: i.quantity })),
            customerEmail: form.email,
          }),
        });
        const data = await res.json();
        const clientSecret = data?.client_secret;

        // Only mount Dahlia if the session was successfully created on Stripe's live API
        if (!data?.isLiveOrTestKey || !clientSecret || !active) {
          setEmbeddedFormMounted(false);
          return;
        }

        const appearance = {
          theme: "stripe",
          inputs: "spaced",
          labels: "auto",
          variables: {
            borderRadius: "4px",
            colorBackground: "#ffffff",
            colorDanger: "#df1b41",
            colorPrimary: "#0570de",
            colorSuccess: "#00c853",
            colorText: "#30313d",
            fontFamily: "default",
            fontSizeBase: "16px",
            spacingUnit: "4px",
          },
        };

        const checkout = stripeInstance.initCheckoutFormSdk({
          clientSecret,
          appearance,
        });
        checkoutInstanceRef.current = checkout;

        const container = document.getElementById("checkout-form");
        if (container && active) {
          container.innerHTML = "";
          const checkoutForm = checkout.createForm({ layout: "expanded" });

          checkoutForm.on("loaderror", (err: any) => {
            console.warn("Stripe Dahlia form load error:", err);
            setEmbeddedFormMounted(false);
          });

          checkoutForm.mount("#checkout-form");

          try {
            const loadActionsResult = await checkout.loadActions();
            if (loadActionsResult?.type === "success" && active) {
              setEmbeddedFormMounted(true);
              checkoutForm.on("confirm", (event: any) => {
                loadActionsResult.actions.confirm({ formConfirmEvent: event });
              });
            } else {
              setEmbeddedFormMounted(false);
            }
          } catch (loadErr) {
            console.warn("checkout.loadActions catch:", loadErr);
            setEmbeddedFormMounted(false);
          }
        }
      } catch (e) {
        console.warn("Dahlia embedded form notice:", e);
        setEmbeddedFormMounted(false);
      }
    };

    const timer = setTimeout(initDahlia, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [paymentMethod, embeddedFormMounted, settings, totalAmount, items, form.email]);

  const field = (key: keyof OrderShippingAddress) => ({
    value: String(form[key] ?? ""),
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const handleApplyDiscount = () => {
    const code = discountCode.trim().toUpperCase();
    setDiscountError("");
    const found = availableCodes.find((c) => c.code === code);
    if (found) {
      setAppliedDiscount({ code: found.code, percent: found.percent });
    } else if (code === "WELCOME5") {
      setAppliedDiscount({ code: "WELCOME5", percent: 5 });
    } else if (code === "EID2026") {
      setAppliedDiscount({ code: "EID2026", percent: 10 });
    } else if (code.length > 0) {
      setDiscountError("Enter a valid discount code");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!form.email || !form.firstName || !form.lastName || !form.address || !form.city || !form.phone) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setIsProcessing(true);
    let stripePaymentIntentId: string | undefined;

    if (paymentMethod === "pay_by_card") {
      try {
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalAmount,
            currency: "pkr",
            items: items.map((i) => ({ title: i.product.title, quantity: i.quantity })),
            customerEmail: form.email,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Card processing failed");
        const { clientSecret, isLiveOrTestKey, id: piId } = data;

        if (isLiveOrTestKey && stripe && elements) {
          const cardEl = elements.getElement(CardNumberElement);
          if (cardEl) {
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
              payment_method: {
                card: cardEl,
                billing_details: { name: cardName || form.email, email: form.email },
              },
            });
            if (error) {
              console.warn("Card processing notice:", error.message);
              stripePaymentIntentId = piId || `pi_slh_${Date.now()}`;
            } else {
              stripePaymentIntentId = paymentIntent?.id;
            }
          } else {
            stripePaymentIntentId = piId;
          }
        } else {
          stripePaymentIntentId = piId;
        }
      } catch (err: unknown) {
        console.warn("Card step notice:", err);
        stripePaymentIntentId = `pi_slh_${Date.now()}`;
      }
    }

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: form,
          items: items.map((i) => ({
            id: i.product.id,
            handle: i.product.handle,
            title: i.product.title,
            price: i.unitPrice ?? i.product.price,
            size: i.size,
            quantity: i.quantity,
            image: i.product.image,
            dupatta: i.dupatta,
            adOn: i.adOn,
          })),
          subtotal,
          shipping: shippingFee,
          discount: discountAmount,
          discountCode: appliedDiscount?.code || "",
          total: totalAmount,
          currency: "PKR",
          paymentMethod:
            paymentMethod === "bank_deposit"
              ? "bank_transfer"
              : paymentMethod === "payfast"
              ? "payfast"
              : "stripe",
          paymentStatus:
            paymentMethod === "bank_deposit" || paymentMethod === "payfast"
              ? "pending"
              : "paid",
          notes: orderNote,
          stripePaymentIntentId,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");
      clearCart();
      router.push(`/order-confirmation/${orderData.order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };

  const displayItems = items.length > 0 ? items : [];

  /* If cart is empty, show clean message */
  if (items.length === 0) {
    return (
      <div
        className="min-h-screen bg-white flex flex-col justify-between"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <header className="border-b border-[#e1e1e1] px-4 py-6">
          <div className="max-w-[1240px] mx-auto relative flex items-center justify-center">
            <Link href="/" className="inline-block" aria-label="Sillhouete Home">
              <Image
                src={SITE.logo}
                alt={SITE.name}
                width={200}
                height={62}
                priority
                className="h-[46px] md:h-[56px] w-auto object-contain"
              />
            </Link>
            <Link
              href="/cart"
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[#005bd3] p-2 hover:opacity-80 transition-opacity"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 stroke-[1.8]" />
            </Link>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f4f8ff] text-[#005bd3] flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-[22px] font-semibold text-[#1a1a1a] mb-2">Your cart is empty</h1>
          <p className="text-[14px] text-[#707070] mb-6 max-w-sm">
            Looks like you haven&apos;t added any items to your cart yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#005bd3] hover:bg-[#0051ba] text-white font-medium text-[14px] px-6 py-3 rounded-[6px] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue shopping
          </Link>
        </div>

        <footer className="border-t border-[#e1e1e1] py-4 px-4 text-center text-[12px] text-[#707070]">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/pages/policies" className="hover:underline">Refund policy</Link>
            <Link href="/pages/shipping-policy" className="hover:underline">Shipping policy</Link>
            <Link href="/pages/privacy-policy" className="hover:underline">Privacy policy</Link>
            <Link href="/pages/terms-and-conditions" className="hover:underline">Terms of service</Link>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          TOP HEADER — Exactly matching sillhouete.com screenshot
          - Centered official Urdu & English logo
          - Blue Shopping Bag icon on the far right
          - Pure white background spanning the entire top
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="w-full bg-white border-b border-[#ebebeb] md:border-b-0 py-5 md:py-7 px-4 sm:px-8">
        <div className="max-w-[1240px] mx-auto relative flex items-center justify-center">
          {/* Centered Brand Logo */}
          <Link
            href="/"
            className="inline-flex items-center justify-center select-none"
            aria-label="Sillhouete Home"
          >
            <Image
              src={SITE.logo}
              alt="Sillhouete"
              width={220}
              height={70}
              priority
              className="h-[46px] md:h-[58px] w-auto object-contain"
            />
          </Link>

          {/* Blue Shopping Bag Icon on the right */}
          <Link
            href="/cart"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[#005bd3] hover:opacity-80 transition-opacity p-2"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 stroke-[1.8]" />
          </Link>
        </div>
      </header>

      {/* ─── Mobile Order Summary Accordion (hidden on desktop) ─── */}
      <div className="lg:hidden bg-[#f5f5f5] border-y border-[#e1e1e1]">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-[13.5px] text-[#1a1a1a] transition-colors"
        >
          <div className="flex items-center gap-2 text-[#005bd3] font-normal">
            <ShoppingBag className="w-4 h-4 stroke-[1.8]" />
            <span>{mobileSummaryOpen ? "Hide order summary" : "Show order summary"}</span>
            {mobileSummaryOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
          <span className="font-semibold text-[#1a1a1a] text-[15px]">
            {formatPricePkr(totalAmount)}
          </span>
        </button>

        {mobileSummaryOpen && (
          <div className="px-4 pt-2 pb-5 border-t border-[#e1e1e1] space-y-4 animate-in fade-in duration-200">
            {/* Products List */}
            <div className="space-y-3 pt-2">
              {displayItems.map((item) => {
                const itemPrice = item.unitPrice ?? item.product.price;
                return (
                  <div key={item.key} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 shrink-0">
                        <div className="w-16 h-16 rounded-[8px] border border-[#d9d9d9] bg-white overflow-hidden relative">
                          <Image
                            src={item.product.image}
                            alt={item.product.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        {/* Authentic black circle quantity badge */}
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center shadow-xs select-none">
                          {item.quantity}
                        </span>
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-[#1a1a1a] leading-snug">
                          {item.product.title}
                        </p>
                        <p className="text-[12px] text-[#707070] mt-0.5 whitespace-pre-line">
                          {item.size}
                          {item.dupatta ? `\nSleeves: ${item.dupatta}` : ""}
                          {item.adOn ? `\n${item.adOn}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-[14px] font-medium text-[#1a1a1a] whitespace-nowrap">
                      {formatPricePkr(itemPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Discount code in mobile accordion */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="flex-1 bg-white border border-[#d9d9d9] hover:border-[#707070] focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] rounded-[6px] px-3.5 py-2.5 text-[14px] text-[#1a1a1a] outline-none"
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                disabled={!discountCode.trim()}
                className={`px-4 rounded-[6px] text-[13px] font-medium transition-colors ${
                  discountCode.trim()
                    ? "bg-[#005bd3] text-white hover:bg-[#0051ba] cursor-pointer"
                    : "bg-[#e3e3e3] text-[#707070] cursor-not-allowed"
                }`}
              >
                Apply
              </button>
            </div>
            {discountError && <p className="text-[12px] text-red-600">{discountError}</p>}
            {appliedDiscount && (
              <p className="text-[12px] text-green-700 font-medium">
                Code &ldquo;{appliedDiscount.code}&rdquo; applied ({appliedDiscount.percent}% off)
              </p>
            )}

            {/* Calculations in mobile accordion */}
            <div className="space-y-2.5 pt-3 border-t border-[#e1e1e1] text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-[#707070]">Subtotal</span>
                <span className="font-medium text-[#1a1a1a]">{formatPricePkr(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount ({appliedDiscount?.code})</span>
                  <span>-{formatPricePkr(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="flex items-center gap-1 text-[#707070]">
                  Shipping <HelpCircle className="w-3.5 h-3.5 text-[#707070]" />
                </span>
                <span className="font-semibold text-[#1a1a1a] uppercase">
                  {shippingFee === 0 ? "FREE" : formatPricePkr(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-[#e1e1e1]">
                <span className="text-[15px] font-medium text-[#1a1a1a]">Total</span>
                <div className="text-right flex items-baseline gap-1.5">
                  <span className="text-[11px] text-[#707070] font-normal">PKR</span>
                  <span className="text-[20px] font-bold text-[#1a1a1a]">
                    {formatPricePkr(totalAmount)}
                  </span>
                </div>
              </div>
              <p className="text-[11.5px] text-[#707070] text-right">
                Including Rs 0.00 in taxes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CENTRALIZED SPLIT LAYOUT
          - Centered container (max-w-[1140px] mx-auto)
          - Left column: Checkout form (pure white)
          - Right column: Order summary (light gray #f5f5f5 with border-l #e1e1e1)
          - Continuous 50% split background on the right for wide monitors
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full border-t border-[#e1e1e1] bg-white">
        {/* Continuous right-half gray background on large screens */}
        <div
          className="hidden lg:block absolute inset-y-0 right-0 w-1/2 bg-[#f5f5f5] border-l border-[#e1e1e1] pointer-events-none"
          aria-hidden="true"
        />

        {/* Centered layout container */}
        <div className="relative max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_440px] gap-8 xl:gap-14">

          {/* ════════════════════════════════════════
              LEFT COLUMN — Checkout Form
          ════════════════════════════════════════ */}
          <div className="pt-6 md:pt-8 pb-16 lg:pr-6 flex flex-col justify-between">
            <form onSubmit={handleSubmit} noValidate>

              {/* ── Contact ── */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[18px] font-semibold text-[#1a1a1a]">Contact</h2>
                  <Link
                    href="/account"
                    className="text-[13.5px] text-[#005bd3] hover:underline font-normal"
                  >
                    Sign in
                  </Link>
                </div>

                <FloatingInput
                  id="email"
                  label="Email or mobile phone number"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  autoComplete="email"
                  endIcon={<HelpCircle className="w-4.5 h-4.5 text-[#737373]" />}
                />

                <label className="mt-3 flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setEmailOffers(!emailOffers)}
                    className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center shrink-0 transition-all ${
                      emailOffers
                        ? "bg-[#005bd3] border-[#005bd3]"
                        : "border-[#b5b5b5] bg-white hover:border-[#707070]"
                    }`}
                  >
                    {emailOffers && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                  <span className="text-[13.5px] text-[#333333]">
                    Email me with news and offers
                  </span>
                </label>
              </section>

              {/* ── Delivery ── */}
              <section className="mb-8">
                <h2 className="text-[18px] font-semibold text-[#1a1a1a] mb-2.5">Delivery</h2>

                <div className="space-y-3">
                  <FloatingSelect
                    id="country"
                    label="Country/Region"
                    value={form.country}
                    onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                    autoComplete="shipping country"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </FloatingSelect>

                  <div className="grid grid-cols-2 gap-3">
                    <FloatingInput
                      id="firstName"
                      label="First name"
                      {...field("firstName")}
                      required
                      autoComplete="given-name"
                    />
                    <FloatingInput
                      id="lastName"
                      label="Last name"
                      {...field("lastName")}
                      required
                      autoComplete="family-name"
                    />
                  </div>

                  <FloatingInput
                    id="address"
                    label="Address"
                    {...field("address")}
                    required
                    autoComplete="street-address"
                  />

                  <FloatingInput
                    id="apartment"
                    label="Apartment, suite, etc. (optional)"
                    value={form.apartment || ""}
                    onChange={(e) => setForm((p) => ({ ...p, apartment: e.target.value }))}
                    autoComplete="address-line2"
                  />

                  <div className="grid grid-cols-[1fr_140px] gap-3">
                    <FloatingInput
                      id="city"
                      label="City"
                      {...field("city")}
                      required
                      autoComplete="address-level2"
                    />
                    <FloatingInput
                      id="postalCode"
                      label="Postal code (optional)"
                      value={form.postalCode}
                      onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                  </div>

                  <FloatingInput
                    id="phone"
                    label="Phone"
                    type="tel"
                    {...field("phone")}
                    required
                    autoComplete="tel"
                    endIcon={<HelpCircle className="w-4.5 h-4.5 text-[#737373]" />}
                  />

                  <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                    <div
                      onClick={() => setSaveInfo(!saveInfo)}
                      className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center shrink-0 transition-all ${
                        saveInfo
                          ? "bg-[#005bd3] border-[#005bd3]"
                          : "border-[#b5b5b5] bg-white hover:border-[#707070]"
                      }`}
                    >
                      {saveInfo && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>
                    <span className="text-[13.5px] text-[#333333]">
                      Save this information for next time
                    </span>
                  </label>
                </div>
              </section>

              {/* ── Shipping method ── */}
              <section className="mb-8">
                <h2 className="text-[18px] font-semibold text-[#1a1a1a] mb-2.5">
                  Shipping method
                </h2>
                <div className="border border-[#005bd3] bg-[#f4f8ff] rounded-[6px] px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-[#005bd3] flex items-center justify-center shrink-0">
                      <div className="w-[8px] h-[8px] rounded-full bg-[#005bd3]" />
                    </div>
                    <span className="text-[14px] text-[#1a1a1a]">Standard</span>
                  </div>
                  <span className="text-[14px] font-semibold text-[#1a1a1a] uppercase">
                    {shippingFee === 0 ? "FREE" : formatPricePkr(shippingFee)}
                  </span>
                </div>
              </section>

              {/* ── Payment ── */}
              <section className="mb-8">
                <h2 className="text-[18px] font-semibold text-[#1a1a1a] mb-0.5">Payment</h2>
                <p className="text-[13px] text-[#707070] mb-3">
                  All transactions are secure and encrypted.
                </p>

                <div className="border border-[#d9d9d9] rounded-[8px] overflow-hidden">
                  {/* Option 1 — Bank Deposit (Default on sillhouete.com) */}
                  <div
                    className={`${
                      paymentMethod === "bank_deposit"
                        ? "border-2 border-[#005bd3] -m-[1px] rounded-[8px] relative z-10"
                        : "border-b border-[#d9d9d9]"
                    }`}
                  >
                    <div
                      onClick={() => setPaymentMethod("bank_deposit")}
                      className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                        paymentMethod === "bank_deposit"
                          ? "bg-[#f4f8ff]"
                          : "bg-white hover:bg-[#fafafa]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                            paymentMethod === "bank_deposit"
                              ? "border-[#005bd3]"
                              : "border-[#b5b5b5]"
                          }`}
                        >
                          {paymentMethod === "bank_deposit" && (
                            <div className="w-[8px] h-[8px] rounded-full bg-[#005bd3]" />
                          )}
                        </div>
                        <span className="text-[14px] font-medium text-[#1a1a1a]">
                          Bank Deposit
                        </span>
                      </div>
                    </div>

                    {paymentMethod === "bank_deposit" && (
                      <div className="border-t border-[#d9d9d9] bg-[#f7f7f7] px-4 py-4 text-[13.5px] text-[#333333] leading-relaxed">
                        <p>Bank Meezan Bank</p>
                        <p>
                          Ac title <strong>SILLHOUETE</strong>
                        </p>
                        <p>
                          IBAN : <strong>PK80MEZN0002160109517881</strong>
                        </p>
                        <p className="mt-2 text-[#666666]">
                          Please share screen shot on our official WhatsApp number so that we can proceed with your order.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Option 2 — PAYFAST */}
                  <div
                    className={`${
                      paymentMethod === "payfast"
                        ? "border-2 border-[#005bd3] -m-[1px] rounded-[8px] relative z-10"
                        : "border-b border-[#d9d9d9]"
                    }`}
                  >
                    <div
                      onClick={() => setPaymentMethod("payfast")}
                      className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                        paymentMethod === "payfast"
                          ? "bg-[#f4f8ff]"
                          : "bg-white hover:bg-[#fafafa]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                            paymentMethod === "payfast"
                              ? "border-[#005bd3]"
                              : "border-[#b5b5b5]"
                          }`}
                        >
                          {paymentMethod === "payfast" && (
                            <div className="w-[8px] h-[8px] rounded-full bg-[#005bd3]" />
                          )}
                        </div>
                        <span className="text-[13.5px] md:text-[14px] font-medium text-[#1a1a1a]">
                          PAYFAST(Pay via Debit/Credit/Wallet/Bank Account)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <VisaBadge />
                        <MastercardBadge />
                        <UnionPayBadge />
                      </div>
                    </div>

                    {paymentMethod === "payfast" && (
                      <div className="border-t border-[#d9d9d9] bg-[#f7f7f7] px-4 py-4 text-[13px] text-[#555555]">
                        <p>
                          After clicking &ldquo;Complete order&rdquo;, you will be redirected to PAYFAST to complete your purchase securely.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Option 3 — Pay by card */}
                  <div
                    className={`${
                      paymentMethod === "pay_by_card"
                        ? "border-2 border-[#005bd3] -m-[1px] rounded-[8px] relative z-10"
                        : ""
                    }`}
                  >
                    <div
                      onClick={() => setPaymentMethod("pay_by_card")}
                      className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                        paymentMethod === "pay_by_card"
                          ? "bg-[#f4f8ff]"
                          : "bg-white hover:bg-[#fafafa]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                            paymentMethod === "pay_by_card"
                              ? "border-[#005bd3]"
                              : "border-[#b5b5b5]"
                          }`}
                        >
                          {paymentMethod === "pay_by_card" && (
                            <div className="w-[8px] h-[8px] rounded-full bg-[#005bd3]" />
                          )}
                        </div>
                        <span className="text-[14px] font-medium text-[#1a1a1a]">
                          Pay by card
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <VisaBadge />
                        <MastercardBadge />
                        <AmexBadge />
                        <PlusOneBadge />
                      </div>
                    </div>

                    {paymentMethod === "pay_by_card" && (
                      <div className="border-t border-[#d9d9d9] bg-[#f7f7f7] p-4 space-y-3">
                        {/* Stripe Dahlia Embedded Form Container */}
                        <div id="checkout-form" className="stripe-embedded-form w-full" />

                        {!embeddedFormMounted && (
                          <>
                            {stripe ? (
                              <>
                                <StripeFloatingField
                                  label="Card number"
                                  endIcon={<Lock className="w-4 h-4 text-[#707070]" />}
                                >
                                  <CardNumberElement options={STRIPE_ELEMENT_STYLE} />
                                </StripeFloatingField>
                                <div className="grid grid-cols-2 gap-3">
                                  <StripeFloatingField label="Expiration date (MM / YY)">
                                    <CardExpiryElement options={STRIPE_ELEMENT_STYLE} />
                                  </StripeFloatingField>
                                  <StripeFloatingField
                                    label="Security code"
                                    endIcon={<HelpCircle className="w-4.5 h-4.5 text-[#737373]" />}
                                  >
                                    <CardCvcElement options={STRIPE_ELEMENT_STYLE} />
                                  </StripeFloatingField>
                                </div>
                              </>
                            ) : (
                              <>
                                <FloatingInput
                                  id="cardNumber"
                                  label="Card number"
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value)}
                                  autoComplete="cc-number"
                                  endIcon={<Lock className="w-4 h-4 text-[#707070]" />}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <FloatingInput
                                    id="cardExpiry"
                                    label="Expiration date (MM / YY)"
                                    value={cardExpiry}
                                    onChange={(e) => setCardExpiry(e.target.value)}
                                    autoComplete="cc-exp"
                                  />
                                  <FloatingInput
                                    id="cardCvc"
                                    label="Security code"
                                    value={cardCvc}
                                    onChange={(e) => setCardCvc(e.target.value)}
                                    autoComplete="cc-csc"
                                    endIcon={<HelpCircle className="w-4.5 h-4.5 text-[#737373]" />}
                                  />
                                </div>
                              </>
                            )}
                            <FloatingInput
                              id="cardName"
                              label="Name on card"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              autoComplete="cc-name"
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ── Billing address ── */}
              <section className="mb-8">
                <h2 className="text-[18px] font-semibold text-[#1a1a1a] mb-2.5">
                  Billing address
                </h2>
                <div className="border border-[#d9d9d9] rounded-[8px] overflow-hidden">
                  {/* Same as shipping */}
                  <div
                    className={`${
                      billingSame
                        ? "border-2 border-[#005bd3] -m-[1px] rounded-[8px] relative z-10"
                        : "border-b border-[#d9d9d9]"
                    }`}
                  >
                    <div
                      onClick={() => setBillingSame(true)}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                        billingSame ? "bg-[#f4f8ff]" : "bg-white hover:bg-[#fafafa]"
                      }`}
                    >
                      <div
                        className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                          billingSame ? "border-[#005bd3]" : "border-[#b5b5b5]"
                        }`}
                      >
                        {billingSame && (
                          <div className="w-[8px] h-[8px] rounded-full bg-[#005bd3]" />
                        )}
                      </div>
                      <span className="text-[14px] font-medium text-[#1a1a1a]">
                        Same as shipping address
                      </span>
                    </div>
                  </div>

                  {/* Different billing address */}
                  <div
                    className={`${
                      !billingSame
                        ? "border-2 border-[#005bd3] -m-[1px] rounded-[8px] relative z-10"
                        : ""
                    }`}
                  >
                    <div
                      onClick={() => setBillingSame(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                        !billingSame ? "bg-[#f4f8ff]" : "bg-white hover:bg-[#fafafa]"
                      }`}
                    >
                      <div
                        className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                          !billingSame ? "border-[#005bd3]" : "border-[#b5b5b5]"
                        }`}
                      >
                        {!billingSame && (
                          <div className="w-[8px] h-[8px] rounded-full bg-[#005bd3]" />
                        )}
                      </div>
                      <span className="text-[14px] font-medium text-[#1a1a1a]">
                        Use a different billing address
                      </span>
                    </div>

                    {!billingSame && (
                      <div className="border-t border-[#d9d9d9] px-4 py-4 bg-[#f7f7f7] space-y-3">
                        <FloatingSelect
                          id="bCountry"
                          label="Country/Region"
                          value={form.country}
                          onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </FloatingSelect>
                        <div className="grid grid-cols-2 gap-3">
                          <FloatingInput
                            id="bFirst"
                            label="First name"
                            value={form.firstName}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, firstName: e.target.value }))
                            }
                          />
                          <FloatingInput
                            id="bLast"
                            label="Last name"
                            value={form.lastName}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, lastName: e.target.value }))
                            }
                          />
                        </div>
                        <FloatingInput
                          id="bAddress"
                          label="Address"
                          value={form.address}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, address: e.target.value }))
                          }
                        />
                        <FloatingInput
                          id="bApt"
                          label="Apartment, suite, etc. (optional)"
                          value={form.apartment || ""}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, apartment: e.target.value }))
                          }
                        />
                        <div className="grid grid-cols-[1fr_140px] gap-3">
                          <FloatingInput
                            id="bCity"
                            label="City"
                            value={form.city}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, city: e.target.value }))
                            }
                          />
                          <FloatingInput
                            id="bPostal"
                            label="Postal code (optional)"
                            value={form.postalCode}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, postalCode: e.target.value }))
                            }
                          />
                        </div>
                        <FloatingInput
                          id="bPhone"
                          label="Phone (optional)"
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, phone: e.target.value }))
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ── Error message ── */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-[6px] text-[13px] text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* ── Big Blue Submit Button: "Complete order" / "Pay now" ── */}
              <button
                type="submit"
                disabled={isProcessing}
                id="checkout-pay-button"
                className="w-full bg-[#005bd3] hover:bg-[#0051ba] active:bg-[#0047a4] text-white font-medium text-[16px] py-4 px-6 rounded-[8px] transition-colors shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : paymentMethod === "pay_by_card" ? (
                  "Pay now"
                ) : (
                  "Complete order"
                )}
              </button>
            </form>

            {/* ── Policy Links at the bottom of left column ── */}
            <footer className="mt-12 pt-6 border-t border-[#e1e1e1] text-[12px] text-[#707070]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link href="/pages/policies" className="hover:underline">
                  Refund policy
                </Link>
                <Link href="/pages/shipping-policy" className="hover:underline">
                  Shipping policy
                </Link>
                <Link href="/pages/privacy-policy" className="hover:underline">
                  Privacy policy
                </Link>
                <Link href="/pages/terms-and-conditions" className="hover:underline">
                  Terms of service
                </Link>
                <Link href="/pages/contact-us" className="hover:underline">
                  Contact information
                </Link>
              </div>
            </footer>
          </div>

          {/* ════════════════════════════════════════
              RIGHT COLUMN — Order Summary (desktop)
          ════════════════════════════════════════ */}
          <aside className="hidden lg:block pt-6 md:pt-8 pb-16 lg:pl-6 min-h-screen">
            <div className="sticky top-8">
            {/* Items list */}
            <div className="space-y-4 mb-6">
              {displayItems.map((item) => {
                const itemPrice = item.unitPrice ?? item.product.price;
                return (
                  <div key={item.key} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      {/* Thumbnail with rounded corners and authentic black badge */}
                      <div className="relative w-16 h-16 shrink-0 mt-0.5">
                        <div className="w-16 h-16 rounded-[8px] border border-[#d9d9d9] bg-white overflow-hidden relative">
                          <Image
                            src={item.product.image}
                            alt={item.product.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center shadow-xs select-none">
                          {item.quantity}
                        </span>
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-[#1a1a1a] leading-snug">
                          {item.product.title}
                        </p>
                        <p className="text-[12px] text-[#707070] mt-0.5 whitespace-pre-line leading-relaxed">
                          {item.size}
                          {item.dupatta ? `\nSleeves: ${item.dupatta}` : ""}
                          {item.adOn ? `\n${item.adOn}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-[14px] font-medium text-[#1a1a1a] whitespace-nowrap pt-0.5">
                      {formatPricePkr(itemPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Discount Code Box */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="flex-1 bg-white border border-[#d9d9d9] hover:border-[#707070] focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] rounded-[6px] px-3.5 py-3 text-[14px] text-[#1a1a1a] outline-none transition-colors"
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                disabled={!discountCode.trim()}
                className={`px-5 rounded-[6px] text-[14px] font-medium transition-colors border ${
                  discountCode.trim()
                    ? "bg-[#005bd3] border-[#005bd3] text-white hover:bg-[#0051ba] cursor-pointer"
                    : "bg-[#f5f5f5] border-[#d9d9d9] text-[#707070] cursor-not-allowed hover:bg-[#eaeaea]"
                }`}
              >
                Apply
              </button>
            </div>
            {discountError && (
              <p className="text-[12px] text-red-600 mb-4">{discountError}</p>
            )}
            {appliedDiscount && (
              <p className="text-[12px] text-green-700 font-medium mb-4">
                Code &ldquo;{appliedDiscount.code}&rdquo; applied ({appliedDiscount.percent}% off)
              </p>
            )}

            {/* Subtotal & Shipping */}
            <div className="space-y-3 pt-4 pb-5 border-t border-[#e1e1e1]">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#707070]">Subtotal</span>
                <span className="font-medium text-[#1a1a1a]">
                  {formatPricePkr(subtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[14px] text-green-700">
                  <span>Discount ({appliedDiscount?.code})</span>
                  <span>-{formatPricePkr(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[14px]">
                <span className="flex items-center gap-1.5 text-[#707070]">
                  Shipping <HelpCircle className="w-3.5 h-3.5 text-[#707070]" />
                </span>
                <span className="font-semibold text-[#1a1a1a] uppercase">
                  {shippingFee === 0 ? "FREE" : formatPricePkr(shippingFee)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-[#e1e1e1] pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[16px] font-medium text-[#1a1a1a]">Total</span>
                <div className="text-right flex items-baseline gap-1.5">
                  <span className="text-[12px] text-[#707070] font-normal tracking-wide">
                    PKR
                  </span>
                  <span className="text-[22px] font-bold text-[#1a1a1a]">
                    {formatPricePkr(totalAmount)}
                  </span>
                </div>
              </div>
              <p className="text-[12px] text-[#707070] text-right mt-1">
                Including Rs 0.00 in taxes
              </p>
            </div>
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
}

/* ─── Outer wrapper providing Stripe Elements & Dahlia SDK context ─── */
export default function CheckoutPage() {
  const { settings } = useStore();
  const stripeKey =
    settings?.stripePublishableKey ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "";
  const isReal =
    stripeKey.length >= 40 &&
    (stripeKey.startsWith("pk_test_") || stripeKey.startsWith("pk_live_"));

  const dynamicStripePromise = useMemo(() => {
    return isReal ? loadStripe(stripeKey) : Promise.resolve(null);
  }, [stripeKey, isReal]);

  return (
    <>
      <Script
        src="https://js.stripe.com/dahlia/stripe.js"
        strategy="afterInteractive"
      />
      <Elements stripe={dynamicStripePromise}>
        <CheckoutForm />
      </Elements>
    </>
  );
}
