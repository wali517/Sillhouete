"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Mail, Phone, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Customer, Order } from "@/types";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setCustomer(d.customer || null);
        setOrders(d.orders || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading...</div>;
  if (!customer) return (
    <div className="text-center py-16">
      <p className="text-gray-500 mb-4">Customer not found</p>
      <Link href="/admin/customers" className="text-sm text-blue-600 hover:underline">← Back</Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/customers" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-sm text-gray-500">Customer since {new Date(customer.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <Mail className="h-4 w-4" /> Contact
          </div>
          <p className="text-sm font-medium text-gray-900">{customer.email}</p>
          {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-2">
            <Package className="h-4 w-4" /> Orders
          </div>
          <div className="text-3xl font-bold text-gray-900">{customer.ordersCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Total Spent</div>
          <div className="text-2xl font-bold text-gray-900">{formatPrice(customer.totalSpent)}</div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Order History ({orders.length})</h2>
        </div>
        {orders.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No orders yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((order) => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">#{order.orderNumber}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${order.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} items · {order.shippingAddress.city}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{formatPrice(order.total)}</div>
                  <Link href={`/admin/orders/${order.id}`} className="text-xs text-blue-600 hover:underline">View →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
