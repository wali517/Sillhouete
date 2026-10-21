"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Eye,
  X,
  CreditCard,
  MapPin,
  ExternalLink,
} from "lucide-react";
import type { Order, OrderStatus, PaymentStatus } from "@/types";
import { formatPrice } from "@/lib/format";

const STATUS_TABS: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<OrderStatus>("pending");
  const [paymentUpdate, setPaymentUpdate] = useState<PaymentStatus>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setStatusUpdate(order.status);
    setPaymentUpdate(order.paymentStatus);
    setTrackingNumber(order.trackingNumber || "");
    setCourier(order.courier || "TCS Express");
  };

  const handleSaveStatus = async () => {
    if (!selectedOrder) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusUpdate,
          paymentStatus: paymentUpdate,
          trackingNumber,
          courier,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? data.order : o)));
        setSelectedOrder(data.order);
        alert("Order status updated successfully!");
      }
    } catch {
      alert("Failed to update order status");
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchTab = activeTab === "all" || o.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Orders Management</h1>
          <p className="text-sm text-gray-500">
            Track customer orders, payments, fulfillment status, and courier dispatch.
          </p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer, or email..."
            className="w-full rounded-md border border-gray-200 py-1.5 pl-9 pr-4 text-xs outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No orders found under this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 uppercase tracking-wider text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-gray-900 block text-sm">
                        #{ord.orderNumber}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-900 block">{ord.customer.name}</span>
                      <span className="text-[11px] text-gray-500">{ord.customer.email}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-gray-800 font-medium block">
                        {ord.shippingAddress.city}
                      </span>
                      <span className="text-[11px] text-gray-500">{ord.shippingAddress.country}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            ord.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          {ord.paymentMethod === "stripe" ? "Stripe Card" : ord.paymentMethod}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          ord.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.status === "shipped"
                            ? "bg-blue-100 text-blue-800"
                            : ord.status === "processing"
                            ? "bg-purple-100 text-purple-800"
                            : ord.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 text-sm">
                        {formatPrice(ord.total)}
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        {ord.items.length} {ord.items.length === 1 ? "item" : "items"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openOrderDetail(ord)}
                        className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Order #{selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-gray-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <h3 className="font-bold uppercase tracking-wider text-xs text-gray-500">
                Ordered Outfits ({selectedOrder.items.length})
              </h3>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 bg-white text-xs">
                    <div className="relative h-16 w-12 shrink-0 border border-gray-200 rounded overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <strong className="block text-gray-900 uppercase text-xs">
                          {item.title}
                        </strong>
                        <span className="text-gray-500">
                          Size: {item.size} • Qty: {item.quantity}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing breakdown */}
            <div className="rounded-lg bg-gray-50 p-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>-{formatPrice(selectedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{selectedOrder.shipping === 0 ? "FREE" : formatPrice(selectedOrder.shipping)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-gray-900">
                <span>Total Amount</span>
                <span>{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-gray-500">Customer</h4>
                <p className="font-semibold text-gray-900">{selectedOrder.customer.name}</p>
                <p className="text-gray-600">{selectedOrder.customer.email}</p>
                <p className="text-gray-600">{selectedOrder.customer.phone}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-gray-500">Shipping Address</h4>
                <p className="text-gray-800">{selectedOrder.shippingAddress.address}</p>
                {selectedOrder.shippingAddress.apartment && (
                  <p className="text-gray-600">{selectedOrder.shippingAddress.apartment}</p>
                )}
                <p className="text-gray-800">
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                </p>
                <p className="font-semibold text-gray-900">{selectedOrder.shippingAddress.country}</p>
              </div>
            </div>

            {/* Manage Status & Tracking Form */}
            <div className="border-t border-gray-200 pt-4 space-y-4 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-gray-900">
                Update Fulfillment &amp; Payment Status
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold uppercase text-gray-700 mb-1">
                    Fulfillment Status
                  </label>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value as OrderStatus)}
                    className="w-full rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing (In Tailoring)</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentUpdate}
                    onChange={(e) => setPaymentUpdate(e.target.value as PaymentStatus)}
                    className="w-full rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold uppercase text-gray-700 mb-1">
                    Courier Partner
                  </label>
                  <input
                    type="text"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="e.g. TCS Express / DHL"
                    className="w-full rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-gray-700 mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. TCS-98421049"
                    className="w-full rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-md border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={saving}
                  className="rounded-md bg-black px-6 py-2 font-bold uppercase tracking-wider text-white hover:bg-gray-800"
                >
                  {saving ? "Saving Changes..." : "Save Order Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
