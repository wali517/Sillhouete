import Link from "next/link";
import {
  DollarSign,
  Package,
  ShoppingBag,
  MessageSquare,
  Users,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
} from "lucide-react";
import { getOrders, getProducts, getContactMessages, getCustomers } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Admin Dashboard – Sillhouete" };

export default async function AdminDashboardPage() {
  const [orders, products, messages, customers] = await Promise.all([
    getOrders(),
    getProducts(),
    getContactMessages(),
    getCustomers(),
  ]);

  const totalRevenue = orders.reduce((sum, o) => (o.paymentStatus === "paid" ? sum + o.total : sum), 0);
  const unreadMessages = messages.filter((m) => m.status === "unread").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">
            Real-time business performance, orders, catalog and customer inquiries.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>View Store</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Sales */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</div>
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>Verified paid orders</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Orders</span>
            <div className="rounded-full bg-blue-50 p-2 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
            <p className="mt-1 text-xs text-gray-500">
              <strong className="text-amber-600 font-semibold">{pendingOrders} pending</strong> fulfillment
            </p>
          </div>
        </div>

        {/* Products in Catalog */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalog Products</span>
            <div className="rounded-full bg-purple-50 p-2 text-purple-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{products.length}</div>
            <p className="mt-1 text-xs text-gray-500">
              {products.filter((p) => p.inStock).length} in stock, ready to ship
            </p>
          </div>
        </div>

        {/* Inquiries */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Inquiries</span>
            <div className="rounded-full bg-amber-50 p-2 text-amber-600">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
            <p className="mt-1 text-xs text-gray-500">
              <strong className="text-red-600 font-semibold">{unreadMessages} unread</strong> messages
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders & Messages Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-black hover:underline flex items-center gap-1"
            >
              <span>View all ({orders.length})</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 overflow-x-auto">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-gray-900">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-0.5">
                    {order.customer.name} ({order.shippingAddress.city}, {order.shippingAddress.country})
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-bold text-sm text-gray-900">{formatPrice(order.total)}</div>
                  <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-700">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900">Customer Messages</h2>
            <Link
              href="/admin/messages"
              className="text-xs font-semibold text-black hover:underline flex items-center gap-1"
            >
              <span>View all ({messages.length})</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {messages.slice(0, 4).map((msg) => (
              <div key={msg.id} className="p-4 hover:bg-gray-50 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-gray-900 text-sm">{msg.name}</strong>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      msg.status === "unread"
                        ? "bg-red-100 text-red-800"
                        : msg.status === "replied"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.status}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px] font-medium">{msg.subject}</p>
                <p className="text-gray-700 line-clamp-2">{msg.message}</p>
                <p className="text-[10px] text-gray-400 pt-1">
                  {new Date(msg.createdAt).toLocaleDateString()} • {msg.email} {msg.phone ? `• ${msg.phone}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
