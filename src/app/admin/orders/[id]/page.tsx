"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Printer,
  Package,
  CreditCard,
  MapPin,
  User,
  Truck,
  CheckCircle,
  RotateCcw,
  AlertCircle,
  Mail,
  Send,
  RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Order, NotificationRecord } from "@/types";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_OPTIONS = [
  "pending",
  "processing",
  "paid",
  "failed",
  "partially_refunded",
  "refunded",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  partially_refunded: "bg-purple-100 text-purple-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [newTracking, setNewTracking] = useState("");
  const [newCourier, setNewCourier] = useState("");
  const [newTrackingUrl, setNewTrackingUrl] = useState("");
  const [newShippingDate, setNewShippingDate] = useState("");
  const [newEstimatedDelivery, setNewEstimatedDelivery] = useState("");

  // Notification state
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [retryingNotifId, setRetryingNotifId] = useState<string | null>(null);

  // Refund state
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("requested_by_customer");
  const [refunding, setRefunding] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/orders/${id}`);
      const d = await res.json();
      if (d.order) {
        setOrder(d.order);
        setNewStatus(d.order.status);
        setNewPaymentStatus(d.order.paymentStatus);
        setNewTracking(d.order.trackingNumber || "");
        setNewCourier(d.order.courier || "");
        setNewTrackingUrl(d.order.trackingUrl || "");
        setNewShippingDate(d.order.shippingDate ? d.order.shippingDate.slice(0, 10) : "");
        setNewEstimatedDelivery(d.order.estimatedDeliveryDate || "");
        const remaining = Math.max(0, d.order.total - (d.order.refundAmount || 0));
        setRefundAmount(remaining.toString());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    // Fetch notification history for this order
    try {
      const nRes = await fetch(`/api/admin/orders/${id}/notifications`);
      const nData = await nRes.json();
      if (Array.isArray(nData.notifications)) {
        setNotifications(nData.notifications);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
          trackingNumber: newTracking,
          courier: newCourier,
          trackingUrl: newTrackingUrl,
          shippingDate: newShippingDate || undefined,
          estimatedDeliveryDate: newEstimatedDelivery,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setOrder(data.order);
      showToast("Order status & tracking updated successfully");
      await fetchOrder();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order";
      showToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRetryNotification = async (notificationId: string) => {
    setRetryingNotifId(notificationId);
    try {
      const res = await fetch(`/api/admin/orders/${id}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retry failed");
      showToast(data.message || "Notification re-sent successfully.");
      await fetchOrder();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Notification retry failed.");
    } finally {
      setRetryingNotifId(null);
    }
  };

  const handleInitiateRefund = async () => {
    if (!order) return;
    const amountNum = Number(refundAmount);
    const existingRefund = order.refundAmount || 0;
    const remaining = Math.max(0, order.total - existingRefund);

    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid refund amount.");
      return;
    }
    if (amountNum > remaining) {
      showToast(`Refund amount cannot exceed remaining balance (${formatPrice(remaining)}).`);
      return;
    }

    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          reason: refundReason,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Refund initiation failed.");

      showToast(`Refund of ${formatPrice(amountNum)} processed successfully with Stripe.`);
      setShowRefundConfirm(false);
      await fetchOrder();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Refund failed";
      showToast(msg);
    } finally {
      setRefunding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Order not found</p>
        <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const existingRefund = order.refundAmount || 0;
  const remainingRefundBalance = Math.max(0, order.total - existingRefund);
  const canRefund =
    !!order.stripePaymentIntentId &&
    (order.paymentStatus === "paid" || order.paymentStatus === "partially_refunded") &&
    remainingRefundBalance > 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">#{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
              STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {order.status}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
              PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-700"
            }`}
          >
            {order.paymentStatus.replace("_", " ")}
          </span>
          {order.refundStatus && order.refundStatus !== "none" && (
            <span className="rounded-full px-3 py-1 text-xs font-bold uppercase bg-purple-100 text-purple-800">
              {order.refundStatus} Refund
            </span>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items + Totals + Status Updates + Refund Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4" /> Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  {item.image && (
                    <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Size: {item.size} · Qty: {item.quantity}
                      {item.dupatta && ` · Dupatta: ${item.dupatta}`}
                      {item.adOn && ` · Add-on: ${item.adOn}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatPrice(item.price)} each
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount {order.discountCode && `(${order.discountCode})`}</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>
                  {formatPrice(order.total)} {order.currency}
                </span>
              </div>
              {existingRefund > 0 && (
                <div className="flex justify-between text-sm font-semibold text-purple-700 pt-1 border-t border-purple-100">
                  <span>Total Refunded</span>
                  <span>
                    -{formatPrice(existingRefund)} {order.currency}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stripe Refund Processing Workflow */}
          {canRefund && (
            <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-purple-600" />
                  <span>Stripe Refund Management</span>
                </h2>
                <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded font-medium">
                  Available Balance: {formatPrice(remainingRefundBalance)} {order.currency}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Initiate full or partial refunds directly through Stripe&apos;s server SDK. Funds
                will be credited back to the customer&apos;s original payment card.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Refund Amount ({order.currency})
                  </label>
                  <input
                    type="number"
                    max={remainingRefundBalance}
                    min="1"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => setRefundAmount(remainingRefundBalance.toString())}
                    className="text-[11px] text-purple-600 hover:underline mt-1"
                  >
                    Set to full balance ({formatPrice(remainingRefundBalance)})
                  </button>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Refund Reason
                  </label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-600"
                  >
                    <option value="requested_by_customer">Customer Request</option>
                    <option value="duplicate">Duplicate Charge</option>
                    <option value="fraudulent">Fraudulent Order</option>
                  </select>
                </div>
              </div>

              {!showRefundConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowRefundConfirm(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-md font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Initiate Refund
                </button>
              ) : (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                  <p className="text-xs text-purple-900 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-purple-600" />
                    Confirm refund of <strong>{formatPrice(Number(refundAmount))} {order.currency}</strong>?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleInitiateRefund}
                      disabled={refunding}
                      className="bg-purple-700 hover:bg-purple-800 text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors disabled:opacity-50"
                    >
                      {refunding ? "Processing Refund..." : "Yes, Process Refund"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRefundConfirm(false)}
                      className="border border-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded font-medium hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Update Status Form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Update Order Status &amp; Tracking
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Order Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-gray-400"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Payment Status
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-gray-400"
                >
                  {PAYMENT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ").charAt(0).toUpperCase() + s.replace("_", " ").slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Courier
                </label>
                <input
                  type="text"
                  value={newCourier}
                  onChange={(e) => setNewCourier(e.target.value)}
                  placeholder="e.g. TCS Express"
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={newTracking}
                  onChange={(e) => setNewTracking(e.target.value)}
                  placeholder="e.g. TCS-98421049"
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Clickable Tracking URL
                </label>
                <input
                  type="url"
                  value={newTrackingUrl}
                  onChange={(e) => setNewTrackingUrl(e.target.value)}
                  placeholder="https://tcsexpress.com/track/..."
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Shipping Date
                </label>
                <input
                  type="date"
                  value={newShippingDate}
                  onChange={(e) => setNewShippingDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Estimated Delivery Date
                </label>
                <input
                  type="text"
                  value={newEstimatedDelivery}
                  onChange={(e) => setNewEstimatedDelivery(e.target.value)}
                  placeholder="e.g. 3-5 business days"
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-gray-400"
                />
              </div>
            </div>
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="mt-4 bg-black text-white text-sm px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Right: Customer + Shipping + Detailed Stripe Payment History */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <User className="h-4 w-4" /> Customer Information
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-gray-900">{order.customer.name}</p>
              <p className="text-gray-500">{order.customer.email}</p>
              <p className="text-gray-500">{order.customer.phone || "No phone provided"}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" /> Shipping Address
            </h3>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium text-gray-900">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p>{order.shippingAddress.address}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>
                {order.shippingAddress.city}
                {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && (
                <p className="pt-1">{order.shippingAddress.phone}</p>
              )}
            </div>
          </div>

          {/* Comprehensive Stripe Payment History */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm border-b border-gray-100 pb-2">
              <CreditCard className="h-4 w-4" /> Stripe Payment Record
            </h3>
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium capitalize text-gray-900">
                  {order.paymentMethod === "stripe" ? "Stripe" : order.paymentMethod.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment Status</span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    PAYMENT_COLORS[order.paymentStatus]
                  }`}
                >
                  {order.paymentStatus.replace("_", " ")}
                </span>
              </div>

              {order.paidAt && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Payment Date</span>
                  <span className="text-gray-700">
                    {new Date(order.paidAt).toLocaleString()}
                  </span>
                </div>
              )}

              {order.amountPaid !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(order.amountPaid)} {order.currency}
                  </span>
                </div>
              )}

              {order.paymentDetails?.brand && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Card</span>
                  <span className="font-mono text-gray-800">
                    {order.paymentDetails.brand.toUpperCase()} •••• {order.paymentDetails.last4}
                  </span>
                </div>
              )}

              {order.stripeSessionId && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-gray-500">Stripe Checkout Session ID</p>
                  <p className="font-mono text-[11px] text-gray-700 break-all select-all">
                    {order.stripeSessionId}
                  </p>
                </div>
              )}

              {order.stripePaymentIntentId && (
                <div className="pt-1">
                  <p className="text-gray-500">Stripe PaymentIntent ID</p>
                  <p className="font-mono text-[11px] text-gray-700 break-all select-all">
                    {order.stripePaymentIntentId}
                  </p>
                </div>
              )}

              {order.stripeCustomerId && (
                <div className="pt-1">
                  <p className="text-gray-500">Stripe Customer ID</p>
                  <p className="font-mono text-[11px] text-gray-700 break-all select-all">
                    {order.stripeCustomerId}
                  </p>
                </div>
              )}

              {order.refundStatus && order.refundStatus !== "none" && (
                <div className="pt-2 border-t border-purple-100 text-purple-900 space-y-1">
                  <div className="flex justify-between">
                    <span>Refund Status</span>
                    <span className="font-bold uppercase text-[10px]">
                      {order.refundStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refunded Amount</span>
                    <span className="font-bold">
                      {formatPrice(order.refundAmount || 0)} {order.currency}
                    </span>
                  </div>
                  {order.refundId && (
                    <div>
                      <span className="text-gray-500">Refund ID:</span>
                      <p className="font-mono text-[10px] break-all">{order.refundId}</p>
                    </div>
                  )}
                  {order.refundedAt && (
                    <div className="text-[10px] text-gray-500">
                      Refunded on: {new Date(order.refundedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <Link
                  href={`/admin/payments/${order.id}`}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  View Detailed Payment & Refund Timeline &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Tracking */}
          {(order.trackingNumber || order.courier) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4" /> Tracking Information
              </h3>
              <div className="text-sm space-y-1">
                {order.courier && <p className="text-gray-600">{order.courier}</p>}
                {order.trackingNumber && (
                  <p className="font-mono font-semibold text-gray-900">
                    {order.trackingNumber}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
              <h3 className="font-semibold text-amber-900 mb-2 text-sm">Order Notes</h3>
              <p className="text-sm text-amber-800">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Notification History Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-700" />
            <h3 className="font-semibold text-gray-900 text-sm">Customer Email Notification History</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {notifications.length} logged
            </span>
          </div>
          <button
            type="button"
            onClick={fetchOrder}
            className="text-xs text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh History
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            No customer email notifications dispatched yet for this order.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Delivery Status</th>
                  <th className="py-2.5 px-3 text-center">Attempts</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-gray-900 capitalize">
                      {n.type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-3 text-gray-600">{n.recipient}</td>
                    <td className="py-3 px-3 text-gray-800 max-w-[220px] truncate" title={n.subject}>
                      {n.subject}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          n.status === "sent"
                            ? "bg-emerald-100 text-emerald-800"
                            : n.status === "simulated"
                            ? "bg-blue-100 text-blue-800"
                            : n.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {n.status}
                      </span>
                      {n.lastError && (
                        <p className="text-[10px] text-red-600 mt-0.5 max-w-[180px] truncate" title={n.lastError}>
                          {n.lastError}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-gray-600">{n.attempts || 1}</td>
                    <td className="py-3 px-3 text-gray-500">
                      {n.sentAt ? new Date(n.sentAt).toLocaleString() : new Date(n.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {(n.status === "failed" || n.status === "simulated") && (
                        <button
                          type="button"
                          onClick={() => handleRetryNotification(n.id)}
                          disabled={retryingNotifId === n.id}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          {retryingNotifId === n.id ? "Retrying..." : "Retry"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
