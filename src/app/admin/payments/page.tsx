"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Filter,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Order, PaymentStatus, RefundStatus } from "@/types";

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  succeeded: "bg-emerald-100 text-emerald-800 border-emerald-200",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-neutral-100 text-neutral-800 border-neutral-200",
};

const REFUND_STATUS_COLORS: Record<string, string> = {
  none: "text-neutral-400 bg-neutral-50 border-neutral-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  partially_refunded: "bg-purple-100 text-purple-800 border-purple-200",
  refunded: "bg-neutral-200 text-neutral-800 border-neutral-300",
  refund_failed: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refundFilter, setRefundFilter] = useState<string>("all");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search match
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        (o.stripePaymentIntentId && o.stripePaymentIntentId.toLowerCase().includes(q)) ||
        (o.paymentDetails?.last4 && o.paymentDetails.last4.includes(q));

      // Payment status filter
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "paid" && (o.paymentStatus === "paid" || o.paymentStatus === "succeeded")) ||
        o.paymentStatus === statusFilter;

      // Refund status filter
      const matchRefund =
        refundFilter === "all" ||
        (refundFilter === "none" && (!o.refundStatus || o.refundStatus === "none")) ||
        o.refundStatus === refundFilter;

      return matchSearch && matchStatus && matchRefund;
    });
  }, [orders, search, statusFilter, refundFilter]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let totalVolume = 0;
    let totalRefunded = 0;
    let successfulCount = 0;
    let pendingCount = 0;

    for (const o of orders) {
      if (o.paymentStatus === "paid" || o.paymentStatus === "succeeded") {
        totalVolume += Number(o.amountPaid || o.total || 0);
        successfulCount++;
      } else if (o.paymentStatus === "pending" || o.paymentStatus === "processing") {
        pendingCount++;
      }
      if (o.refundAmount) {
        totalRefunded += Number(o.refundAmount);
      }
    }

    return { totalVolume, totalRefunded, successfulCount, pendingCount };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payment Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all customer payments, Stripe card transactions, status synchronization and automatic refunds.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Volume (Paid)</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatPrice(metrics.totalVolume)}</div>
          <p className="text-xs text-gray-500 mt-1">From {metrics.successfulCount} verified payments</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Successful Payments</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{metrics.successfulCount}</div>
          <p className="text-xs text-emerald-600 mt-1">Confirmed via Stripe webhooks</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Refunded</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{formatPrice(metrics.totalRefunded)}</div>
          <p className="text-xs text-gray-500 mt-1">Auto-refunded upon cancellation</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending / Processing</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{metrics.pendingCount}</div>
          <p className="text-xs text-gray-500 mt-1">Awaiting customer payment or webhook</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order #, Customer, Email, PI ID, or last 4 digits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by payment status"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-700 outline-none focus:border-black"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid / Succeeded</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Refund Status Filter */}
          <select
            value={refundFilter}
            onChange={(e) => setRefundFilter(e.target.value)}
            aria-label="Filter by refund status"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-700 outline-none focus:border-black"
          >
            <option value="all">All Refund Statuses</option>
            <option value="none">No Refund</option>
            <option value="partially_refunded">Partially Refunded</option>
            <option value="refunded">Fully Refunded</option>
            <option value="refund_failed">Refund Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order & Customer</th>
                <th className="py-3 px-4">Method & Card</th>
                <th className="py-3 px-4">Original Amount</th>
                <th className="py-3 px-4">Paid / Refunded</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Refund Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No payments found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const paid = Number(order.amountPaid || (order.paymentStatus === "paid" ? order.total : 0));
                  const refunded = Number(order.refundAmount || 0);
                  const remainingRefundable = Math.max(0, paid - refunded);

                  const cardBrand = order.paymentDetails?.brand?.toUpperCase() || "";
                  const last4 = order.paymentDetails?.last4 || "";

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      {/* Order & Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <span>#{order.orderNumber}</span>
                          <span className="text-[11px] font-normal text-gray-500">
                            ({new Date(order.createdAt).toLocaleDateString()})
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 font-medium">{order.customer.name}</div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
                          {order.customer.email}
                        </div>
                      </td>

                      {/* Method & Card */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900">
                          <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                          <span className="capitalize">{order.paymentMethod === "credit_card" ? "Stripe Card" : order.paymentMethod}</span>
                        </div>
                        {last4 ? (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {cardBrand ? `${cardBrand} ` : ""}•••• {last4}
                          </div>
                        ) : order.stripePaymentIntentId ? (
                          <div className="text-[10px] text-gray-400 font-mono truncate max-w-[140px] mt-0.5">
                            {order.stripePaymentIntentId}
                          </div>
                        ) : null}
                      </td>

                      {/* Original Amount */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </td>

                      {/* Paid / Refunded */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-emerald-700">
                          Paid: {formatPrice(paid)}
                        </div>
                        {refunded > 0 && (
                          <div className="text-[11px] font-medium text-purple-700 mt-0.5">
                            Refunded: {formatPrice(refunded)}
                          </div>
                        )}
                        {paid > 0 && refunded > 0 && remainingRefundable > 0 && (
                          <div className="text-[10px] text-gray-500">
                            Remaining: {formatPrice(remainingRefundable)}
                          </div>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            PAYMENT_STATUS_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-800 border-gray-200"
                          }`}
                        >
                          <span className="capitalize">{order.paymentStatus === "paid" ? "Succeeded" : order.paymentStatus}</span>
                        </span>
                      </td>

                      {/* Refund Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            REFUND_STATUS_COLORS[order.refundStatus || "none"] || "bg-gray-100 text-gray-800 border-gray-200"
                          }`}
                        >
                          <span className="capitalize">
                            {order.refundStatus === "partially_refunded"
                              ? "Partially Refunded"
                              : order.refundStatus === "refunded"
                              ? "Refunded"
                              : order.refundStatus === "refund_failed"
                              ? "Refund Failed"
                              : order.refundStatus || "None"}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/admin/payments/${order.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-black bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </Link>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            title="Open related Order"
                            className="inline-flex items-center p-1 text-gray-400 hover:text-black transition-colors"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

