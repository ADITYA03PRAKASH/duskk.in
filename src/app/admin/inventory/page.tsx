"use client";

import React, { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { Boxes, AlertTriangle, CheckCircle, Search, Filter, Plus, Minus, Check, Loader2 } from "lucide-react";

export default function AdminInventoryPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory?filter=${filter}`);
      const resData = await res.json();
      if (resData.success) setData(resData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [filter]);

  const handleUpdateStock = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    setUpdatingId(productId);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, stockQuantity: newStock }),
      });
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          products: prev.products.map((p: any) =>
            p.id === productId ? { ...p, stockQuantity: newStock } : p
          ),
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const { stats, products = [] } = data || {};

  const filteredProducts = products.filter(
    (p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs uppercase font-mono tracking-widest text-duskk-500 block">
          Stock Control & Auditing
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-duskk-900">
          Inventory Management
        </h1>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`p-4 rounded-lg border text-left transition ${
            filter === "all" ? "bg-duskk-900 text-white border-duskk-900 shadow-md" : "bg-white border-duskk-200"
          }`}
        >
          <span className="text-xs uppercase tracking-wider block opacity-80">Total Vault SKUs</span>
          <span className="font-serif text-2xl font-bold">{stats?.totalItems || 0}</span>
        </button>

        <button
          onClick={() => setFilter("low")}
          className={`p-4 rounded-lg border text-left transition ${
            filter === "low" ? "bg-amber-800 text-white border-amber-800 shadow-md" : "bg-white border-duskk-200"
          }`}
        >
          <span className="text-xs uppercase tracking-wider block opacity-80">Low Stock (&le; 10 units)</span>
          <span className="font-serif text-2xl font-bold">{stats?.lowStock || 0}</span>
        </button>

        <button
          onClick={() => setFilter("out")}
          className={`p-4 rounded-lg border text-left transition ${
            filter === "out" ? "bg-rose-900 text-white border-rose-900 shadow-md" : "bg-white border-duskk-200"
          }`}
        >
          <span className="text-xs uppercase tracking-wider block opacity-80">Out of Stock (0 units)</span>
          <span className="font-serif text-2xl font-bold">{stats?.outOfStock || 0}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 border border-duskk-200 rounded-lg shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-duskk-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SKU or item name..."
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
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-duskk-400 text-xs">
            No inventory records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-duskk-50 text-duskk-600 uppercase font-mono tracking-wider border-b border-duskk-200">
                <tr>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4 text-right">Inline Stock Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-duskk-100">
                {filteredProducts.map((prod: any) => (
                  <tr key={prod.id} className="hover:bg-duskk-50/50">
                    <td className="py-3 px-4 flex items-center space-x-3">
                      <img
                        src={prod.image || "/placeholder.jpg"}
                        alt={prod.name}
                        className="w-10 h-10 object-cover rounded bg-duskk-50 border border-duskk-100 flex-shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-duskk-900">{prod.name}</p>
                        <p className="text-[10px] text-duskk-400 font-mono">{prod.sku}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-duskk-700">{prod.category?.name}</td>

                    <td className="py-3 px-4 font-serif font-bold text-duskk-900">
                      {formatPrice(prod.price)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-sm text-duskk-900 font-mono">
                        {prod.stockQuantity}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {prod.stockQuantity === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          OUT OF STOCK
                        </span>
                      ) : prod.stockQuantity <= 10 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          LOW STOCK ({prod.stockQuantity})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          HEALTHY ({prod.stockQuantity})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-1 border border-duskk-300 rounded bg-white p-0.5">
                        <button
                          onClick={() => handleUpdateStock(prod.id, prod.stockQuantity - 1)}
                          disabled={prod.stockQuantity <= 0 || updatingId === prod.id}
                          className="px-2 py-1 text-duskk-600 hover:text-duskk-900 hover:bg-duskk-100 rounded disabled:opacity-40"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-semibold text-duskk-900 min-w-[28px] text-center">
                          {prod.stockQuantity}
                        </span>
                        <button
                          onClick={() => handleUpdateStock(prod.id, prod.stockQuantity + 5)}
                          disabled={updatingId === prod.id}
                          className="px-2 py-1 text-duskk-600 hover:text-duskk-900 hover:bg-duskk-100 rounded"
                          title="Add 5 units"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
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
