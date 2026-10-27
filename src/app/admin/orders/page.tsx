"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search, Package, ChevronDown, Filter, Printer,
  TrendingUp, Clock, CheckCircle, XCircle, Truck,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/types";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_OPTIONS = ["pending", "paid", "failed", "refunded"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updates, setUpdates] = useState<Record<string, { status?: string; paymentStatus?: string; trackingNumber?: string; courier?: string }>>({});
  const [toast, setToast] = useState("");

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleUpdate = async (id: string) => {
    setUpdatingId(id);
    try {
      const payload = updates[id] || {};
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      showToast("Order updated successfully");
      await fetchOrders();
      setExpandedId(null);
    } catch {
      showToast("Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const setUpdate = (id: string, field: string, value: string) => {
    setUpdates((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  const tabs = [
    { key: "all", label: "All", count: orders.length },
    { key: "pending", label: "Pending", count: orders.filter((o) => o.status === "pending").length },
    { key: "processing", label: "Processing", count: orders.filter((o) => o.status === "processing").length },
    { key: "shipped", label: "Shipped", count: orders.filter((o) => o.status === "shipped").length },
    { key: "delivered", label: "Delivered", count: orders.filter((o) => o.status === "delivered").length },
    { key: "cancelled", label: "Cancelled", count: orders.filter((o) => o.status === "cancelled").length },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg text-sm shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">
            {orders.length} orders · Revenue: <strong>{formatPrice(totalRevenue)}</strong>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: Package, color: "blue" },
          { label: "Pending", value: orders.filter((o) => o.status === "pending").length, icon: Clock, color: "amber" },
          { label: "Shipped", value: orders.filter((o) => o.status === "shipped").length, icon: Truck, color: "purple" },
          { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length, icon: CheckCircle, color: "emerald" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
              <div className={`rounded-full p-1.5 bg-${color}-50 text-${color}-600`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" placeholder="Search by order#, customer name or email..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-gray-50"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === t.key ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
              }`}>
              {t.label} {t.count > 0 && <span className="ml-1 opacity-70">({t.count})</span>}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-3">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No orders found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Order</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Items</th>
                  <th className="text-right px-4 py-3 font-semibold">Total</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Payment</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => (
  <Fragment key={order.id}>
    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-sm">#{order.orderNumber}</div>
                        <div className="text-xs text-gray-400">{order.currency}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{order.customer.name}</div>
                        <div className="text-xs text-gray-500">{order.customer.email}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-700"}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/orders/${order.id}`}
                            className="text-xs text-blue-600 hover:underline font-medium">Details</Link>
                          <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-medium transition-colors">
                            Update <ChevronDown className={`inline h-3 w-3 ml-0.5 transition-transform ${expandedId === order.id ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === order.id && (
  <tr key={`${order.id}-expand`} className="bg-gray-50">
                        <td colSpan={8} className="px-4 pb-4 pt-2">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-600 block mb-1">Order Status</label>
                              <select
                                defaultValue={order.status}
                                onChange={(e) => setUpdate(order.id, "status", e.target.value)}
                                className="w-full border border-gray-200 rounded-md text-sm px-2 py-1.5 outline-none focus:border-gray-400">
                                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 block mb-1">Payment Status</label>
                              <select
                                defaultValue={order.paymentStatus}
                                onChange={(e) => setUpdate(order.id, "paymentStatus", e.target.value)}
                                className="w-full border border-gray-200 rounded-md text-sm px-2 py-1.5 outline-none focus:border-gray-400">
                                {PAYMENT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 block mb-1">Tracking #</label>
                              <input type="text" placeholder="e.g. TCS-12345"
                                defaultValue={order.trackingNumber || ""}
                                onChange={(e) => setUpdate(order.id, "trackingNumber", e.target.value)}
                                className="w-full border border-gray-200 rounded-md text-sm px-2 py-1.5 outline-none focus:border-gray-400" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 block mb-1">Courier</label>
                              <input type="text" placeholder="e.g. TCS Express"
                                defaultValue={order.courier || ""}
                                onChange={(e) => setUpdate(order.id, "courier", e.target.value)}
                                className="w-full border border-gray-200 rounded-md text-sm px-2 py-1.5 outline-none focus:border-gray-400" />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleUpdate(order.id)}
                              disabled={updatingId === order.id}
                              className="bg-black text-white text-xs px-4 py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
                              {updatingId === order.id ? "Saving..." : "Save Changes"}
                            </button>
                            <button onClick={() => setExpandedId(null)}
                              className="text-xs px-4 py-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                   </Fragment>
))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
