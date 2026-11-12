"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Package,
  User,
  ExternalLink,
  RefreshCw,
  Ban,
  Receipt,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/types";

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  processing: "bg-blue-100 text-blue-800 border-blue-300",
  succeeded: "bg-emerald-100 text-emerald-800 border-emerald-300",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-300",
  failed: "bg-red-100 text-red-800 border-red-300",
  cancelled: "bg-neutral-100 text-neutral-800 border-neutral-300",
};

const REFUND_STATUS_COLORS: Record<string, string> = {
  none: "text-neutral-400 bg-neutral-50 border-neutral-200",
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  processing: "bg-blue-100 text-blue-800 border-blue-300",
  partially_refunded: "bg-purple-100 text-purple-800 border-purple-300",
  refunded: "bg-neutral-200 text-neutral-800 border-neutral-300",
  refund_failed: "bg-red-100 text-red-800 border-red-300",
};

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Partial Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmountInput, setRefundAmountInput] = useState("");
  const [refundReasonInput, setRefundReasonInput] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchPayment = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
      } else {
        setError("Payment or order not found.");
      }
    } catch {
      setError("Failed to load payment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    let active = true;
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.order) {
          setOrder(data.order);
        } else {
          setError("Payment or order not found.");
        }
      })
      .catch(() => {
        if (active) setError("Failed to load payment details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const handleCancelAndAutoRefund = async () => {
    if (!order) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancelReasonInput.trim() || "Cancelled by administrator from Payment Management",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order.");
      }

      showToast(data.message || "Order cancelled and automatic refund processed via Stripe.");
      setCancelModalOpen(false);
      await fetchPayment();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Cancellation failed.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePartialRefund = async () => {
    if (!order) return;
    const amt = parseFloat(refundAmountInput);
    if (isNaN(amt) || amt <= 0) {
      showToast("Please enter a valid refund amount.");
      return;
    }

    setRefundLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          reason: refundReasonInput.trim() || "Administrator partial refund",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue refund.");
      }

      showToast(`Successfully refunded Rs. ${amt.toLocaleString()} via Stripe.`);
      setRefundModalOpen(false);
      setRefundAmountInput("");
      setRefundReasonInput("");
      await fetchPayment();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Refund failed.");
    } finally {
      setRefundLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100 text-gray-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-black" />
        Loading payment record...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payments
        </Link>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error || "Payment record not found."}
        </div>
      </div>
    );
  }

  const paidAmount = Number(order.amountPaid || (order.paymentStatus === "paid" ? order.total : 0));
  const refundedAmount = Number(order.refundAmount || 0);
  const remainingRefundable = Math.max(0, paidAmount - refundedAmount);
  const isPaid = order.paymentStatus === "paid" || order.paymentStatus === "succeeded";
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-2.5 rounded shadow-lg text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payments
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <Package className="w-3.5 h-3.5" />
            Open Order #{order.orderNumber}
          </Link>

          {order.stripePaymentIntentId && (
            <a
              href={`https://dashboard.stripe.com/test/payments/${order.stripePaymentIntentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#635bff] text-[#635bff] hover:bg-[#635bff]/5 rounded-md text-xs font-medium transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Stripe Dashboard
            </a>
          )}
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900">
              Payment #{order.orderNumber}
            </h1>
            {/* Payment Status Label */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                PAYMENT_STATUS_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-800"
              }`}
            >
              {order.paymentStatus === "paid" ? "Succeeded" : order.paymentStatus.toUpperCase()}
            </span>
            {/* Refund Status Label */}
            {order.refundStatus && order.refundStatus !== "none" && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  REFUND_STATUS_COLORS[order.refundStatus]
                }`}
              >
                {order.refundStatus === "partially_refunded"
                  ? "Partially Refunded"
                  : order.refundStatus === "refunded"
                  ? "Refunded"
                  : order.refundStatus === "refund_failed"
                  ? "Refund Failed"
                  : order.refundStatus.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Created on {new Date(order.createdAt).toLocaleString()} · Customer: {order.customer.name} ({order.customer.email})
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isCancelled && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              <Ban className="w-4 h-4" />
              Cancel & Auto-Refund
            </button>
          )}

          {isPaid && remainingRefundable > 0 && (
            <button
              onClick={() => setRefundModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Issue Partial Refund
            </button>
          )}
        </div>
      </div>

      {/* Grid: Payment Summary & Stripe Card Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Financial Summary
            </h2>
            <Receipt className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Original Order Total</span>
              <span className="font-semibold text-gray-900">{formatPrice(order.total)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-semibold text-emerald-700">{formatPrice(paidAmount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Amount Refunded</span>
              <span className="font-semibold text-purple-700">{formatPrice(refundedAmount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Remaining Refundable</span>
              <span className="font-semibold text-gray-900">{formatPrice(remainingRefundable)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Currency</span>
              <span className="font-mono text-gray-900 uppercase">{order.currency || "PKR"}</span>
            </div>
          </div>
        </div>

        {/* Stripe Transaction & Card Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Stripe Transaction Details
            </h2>
            <CreditCard className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-semibold text-gray-900 capitalize">
                {order.paymentMethod === "credit_card" ? "Stripe Elements Card" : order.paymentMethod}
              </span>
            </div>

            {order.paymentDetails?.last4 && (
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Card Info</span>
                <span className="font-mono font-medium text-gray-900">
                  {order.paymentDetails.brand?.toUpperCase()} •••• {order.paymentDetails.last4}
                  {order.paymentDetails.expMonth && order.paymentDetails.expYear ? ` (${order.paymentDetails.expMonth}/${order.paymentDetails.expYear})` : ""}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">PaymentIntent ID</span>
              <span className="font-mono text-xs text-gray-700 truncate max-w-50" title={order.stripePaymentIntentId}>
                {order.stripePaymentIntentId || "None"}
              </span>
            </div>

            {order.refundId && (
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Latest Refund ID</span>
                <span className="font-mono text-xs text-purple-700 truncate max-w-50" title={order.refundId}>
                  {order.refundId}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1">
              <span className="text-gray-500">Webhook Verification</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified & Idempotent
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Failure or Cancellation Alert Box */}
      {(order.failureReason || order.cancellationReason || order.refundFailureReason) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm">
          {order.cancellationReason && (
            <div className="flex items-start gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Cancellation Reason:</strong> {order.cancellationReason}
                {order.cancelledAt && (
                  <span className="text-xs text-amber-700 ml-1">
                    (Cancelled at: {new Date(order.cancelledAt).toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          )}

          {order.failureReason && (
            <div className="flex items-start gap-2 text-red-900">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <strong>Payment Failure Info:</strong> {order.failureReason}
              </div>
            </div>
          )}

          {order.refundFailureReason && (
            <div className="flex items-start gap-2 text-red-900">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <strong>Refund Failure Notice:</strong> {order.refundFailureReason}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two-Column: Payment Timeline & Refund Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Timeline */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4">
            Payment Timeline
          </h2>

          <div className="space-y-4">
            {order.paymentTimeline && order.paymentTimeline.length > 0 ? (
              order.paymentTimeline.map((item, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-emerald-500 pb-2">
                  <div className="absolute -left-1.75 top-0 w-3 h-3 rounded-full bg-emerald-500" />
                  <div className="text-xs font-semibold text-gray-900">{item.title}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(item.date).toLocaleString()}
                  </div>
                  {item.details && (
                    <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {item.details}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400">No payment events logged yet.</div>
            )}
          </div>
        </div>

        {/* Refund Timeline */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4">
            Refund Timeline
          </h2>

          <div className="space-y-4">
            {order.refundTimeline && order.refundTimeline.length > 0 ? (
              order.refundTimeline.map((item, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-purple-500 pb-2">
                  <div className="absolute -left-1.75 top-0 w-3 h-3 rounded-full bg-purple-500" />
                  <div className="text-xs font-semibold text-gray-900">{item.title}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(item.date).toLocaleString()}
                  </div>
                  {item.details && (
                    <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {item.details}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400">No refund events on this order.</div>
            )}
          </div>
        </div>
      </div>

      {/* Partial Refund Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Issue Partial Refund</h3>
            <p className="text-xs text-gray-500">
              Remaining refundable balance: <strong>{formatPrice(remainingRefundable)}</strong>.
              This will invoke the Stripe Server SDK and update the customer&apos;s refund records.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Refund Amount ({order.currency || "PKR"})
                </label>
                <input
                  type="number"
                  placeholder={`e.g. 5000 (Max: ${remainingRefundable})`}
                  value={refundAmountInput}
                  onChange={(e) => setRefundAmountInput(e.target.value)}
                  max={remainingRefundable}
                  min={1}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Defective item, customer accommodation"
                  value={refundReasonInput}
                  onChange={(e) => setRefundReasonInput(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePartialRefund}
                disabled={refundLoading || !refundAmountInput}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                {refundLoading ? "Processing via Stripe..." : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order & Auto Refund Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Cancel Order & Auto-Refund</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to cancel Order <strong>#{order.orderNumber}</strong>?
              {isPaid ? (
                <>
                  <br />
                  <span className="text-purple-700 font-semibold">
                    Because this order is paid, cancelling it will automatically submit a full refund of {formatPrice(remainingRefundable)} to the customer&apos;s card via Stripe.
                  </span>
                </>
              ) : (
                " Because payment is not yet collected, the order will be cancelled without issuing a refund."
              )}
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cancellation Reason
              </label>
              <textarea
                rows={2}
                placeholder="Reason for cancellation..."
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleCancelAndAutoRefund}
                disabled={cancelLoading}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                {cancelLoading ? "Cancelling & Refunding..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

