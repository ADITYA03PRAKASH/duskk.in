"use client";

import React, { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { Tag, Plus, Check, X, Loader2 } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("999");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success) setCoupons(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue,
          minOrderValue,
          maxDiscount: maxDiscount || undefined,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setCode("");
        setDiscountValue("");
        loadCoupons();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-duskk-500 block">
            Promotions & Discounts
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-duskk-900">
            Coupons & Voucher Codes ({coupons.length})
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      <div className="bg-white border border-duskk-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-duskk-900 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-duskk-50 text-duskk-600 uppercase font-mono tracking-wider border-b border-duskk-200">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min Order Value</th>
                  <th className="py-3 px-4">Max Discount Cap</th>
                  <th className="py-3 px-4">Usage Count</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-duskk-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-duskk-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-duskk-900">
                      {c.code}
                    </td>

                    <td className="py-3 px-4 font-semibold text-emerald-700">
                      {c.discountType === "PERCENT" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                    </td>

                    <td className="py-3 px-4 text-duskk-700">
                      {formatPrice(c.minOrderValue)}
                    </td>

                    <td className="py-3 px-4 text-duskk-700">
                      {c.maxDiscount ? formatPrice(c.maxDiscount) : "No Limit"}
                    </td>

                    <td className="py-3 px-4 font-mono text-duskk-900">
                      {c.usageCount} times used
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-lg shadow-2xl overflow-hidden border border-duskk-200">
            <div className="bg-duskk-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-serif text-base font-medium">Create Coupon Code</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border rounded font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Discount Type *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    placeholder={discountType === "PERCENT" ? "10" : "500"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-duskk-900 text-white rounded font-semibold uppercase tracking-wider"
                >
                  {saving ? "Creating..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
