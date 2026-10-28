"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  Loader2,
  Home,
  ShoppingBag,
} from "lucide-react";
import type { Order } from "@/types";

function formatPricePkr(amt: number) {
  return `Rs. ${Math.round(amt).toLocaleString("en-US")}`;
}

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order) setOrder(d.order);
        else setError("Order not found.");
      })
      .catch(() => setError("Failed to load order."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#005bd3]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Package className="w-14 h-14 text-neutral-400" />
        <h1 className="text-xl font-semibold text-neutral-800">{error || "Order not found"}</h1>
        <p className="text-sm text-neutral-500">
          If you just placed an order, please check your email or contact us.
        </p>
        <Link
          href="/"
          className="mt-4 px-6 py-3 bg-[#005bd3] text-white rounded-[5px] text-sm font-semibold hover:bg-[#0056c7] transition-colors"
        >
          Return to store
        </Link>
      </div>
    );
  }

  // Keep support for legacy payment-method values stored in older orders.
  const paymentMethod = order.paymentMethod as string;
  const isBankDeposit =
    paymentMethod === "bank_transfer" || paymentMethod === "bank_deposit";
  const isPaid = order.paymentStatus === "paid";

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* Header */}
      <header className="border-b border-[#e1e1e1]">
        <div className="mx-auto max-w-[680px] px-4 py-5 flex items-center justify-between">
          <Link href="/" className="flex flex-col items-center leading-none select-none">
            <span className="text-[12px] text-black" style={{ fontFamily: "serif" }}>
              سلوٹ
            </span>
            <span
              className="text-[22px] font-semibold tracking-[0.04em] text-black"
              style={{ fontFamily: "serif" }}
            >
              Sillhouete
            </span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-[680px] px-4 py-10">
        {/* ── Success Banner ── */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-[60px] h-[60px] rounded-full bg-[#e8f0fe] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#005bd3]" />
          </div>
          <p className="text-[13px] text-[#636363] font-medium mb-1">
            Order #{order.id?.slice(-8)?.toUpperCase()}
          </p>
          <h1 className="text-[28px] font-bold text-[#1a1a1a] leading-tight">
            Thank you, {order.shippingAddress?.firstName}!
          </h1>
          {isBankDeposit && (
            <div className="mt-4 p-4 bg-[#fff8e1] border border-[#ffe082] rounded-[8px] text-left max-w-[480px]">
              <p className="text-[14px] font-semibold text-[#7c6000] mb-1">
                ⚠ Bank Deposit — Action Required
              </p>
              <p className="text-[13px] text-[#7c6000] leading-relaxed">
                Your order is confirmed. Please transfer{" "}
                <strong>{formatPricePkr(order.total)}</strong> to:
              </p>
              <div className="mt-2 text-[13px] font-mono text-[#1a1a1a] space-y-0.5">
                <p>Bank: <strong>Meezan Bank</strong></p>
                <p>Account Title: <strong>SILLHOUETE</strong></p>
                <p>IBAN: <strong>PK80MEZN0002160109517881</strong></p>
              </div>
              <p className="mt-2 text-[12px] text-[#7c6000]">
                Share payment screenshot on WhatsApp to confirm your order.
              </p>
            </div>
          )}
          {isPaid && !isBankDeposit && (
            <p className="mt-3 text-[14px] text-[#1a1a1a]">
              Your payment was confirmed and your order is being prepared.
            </p>
          )}
        </div>

        {/* ── Customer info card ── */}
        <div className="border border-[#e1e1e1] rounded-[8px] overflow-hidden mb-6">
          {/* Order items */}
          <div className="p-4 border-b border-[#e1e1e1]">
            <h2 className="text-[13px] font-semibold text-[#636363] uppercase tracking-wide mb-3">
              Items ordered
            </h2>
            <div className="space-y-4">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="relative w-14 h-14 shrink-0">
                    <div className="w-14 h-14 rounded-[6px] border border-[#e1e1e1] overflow-hidden bg-neutral-50">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 grid place-items-center rounded-full bg-[#636363] text-white text-[11px] font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1a1a1a] truncate">{item.title}</p>
                    <p className="text-[12px] text-[#636363]">
                      {item.size}
                      {item.dupatta ? ` / ${item.dupatta}` : ""}
                      {item.adOn ? ` / ${item.adOn}` : ""}
                    </p>
                  </div>
                  <span className="text-[14px] font-semibold text-[#1a1a1a] whitespace-nowrap">
                    {formatPricePkr((item.price ?? 0) * (item.quantity ?? 1))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-4 border-b border-[#e1e1e1] space-y-2">
            <div className="flex justify-between text-[13px] text-[#636363]">
              <span>Subtotal</span>
              <span className="text-[#1a1a1a] font-medium">{formatPricePkr(order.subtotal ?? 0)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[13px] text-green-700">
                <span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span>
                <span>-{formatPricePkr(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[13px] text-[#636363]">
              <span>Shipping</span>
              <span className="text-[#1a1a1a] font-semibold">
                {(order.shipping ?? 0) === 0 ? "Free" : formatPricePkr(order.shipping)}
              </span>
            </div>
            <div className="flex justify-between text-[15px] font-bold text-[#1a1a1a] pt-2 border-t border-[#e1e1e1]">
              <span>Total</span>
              <span>
                <span className="text-[12px] font-medium text-[#636363] mr-1">PKR</span>
                {formatPricePkr(order.total)}
              </span>
            </div>
          </div>

          {/* Two-column: Contact + Ship + Payment */}
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#e1e1e1]">
            {/* Contact */}
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingBag className="w-3.5 h-3.5 text-[#636363]" />
                <span className="text-[12px] font-semibold text-[#636363] uppercase tracking-wide">Contact</span>
              </div>
              <p className="text-[13px] text-[#1a1a1a]">{order.shippingAddress?.email}</p>
              <p className="text-[13px] text-[#1a1a1a]">{order.shippingAddress?.phone}</p>
            </div>

            {/* Shipping Address */}
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-[#636363]" />
                <span className="text-[12px] font-semibold text-[#636363] uppercase tracking-wide">Ship to</span>
              </div>
              <p className="text-[13px] text-[#1a1a1a] leading-relaxed">
                {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                <br />
                {order.shippingAddress?.address}
                {order.shippingAddress?.apartment ? `, ${order.shippingAddress.apartment}` : ""}
                <br />
                {order.shippingAddress?.city}
                {order.shippingAddress?.postalCode ? ` ${order.shippingAddress.postalCode}` : ""}
                <br />
                {order.shippingAddress?.country}
              </p>
            </div>

            {/* Payment */}
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <CreditCard className="w-3.5 h-3.5 text-[#636363]" />
                <span className="text-[12px] font-semibold text-[#636363] uppercase tracking-wide">Payment</span>
              </div>
              <p className="text-[13px] text-[#1a1a1a] capitalize">
                {isBankDeposit
                  ? "Bank Deposit"
                  : paymentMethod === "payfast"
                  ? "PAYFAST"
                  : "Card"}
              </p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                  isPaid
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isPaid ? "Paid" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-[#005bd3] text-white rounded-[5px] text-[14px] font-semibold hover:bg-[#0056c7] transition-colors"
          >
            <Home className="w-4 h-4" />
            Continue shopping
          </Link>
          <Link
            href="/collections/1"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 border border-[#b5b5b5] text-[#1a1a1a] rounded-[5px] text-[14px] font-semibold hover:bg-neutral-50 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse more
          </Link>
        </div>

        {/* Help text */}
        <p className="mt-6 text-center text-[12px] text-[#636363]">
          Need help?{" "}
          <Link href="/pages/contact" className="text-[#005bd3] hover:underline">
            Contact us
          </Link>{" "}
          or WhatsApp us at{" "}
          <a href="https://wa.me/923001234567" className="text-[#005bd3] hover:underline">
            +92 300 1234567
          </a>
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e1e1e1] mt-12 py-4 text-center">
        <Link href="/pages/policies" className="text-[12px] text-[#636363] hover:underline">
          Terms and policies
        </Link>
      </footer>
    </div>
  );
}
