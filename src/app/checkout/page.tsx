"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, HelpCircle, Lock, CreditCard } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { VisaBadge, MastercardBadge, AmexBadge, UnionPayBadge } from "@/components/ui/CardBadges";
import { SITE } from "@/data/site";
import type { OrderShippingAddress } from "@/types";

const COUNTRIES = [
  "Pakistan",
  "United States",
  "United Kingdom",
  "Canada",
  "United Arab Emirates",
  "Saudi Arabia",
  "Australia",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, orderNote } = useStore();

  // Contact & Delivery form data
  const [formData, setFormData] = useState<OrderShippingAddress>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "Lahore",
    state: "Punjab",
    postalCode: "54000",
    country: "Pakistan",
  });

  const [emailOffers, setEmailOffers] = useState(true);
  const [saveInfo, setSaveInfo] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"standard">("standard");
  const [paymentMethod, setPaymentMethod] = useState<
    "credit_card" | "payfast" | "pay_by_card" | "bank_deposit"
  >("bank_deposit");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  // Card fields if credit card selected
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Discount code
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [discountError, setDiscountError] = useState("");

  // Order processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Pricing calculations
  const discountAmount = appliedDiscount ? Math.round((subtotal * appliedDiscount.percent) / 100) : 0;
  const shippingFee = 0; // FREE as shown in screenshot
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const formatPricePkr = (amt: number) => {
    return `Rs ${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleApplyDiscount = () => {
    const code = discountCode.trim().toUpperCase();
    setDiscountError("");
    if (code === "WELCOME5") {
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

    if (!formData.email || !formData.firstName || !formData.lastName || !formData.address) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setIsProcessing(true);

    // If Credit card or Pay by card, authorize via Stripe endpoint
    if (paymentMethod === "credit_card" || paymentMethod === "pay_by_card") {
      if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
        setErrorMessage("Please complete all credit card details (Card number, Expiry, Security code, Name on card).");
        setIsProcessing(false);
        return;
      }

      try {
        const stripeRes = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalAmount,
            currency: "pkr",
            items: items.map((i) => ({ title: i.product.title, quantity: i.quantity })),
            customerEmail: formData.email,
          }),
        });
        const stripeData = await stripeRes.json();
        if (!stripeRes.ok) {
          throw new Error(stripeData.error || "Card processing failed. Please check your card info.");
        }
      } catch (stripeErr: unknown) {
        const sMsg = stripeErr instanceof Error ? stripeErr.message : "Card authorization failed";
        setErrorMessage(sMsg);
        setIsProcessing(false);
        return;
      }
    }

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: formData,
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
          paymentMethod,
          paymentStatus:
            paymentMethod === "credit_card" || paymentMethod === "pay_by_card" ? "paid" : "pending",
          notes: orderNote,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      clearCart();
      router.push(`/order-confirmation/${orderData.order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during order submission";
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };

  // Fallback demo item if cart empty for instant preview matching screenshot
  const displayItems =
    items.length > 0
      ? items
      : [
          {
            key: "demo-item",
            product: {
              id: "9471754830067",
              handle: "nyah",
              title: "Nyah",
              price: 69900,
              priceFrom: false,
              image:
                "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/3_96e35d3b-86a2-48a6-b414-26f8626b260c.png?v=1740993687",
              hoverImage:
                "https://cdn.shopify.com/s/files/1/0709/7755/2627/files/3_96e35d3b-86a2-48a6-b414-26f8626b260c.png?v=1740993687",
              alt: "Nyah",
              ratio: 1.35,
            },
            size: "XS",
            dupatta: "None",
            adOn: "None",
            expedite: false,
            unitPrice: 69900,
            quantity: 1,
          },
        ];

  const currentSubtotal = items.length > 0 ? subtotal : 69900;
  const currentTotal = Math.max(0, currentSubtotal - discountAmount + shippingFee);

  return (
    <div className="min-h-screen bg-white text-[#333333] font-serif antialiased text-sm">
      {/* 1. Header with centered logo & right bag icon matching media_1792669523423_68b2c274.png */}
      <header className="border-b border-neutral-200 py-5 px-4 md:px-12 bg-white">
        <div className="mx-auto max-w-[1180px] flex items-center justify-between">
          <div className="w-8" />
          <Link href="/" className="flex flex-col items-center">
            {/* Calligraphy and English brand mark matching Sillhouete */}
            <span className="font-serif text-[18px] leading-none text-black select-none">سلوٹ</span>
            <span className="font-serif text-[26px] md:text-[30px] font-bold tracking-[0.05em] text-black">
              Sillhouete
            </span>
          </Link>
          <Link href="/cart" className="text-black hover:opacity-75 transition-opacity" aria-label="Cart">
            <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
          </Link>
        </div>
      </header>

      {/* 2. Main 2-Column Shopify Layout */}
      <div className="mx-auto max-w-[1180px] px-4 md:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-start">
          {/* LEFT COLUMN: Customer Information, Delivery, Shipping, Payment, Billing */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[17px] font-semibold text-black">Contact</h2>
                <Link href="/account" className="text-xs text-[#005bd3] hover:underline">
                  Sign in
                </Link>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Email or mobile phone number"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-11 px-3.5 pr-10 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] transition-all bg-white"
                />
                <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              </div>

              <label className="mt-2.5 flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={emailOffers}
                  onChange={(e) => setEmailOffers(e.target.checked)}
                  className="h-4 w-4 rounded-[4px] border-neutral-300 text-[#005bd3] focus:ring-[#005bd3] accent-[#005bd3]"
                />
                <span className="text-xs text-neutral-800">Email me with news and offers</span>
              </label>
            </div>

            {/* Delivery Section */}
            <div className="pt-2">
              <h2 className="text-[17px] font-semibold text-black mb-3">Delivery</h2>

              <div className="space-y-3">
                {/* Country/Region dropdown */}
                <div className="border border-neutral-300 rounded-[5px] px-3.5 py-1.5 bg-white focus-within:border-[#005bd3] focus-within:ring-1 focus-within:ring-[#005bd3]">
                  <label className="block text-[10px] text-neutral-500 leading-tight">Country/Region</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full text-sm font-normal text-black bg-transparent outline-none cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* First name & Last name */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] transition-all bg-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] transition-all bg-white"
                  />
                </div>

                {/* Address */}
                <input
                  type="text"
                  required
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] transition-all bg-white"
                />

                {/* Apartment (optional) */}
                <input
                  type="text"
                  placeholder="Apartment, suite, etc. (optional)"
                  value={formData.apartment || ""}
                  onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  className="w-full h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] transition-all bg-white"
                />

                {/* City & Postal code */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] transition-all bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Postal code (optional)"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] transition-all bg-white"
                  />
                </div>

                {/* Phone */}
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-11 px-3.5 pr-10 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] transition-all bg-white"
                  />
                  <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                </div>

                {/* Save info */}
                <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    className="h-4 w-4 rounded-[4px] border-neutral-300 text-[#005bd3] focus:ring-[#005bd3] accent-[#005bd3]"
                  />
                  <span className="text-xs text-neutral-800">Save this information for next time</span>
                </label>
              </div>
            </div>

            {/* Shipping method */}
            <div className="pt-2">
              <h2 className="text-[15px] font-semibold text-black mb-2.5">Shipping method</h2>
              <div className="border-2 border-[#005bd3] rounded-[6px] bg-[#f8faff] p-3.5 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="shipping_method"
                    checked={shippingMethod === "standard"}
                    onChange={() => setShippingMethod("standard")}
                    className="h-4 w-4 accent-[#005bd3] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-black">Standard</span>
                </label>
                <span className="text-xs font-bold text-black">FREE</span>
              </div>
            </div>

            {/* Payment Section matching frame by frame */}
            <div className="pt-2">
              <h2 className="text-[17px] font-semibold text-black">Payment</h2>
              <p className="text-xs text-neutral-500 mb-3">All transactions are secure and encrypted.</p>

              {/* Stacked Payment Options Box */}
              <div className="border border-neutral-300 rounded-[6px] overflow-hidden divide-y divide-neutral-200 bg-white">
                {/* 1. Credit card */}
                <div className="transition-all">
                  <div
                    onClick={() => setPaymentMethod("credit_card")}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                      paymentMethod === "credit_card" ? "bg-[#f8faff]" : "hover:bg-neutral-50"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === "credit_card"}
                        onChange={() => setPaymentMethod("credit_card")}
                        className="h-4 w-4 accent-[#005bd3] cursor-pointer"
                      />
                      <span className="text-xs font-medium text-black">Credit card</span>
                    </label>
                    {/* Real SVG Badges: Visa, Mastercard, Amex, +1 */}
                    <div className="flex items-center gap-1.5">
                      <VisaBadge className="h-5 w-8" />
                      <MastercardBadge className="h-5 w-8" />
                      <AmexBadge className="h-5 w-8" />
                      <span className="inline-flex items-center justify-center bg-neutral-100 border border-neutral-300 text-neutral-600 px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold h-5">
                        +1
                      </span>
                    </div>
                  </div>

                  {/* Embedded Credit Card Inputs */}
                  {paymentMethod === "credit_card" && (
                    <div className="border-t border-neutral-200 bg-[#fbfbfb] p-4 space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Card number"
                          value={cardNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                            setCardNumber(val.replace(/(\d{4})(?=\d)/g, "$1 "));
                          }}
                          className="w-full h-11 px-3.5 pr-10 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] bg-white font-mono"
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Expiration date (MM / YY)"
                          value={cardExpiry}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                            if (val.length >= 3) {
                              setCardExpiry(`${val.slice(0, 2)} / ${val.slice(2)}`);
                            } else {
                              setCardExpiry(val);
                            }
                          }}
                          className="h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] bg-white"
                        />
                        <div className="relative">
                          <input
                            type="password"
                            required
                            maxLength={4}
                            placeholder="Security code (CVV)"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            className="w-full h-11 px-3.5 pr-10 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] bg-white font-mono"
                          />
                          <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        </div>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* 2. PAYFAST */}
                <div
                  onClick={() => setPaymentMethod("payfast")}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    paymentMethod === "payfast" ? "bg-[#f8faff]" : "hover:bg-neutral-50"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === "payfast"}
                      onChange={() => setPaymentMethod("payfast")}
                      className="h-4 w-4 accent-[#005bd3] cursor-pointer"
                    />
                    <span className="text-xs font-medium text-black">
                      PAYFAST(Pay via Debit/Credit/Wallet/Bank Account)
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <VisaBadge className="h-5 w-8" />
                    <MastercardBadge className="h-5 w-8" />
                    <UnionPayBadge className="h-5 w-8" />
                  </div>
                </div>

                {/* 3. Pay by card */}
                <div className="transition-all">
                  <div
                    onClick={() => setPaymentMethod("pay_by_card")}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                      paymentMethod === "pay_by_card" ? "bg-[#f8faff]" : "hover:bg-neutral-50"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === "pay_by_card"}
                        onChange={() => setPaymentMethod("pay_by_card")}
                        className="h-4 w-4 accent-[#005bd3] cursor-pointer"
                      />
                      <span className="text-xs font-medium text-black">Pay by card</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <VisaBadge className="h-5 w-8" />
                      <MastercardBadge className="h-5 w-8" />
                      <AmexBadge className="h-5 w-8" />
                      <span className="inline-flex items-center justify-center bg-neutral-100 border border-neutral-300 text-neutral-600 px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold h-5">
                        +1
                      </span>
                    </div>
                  </div>

                  {paymentMethod === "pay_by_card" && (
                    <div className="border-t border-neutral-200 bg-[#fbfbfb] p-4 space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Card number"
                          value={cardNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                            setCardNumber(val.replace(/(\d{4})(?=\d)/g, "$1 "));
                          }}
                          className="w-full h-11 px-3.5 pr-10 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] bg-white font-mono"
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Expiration date (MM / YY)"
                          value={cardExpiry}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                            if (val.length >= 3) {
                              setCardExpiry(`${val.slice(0, 2)} / ${val.slice(2)}`);
                            } else {
                              setCardExpiry(val);
                            }
                          }}
                          className="h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] bg-white"
                        />
                        <div className="relative">
                          <input
                            type="password"
                            required
                            maxLength={4}
                            placeholder="Security code (CVV)"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            className="w-full h-11 px-3.5 pr-10 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] bg-white font-mono"
                          />
                          <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        </div>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Bank Deposit - SELECTED in media_1792669523423_68b2c274.png */}
                <div className="transition-all">
                  <div
                    onClick={() => setPaymentMethod("bank_deposit")}
                    className={`p-3.5 flex items-center justify-between cursor-pointer border-2 ${
                      paymentMethod === "bank_deposit"
                        ? "border-[#005bd3] bg-[#f8faff]"
                        : "border-transparent hover:bg-neutral-50"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === "bank_deposit"}
                        onChange={() => setPaymentMethod("bank_deposit")}
                        className="h-4 w-4 accent-[#005bd3] cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-black">Bank Deposit</span>
                    </label>
                  </div>

                  {/* Bank Deposit Details Subpanel */}
                  {paymentMethod === "bank_deposit" && (
                    <div className="border-t border-neutral-200 bg-[#fbfbfb] p-4 text-xs text-neutral-800 space-y-1.5 leading-relaxed">
                      <p className="font-semibold text-black">Bank: Meezan Bank</p>
                      <p>
                        <span className="text-neutral-600">Ac title: </span>
                        <strong>SILLHOUETE</strong>
                      </p>
                      <p>
                        <span className="text-neutral-600">IBAN : </span>
                        <strong className="font-mono text-black">PK80MEZN0002160109517881</strong>
                      </p>
                      <p className="pt-1 text-neutral-700">
                        Please share screen shot on our official WhatsApp number so that we can proceed with your order.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Address Section */}
            <div className="pt-2">
              <h2 className="text-[17px] font-semibold text-black mb-2.5">Billing address</h2>
              <div className="border border-neutral-300 rounded-[6px] overflow-hidden divide-y divide-neutral-200 bg-white">
                <div
                  onClick={() => setBillingSameAsShipping(true)}
                  className={`p-3.5 flex items-center cursor-pointer border-2 ${
                    billingSameAsShipping ? "border-[#005bd3] bg-[#f8faff]" : "border-transparent"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="billing_address"
                      checked={billingSameAsShipping}
                      onChange={() => setBillingSameAsShipping(true)}
                      className="h-4 w-4 accent-[#005bd3] cursor-pointer"
                    />
                    <span className="text-xs font-medium text-black">Same as shipping address</span>
                  </label>
                </div>

                <div
                  onClick={() => setBillingSameAsShipping(false)}
                  className={`p-3.5 flex items-center cursor-pointer ${
                    !billingSameAsShipping ? "bg-[#f8faff]" : ""
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="billing_address"
                      checked={!billingSameAsShipping}
                      onChange={() => setBillingSameAsShipping(false)}
                      className="h-4 w-4 accent-[#005bd3] cursor-pointer"
                    />
                    <span className="text-xs font-normal text-black">Use a different billing address</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Error notice if any */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Complete order Button - Blue Shopify Button matching screenshot */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isProcessing}
                className="checkout-submit-btn w-full bg-[#005bd3] hover:bg-[#004bb0] text-white py-3.5 px-6 rounded-[6px] font-semibold text-[15px] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Complete order"}
              </button>
            </div>

            {/* Footer link */}
            <div className="pt-2">
              <Link href="/pages/policies" className="text-xs text-[#005bd3] hover:underline">
                Terms and policies
              </Link>
            </div>
          </form>

          {/* RIGHT COLUMN: Order Summary matching media_1792669523423_68b2c274.png */}
          <div className="lg:border-l lg:border-neutral-200 lg:pl-10 space-y-6">
            {/* Items list */}
            <div className="space-y-4">
              {displayItems.map((item) => {
                const itemPrice = item.unitPrice ?? item.product.price;
                return (
                  <div key={item.key} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Image Thumbnail with count badge on top right */}
                      <div className="relative h-16 w-16 rounded-[8px] border border-neutral-300 bg-white shrink-0 overflow-visible">
                        <Image
                          src={item.product.image}
                          alt={item.product.title}
                          fill
                          sizes="64px"
                          className="object-cover rounded-[8px]"
                        />
                        {/* Circular Black Badge with Quantity */}
                        <span className="absolute -top-2 -right-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-black text-white text-[11px] font-bold shadow">
                          {item.quantity}
                        </span>
                      </div>

                      {/* Title & Variants */}
                      <div>
                        <h3 className="text-xs md:text-sm font-semibold text-black leading-snug">
                          {item.product.title}
                        </h3>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {item.size} / {item.dupatta || "None"} / {item.adOn || "None"}
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right text-xs md:text-sm font-semibold text-black whitespace-nowrap">
                      {formatPricePkr(itemPrice * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Discount Code Input */}
            <div className="pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1 h-11 px-3.5 border border-neutral-300 rounded-[5px] text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="h-11 px-5 border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-[5px] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {discountError && <p className="mt-1 text-xs text-red-600">{discountError}</p>}
              {appliedDiscount && (
                <p className="mt-1 text-xs text-emerald-600 font-medium">
                  Code &ldquo;{appliedDiscount.code}&rdquo; applied ({appliedDiscount.percent}% off)
                </p>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-2.5 text-xs md:text-sm pt-2">
              <div className="flex justify-between text-neutral-700">
                <span>Subtotal</span>
                <span className="font-medium text-black">{formatPricePkr(currentSubtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatPricePkr(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-700 items-center">
                <span className="flex items-center gap-1">
                  <span>Shipping</span>
                  <HelpCircle className="h-3.5 w-3.5 text-neutral-400" />
                </span>
                <span className="font-semibold text-black uppercase tracking-wider text-xs">FREE</span>
              </div>
            </div>

            {/* Total Row */}
            <div className="border-t border-neutral-200 pt-4 flex items-baseline justify-between">
              <span className="text-[17px] font-semibold text-black">Total</span>
              <div className="text-right">
                <span className="text-[11px] text-neutral-500 mr-1.5 font-medium">PKR</span>
                <span className="text-[20px] font-bold text-black">{formatPricePkr(currentTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
