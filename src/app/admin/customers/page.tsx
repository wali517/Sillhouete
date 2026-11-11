"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, TrendingUp, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Customer } from "@/types";
import AdminPagination from "@/components/admin/AdminPagination";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone || "").includes(q)
    );
  });

  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">
          {customers.length} customers · Total spent: <strong>{formatPrice(totalRevenue)}</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => { setSearch(""); setPage(1); }}
          className="bg-white rounded-xl p-5 shadow-xs hover:shadow-sm transition-all text-left cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Customers</span>
            <div className="rounded-full p-1.5 bg-gray-50 text-gray-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="font-bold text-gray-900 text-2xl">{customers.length}</div>
        </button>

        <Link
          href="/admin/payments"
          className="bg-white rounded-xl p-5 shadow-xs hover:shadow-sm transition-all text-left cursor-pointer block"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Revenue</span>
            <div className="rounded-full p-1.5 bg-gray-50 text-gray-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="font-bold text-gray-900 text-lg">{formatPrice(totalRevenue)}</div>
        </Link>

        <Link
          href="/admin/orders"
          className="bg-white rounded-xl p-5 shadow-xs hover:shadow-sm transition-all text-left cursor-pointer block"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avg Order Value</span>
            <div className="rounded-full p-1.5 bg-gray-50 text-gray-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="font-bold text-gray-900 text-lg">
            {customers.length > 0
              ? formatPrice(Math.round(totalRevenue / customers.reduce((s, c) => s + c.ordersCount, 0) || 0))
              : "—"}
          </div>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email or phone..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none bg-gray-50 focus:bg-white focus:ring-1 focus:ring-gray-300 transition" />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading customers...</div>
          ) : paginated.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No customers found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Phone</th>
                  <th className="text-right px-4 py-3 font-semibold">Orders</th>
                  <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">Total Spent</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Joined</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-xs text-gray-500">{customer.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-xs">{customer.phone || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-800 text-xs font-bold">
                        {customer.ordersCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell font-semibold text-gray-900">
                      {formatPrice(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/customers/${customer.id}`}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-medium transition-colors">
                        View Orders
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <AdminPagination
          currentPage={page}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    </div>
  );
}
