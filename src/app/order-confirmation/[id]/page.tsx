"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  Loader2,
  Home,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import type { Order } from "@/types";
import { useStore } from "@/components/providers/StoreProvider";

function formatPricePkr(amt: number) {
  return `Rs. ${Math.round(amt).toLocaleString("en-US")}`;
}

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");

  // Clear cart whenever an order confirmation page is reached
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const syncPaymentStatus = async (oid: string, piId?: string) => {
    try {
      const res = await fetch("/api/stripe/sync-payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: oid, paymentIntentId: piId }),
      });
      const data = await res.json();
      if (res.ok && data.order && data.synced) {
        setOrder(data.order);
        return true;
      }
    } catch {
      // Silent — webhook or next poll will handle it
    }
    return false;
  };

  const fetchOrder = async (syncIfPending = false) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
        // If stripe payment is still pending, immediately ask the server to verify
        // the PaymentIntent directly with Stripe API (no webhook required)
        if (
          syncIfPending &&
          (data.order.paymentMethod === "stripe" || data.order.paymentMethod === "credit_card") &&
          (data.order.paymentStatus === "pending" || data.order.paymentStatus === "processing") &&
          data.order.status !== "cancelled"
        ) {
          await syncPaymentStatus(data.order.id, data.order.stripePaymentIntentId);
        }
      } else {
        setError("Order not found.");
      }
    } catch {
      setError("Failed to load order.");
    } finally {
      setLoading(false);
    }
  };

  // On first load: fetch order then immediately sync with Stripe if pending
  useEffect(() => {
    fetchOrder(true);
  }, [id]);

  // Continue polling every 3s for up to 30s as a backup (in case sync needs a moment)
  useEffect(() => {
    if (!order) return;
    const isCard = order.paymentMethod === "credit_card" || order.paymentMethod === "stripe";
    const isUnsettled = order.paymentStatus === "pending" || order.paymentStatus === "processing";
    if (isCard && isUnsettled && order.status !== "cancelled") {
      const pollTimer = setInterval(async () => {
        // Try direct Stripe sync first; fall back to fetching order
        const synced = await syncPaymentStatus(order.id, order.stripePaymentIntentId);
        if (!synced) fetchOrder(false);
      }, 3000);
      const stopTimer = setTimeout(() => {
        clearInterval(pollTimer);
      }, 30000);
      return () => {
        clearInterval(pollTimer);
        clearTimeout(stopTimer);
      };
    }
  }, [order?.paymentStatus, order?.status]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Are you sure you want to cancel this order? If already paid, an automatic refund will be requested immediately via Stripe.")) {
      return;
    }

    setCancelling(true);
    setCancelMessage("");
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: order.customer?.email || order.shippingAddress?.email,
          reason: "Customer requested cancellation via confirmation page",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order.");
      }

      setCancelMessage(data.message || "Order has been cancelled.");
      await fetchOrder();
    } catch (err: unknown) {
      setCancelMessage(err instanceof Error ? err.message : "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

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

  const paymentMethod = order.paymentMethod as string;
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
            Order #{order.orderNumber || order.id?.slice(-8)?.toUpperCase()}
          </p>
          <h1 className="text-[28px] font-bold text-[#1a1a1a] leading-tight">
            Thank you, {order.shippingAddress?.firstName}!
          </h1>

          {order.status === "cancelled" ? (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-[8px] text-left max-w-[520px]">
              <p className="text-[14px] font-semibold text-red-800 mb-1 flex items-center gap-1.5">
                <span>✕</span> Order Cancelled
              </p>
              <p className="text-[13px] text-red-700 leading-relaxed">
                {order.cancellationReason || "This order was cancelled."}
              </p>
              {order.refundAmount && order.refundAmount > 0 ? (
                <div className="mt-2.5 pt-2 border-t border-red-200 text-[12.5px] text-red-800 space-y-1">
                  <p>
                    <strong>Automatic Refund Initiated:</strong> Rs. {order.refundAmount.toLocaleString()} via Stripe
                  </p>
                  {order.refundId && (
                    <p className="font-mono text-[11px] text-red-700">
                      Stripe Refund ID: {order.refundId}
                    </p>
                  )}
                  <p className="text-[12px] text-neutral-600 mt-1 italic">
                    Note: Funds are credited directly back to your original payment card. Depending on your issuing bank, this typically reflects on your statement within 5–10 business days.
                  </p>
                </div>
              ) : order.refundStatus === "refund_failed" ? (
                <p className="mt-2 text-[12px] text-amber-800">
                  Refund notice: {order.refundFailureReason || "Refund pending administrator review."}
                </p>
              ) : (
                <p className="mt-1 text-[12px] text-neutral-600">
                  This order was cancelled before payment was captured. No charge was applied.
                </p>
              )}
            </div>
          ) : isPaid ? (
            <div className="mt-3 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full text-[13px] font-medium border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Stripe Payment Confirmed · Verified by Card Network</span>
            </div>
          ) : order.paymentStatus === "failed" ? (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-[6px] text-red-700 text-[13px]">
              <p className="font-medium">Payment could not be completed.</p>
              <p className="text-[12px] mt-0.5">{order.failureReason || "Card was declined."}</p>
              <Link
                href="/checkout"
                className="inline-block mt-2 px-3 py-1 bg-red-600 text-white rounded text-[12px] font-medium hover:bg-red-700"
              >
                Return to checkout & retry
              </Link>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-[13px] text-amber-800 bg-amber-50 px-3.5 py-1.5 rounded-full font-medium border border-amber-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
              <span>Payment processing · Verifying transaction with card network...</span>
            </div>
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

          {/* Three-column: Contact + Ship + Payment */}
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
                Credit card (Stripe)
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
              {order.stripePaymentIntentId && (
                <p className="text-[10px] text-neutral-400 font-mono mt-1 truncate">
                  ID: {order.stripePaymentIntentId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Self-Service Cancellation Option */}
        {order.status !== "cancelled" && order.status !== "shipped" && order.status !== "delivered" && (
          <div className="mb-6 p-4 rounded-[8px] border border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-neutral-800">Need to cancel this order?</p>
              <p className="text-[12px] text-neutral-500">
                {isPaid
                  ? "Eligible paid orders will automatically be refunded through Stripe."
                  : "You can cancel your order before fulfillment."}
              </p>
              {cancelMessage && <p className="text-[12px] text-blue-700 mt-1 font-medium">{cancelMessage}</p>}
            </div>
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-3.5 py-1.5 border border-red-300 text-red-600 rounded-[5px] text-[12.5px] font-medium hover:bg-red-50 disabled:opacity-50 cursor-pointer shrink-0 transition-colors"
            >
              {cancelling ? "Processing..." : "Cancel Order"}
            </button>
          </div>
        )}

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
            href="/collections/pret"
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
          <a href="https://wa.me/923310397865" className="text-[#005bd3] hover:underline">
            +92 331 0397865
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
