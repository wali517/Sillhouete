"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  ShoppingBag,
  Tag,
  HelpCircle,
} from "lucide-react";
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
import type { OrderShippingAddress } from "@/types";

/** Only load Stripe when a real publishable key is present */
const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const isRealPubKey =
  STRIPE_KEY.length >= 40 &&
  (STRIPE_KEY.startsWith("pk_test_") || STRIPE_KEY.startsWith("pk_live_"));
const stripePromise: Promise<StripeType | null> = isRealPubKey
  ? loadStripe(STRIPE_KEY)
  : Promise.resolve(null);

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
function formatPriceShort(amt: number) {
  return `Rs\u00a0${Math.round(amt).toLocaleString("en-US")}.00`;
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
          focused ? "border-[#005bd3] ring-1 ring-[#005bd3] shadow-[0_0_0_3px_rgba(0,91,211,0.2)]" : "border-[#b5b5b5]"
        }`}
      >
        <label
          htmlFor={id}
          className={`absolute left-3 pointer-events-none transition-all duration-150 ${
            raised
              ? "top-1.5 text-[10px] text-[#636363]"
              : "top-1/2 -translate-y-1/2 text-[14px] text-[#636363]"
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
          className="w-full bg-transparent outline-none pt-5 pb-1.5 px-3 text-[14px] text-[#1a1a1a] leading-snug"
        />
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#636363]">
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
        focused ? "border-[#005bd3] ring-1 ring-[#005bd3] shadow-[0_0_0_3px_rgba(0,91,211,0.2)]" : "border-[#b5b5b5]"
      }`}
    >
      <label
        htmlFor={id}
        className="absolute left-3 top-1.5 text-[10px] text-[#636363] pointer-events-none"
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
        className="w-full bg-transparent outline-none pt-5 pb-1.5 px-3 pr-8 text-[14px] text-[#1a1a1a] appearance-none cursor-pointer"
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#636363]">
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
      fontFamily: "inherit",
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
          ? "border-[#005bd3] ring-1 ring-[#005bd3] shadow-[0_0_0_3px_rgba(0,91,211,0.2)]"
          : "border-[#b5b5b5]"
      }`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <label className="absolute left-3 top-1.5 text-[10px] text-[#636363] pointer-events-none">
        {label}
      </label>
      <div className="pt-5 pb-1.5 px-3 pr-10">{children}</div>
      {endIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#636363]">
          {endIcon}
        </div>
      )}
    </div>
  );
}

/* ─── Payment option row ─── */
function PaymentOption({
  id,
  label,
  selected,
  onClick,
  icons,
  children,
  isLast,
}: {
  id: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  icons?: React.ReactNode;
  children?: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={`${!isLast ? "border-b border-[#d9d9d9]" : ""}`}
    >
      <div
        onClick={onClick}
        className={`flex items-center justify-between px-3.5 py-3 cursor-pointer transition-colors ${
          selected ? "bg-[#f3f6fc]" : "hover:bg-[#fafafa]"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Custom radio */}
          <div
            className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              selected ? "border-[#005bd3]" : "border-[#b5b5b5]"
            }`}
          >
            {selected && (
              <div className="w-[9px] h-[9px] rounded-full bg-[#005bd3]" />
            )}
          </div>
          <span className="text-[14px] font-semibold text-[#1a1a1a]">
            {label}
          </span>
        </div>
        {icons && <div className="flex items-center gap-1">{icons}</div>}
      </div>
      {/* Expanded content */}
      {selected && children && (
        <div className="border-t border-[#d9d9d9] bg-[#f3f6fc] px-3.5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Visa/MC/Amex badges ─── */
function CardBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center h-[24px] px-1.5 rounded text-[9px] font-bold tracking-wide border border-gray-200"
      style={{ background: color, color: color === "#fff" ? "#333" : "#fff", minWidth: 38 }}
    >
      {label}
    </span>
  );
}

function CardIcons({ types }: { types: string[] }) {
  const colors: Record<string, string> = {
    VISA: "#1a1f71",
    MC: "#EB001B",
    AMEX: "#2E77BC",
    UP: "#e0312b",
  };
  return (
    <div className="flex items-center gap-1">
      {types.map((t) => (
        <CardBadge key={t} label={t} color={colors[t] ?? "#888"} />
      ))}
    </div>
  );
}

/* ─── Main Checkout Form (inner, has Stripe hooks) ─── */
function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clearCart, orderNote } = useStore();
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

  type PayMethod = "credit_card" | "payfast" | "pay_by_card" | "bank_deposit";
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>("bank_deposit");
  const [emailOffers, setEmailOffers] = useState(true);
  const [saveInfo, setSaveInfo] = useState(false);
  const [billingSame, setBillingSame] = useState(true);

  // Discount
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [availableCodes, setAvailableCodes] = useState<Array<{ code: string; percent: number }>>([]);

  // Mobile summary
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Card
  const [cardName, setCardName] = useState("");

  // Submit
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
  const shippingFee = subtotal >= 14000 ? 0 : 250;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

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
    } else {
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

    if (paymentMethod === "credit_card" || paymentMethod === "pay_by_card") {
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
          if (!cardEl) throw new Error("Card fields not loaded");
          const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardEl,
              billing_details: { name: cardName || form.email, email: form.email },
            },
          });
          if (error) throw new Error(error.message || "Card declined");
          if (paymentIntent?.status !== "succeeded") throw new Error("Payment incomplete");
          stripePaymentIntentId = paymentIntent.id;
        } else {
          stripePaymentIntentId = piId;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Card authorization failed";
        setErrorMessage(msg);
        setIsProcessing(false);
        return;
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

  // Order summary sidebar
  const displayItems = items.length > 0 ? items : [];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", fontSize: 14 }}>

      {/* ─── Header ─── */}
      <header className="border-b border-[#e1e1e1] bg-white">
        <div className="mx-auto max-w-[1280px] flex items-center justify-between px-4 md:px-10 py-4">
          {/* Left cart (hidden for centering) */}
          <div className="w-[28px] opacity-0">
            <ShoppingBag className="w-[19px] h-[19px]" />
          </div>

          {/* Centered logo */}
          <Link href="/" className="flex flex-col items-center leading-none select-none">
            <span className="text-[13px] leading-none text-black" style={{ fontFamily: "serif" }}>
              سلوٹ
            </span>
            <span
              className="text-[22px] md:text-[26px] font-semibold tracking-[0.04em] text-black"
              style={{ fontFamily: "serif" }}
            >
              Sillhouete
            </span>
          </Link>

          {/* Right cart */}
          <Link href="/cart" aria-label="Cart" className="text-[#1a1a1a] hover:opacity-70 transition-opacity">
            <ShoppingBag className="w-[19px] h-[19px]" strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      {/* ─── Main ─── */}
      <div className="mx-auto max-w-[1280px]">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_432px]">

          {/* ════════════════════════════════════════
              LEFT COLUMN — Form
          ════════════════════════════════════════ */}
          <div className="lg:pr-10 xl:pr-14 px-4 md:px-8 py-7">
            <form onSubmit={handleSubmit} noValidate>

              {/* ── Contact ── */}
              <section className="mb-7">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[16px] font-semibold text-[#1a1a1a]">Contact</h2>
                  <Link href="/account" className="text-[13px] text-[#005bd3] hover:underline">
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
                  endIcon={<HelpCircle className="w-4 h-4" />}
                />

                <label className="mt-3 flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setEmailOffers(!emailOffers)}
                    className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      emailOffers ? "bg-[#005bd3] border-[#005bd3]" : "border-[#b5b5b5] bg-white"
                    }`}
                  >
                    {emailOffers && (
                      <svg viewBox="0 0 14 14" className="w-3 h-3 text-white fill-none stroke-white stroke-2">
                        <polyline points="2,7 6,11 12,3" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[13px] text-[#1a1a1a]">Email me with news and offers</span>
                </label>
              </section>

              {/* ── Delivery ── */}
              <section className="mb-7">
                <h2 className="text-[16px] font-semibold text-[#1a1a1a] mb-3">Delivery</h2>

                <div className="space-y-2">
                  <FloatingSelect
                    id="country"
                    label="Country/Region"
                    value={form.country}
                    onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                    autoComplete="shipping country"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </FloatingSelect>

                  <div className="grid grid-cols-2 gap-2">
                    <FloatingInput id="firstName" label="First name" {...field("firstName")} required autoComplete="given-name" />
                    <FloatingInput id="lastName" label="Last name" {...field("lastName")} required autoComplete="family-name" />
                  </div>

                  <FloatingInput id="address" label="Address" {...field("address")} required autoComplete="street-address" />

                  <FloatingInput
                    id="apartment"
                    label="Apartment, suite, etc. (optional)"
                    value={form.apartment || ""}
                    onChange={(e) => setForm((p) => ({ ...p, apartment: e.target.value }))}
                    autoComplete="address-line2"
                  />

                  <div className="grid grid-cols-[1fr_120px] gap-2">
                    <FloatingInput id="city" label="City" {...field("city")} required autoComplete="address-level2" />
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
                    endIcon={<HelpCircle className="w-4 h-4" />}
                  />

                  <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                    <div
                      onClick={() => setSaveInfo(!saveInfo)}
                      className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                        saveInfo ? "bg-[#005bd3] border-[#005bd3]" : "border-[#b5b5b5] bg-white"
                      }`}
                    >
                      {saveInfo && (
                        <svg viewBox="0 0 14 14" className="w-3 h-3 fill-none stroke-white stroke-2">
                          <polyline points="2,7 6,11 12,3" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13px] text-[#1a1a1a]">Save this information for next time</span>
                  </label>
                </div>
              </section>

              {/* ── Shipping method ── */}
              <section className="mb-7">
                <h2 className="text-[16px] font-semibold text-[#1a1a1a] mb-3">Shipping method</h2>
                <div className="border border-[#b5b5b5] rounded-[5px] overflow-hidden">
                  <div className="bg-[#f3f6fc] border border-[#005bd3] rounded-[5px] px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-[#005bd3] flex items-center justify-center shrink-0">
                        <div className="w-[9px] h-[9px] rounded-full bg-[#005bd3]" />
                      </div>
                      <span className="text-[14px] font-semibold text-[#1a1a1a]">Standard</span>
                    </div>
                    <span className="text-[14px] font-bold text-[#1a1a1a]">
                      {shippingFee === 0 ? "Free" : formatPricePkr(shippingFee)}
                    </span>
                  </div>
                </div>
              </section>

              {/* ── Payment ── */}
              <section className="mb-7">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-[16px] font-semibold text-[#1a1a1a]">Payment</h2>
                </div>
                <p className="text-[13px] text-[#636363] mb-3 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  All transactions are secure and encrypted.
                </p>

                <div className="border border-[#b5b5b5] rounded-[5px] overflow-hidden">
                  {/* Option 1 — Credit card (Stripe Elements demo) */}
                  <PaymentOption
                    id="credit_card"
                    label="Credit card"
                    selected={paymentMethod === "credit_card"}
                    onClick={() => setPaymentMethod("credit_card")}
                    icons={<CardIcons types={["VISA", "MC", "AMEX"]} />}
                  >
                    <div className="space-y-2">
                      {/* Demo notice */}
                      <div className="bg-white border border-[#b5b5b5] rounded-[5px] px-3 py-2 text-[12px] text-[#636363] flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          <strong className="text-[#1a1a1a]">Demo mode</strong> — Add your real Stripe keys in Admin → Settings to enable live payments.
                          <br />Test card: <strong className="font-mono">4242 4242 4242 4242</strong> · Any future expiry · Any CVC
                        </span>
                      </div>
                      <StripeFloatingField label="Card number" endIcon={<Lock className="w-4 h-4" />}>
                        <CardNumberElement options={STRIPE_ELEMENT_STYLE} />
                      </StripeFloatingField>
                      <div className="grid grid-cols-2 gap-2">
                        <StripeFloatingField label="Expiration date (MM / YY)">
                          <CardExpiryElement options={STRIPE_ELEMENT_STYLE} />
                        </StripeFloatingField>
                        <StripeFloatingField
                          label="Security code"
                          endIcon={<HelpCircle className="w-4 h-4" />}
                        >
                          <CardCvcElement options={STRIPE_ELEMENT_STYLE} />
                        </StripeFloatingField>
                      </div>
                      <FloatingInput
                        id="cardName"
                        label="Name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>
                  </PaymentOption>

                  {/* Option 2 — PAYFAST */}
                  <PaymentOption
                    id="payfast"
                    label="PAYFAST (Pay via Debit/Credit/Wallet/Bank Account)"
                    selected={paymentMethod === "payfast"}
                    onClick={() => setPaymentMethod("payfast")}
                    icons={<CardIcons types={["VISA", "MC", "UP"]} />}
                  >
                    <p className="text-[13px] text-[#636363]">
                      You will be redirected to PAYFAST to complete your payment securely.
                    </p>
                  </PaymentOption>

                  {/* Option 3 — Pay by card */}
                  <PaymentOption
                    id="pay_by_card"
                    label="Pay by card"
                    selected={paymentMethod === "pay_by_card"}
                    onClick={() => setPaymentMethod("pay_by_card")}
                    icons={<CardIcons types={["VISA", "MC", "AMEX"]} />}
                  >
                    <p className="text-[13px] text-[#636363]">
                      Enter your card details to pay securely.
                    </p>
                  </PaymentOption>

                  {/* Option 4 — Bank Deposit (default) */}
                  <PaymentOption
                    id="bank_deposit"
                    label="Bank Deposit"
                    selected={paymentMethod === "bank_deposit"}
                    onClick={() => setPaymentMethod("bank_deposit")}
                    isLast
                  >
                    <p className="text-[14px] text-[#1a1a1a] leading-relaxed">
                      Bank &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Meezan Bank<br />
                      Ac title &nbsp;&nbsp;&nbsp; <strong>SILLHOUETE</strong><br />
                      IBAN &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong className="font-mono tracking-wide">PK80MEZN0002160109517881</strong><br />
                      <span className="text-[13px] text-[#636363] mt-1 block">
                        Please share screenshot on our official WhatsApp so we can proceed with your order.
                      </span>
                    </p>
                  </PaymentOption>
                </div>
              </section>

              {/* ── Billing address ── */}
              <section className="mb-7">
                <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-3">Billing address</h3>
                <div className="border border-[#b5b5b5] rounded-[5px] overflow-hidden">
                  {/* Same as shipping */}
                  <div
                    onClick={() => setBillingSame(true)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[#d9d9d9] ${billingSame ? "bg-[#f3f6fc]" : "hover:bg-[#fafafa]"}`}
                  >
                    <div
                      className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        billingSame ? "border-[#005bd3]" : "border-[#b5b5b5]"
                      }`}
                    >
                      {billingSame && <div className="w-[9px] h-[9px] rounded-full bg-[#005bd3]" />}
                    </div>
                    <span className="text-[14px] font-semibold text-[#1a1a1a]">
                      Same as shipping address
                    </span>
                  </div>
                  {/* Different billing address */}
                  <div
                    onClick={() => setBillingSame(false)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${!billingSame ? "bg-[#f3f6fc]" : "hover:bg-[#fafafa]"}`}
                  >
                    <div
                      className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        !billingSame ? "border-[#005bd3]" : "border-[#b5b5b5]"
                      }`}
                    >
                      {!billingSame && <div className="w-[9px] h-[9px] rounded-full bg-[#005bd3]" />}
                    </div>
                    <span className="text-[14px] font-semibold text-[#1a1a1a]">
                      Use a different billing address
                    </span>
                  </div>
                  {!billingSame && (
                    <div className="border-t border-[#d9d9d9] px-4 py-4 bg-[#f3f6fc] space-y-2">
                      <FloatingSelect id="billingCountry" label="Country/Region" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} autoComplete="billing country">
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </FloatingSelect>
                      <div className="grid grid-cols-2 gap-2">
                        <FloatingInput id="billingFirst" label="First name" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} autoComplete="billing given-name" />
                        <FloatingInput id="billingLast" label="Last name" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} autoComplete="billing family-name" />
                      </div>
                      <FloatingInput id="billingAddress" label="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} autoComplete="billing street-address" />
                      <FloatingInput id="billingApt" label="Apartment, suite, etc. (optional)" value={form.apartment || ""} onChange={(e) => setForm((p) => ({ ...p, apartment: e.target.value }))} autoComplete="billing address-line2" />
                      <div className="grid grid-cols-[1fr_120px] gap-2">
                        <FloatingInput id="billingCity" label="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} autoComplete="billing address-level2" />
                        <FloatingInput id="billingPostal" label="Postal code (optional)" value={form.postalCode} onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))} inputMode="numeric" />
                      </div>
                      <FloatingInput id="billingPhone" label="Phone (optional)" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} autoComplete="billing tel" endIcon={<HelpCircle className="w-4 h-4" />} />
                    </div>
                  )}
                </div>
              </section>

              {/* ── Add discount (collapsible, matches real site) ── */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setDiscountOpen(!discountOpen)}
                  className="flex items-center gap-2 text-[13px] text-[#005bd3] hover:underline"
                >
                  <Tag className="w-4 h-4" />
                  <span>Add discount code</span>
                  {discountOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {discountOpen && (
                  <div className="mt-2.5 flex gap-2">
                    <FloatingInput
                      id="discountCode"
                      label="Discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      className="h-[52px] px-5 border border-[#b5b5b5] rounded-[5px] text-[14px] font-semibold text-[#1a1a1a] hover:bg-neutral-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {discountError && <p className="mt-1 text-[12px] text-red-600">{discountError}</p>}
                {appliedDiscount && (
                  <p className="mt-1 text-[12px] text-green-700 font-medium">
                    Code &ldquo;{appliedDiscount.code}&rdquo; applied — {appliedDiscount.percent}% off
                  </p>
                )}
              </div>

              {/* ── Error ── */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-[5px] text-[13px] text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* ── Submit button ── */}
              <button
                type="submit"
                disabled={isProcessing}
                id="checkout-pay-button"
                className="w-full bg-[#005bd3] hover:bg-[#0056c7] active:bg-[#004cb8] text-white font-semibold text-[16px] py-4 px-6 rounded-[5px] transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Complete order · ${formatPriceShort(totalAmount)}`
                )}
              </button>

              {/* ── Terms ── */}
              <div className="mt-4 text-center">
                <Link href="/pages/policies" className="text-[12px] text-[#636363] hover:underline">
                  Terms and policies
                </Link>
              </div>
            </form>
          </div>

          {/* ════════════════════════════════════════
              RIGHT COLUMN — Order summary (desktop)
          ════════════════════════════════════════ */}
          <aside className="hidden lg:block bg-[#fafafa] border-l border-[#e1e1e1] px-8 xl:px-10 py-7">

            {/* Items */}
            <div className="space-y-4 mb-6">
              {displayItems.length === 0 ? (
                <p className="text-[13px] text-[#636363]">Your cart is empty.</p>
              ) : (
                displayItems.map((item) => {
                  const itemPrice = item.unitPrice ?? item.product.price;
                  return (
                    <div key={item.key} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail with quantity badge */}
                        <div className="relative w-16 h-16 shrink-0">
                          <div className="w-16 h-16 rounded-[8px] border border-[#d9d9d9] bg-white overflow-hidden">
                            <Image
                              src={item.product.image}
                              alt={item.product.title}
                              fill
                              sizes="64px"
                              className="object-cover rounded-[8px]"
                            />
                          </div>
                          <span className="absolute -top-2 -right-2 w-5 h-5 grid place-items-center rounded-full bg-[#636363] text-white text-[11px] font-bold shadow">
                            {item.quantity}
                          </span>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#1a1a1a] leading-snug">{item.product.title}</p>
                          <p className="text-[12px] text-[#636363] mt-0.5">
                            {item.size}
                            {item.dupatta ? ` / ${item.dupatta}` : ""}
                            {item.adOn ? ` / ${item.adOn}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-[14px] font-semibold text-[#1a1a1a] whitespace-nowrap">
                        {formatPricePkr(itemPrice * item.quantity)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-[#e1e1e1] mb-4" />

            {/* Discount row on sidebar */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative border border-[#b5b5b5] rounded-[5px] bg-white flex items-center">
                <Tag className="absolute left-3 w-4 h-4 text-[#636363]" />
                <input
                  type="text"
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-[13px] text-[#1a1a1a] bg-transparent outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="px-4 border border-[#b5b5b5] rounded-[5px] text-[13px] font-semibold text-[#1a1a1a] hover:bg-neutral-100 bg-white transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-[#e1e1e1] mb-4" />

            {/* Totals */}
            <div className="space-y-2.5 mb-4">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#636363]">Subtotal</span>
                <span className="font-medium text-[#1a1a1a]">{formatPricePkr(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[14px] text-green-700">
                  <span>Discount ({appliedDiscount?.code})</span>
                  <span>-{formatPricePkr(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[14px]">
                <span className="flex items-center gap-1 text-[#636363]">
                  Shipping <HelpCircle className="w-3.5 h-3.5 text-[#b5b5b5]" />
                </span>
                <span className="font-semibold text-[#1a1a1a]">
                  {shippingFee === 0 ? "Free" : formatPricePkr(shippingFee)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-[#e1e1e1] pt-4 flex items-baseline justify-between">
              <span className="text-[16px] font-semibold text-[#1a1a1a]">Total</span>
              <div className="text-right">
                <span className="text-[13px] text-[#636363] mr-1 font-medium">PKR</span>
                <span className="text-[24px] font-bold text-[#1a1a1a]">{formatPricePkr(totalAmount)}</span>
              </div>
            </div>
          </aside>
        </div>

        {/* ─── Mobile order summary accordion ─── */}
        <div className="lg:hidden border-t border-[#e1e1e1] bg-[#fafafa]">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
            className="w-full px-4 py-4 flex items-center justify-between text-[14px] font-semibold text-[#1a1a1a]"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#636363]" />
              {mobileSummaryOpen ? "Hide order summary" : "Show order summary"}
              {mobileSummaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
            <span className="text-[#1a1a1a] font-bold">{formatPricePkr(totalAmount)}</span>
          </button>

          {mobileSummaryOpen && (
            <div className="px-4 pb-4 space-y-4 border-t border-[#e1e1e1]">
              {displayItems.map((item) => {
                const itemPrice = item.unitPrice ?? item.product.price;
                return (
                  <div key={item.key} className="flex items-center justify-between gap-3 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 shrink-0">
                        <div className="w-14 h-14 rounded-[6px] border border-[#d9d9d9] bg-white overflow-hidden">
                          <Image src={item.product.image} alt={item.product.title} fill sizes="56px" className="object-cover" />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 grid place-items-center rounded-full bg-[#636363] text-white text-[11px] font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#1a1a1a]">{item.product.title}</p>
                        <p className="text-[11px] text-[#636363]">{item.size}</p>
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold">{formatPricePkr(itemPrice * item.quantity)}</span>
                  </div>
                );
              })}
              <div className="border-t border-[#e1e1e1] pt-3 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#636363]">Subtotal</span>
                  <span className="font-medium">{formatPricePkr(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#636363]">Shipping</span>
                  <span className="font-semibold">{shippingFee === 0 ? "Free" : formatPricePkr(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-[15px] font-bold pt-1 border-t border-[#e1e1e1]">
                  <span>Total</span>
                  <span>{formatPricePkr(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#e1e1e1] py-4 px-4 mt-6">
        <div className="mx-auto max-w-[1280px] flex justify-center">
          <Link href="/pages/policies" className="text-[12px] text-[#636363] hover:underline">
            Terms and policies
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ─── Outer wrapper providing Stripe Elements context ─── */
export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
