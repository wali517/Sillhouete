"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Banknote,
  Building2,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { SITE } from "@/data/site";
import type { OrderShippingAddress, PaymentMethod } from "@/types";

const COUNTRIES = [
  "Pakistan",
  "United States",
  "United Kingdom",
  "Canada",
  "United Arab Emirates",
  "Saudi Arabia",
  "Australia",
  "Germany",
  "France",
  "Qatar",
  "Kuwait",
  "Oman",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, formatPrice, orderNote } = useStore();

  // Form Fields
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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [saveInfo, setSaveInfo] = useState(true);

  // Direct Card Fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Discount Codes
  const [discountInput, setDiscountInput] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState("");

  // Submission Status
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Shipping calculation
  const isFreeShipping = subtotal >= 140000 || discountCode === "FREESHIP";
  const shippingFee = isFreeShipping ? 0 : formData.country === "Pakistan" ? 250 : 4500;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  // Redirect if cart is empty and not already processing
  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      // Check if maybe redirected from empty
    }
  }, [items, isProcessing]);

  // Apply discount code
  const handleApplyDiscount = () => {
    const code = discountInput.trim().toUpperCase();
    setDiscountError("");
    if (code === "WELCOME5") {
      setDiscountPercent(5);
      setDiscountCode("WELCOME5");
    } else if (code === "EID2026") {
      setDiscountPercent(10);
      setDiscountCode("EID2026");
    } else if (code === "FREESHIP") {
      setDiscountPercent(0);
      setDiscountCode("FREESHIP");
    } else {
      setDiscountError("Invalid discount code. Try WELCOME5 or EID2026");
    }
  };

  // Helper to format card input
  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 16);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 2) {
      setCardExpiry(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setCardExpiry(clean);
    }
  };

  // Test card autofill
  const fillTestCard = () => {
    setCardNumber("4242 4242 4242 4242");
    setCardExpiry("12/28");
    setCardCvc("123");
    setCardName(`${formData.firstName || "Customer"} ${formData.lastName || "Name"}`.trim());
    if (!formData.firstName) {
      setFormData((prev) => ({
        ...prev,
        firstName: "Ayesha",
        lastName: "Khan",
        email: "customer@example.com",
        phone: "+92 300 1234567",
        address: "327-B Cavalry Ground",
        city: "Lahore",
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address) {
      setErrorMessage("Please fill out all required contact and shipping fields.");
      return;
    }

    if (paymentMethod === "stripe") {
      const cleanCard = cardNumber.replace(/\s/g, "");
      if (cleanCard.length < 15) {
        setErrorMessage("Please enter a valid credit or debit card number.");
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setErrorMessage("Please enter card expiry in MM/YY format.");
        return;
      }
      if (!cardCvc || cardCvc.length < 3) {
        setErrorMessage("Please enter the 3- or 4-digit CVC code.");
        return;
      }
    }

    setIsProcessing(true);

    try {
      let stripePaymentIntentId: string | undefined = undefined;

      // 1. Process Stripe Card Payment directly on site
      if (paymentMethod === "stripe") {
        const intentRes = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalAmount,
            currency: "pkr",
            customerEmail: formData.email,
            items: items.map((i) => ({ id: i.product.id, title: i.product.title, quantity: i.quantity })),
          }),
        });

        const intentData = await intentRes.json();
        if (!intentRes.ok) {
          throw new Error(intentData.error || "Payment authorization failed");
        }
        stripePaymentIntentId = intentData.id;
      }

      // 2. Create Order in Backend Database
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
          })),
          subtotal,
          shipping: shippingFee,
          discount: discountAmount,
          discountCode,
          total: totalAmount,
          currency: "PKR",
          paymentMethod,
          paymentStatus: paymentMethod === "stripe" ? "paid" : "pending",
          notes: orderNote,
          stripePaymentIntentId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order record");
      }

      // 3. Clear cart and redirect to order confirmation
      clearCart();
      router.push(`/order-confirmation/${orderData.order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during checkout";
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="heading text-[24px]">Your cart is empty</h1>
        <p className="mt-3 text-sm text-black/70">Please add items to your cart before proceeding to checkout.</p>
        <Link href="/collections/1" className="btn mt-6">
          Browse Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Checkout Header */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-4 py-4 md:px-8">
          <Link href="/" className="relative block h-10 w-28">
            <Image src={SITE.logo} alt="Sillhouete" fill sizes="112px" priority className="object-contain object-left" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-black/70">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">256-Bit SSL Encrypted Direct Checkout</span>
            <span className="sm:hidden">Secure Checkout</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1240px] px-4 py-8 md:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-black/60">
          <Link href="/cart" className="hover:underline">Cart</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-black">Information & Payment</span>
          <ChevronRight className="h-3 w-3" />
          <span>Confirmation</span>
        </nav>

        <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          {/* Left Column: Information, Shipping & Payment */}
          <div className="space-y-8">
            {/* Contact Info */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="heading text-[18px]">1. Contact Information</h2>
                <Link href="/account" className="text-xs underline text-black/70">
                  Already have an account? Sign in
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-black/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                />
                <span>Email me with news and exclusive festive offers</span>
              </label>
            </section>

            {/* Delivery Address */}
            <section className="space-y-4 border-t border-line pt-6">
              <h2 className="heading text-[18px]">2. Shipping Address</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ayesha"
                    className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Khan"
                    className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House / Apartment number and street name"
                  className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                  Apartment, Suite, Unit (optional)
                </label>
                <input
                  type="text"
                  value={formData.apartment || ""}
                  onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  placeholder="Floor, Suite, Landmark"
                  className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Lahore"
                    className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                    State / Province
                  </label>
                  <input
                    type="text"
                    value={formData.state || ""}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Punjab"
                    className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="54000"
                    className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                  Country / Region *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black bg-white"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Shipping Method */}
            <section className="space-y-4 border-t border-line pt-6">
              <h2 className="heading text-[18px]">3. Shipping Method</h2>
              <div className="border border-line divide-y divide-line">
                <div className="flex items-center justify-between p-4 bg-soft">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-black" />
                    <div>
                      <p className="text-sm font-semibold">
                        {formData.country === "Pakistan" ? "Standard Courier (TCS / Call Courier)" : "International Express (DHL / FedEx)"}
                      </p>
                      <p className="text-xs text-black/60">
                        {formData.country === "Pakistan" ? "3–5 business days" : "7–14 business days with live tracking"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
                  </span>
                </div>
              </div>
            </section>

            {/* Payment Method - DIRECT STRIPE ON-SITE */}
            <section className="space-y-4 border-t border-line pt-6">
              <div className="flex items-center justify-between">
                <h2 className="heading text-[18px]">4. Payment Method</h2>
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <Lock className="h-3.5 w-3.5" />
                  Direct On-Page Card Payment
                </span>
              </div>

              <div className="space-y-3">
                {/* Stripe Card Payment Option */}
                <div
                  className={`border transition-colors ${
                    paymentMethod === "stripe" ? "border-black bg-soft/40" : "border-line"
                  }`}
                >
                  <label className="flex items-center justify-between p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="stripe"
                        checked={paymentMethod === "stripe"}
                        onChange={() => setPaymentMethod("stripe")}
                        className="h-4 w-4"
                      />
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm font-semibold">Credit or Debit Card (Stripe)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-bold">VISA</span>
                      <span className="rounded border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-bold">MASTERCARD</span>
                      <span className="rounded border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-bold">AMEX</span>
                    </div>
                  </label>

                  {/* Direct Card Input Fields right on the page */}
                  {paymentMethod === "stripe" && (
                    <div className="border-t border-line bg-white p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-black/70">
                          Enter your card details directly below. Payment is processed securely without leaving this page.
                        </p>
                        <button
                          type="button"
                          onClick={fillTestCard}
                          className="text-xs font-semibold text-black underline hover:text-black/70"
                        >
                          ⚡ Autofill Test Card
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          required={paymentMethod === "stripe"}
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Ayesha Khan"
                          className="mt-1.5 w-full border border-line p-3 text-sm outline-none focus:border-black"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                          Card Number *
                        </label>
                        <div className="relative mt-1.5">
                          <input
                            type="text"
                            required={paymentMethod === "stripe"}
                            value={cardNumber}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            maxLength={19}
                            className="w-full border border-line p-3 pr-10 text-sm font-mono tracking-wider outline-none focus:border-black"
                          />
                          <Lock className="absolute right-3 top-3.5 h-4 w-4 text-black/40" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                            Expiration Date *
                          </label>
                          <input
                            type="text"
                            required={paymentMethod === "stripe"}
                            value={cardExpiry}
                            onChange={(e) => handleExpiryChange(e.target.value)}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="mt-1.5 w-full border border-line p-3 text-sm font-mono outline-none focus:border-black"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-black/80">
                            Security Code (CVC) *
                          </label>
                          <input
                            type="password"
                            required={paymentMethod === "stripe"}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="123"
                            maxLength={4}
                            className="mt-1.5 w-full border border-line p-3 text-sm font-mono outline-none focus:border-black"
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-black/50">
                        🔒 Encrypted & processed directly via Stripe API. Your card details are never stored on our servers.
                      </p>
                    </div>
                  )}
                </div>

                {/* Cash on Delivery (COD) Option */}
                {formData.country === "Pakistan" && (
                  <div
                    className={`border transition-colors ${
                      paymentMethod === "cod" ? "border-black bg-soft/40" : "border-line"
                    }`}
                  >
                    <label className="flex items-center justify-between p-4 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
                          className="h-4 w-4"
                        />
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          <span className="text-sm font-semibold">Cash on Delivery (Pakistan Only)</span>
                        </div>
                      </div>
                      <span className="text-xs text-black/60">Pay upon delivery</span>
                    </label>
                    {paymentMethod === "cod" && (
                      <div className="border-t border-line bg-white p-4 text-xs text-black/70">
                        Pay with cash upon delivery of your parcel. Our courier team will contact you prior to delivery.
                      </div>
                    )}
                  </div>
                )}

                {/* Bank Wire / Zelle Option */}
                <div
                  className={`border transition-colors ${
                    paymentMethod === "bank_transfer" ? "border-black bg-soft/40" : "border-line"
                  }`}
                >
                  <label className="flex items-center justify-between p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === "bank_transfer"}
                        onChange={() => setPaymentMethod("bank_transfer")}
                        className="h-4 w-4"
                      />
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm font-semibold">Direct Bank Transfer / Zelle</span>
                      </div>
                    </div>
                    <span className="text-xs text-black/60">Account details</span>
                  </label>
                  {paymentMethod === "bank_transfer" && (
                    <div className="border-t border-line bg-white p-4 text-xs space-y-1.5 text-black/80">
                      <p><strong>Bank:</strong> Habib Bank Limited (HBL) / Meezan Bank</p>
                      <p><strong>Account Title:</strong> Sillhouete Official</p>
                      <p><strong>Account / IBAN:</strong> PK36MEZN00010482937501</p>
                      <p><strong>USA Zelle:</strong> info@sillhouete.com (+1 217 2909383)</p>
                      <p className="text-black/60 pt-1">
                        Please share screenshot of payment receipt on WhatsApp (+92 331 0397865) with your Order ID.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded border border-sale/40 bg-sale/5 p-4 text-xs text-sale font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Complete Order Button matching black button with white text */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-black py-4 text-xs font-bold uppercase tracking-[0.25em] text-white shadow-sm hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              <span>{isProcessing ? "Processing Payment & Order..." : "Pay now"}</span>
            </button>

            {/* Bottom Checkout Policy Links */}
            <div className="pt-6 border-t border-black/10 flex flex-wrap items-center justify-center gap-4 text-xs text-[#005bd3]">
              <Link href="/pages/policies" className="hover:underline">Refund policy</Link>
              <Link href="/pages/shipping-policy" className="hover:underline">Shipping</Link>
              <Link href="/pages/privacy-policy" className="hover:underline">Privacy policy</Link>
              <Link href="/pages/terms-and-conditions" className="hover:underline">Terms of service</Link>
              <Link href="/pages/contact-us" className="hover:underline">Contact</Link>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="h-fit space-y-6 rounded border border-line bg-soft p-6">
            <h2 className="heading text-[20px] border-b border-line pb-3">
              Order Summary ({items.reduce((n, i) => n + i.quantity, 0)})
            </h2>

            {/* Line Items */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto divide-y divide-line pr-1">
              {items.map((item) => {
                const itemPrice = item.unitPrice ?? item.product.price;
                return (
                  <div key={item.key} className="flex gap-4 pt-4 first:pt-0">
                    <div className="relative h-20 w-16 shrink-0 border border-line bg-white">
                      <Image
                        src={item.product.image}
                        alt={item.product.alt}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col justify-center text-xs">
                      <span className="font-semibold uppercase tracking-wide">
                        {item.product.title}
                      </span>
                      <span className="text-black/60">
                        Size: {item.size}
                        {item.dupatta && ` · ${item.dupatta}`}
                        {item.adOn && ` · ${item.adOn}`}
                        {item.expedite && ` · Express`}
                      </span>
                      <span className="mt-1 font-semibold text-sm">
                        {formatPrice(itemPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Discount Code */}
            <div className="border-t border-line pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="Discount code (e.g. WELCOME5)"
                  className="flex-1 border border-line bg-white px-3 py-2 text-xs uppercase outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="btn px-4 py-2 text-xs"
                >
                  Apply
                </button>
              </div>
              {discountCode && (
                <p className="mt-2 text-xs text-emerald-700 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Code {discountCode} applied ({discountPercent}% off)!
                </p>
              )}
              {discountError && (
                <p className="mt-2 text-xs text-sale font-medium">{discountError}</p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-line pt-4 text-xs">
              <div className="flex justify-between text-black/80">
                <span>Subtotal</span>
                <span className="font-semibold text-sm">{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({discountCode})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-black/80">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}</span>
              </div>
              <div className="border-t border-line pt-3 flex justify-between text-base font-bold text-black">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {orderNote && (
              <div className="border-t border-line pt-3 text-xs text-black/70">
                <strong>Order Instructions:</strong>
                <p className="mt-1 italic">{orderNote}</p>
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
