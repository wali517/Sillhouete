"use client";

import { useEffect, useState } from "react";
import { Users, Search, Mail, Phone, ShoppingBag, DollarSign } from "lucide-react";
import type { Customer } from "@/types";
import { formatPrice } from "@/lib/format";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      !search ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">
          View registered and guest shoppers, order frequencies, and lifetime values.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Customers
          </span>
          <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Customer Spend
          </span>
          <div className="text-2xl font-bold text-gray-900">{formatPrice(totalSpentAll)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Average Lifetime Value
          </span>
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(customers.length ? Math.round(totalSpentAll / customers.length) : 0)}
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or phone..."
            className="w-full rounded-md border border-gray-200 py-1.5 pl-9 pr-4 text-xs outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 uppercase tracking-wider text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Orders Placed</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Joined / First Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white font-bold text-xs uppercase">
                          {cust.name.slice(0, 2)}
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{cust.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        <span>{cust.email}</span>
                      </div>
                      {cust.phone && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                        <ShoppingBag className="h-3 w-3" />
                        {cust.ordersCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-900 text-sm">
                      {formatPrice(cust.totalSpent)}
                    </td>

                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(cust.createdAt).toLocaleDateString()}
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
