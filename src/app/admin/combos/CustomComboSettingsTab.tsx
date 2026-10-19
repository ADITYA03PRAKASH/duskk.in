"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { CustomComboSettings } from "@/types";
import {
  Sparkles,
  Settings,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Layers,
  Percent,
  Sliders,
  Calendar,
  Package,
  ShieldCheck,
  Tag,
  RefreshCw,
  ShoppingBag,
  Info,
  Check,
  X,
  Filter,
  Search,
} from "lucide-react";

interface ProductItem {
  id: string;
  title: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  categoryId: string;
  image: string | null;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export function CustomComboSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Settings State
  const [settings, setSettings] = useState<CustomComboSettings>({
    isEnabled: true,
    title: "Build Your Own Combo",
    subtitle: "Create your bespoke luxury jewelry pairing. Select your favorite pieces and unlock an exclusive bundled gift discount.",
    eligibleCategoryIds: [],
    eligibleProductIds: [],
    minItems: 2,
    maxItems: 5,
    minQuantityPerProduct: 1,
    maxQuantityPerProduct: 3,
    discountType: "percentage",
    discountValue: 15,
    maxDiscountAmount: 1500,
    allowCouponsWithCombo: false,
    startsAt: null,
    endsAt: null,
    showOnHomepage: true,
    homepageDisplayOrder: 1,
  });

  // Eligibility filter controls in CMS
  const [eligibilityMode, setEligibilityMode] = useState<"ALL" | "RESTRICTED">("ALL");
  const [categoryFilterSearch, setCategoryFilterSearch] = useState("");
  const [productFilterSearch, setProductFilterSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("ALL");

  // Interactive Test Simulator State
  const [simItem1Price, setSimItem1Price] = useState<number>(2499);
  const [simItem2Price, setSimItem2Price] = useState<number>(1999);
  const [simItem3Price, setSimItem3Price] = useState<number>(1499);
  const [simItemCount, setSimItemCount] = useState<number>(3);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/combos/builder-config");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load builder settings");
      }

      const data = json.data;
      if (data.settings) {
        setSettings(data.settings);
        const hasRestrictions =
          (data.settings.eligibleCategoryIds && data.settings.eligibleCategoryIds.length > 0) ||
          (data.settings.eligibleProductIds && data.settings.eligibleProductIds.length > 0);
        setEligibilityMode(hasRestrictions ? "RESTRICTED" : "ALL");
      }
      setCategories(data.categories || []);
      setProducts(data.products || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: CustomComboSettings = {
        ...settings,
        eligibleCategoryIds: eligibilityMode === "RESTRICTED" ? settings.eligibleCategoryIds : [],
        eligibleProductIds: eligibilityMode === "RESTRICTED" ? settings.eligibleProductIds : [],
      };

      const res = await fetch("/api/admin/combos/builder-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update builder settings");
      }

      setSettings(json.data);
      setSuccessMessage("Build Your Own Combo configuration saved successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Category selection
  const toggleCategory = (catId: string) => {
    setSettings((prev) => {
      const exists = prev.eligibleCategoryIds.includes(catId);
      const next = exists
        ? prev.eligibleCategoryIds.filter((id) => id !== catId)
        : [...prev.eligibleCategoryIds, catId];
      return { ...prev, eligibleCategoryIds: next };
    });
  };

  // Toggle Product selection
  const toggleProduct = (prodId: string) => {
    setSettings((prev) => {
      const exists = prev.eligibleProductIds.includes(prodId);
      const next = exists
        ? prev.eligibleProductIds.filter((id) => id !== prodId)
        : [...prev.eligibleProductIds, prodId];
      return { ...prev, eligibleProductIds: next };
    });
  };

  // Select / Deselect All Categories
  const handleSelectAllCategories = () => {
    setSettings((prev) => ({
      ...prev,
      eligibleCategoryIds: categories.map((c) => c.id),
    }));
  };

  const handleClearAllCategories = () => {
    setSettings((prev) => ({
      ...prev,
      eligibleCategoryIds: [],
    }));
  };

  // Select / Deselect All Products
  const handleSelectAllProducts = () => {
    setSettings((prev) => ({
      ...prev,
      eligibleProductIds: products.map((p) => p.id),
    }));
  };

  const handleClearAllProducts = () => {
    setSettings((prev) => ({
      ...prev,
      eligibleProductIds: [],
    }));
  };

  // Filtered Products for Picker
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productCategoryFilter !== "ALL" && p.categoryId !== productCategoryFilter) {
        return false;
      }
      if (productFilterSearch.trim()) {
        const q = productFilterSearch.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSku) return false;
      }
      return true;
    });
  }, [products, productCategoryFilter, productFilterSearch]);

  // Real-time calculation simulator
  const simulatedCalculation = useMemo(() => {
    const rawTotal =
      (simItemCount >= 1 ? simItem1Price : 0) +
      (simItemCount >= 2 ? simItem2Price : 0) +
      (simItemCount >= 3 ? simItem3Price : 0);

    let discount = 0;
    if (settings.discountType === "percentage") {
      discount = Math.round((rawTotal * (settings.discountValue || 0)) / 100);
      if (settings.maxDiscountAmount && discount > settings.maxDiscountAmount) {
        discount = settings.maxDiscountAmount;
      }
    } else if (settings.discountType === "fixed_amount") {
      discount = Math.min(settings.discountValue || 0, rawTotal);
      if (settings.maxDiscountAmount && discount > settings.maxDiscountAmount) {
        discount = settings.maxDiscountAmount;
      }
    }

    const finalPrice = Math.max(0, rawTotal - discount);
    const savingsPercent = rawTotal > 0 ? Math.round((discount / rawTotal) * 100) : 0;

    return { rawTotal, discount, finalPrice, savingsPercent };
  }, [settings, simItem1Price, simItem2Price, simItem3Price, simItemCount]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-duskk-600 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-duskk-gold" />
        <p className="text-sm font-medium">Loading Build Your Own Combo settings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Alert Banners */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800 text-sm shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="p-1 hover:bg-emerald-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status & Master Switch Card */}
      <div className="bg-white border border-duskk-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-duskk-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-duskk-gold">
                Feature Status
              </span>
              <span
                className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full ${
                  settings.isEnabled
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-rose-100 text-rose-800 border border-rose-200"
                }`}
              >
                {settings.isEnabled ? "ACTIVE ON DUSKK" : "DISABLED"}
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-duskk-900 mt-1">
              Build Your Own Combo (Mode B)
            </h2>
            <p className="text-xs text-duskk-600 mt-0.5">
              Allows customers to handpick multiple eligible jewelry pieces, configure quantities, and buy custom bundles.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/build-your-combo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3.5 py-2 bg-duskk-100 hover:bg-duskk-200 text-duskk-800 text-xs font-medium rounded-lg transition space-x-1.5"
            >
              <span>View Customer Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))}
              className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.isEnabled ? "bg-emerald-600" : "bg-duskk-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.isEnabled ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Homepage Placement Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-xs">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="showOnHomepage"
              checked={settings.showOnHomepage}
              onChange={(e) => setSettings((prev) => ({ ...prev, showOnHomepage: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-duskk-300 text-duskk-900 focus:ring-duskk-gold"
            />
            <div>
              <label htmlFor="showOnHomepage" className="font-semibold text-duskk-900 cursor-pointer">
                Feature on Main Homepage
              </label>
              <p className="text-duskk-500 mt-0.5">
                Displays a dedicated &ldquo;Build Your Own Combo&rdquo; interactive banner and entry card in the combo section.
              </p>
            </div>
          </div>

          <div>
            <label className="block font-medium text-duskk-700 mb-1">
              Homepage Display Order
            </label>
            <input
              type="number"
              min="0"
              value={settings.homepageDisplayOrder}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  homepageDisplayOrder: parseInt(e.target.value || "1", 10),
                }))
              }
              className="w-32 px-3 py-1.5 border border-duskk-300 rounded text-xs bg-white text-duskk-900 focus:border-duskk-gold"
            />
          </div>
        </div>
      </div>

      {/* Customer-Facing Presentation Card */}
      <div className="bg-white border border-duskk-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-duskk-gold">
          <Tag className="w-5 h-5" />
          <h3 className="font-serif text-lg font-bold text-duskk-900">
            Storefront Headings & Copy
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 text-xs">
          <div>
            <label className="block font-medium text-duskk-700 mb-1">
              Builder Page Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Build Your Own Combo"
              required
              className="w-full px-3 py-2 border border-duskk-300 rounded text-xs focus:outline-none focus:border-duskk-gold"
            />
          </div>

          <div>
            <label className="block font-medium text-duskk-700 mb-1">
              Subtitle & Customer Value Proposition
            </label>
            <textarea
              rows={2}
              value={settings.subtitle}
              onChange={(e) => setSettings((prev) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="e.g. Create your bespoke luxury jewelry pairing. Select your favorite pieces and unlock an exclusive bundled gift discount."
              className="w-full px-3 py-2 border border-duskk-300 rounded text-xs focus:outline-none focus:border-duskk-gold"
            />
          </div>
        </div>
      </div>

      {/* Selection Rules & Quantity Limits Card */}
      <div className="bg-white border border-duskk-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 text-duskk-gold">
          <Sliders className="w-5 h-5" />
          <h3 className="font-serif text-lg font-bold text-duskk-900">
            Selection Constraints & Limits
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-medium text-duskk-700 mb-1">
              Min Distinct Products <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={settings.maxItems}
              value={settings.minItems}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  minItems: Math.max(1, parseInt(e.target.value || "1", 10)),
                }))
              }
              className="w-full px-3 py-2 border border-duskk-300 rounded focus:border-duskk-gold"
              required
            />
            <span className="text-[10px] text-duskk-400 mt-1 block">Default: 2 items</span>
          </div>

          <div>
            <label className="block font-medium text-duskk-700 mb-1">
              Max Distinct Products <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={settings.minItems}
              max="20"
              value={settings.maxItems}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  maxItems: Math.max(prev.minItems, parseInt(e.target.value || "2", 10)),
                }))
              }
              className="w-full px-3 py-2 border border-duskk-300 rounded focus:border-duskk-gold"
              required
            />
            <span className="text-[10px] text-duskk-400 mt-1 block">Default: 5 items</span>
          </div>

          <div>
            <label className="block font-medium text-duskk-700 mb-1">
              Min Qty Per Product
            </label>
            <input
              type="number"
              min="1"
              max={settings.maxQuantityPerProduct}
              value={settings.minQuantityPerProduct}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  minQuantityPerProduct: Math.max(1, parseInt(e.target.value || "1", 10)),
                }))
              }
              className="w-full px-3 py-2 border border-duskk-300 rounded focus:border-duskk-gold"
              required
            />
            <span className="text-[10px] text-duskk-400 mt-1 block">Usually 1</span>
          </div>

          <div>
            <label className="block font-medium text-duskk-700 mb-1">
              Max Qty Per Product
            </label>
            <input
              type="number"
              min={settings.minQuantityPerProduct}
              max="10"
              value={settings.maxQuantityPerProduct}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  maxQuantityPerProduct: Math.max(prev.minQuantityPerProduct, parseInt(e.target.value || "1", 10)),
                }))
              }
              className="w-full px-3 py-2 border border-duskk-300 rounded focus:border-duskk-gold"
              required
            />
            <span className="text-[10px] text-duskk-400 mt-1 block">Default: 3</span>
          </div>
        </div>
      </div>

      {/* Discount Model & Pricing Policy Card */}
      <div className="bg-white border border-duskk-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 text-duskk-gold">
          <Percent className="w-5 h-5" />
          <h3 className="font-serif text-lg font-bold text-duskk-900">
            Discount Model & Pricing Rules
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <label className="block font-medium text-duskk-700 mb-1">
              Discount Model
            </label>
            <select
              value={settings.discountType}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  discountType: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-900 focus:border-duskk-gold font-medium"
            >
              <option value="percentage">Percentage Discount (%)</option>
              <option value="fixed_amount">Fixed Amount Discount (₹)</option>
              <option value="none">Standard Combined Price (No Extra Discount)</option>
            </select>
            <p className="text-[11px] text-duskk-500 mt-1">
              Choose how the savings are computed for the custom combo.
            </p>
          </div>

          {settings.discountType !== "none" && (
            <div>
              <label className="block font-medium text-duskk-700 mb-1">
                {settings.discountType === "percentage" ? "Discount Percentage (%)" : "Fixed Discount Amount (₹)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={settings.discountType === "percentage" ? "90" : "100000"}
                  value={settings.discountValue}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      discountValue: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-duskk-300 rounded font-mono text-duskk-900 focus:border-duskk-gold"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-duskk-400">
                  {settings.discountType === "percentage" ? "%" : "₹"}
                </span>
              </div>
            </div>
          )}

          {settings.discountType !== "none" && (
            <div>
              <label className="block font-medium text-duskk-700 mb-1">
                Maximum Discount Cap (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Optional (e.g. 1500)"
                value={settings.maxDiscountAmount || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                className="w-full px-3 py-2 border border-duskk-300 rounded font-mono text-duskk-900 focus:border-duskk-gold"
              />
              <span className="text-[10px] text-duskk-400 mt-1 block">
                Leave empty for uncapped discount
              </span>
            </div>
          )}
        </div>

        {/* Coupon Stacking Policy */}
        <div className="pt-4 border-t border-duskk-100 flex items-start space-x-3 text-xs">
          <input
            type="checkbox"
            id="allowCouponsWithCombo"
            checked={settings.allowCouponsWithCombo || false}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, allowCouponsWithCombo: e.target.checked }))
            }
            className="mt-0.5 h-4 w-4 rounded border-duskk-300 text-duskk-900 focus:ring-duskk-gold"
          />
          <div>
            <label htmlFor="allowCouponsWithCombo" className="font-semibold text-duskk-900 cursor-pointer">
              Allow Promotional Coupons to Stack on Custom Combos
            </label>
            <p className="text-duskk-500 mt-0.5">
              Recommended: <strong>OFF</strong>. When unchecked, coupon codes apply only to non-combo items, preventing unintended double discounting.
            </p>
          </div>
        </div>
      </div>

      {/* Promotional Validity Dates Card */}
      <div className="bg-white border border-duskk-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-duskk-gold">
          <Calendar className="w-5 h-5" />
          <h3 className="font-serif text-lg font-bold text-duskk-900">
            Promotion Schedule & Validity
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-duskk-700 mb-1">
              Start Date & Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={settings.startsAt ? settings.startsAt.slice(0, 16) : ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  startsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
              className="w-full px-3 py-2 border border-duskk-300 rounded text-xs bg-white text-duskk-900"
            />
          </div>

          <div>
            <label className="block font-medium text-duskk-700 mb-1">
              End Date & Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={settings.endsAt ? settings.endsAt.slice(0, 16) : ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  endsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
              className="w-full px-3 py-2 border border-duskk-300 rounded text-xs bg-white text-duskk-900"
            />
          </div>
        </div>

        {(settings.startsAt || settings.endsAt) && (
          <button
            type="button"
            onClick={() => setSettings((prev) => ({ ...prev, startsAt: null, endsAt: null }))}
            className="text-xs text-duskk-500 hover:text-rose-600 underline font-medium"
          >
            Clear dates (make continuously ongoing)
          </button>
        )}
      </div>

      {/* Product & Category Eligibility Card */}
      <div className="bg-white border border-duskk-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-duskk-gold">
            <Layers className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold text-duskk-900">
              Eligible Products & Categories
            </h3>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-2 bg-duskk-100 p-1 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setEligibilityMode("ALL")}
              className={`px-3 py-1.5 rounded transition ${
                eligibilityMode === "ALL"
                  ? "bg-white text-duskk-900 shadow-sm font-semibold"
                  : "text-duskk-600 hover:text-duskk-900"
              }`}
            >
              All Catalog Products ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setEligibilityMode("RESTRICTED")}
              className={`px-3 py-1.5 rounded transition ${
                eligibilityMode === "RESTRICTED"
                  ? "bg-white text-duskk-900 shadow-sm font-semibold"
                  : "text-duskk-600 hover:text-duskk-900"
              }`}
            >
              Custom Restrictions
            </button>
          </div>
        </div>

        {eligibilityMode === "ALL" ? (
          <div className="p-4 bg-duskk-50 border border-duskk-200 rounded-lg text-xs text-duskk-700 flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>All active products across all categories</strong> are currently eligible for customer combos. No restrictions applied.
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Categories Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-duskk-800">
                  Eligible Categories ({settings.eligibleCategoryIds.length}/{categories.length} selected)
                </span>
                <div className="flex space-x-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllCategories}
                    className="text-duskk-gold hover:underline"
                  >
                    Select All
                  </button>
                  <span>&bull;</span>
                  <button
                    type="button"
                    onClick={handleClearAllCategories}
                    className="text-duskk-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                {categories.map((cat) => {
                  const isChecked = settings.eligibleCategoryIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-center space-x-2 p-2.5 rounded border cursor-pointer transition ${
                        isChecked
                          ? "bg-duskk-gold/10 border-duskk-gold/60 text-duskk-900 font-medium"
                          : "bg-white border-duskk-200 text-duskk-700 hover:bg-duskk-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded border-duskk-300 text-duskk-900 focus:ring-duskk-gold"
                      />
                      <span className="truncate">{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Products Section */}
            <div className="space-y-3 pt-4 border-t border-duskk-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-duskk-800">
                  Specific Eligible Products ({settings.eligibleProductIds.length}/{products.length} selected)
                </span>
                <div className="flex items-center space-x-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllProducts}
                    className="text-duskk-gold hover:underline"
                  >
                    Select All ({products.length})
                  </button>
                  <span>&bull;</span>
                  <button
                    type="button"
                    onClick={handleClearAllProducts}
                    className="text-duskk-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Product Search & Category Filter */}
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-duskk-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search product by title or SKU..."
                    value={productFilterSearch}
                    onChange={(e) => setProductFilterSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-duskk-300 rounded text-xs bg-white"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 border border-duskk-300 rounded text-xs bg-white text-duskk-800"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Checklist Scrollbox */}
              <div className="max-h-64 overflow-y-auto border border-duskk-200 rounded-lg divide-y divide-duskk-100 bg-white">
                {filteredProducts.map((p) => {
                  const isChecked = settings.eligibleProductIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center justify-between p-2.5 hover:bg-duskk-50 cursor-pointer text-xs transition ${
                        isChecked ? "bg-duskk-gold/5" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProduct(p.id)}
                          className="rounded border-duskk-300 text-duskk-900 focus:ring-duskk-gold"
                        />
                        <img
                          src={p.image || "/placeholder.jpg"}
                          alt={p.title}
                          className="w-8 h-8 rounded object-cover border border-duskk-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-duskk-900 truncate">{p.title}</p>
                          <p className="text-[10px] text-duskk-400 font-mono">SKU: {p.sku}</p>
                        </div>
                      </div>
                      <span className="font-mono text-duskk-800 flex-shrink-0">
                        {formatPrice(p.salePrice || p.basePrice)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Simulator Card */}
      <div className="bg-duskk-50 border border-duskk-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-duskk-900">
          <Sparkles className="w-5 h-5 text-duskk-gold" />
          <h3 className="font-serif text-lg font-bold text-duskk-900">
            Real-Time Rule Simulation
          </h3>
        </div>
        <p className="text-xs text-duskk-600">
          Preview how a customer&rsquo;s custom combo pricing will calculate with the currently configured rules before saving.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Simulator Controls */}
          <div className="space-y-3 bg-white p-4 border border-duskk-200 rounded-lg text-xs">
            <span className="font-semibold text-duskk-900 uppercase tracking-wider block">
              Sample Selection:
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-duskk-500 block mb-0.5">Item 1 Price (₹)</label>
                <input
                  type="number"
                  value={simItem1Price}
                  onChange={(e) => setSimItem1Price(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-duskk-300 rounded font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-duskk-500 block mb-0.5">Item 2 Price (₹)</label>
                <input
                  type="number"
                  value={simItem2Price}
                  onChange={(e) => setSimItem2Price(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-duskk-300 rounded font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-duskk-500 block mb-0.5">Item 3 Price (₹)</label>
                <input
                  type="number"
                  value={simItem3Price}
                  onChange={(e) => setSimItem3Price(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-duskk-300 rounded font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-1">
              <span className="text-duskk-600">Included Pieces:</span>
              {[1, 2, 3].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSimItemCount(count)}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    simItemCount === count
                      ? "bg-duskk-900 text-white"
                      : "bg-duskk-100 text-duskk-700 hover:bg-duskk-200"
                  }`}
                >
                  {count} {count === 1 ? "Item" : "Items"}
                </button>
              ))}
            </div>
          </div>

          {/* Simulator Output */}
          <div className="bg-duskk-900 text-white p-5 rounded-lg flex flex-col justify-between text-xs space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-duskk-300">
                <span>Original Combined Price:</span>
                <span className="font-mono">{formatPrice(simulatedCalculation.rawTotal)}</span>
              </div>
              <div className="flex justify-between text-duskk-gold font-medium">
                <span>Combo Discount ({settings.discountType === "percentage" ? `${settings.discountValue}%` : "Fixed"}):</span>
                <span className="font-mono">-{formatPrice(simulatedCalculation.discount)}</span>
              </div>
              <div className="flex justify-between text-xs text-duskk-400">
                <span>Customer Savings:</span>
                <span>{simulatedCalculation.savingsPercent}% OFF</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/20 flex justify-between items-baseline">
              <span className="text-sm font-serif font-bold text-white">Final Customer Price:</span>
              <span className="font-serif text-2xl font-bold text-duskk-gold">
                {formatPrice(simulatedCalculation.finalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 border border-duskk-300 rounded-xl shadow-xl flex items-center justify-between">
        <div className="text-xs text-duskk-600">
          Changes will immediately update the customer builder at{" "}
          <strong className="text-duskk-900 font-mono">/build-your-combo</strong>.
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white font-semibold text-xs tracking-wider uppercase rounded-lg transition-all shadow-md flex items-center space-x-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Settings...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save & Publish Settings</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
