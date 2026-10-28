"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Printer, Package, CreditCard, MapPin,
  User, Truck, CheckCircle, Clock, XCircle
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

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [newTracking, setNewTracking] = useState("");
  const [newCourier, setNewCourier] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order) {
          setOrder(d.order);
          setNewStatus(d.order.status);
          setNewPaymentStatus(d.order.paymentStatus);
          setNewTracking(d.order.trackingNumber || "");
          setNewCourier(d.order.courier || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder(data.order);
      showToast("Order updated successfully");
    } catch {
      showToast("Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Order not found</p>
        <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">← Back to orders</Link>
      </div>
    );
  }

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
          <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">#{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
            {order.status}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-700"}`}>
            {order.paymentStatus}
          </span>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items + Totals */}
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
                    <div className="font-medium text-gray-900 text-sm truncate">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Size: {item.size} · Qty: {item.quantity}
                      {(item as { dupatta?: string }).dupatta && ` · Dupatta: ${(item as { dupatta?: string }).dupatta}`}
                      {(item as { adOn?: string }).adOn && ` · Add-on: ${(item as { adOn?: string }).adOn}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</div>
                    <div className="text-xs text-gray-400">{formatPrice(item.price)} each</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
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
                <span>Total</span><span>{formatPrice(order.total)} {order.currency}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Update Order
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Order Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-gray-400">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Payment Status</label>
                <select value={newPaymentStatus} onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-gray-400">
                  {PAYMENT_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Tracking Number</label>
                <input type="text" value={newTracking} onChange={(e) => setNewTracking(e.target.value)}
                  placeholder="e.g. TCS-98421049"
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Courier</label>
                <input type="text" value={newCourier} onChange={(e) => setNewCourier(e.target.value)}
                  placeholder="e.g. TCS Express"
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-gray-400" />
              </div>
            </div>
            <button onClick={handleUpdate} disabled={saving}
              className="mt-4 bg-black text-white text-sm px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Right: Customer + Shipping + Payment */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <User className="h-4 w-4" /> Customer
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-gray-900">{order.customer.name}</p>
              <p className="text-gray-500">{order.customer.email}</p>
              <p className="text-gray-500">{order.customer.phone}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" /> Shipping Address
            </h3>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium text-gray-900">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p>{order.shippingAddress.address}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>{order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="pt-1">{order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4" /> Payment
            </h3>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${PAYMENT_COLORS[order.paymentStatus]}`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.stripePaymentIntentId && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Stripe ID</p>
                  <p className="font-mono text-xs text-gray-700 break-all">{order.stripePaymentIntentId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tracking */}
          {(order.trackingNumber || order.courier) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4" /> Tracking
              </h3>
              <div className="text-sm space-y-1">
                {order.courier && <p className="text-gray-600">{order.courier}</p>}
                {order.trackingNumber && (
                  <p className="font-mono font-semibold text-gray-900">{order.trackingNumber}</p>
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
    </div>
  );
}
