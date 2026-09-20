"use client";

import React, { useState, useEffect } from "react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Users, Search, ShoppingBag, Mail, Phone, Calendar, ArrowRight, UserCheck, UserX, Loader2 } from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs uppercase font-mono tracking-widest text-duskk-500 block">
          Patron Directory & CRM
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-duskk-900">
          Customer Database ({customers.length})
        </h1>
        <p className="text-xs text-duskk-500 mt-1">
          Unified customer profiles created automatically from guest checkouts and registered accounts.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 border border-duskk-200 rounded-lg shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-duskk-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-duskk-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-duskk-900 animate-spin mx-auto" />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-duskk-400 text-xs">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-duskk-50 text-duskk-600 uppercase font-mono tracking-wider border-b border-duskk-200">
                <tr>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Lifetime Spend</th>
                  <th className="py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-duskk-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-duskk-50/50">
                    <td className="py-3 px-4 font-mono text-[11px] text-duskk-500">
                      {c.id.substring(0, 10)}...
                    </td>

                    <td className="py-3 px-4 font-semibold text-duskk-900">
                      {c.name}
                    </td>

                    <td className="py-3 px-4">
                      <div>{c.email}</div>
                      <div className="text-[10px] text-duskk-400">{c.phone || "No phone"}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.registrationType === "Registered"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-duskk-100 text-duskk-800"
                        }`}
                      >
                        {c.registrationType === "Registered" ? (
                          <UserCheck className="w-3 h-3 mr-1 text-purple-700" />
                        ) : (
                          <UserX className="w-3 h-3 mr-1 text-duskk-500" />
                        )}
                        {c.registrationType}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-duskk-900">
                      {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                    </td>

                    <td className="py-3 px-4 font-serif font-bold text-duskk-900 text-sm">
                      {formatPrice(c.totalSpent)}
                    </td>

                    <td className="py-3 px-4 text-duskk-500 whitespace-nowrap">
                      {formatDate(c.createdAt)}
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
