"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ShippingSettings, ShippingRuleApplied } from "@/types";
import { calculateShipping, DEFAULT_SHIPPING_SETTINGS } from "@/services/shipping.service";
import {
  Truck,
  Settings,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Package,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Search,
  Check,
  X,
  AlertTriangle,
  Clock,
  Eye,
  Sliders,
  Info,
  DollarSign,
  Gift,
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

export default function AdminShippingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Raw data from server
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Settings state
  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);

  // Search filters for product/category selection
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [categorySearch, setCategorySearch] = useState("");

  // Confirmation modal state for disabling shipping
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  // Live Simulator state
  const [simSubtotal, setSimSubtotal] = useState<number>(599);
  const [simSelectedProductIds, setSimSelectedProductIds] = useState<string[]>([]);
  const [simSelectedCategoryIds, setSimSelectedCategoryIds] = useState<string[]>([]);
  const [simDateOption, setSimDateOption] = useState<"NOW" | "PROMO_WINDOW">("NOW");

  const fetchShippingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/shipping");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load shipping settings");
      }
      setSettings(json.data.settings);
      setInitialSettings(json.data.settings);
      setCategories(json.data.categories || []);
      setProducts(json.data.products || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingData();
  }, []);

  const handleToggleShippingEnabled = () => {
    if (settings.isEnabled) {
      // Disabling active shipping requires confirmation
      setShowDisableConfirm(true);
    } else {
      setSettings((prev) => ({ ...prev, isEnabled: true }));
    }
  };

  const confirmDisableShipping = () => {
    setSettings((prev) => ({ ...prev, isEnabled: false }));
    setShowDisableConfirm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Frontend validation
    if (settings.defaultCharge < 0) {
      setError("Default shipping charge must be greater than or equal to 0.");
      setSaving(false);
      return;
    }

    if (!settings.methodName.trim()) {
      setError("Shipping method name cannot be empty.");
      setSaving(false);
      return;
    }

    if (settings.scheduledPromotion.isEnabled) {
      if (
        settings.scheduledPromotion.startsAt &&
        settings.scheduledPromotion.endsAt &&
        new Date(settings.scheduledPromotion.startsAt) > new Date(settings.scheduledPromotion.endsAt)
      ) {
        setError("Scheduled promotion start date cannot be after end date.");
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/admin/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update shipping settings");
      }

      setSettings(json.data);
      setInitialSettings(json.data);
      setSuccessMessage("Shipping & Delivery settings saved successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setError(null);
    setSuccessMessage(null);
  };

  // Promotion Status Computations
  const scheduledPromoStatus = useMemo(() => {
    if (!settings.scheduledPromotion.isEnabled) {
      return { status: "DISABLED", label: "Disabled", color: "bg-gray-100 text-gray-700" };
    }
    const now = new Date();
    const starts = settings.scheduledPromotion.startsAt ? new Date(settings.scheduledPromotion.startsAt) : null;
    const ends = settings.scheduledPromotion.endsAt ? new Date(settings.scheduledPromotion.endsAt) : null;

    if (starts && now < starts) {
      return { status: "SCHEDULED", label: "Scheduled (Future)", color: "bg-blue-100 text-blue-800" };
    }
    if (ends && now > ends) {
      return { status: "EXPIRED", label: "Expired", color: "bg-amber-100 text-amber-800" };
    }
    return { status: "ACTIVE", label: "Active Now", color: "bg-emerald-100 text-emerald-800 animate-pulse" };
  }, [settings.scheduledPromotion]);

  // Product Selection Filter
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCat = productCategoryFilter === "ALL" || p.categoryId === productCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, productCategoryFilter]);

  // Category Selection Filter
  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const toggleProductEligibility = (productId: string) => {
    setSettings((prev) => {
      const current = prev.productSpecificRules.eligibleProductIds;
      const exists = current.includes(productId);
      const updated = exists ? current.filter((id) => id !== productId) : [...current, productId];
      return {
        ...prev,
        productSpecificRules: {
          ...prev.productSpecificRules,
          eligibleProductIds: updated,
        },
      };
    });
  };

  const toggleCategoryEligibility = (categoryId: string) => {
    setSettings((prev) => {
      const current = prev.categorySpecificRules.eligibleCategoryIds;
      const exists = current.includes(categoryId);
      const updated = exists ? current.filter((id) => id !== categoryId) : [...current, categoryId];
      return {
        ...prev,
        categorySpecificRules: {
          ...prev.categorySpecificRules,
          eligibleCategoryIds: updated,
        },
      };
    });
  };

  // Live Simulator Calculation
  const simulatorResult = useMemo(() => {
    let testDate = new Date();
    if (simDateOption === "PROMO_WINDOW" && settings.scheduledPromotion.startsAt) {
      testDate = new Date(settings.scheduledPromotion.startsAt);
      testDate.setMinutes(testDate.getMinutes() + 5);
    }

    const simItems = [
      ...simSelectedProductIds.map((pid) => ({
        productId: pid,
        quantity: 1,
      })),
      ...simSelectedCategoryIds.map((cid) => ({
        categoryId: cid,
        quantity: 1,
      })),
    ];

    return calculateShipping(
      {
        subtotal: simSubtotal,
        items: simItems,
        now: testDate,
      },
      settings
    );
  }, [simSubtotal, simSelectedProductIds, simSelectedCategoryIds, simDateOption, settings]);

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-duskk-gold animate-spin" />
        <p className="text-sm font-mono tracking-wider text-duskk-600 uppercase">
          Loading shipping configuration...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-duskk-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-duskk-900 text-duskk-gold rounded">
              <Truck className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-mono tracking-[0.2em] text-duskk-gold font-bold">
              LOGISTICS & PROMOTIONS
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-duskk-900 font-normal mt-1">
            Shipping & Delivery Settings
          </h1>
          <p className="text-xs text-duskk-500 mt-0.5">
            Manage base shipping charges, free shipping thresholds, festival promotions, and catalog rules.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 border border-duskk-300 hover:border-duskk-900 text-duskk-700 text-xs font-semibold uppercase tracking-wider rounded transition"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center space-x-2 shadow disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-3 text-rose-800 text-xs shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start space-x-3 text-emerald-800 text-xs shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Method Status */}
        <div className="bg-white p-5 rounded-lg border border-duskk-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-duskk-500 font-mono uppercase">
            <span>Shipping Method</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                settings.isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}
            >
              {settings.isEnabled ? "ENABLED" : "DISABLED"}
            </span>
          </div>
          <div className="font-serif text-xl text-duskk-900 font-medium">
            {settings.methodName}
          </div>
          <p className="text-xs text-duskk-500">
            Standard rate: <strong className="text-duskk-900 font-semibold">{formatPrice(settings.defaultCharge)}</strong>
          </p>
        </div>

        {/* Free Shipping Threshold */}
        <div className="bg-white p-5 rounded-lg border border-duskk-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-duskk-500 font-mono uppercase">
            <span>Free Threshold</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                settings.minOrderThreshold.isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
              }`}
            >
              {settings.minOrderThreshold.isEnabled ? "ACTIVE" : "OFF"}
            </span>
          </div>
          <div className="font-serif text-xl text-duskk-900 font-medium">
            {settings.minOrderThreshold.isEnabled
              ? formatPrice(settings.minOrderThreshold.minSubtotal)
              : "No Minimum"}
          </div>
          <p className="text-xs text-duskk-500">
            Orders above this amount receive free shipping
          </p>
        </div>

        {/* Global Free Shipping Event */}
        <div className="bg-white p-5 rounded-lg border border-duskk-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-duskk-500 font-mono uppercase">
            <span>Global Promo Event</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                settings.globalFreeShipping.isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
              }`}
            >
              {settings.globalFreeShipping.isEnabled ? "ACTIVE" : "OFF"}
            </span>
          </div>
          <div className="font-serif text-xl text-duskk-900 font-medium">
            {settings.globalFreeShipping.isEnabled ? "All Orders Free" : "Standard Policy"}
          </div>
          <p className="text-xs text-duskk-500">
            Storewide festival override for 100% free delivery
          </p>
        </div>

        {/* Scheduled Campaign */}
        <div className="bg-white p-5 rounded-lg border border-duskk-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-duskk-500 font-mono uppercase">
            <span>Scheduled Campaign</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${scheduledPromoStatus.color}`}>
              {scheduledPromoStatus.label}
            </span>
          </div>
          <div className="font-serif text-xl text-duskk-900 font-medium truncate">
            {settings.scheduledPromotion.promotionName || "None"}
          </div>
          <p className="text-xs text-duskk-500 truncate">
            {settings.scheduledPromotion.isEnabled && settings.scheduledPromotion.startsAt
              ? new Date(settings.scheduledPromotion.startsAt).toLocaleDateString()
              : "Not scheduled"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION A: DEFAULT SHIPPING CONFIGURATION */}
        <div className="bg-white rounded-lg border border-duskk-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-duskk-100">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 rounded-full bg-duskk-gold/15 text-duskk-900 flex items-center justify-center font-bold text-sm">
                A
              </span>
              <div>
                <h2 className="font-serif text-lg font-semibold text-duskk-900">
                  Default Shipping Configuration
                </h2>
                <p className="text-xs text-duskk-500">
                  Set baseline delivery method, standard charge, and customer messaging.
                </p>
              </div>
            </div>

            {/* Enable/Disable Method Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-duskk-700">
                Method Status:
              </span>
              <button
                type="button"
                onClick={handleToggleShippingEnabled}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.isEnabled ? "bg-emerald-600" : "bg-duskk-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-xs font-mono font-bold text-duskk-900">
                {settings.isEnabled ? "ENABLED" : "DISABLED"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Method Name */}
            <div>
              <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1.5">
                Shipping Method Name *
              </label>
              <input
                type="text"
                value={settings.methodName}
                onChange={(e) => setSettings({ ...settings, methodName: e.target.value })}
                placeholder="Insured Express Shipping"
                required
                className="w-full px-3.5 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold font-medium"
              />
              <p className="text-[11px] text-duskk-500 mt-1">
                Customer-facing title shown in bag, checkout, and tracking receipts.
              </p>
            </div>

            {/* Default Charge */}
            <div>
              <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1.5">
                Default Shipping Charge (₹) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-duskk-500 font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={settings.defaultCharge}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultCharge: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  required
                  className="w-full pl-7 pr-3 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold font-medium"
                />
              </div>
              <p className="text-[11px] text-duskk-500 mt-1">
                Standard fee charged when no free shipping rules qualify. Initial standard: ₹99.
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <input
                type="text"
                value={settings.currency}
                disabled
                className="w-full px-3.5 py-2 text-xs border border-duskk-200 bg-duskk-50 text-duskk-600 rounded font-mono"
              />
              <p className="text-[11px] text-duskk-500 mt-1">
                Locked to Indian Rupee (INR) for DUSKK India storefront.
              </p>
            </div>

            {/* Estimated Delivery Text */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1.5">
                Estimated Delivery Information (Optional)
              </label>
              <input
                type="text"
                value={settings.estimatedDeliveryText || ""}
                onChange={(e) =>
                  setSettings({ ...settings, estimatedDeliveryText: e.target.value })
                }
                placeholder="Delivered within 3-5 business days across India"
                className="w-full px-3.5 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
              />
              <p className="text-[11px] text-duskk-500 mt-1">
                Displayed alongside shipping charges at checkout and inside order confirmation receipts.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION B: FREE SHIPPING RULES */}
        <div className="bg-white rounded-lg border border-duskk-200 p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-duskk-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 rounded-full bg-duskk-gold/15 text-duskk-900 flex items-center justify-center font-bold text-sm">
                B
              </span>
              <div>
                <h2 className="font-serif text-lg font-semibold text-duskk-900">
                  Free Shipping Promotional Rules
                </h2>
                <p className="text-xs text-duskk-500">
                  Configure promotional shipping criteria, order thresholds, and catalogue-based eligibility.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 divide-y divide-duskk-100">
            {/* Rule 1: Global Free Shipping */}
            <div className="pt-4 first:pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-duskk-900">
                      1. Storewide Free Shipping for All Orders
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-duskk-100 text-duskk-700 rounded font-bold">
                      FESTIVAL / EVENT OVERRIDE
                    </span>
                  </div>
                  <p className="text-xs text-duskk-500 mt-0.5">
                    When active, all customers receive free express shipping regardless of bag value or items.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.globalFreeShipping.isEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        globalFreeShipping: {
                          ...settings.globalFreeShipping,
                          isEnabled: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-duskk-gold"></div>
                </label>
              </div>

              {settings.globalFreeShipping.isEnabled && (
                <div className="p-4 bg-duskk-50/70 border border-duskk-200 rounded-lg space-y-2">
                  <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider">
                    Event Announcement Label
                  </label>
                  <input
                    type="text"
                    value={settings.globalFreeShipping.label || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        globalFreeShipping: {
                          ...settings.globalFreeShipping,
                          label: e.target.value,
                        },
                      })
                    }
                    placeholder="Festival Special: Free Insured Express Shipping on all orders"
                    className="w-full px-3 py-2 text-xs border border-duskk-300 rounded bg-white focus:outline-none focus:border-duskk-gold"
                  />
                </div>
              )}
            </div>

            {/* Rule 2: Minimum Order Threshold */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-duskk-900">
                      2. Free Shipping Above Minimum Order Value
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-duskk-100 text-duskk-700 rounded font-bold">
                      BASKET THRESHOLD
                    </span>
                  </div>
                  <p className="text-xs text-duskk-500 mt-0.5">
                    Orders with subtotal equal to or exceeding this threshold receive free insured shipping.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.minOrderThreshold.isEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        minOrderThreshold: {
                          ...settings.minOrderThreshold,
                          isEnabled: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-duskk-gold"></div>
                </label>
              </div>

              {settings.minOrderThreshold.isEnabled && (
                <div className="p-4 bg-duskk-50/70 border border-duskk-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                      Minimum Subtotal Threshold (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-duskk-500 font-semibold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={settings.minOrderThreshold.minSubtotal}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            minOrderThreshold: {
                              ...settings.minOrderThreshold,
                              minSubtotal: Math.max(0, parseInt(e.target.value, 10) || 0),
                            },
                          })
                        }
                        className="w-full pl-7 pr-3 py-2 text-xs border border-duskk-300 rounded bg-white focus:outline-none focus:border-duskk-gold font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                      Threshold Rule Label
                    </label>
                    <input
                      type="text"
                      value={settings.minOrderThreshold.label || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          minOrderThreshold: {
                            ...settings.minOrderThreshold,
                            label: e.target.value,
                          },
                        })
                      }
                      placeholder={`Free Insured Express Shipping on orders above ₹${settings.minOrderThreshold.minSubtotal}`}
                      className="w-full px-3 py-2 text-xs border border-duskk-300 rounded bg-white focus:outline-none focus:border-duskk-gold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rule 3: Scheduled Promotional Free Shipping */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-duskk-900">
                      3. Scheduled Promotional Free Shipping
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold ${scheduledPromoStatus.color}`}>
                      {scheduledPromoStatus.label}
                    </span>
                  </div>
                  <p className="text-xs text-duskk-500 mt-0.5">
                    Automatically activates free shipping during a scheduled start and end window (e.g. Diwali, Black Friday).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.scheduledPromotion.isEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        scheduledPromotion: {
                          ...settings.scheduledPromotion,
                          isEnabled: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-duskk-gold"></div>
                </label>
              </div>

              {settings.scheduledPromotion.isEnabled && (
                <div className="p-4 bg-duskk-50/70 border border-duskk-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                      Promotion Name *
                    </label>
                    <input
                      type="text"
                      value={settings.scheduledPromotion.promotionName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          scheduledPromotion: {
                            ...settings.scheduledPromotion,
                            promotionName: e.target.value,
                          },
                        })
                      }
                      placeholder="Diwali Festive Free Express Shipping"
                      className="w-full px-3 py-2 text-xs border border-duskk-300 rounded bg-white focus:outline-none focus:border-duskk-gold font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                      Start Date & Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={
                        settings.scheduledPromotion.startsAt
                          ? new Date(settings.scheduledPromotion.startsAt).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          scheduledPromotion: {
                            ...settings.scheduledPromotion,
                            startsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-duskk-300 rounded bg-white focus:outline-none focus:border-duskk-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                      End Date & Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={
                        settings.scheduledPromotion.endsAt
                          ? new Date(settings.scheduledPromotion.endsAt).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          scheduledPromotion: {
                            ...settings.scheduledPromotion,
                            endsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-duskk-300 rounded bg-white focus:outline-none focus:border-duskk-gold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rule 4: Product-Specific Free Shipping */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-duskk-900">
                      4. Product-Specific Free Shipping
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-duskk-100 text-duskk-700 rounded font-bold">
                      CATALOG ITEMS ({settings.productSpecificRules.eligibleProductIds.length} SELECTED)
                    </span>
                  </div>
                  <p className="text-xs text-duskk-500 mt-0.5">
                    Orders containing any of these selected pieces receive complimentary express delivery.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.productSpecificRules.isEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        productSpecificRules: {
                          ...settings.productSpecificRules,
                          isEnabled: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-duskk-gold"></div>
                </label>
              </div>

              {settings.productSpecificRules.isEnabled && (
                <div className="p-4 bg-duskk-50/70 border border-duskk-200 rounded-lg space-y-4">
                  {/* Scope Policy */}
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="font-semibold text-duskk-700">Eligibility Scope:</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="productScope"
                        checked={settings.productSpecificRules.entireOrderFree}
                        onChange={() =>
                          setSettings({
                            ...settings,
                            productSpecificRules: {
                              ...settings.productSpecificRules,
                              entireOrderFree: true,
                            },
                          })
                        }
                        className="text-duskk-gold focus:ring-duskk-gold"
                      />
                      <span>Makes entire shipment free if any eligible product is in bag</span>
                    </label>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-duskk-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search products by title or SKU..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-duskk-300 rounded bg-white focus:outline-none focus:border-duskk-gold"
                      />
                    </div>
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-duskk-300 rounded bg-white focus:outline-none"
                    >
                      <option value="ALL">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Grid / List */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-duskk-200 bg-white border border-duskk-200 rounded">
                    {filteredProducts.length === 0 ? (
                      <p className="p-4 text-center text-xs text-duskk-400">
                        No products match the search filter.
                      </p>
                    ) : (
                      filteredProducts.map((p) => {
                        const isSelected = settings.productSpecificRules.eligibleProductIds.includes(
                          p.id
                        );
                        return (
                          <div
                            key={p.id}
                            onClick={() => toggleProductEligibility(p.id)}
                            className={`p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-duskk-50 transition ${
                              isSelected ? "bg-amber-50/50" : ""
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-duskk-gold focus:ring-duskk-gold"
                              />
                              <img
                                src={p.image || "/placeholder.jpg"}
                                alt={p.title}
                                className="w-8 h-8 rounded object-cover bg-duskk-100 border border-duskk-200"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-duskk-900 truncate">{p.title}</p>
                                <p className="text-[10px] text-duskk-400 font-mono">
                                  SKU: {p.sku} &bull; {formatPrice(p.salePrice || p.basePrice)}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                isSelected
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-duskk-100 text-duskk-600"
                              }`}
                            >
                              {isSelected ? "FREE SHIPPING" : "STANDARD"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Rule 5: Category-Specific Free Shipping */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-duskk-900">
                      5. Category-Specific Free Shipping
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-duskk-100 text-duskk-700 rounded font-bold">
                      COLLECTIONS ({settings.categorySpecificRules.eligibleCategoryIds.length} SELECTED)
                    </span>
                  </div>
                  <p className="text-xs text-duskk-500 mt-0.5">
                    Orders containing items from selected jewelry categories unlock free delivery.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.categorySpecificRules.isEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        categorySpecificRules: {
                          ...settings.categorySpecificRules,
                          isEnabled: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-duskk-gold"></div>
                </label>
              </div>

              {settings.categorySpecificRules.isEnabled && (
                <div className="p-4 bg-duskk-50/70 border border-duskk-200 rounded-lg space-y-4">
                  <div className="max-h-48 overflow-y-auto divide-y divide-duskk-200 bg-white border border-duskk-200 rounded">
                    {categories.length === 0 ? (
                      <p className="p-4 text-center text-xs text-duskk-400">No categories found.</p>
                    ) : (
                      categories.map((c) => {
                        const isSelected = settings.categorySpecificRules.eligibleCategoryIds.includes(
                          c.id
                        );
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleCategoryEligibility(c.id)}
                            className={`p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-duskk-50 transition ${
                              isSelected ? "bg-amber-50/50" : ""
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-duskk-gold focus:ring-duskk-gold"
                              />
                              <span className="font-semibold text-duskk-900">{c.name}</span>
                              <span className="text-[10px] text-duskk-400 font-mono">({c.slug})</span>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                isSelected
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-duskk-100 text-duskk-600"
                              }`}
                            >
                              {isSelected ? "ELIGIBLE" : "STANDARD"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Rule 6: Precedence Policy Summary */}
            <div className="pt-6 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-duskk-700">
                <Info className="w-4 h-4 text-duskk-gold" />
                <span>Explicit Rule Precedence & Combination Policy</span>
              </div>
              <div className="bg-duskk-50 border border-duskk-200 p-4 rounded text-[11px] text-duskk-600 space-y-1.5 leading-relaxed">
                <p className="font-medium text-duskk-900">
                  When multiple rules are configured, the authoritative server evaluates in this strict order:
                </p>
                <ol className="list-decimal list-inside space-y-1 font-mono text-[10px] text-duskk-700">
                  <li><strong>Method Availability:</strong> If disabled, shipping is suspended.</li>
                  <li><strong>Scheduled Promotion:</strong> Active date window grants ₹0 shipping.</li>
                  <li><strong>Storewide Festival Free Shipping:</strong> If enabled, all orders get ₹0 shipping.</li>
                  <li><strong>Order Value Threshold:</strong> Subtotal ≥ threshold grants ₹0 shipping.</li>
                  <li><strong>Product-Specific:</strong> Cart containing eligible item grants ₹0 shipping.</li>
                  <li><strong>Category-Specific:</strong> Cart containing item from eligible category grants ₹0 shipping.</li>
                  <li><strong>Default Standard Rate:</strong> Default fee (₹{settings.defaultCharge}) applied.</li>
                </ol>
                <p className="text-[10px] text-duskk-500 pt-1">
                  🛡️ Discounts never stack into negative shipping charges. Once a rule grants free shipping, the fee is ₹0.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: LIVE ORDER SIMULATOR */}
        <div className="bg-white rounded-lg border border-duskk-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-duskk-100">
            <span className="w-8 h-8 rounded-full bg-duskk-gold/15 text-duskk-900 flex items-center justify-center font-bold text-sm">
              C
            </span>
            <div>
              <h2 className="font-serif text-lg font-semibold text-duskk-900">
                Interactive Shipping Simulator
              </h2>
              <p className="text-xs text-duskk-500">
                Test how the configured rules will calculate on sample customer carts before publishing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Simulator Controls (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                  Simulated Bag Subtotal (₹)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={simSubtotal}
                    onChange={(e) => setSimSubtotal(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="flex-1 px-3 py-2 text-xs border border-duskk-300 rounded font-medium focus:outline-none focus:border-duskk-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setSimSubtotal(499)}
                    className="px-2.5 py-1.5 border border-duskk-300 text-[11px] rounded hover:bg-duskk-50"
                  >
                    ₹499
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimSubtotal(999)}
                    className="px-2.5 py-1.5 border border-duskk-300 text-[11px] rounded hover:bg-duskk-50"
                  >
                    ₹999
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimSubtotal(1499)}
                    className="px-2.5 py-1.5 border border-duskk-300 text-[11px] rounded hover:bg-duskk-50"
                  >
                    ₹1,499
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                  Simulated Timeframe
                </label>
                <div className="flex space-x-4 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="simTime"
                      checked={simDateOption === "NOW"}
                      onChange={() => setSimDateOption("NOW")}
                      className="text-duskk-gold focus:ring-duskk-gold"
                    />
                    <span>Current Moment (Now)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="simTime"
                      checked={simDateOption === "PROMO_WINDOW"}
                      onChange={() => setSimDateOption("PROMO_WINDOW")}
                      className="text-duskk-gold focus:ring-duskk-gold"
                    />
                    <span>During Scheduled Promo Window</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                  Include Product with Special Free Shipping?
                </label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    setSimSelectedProductIds(val ? [val] : []);
                  }}
                  className="w-full px-3 py-2 text-xs border border-duskk-300 rounded bg-white focus:outline-none"
                >
                  <option value="">No special product in simulated bag</option>
                  {settings.productSpecificRules.eligibleProductIds.map((pid) => {
                    const prod = products.find((p) => p.id === pid);
                    return (
                      <option key={pid} value={pid}>
                        {prod ? prod.title : pid} (Eligible for free delivery)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Right: Calculated Simulator Result Box (6 cols) */}
            <div className="lg:col-span-6 bg-duskk-900 text-white rounded-lg p-6 space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs uppercase font-mono tracking-widest text-duskk-gold font-bold">
                  SIMULATED CALCULATION RESULT
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    simulatorResult.isFreeShipping
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-duskk-gold/20 text-duskk-champagne border border-duskk-gold/30"
                  }`}
                >
                  {simulatorResult.isFreeShipping ? "FREE SHIPPING" : "STANDARD RATE"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-duskk-300">
                  <span>Eligible Order Subtotal:</span>
                  <span className="font-mono text-white font-medium">
                    {formatPrice(simulatorResult.eligibleSubtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-duskk-300">
                  <span>Method Selected:</span>
                  <span className="text-white font-medium">
                    {simulatorResult.shippingMethodName}
                  </span>
                </div>

                <div className="flex justify-between text-duskk-300">
                  <span>Base Rate:</span>
                  <span className="font-mono text-white">
                    {formatPrice(simulatorResult.defaultShippingFee)}
                  </span>
                </div>

                {simulatorResult.shippingDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Shipping Discount:</span>
                    <span className="font-mono">
                      -{formatPrice(simulatorResult.shippingDiscount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-duskk-300">
                  <span>Applied Rule:</span>
                  <span className="font-mono text-duskk-gold text-[11px] font-bold">
                    {simulatorResult.appliedRule}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                  <span className="text-sm font-semibold uppercase tracking-wider text-duskk-champagne">
                    Final Shipping Charge:
                  </span>
                  <span className="font-serif text-2xl font-bold text-white">
                    {simulatorResult.finalShippingCharge === 0 ? (
                      <span className="text-emerald-400">FREE (₹0)</span>
                    ) : (
                      formatPrice(simulatorResult.finalShippingCharge)
                    )}
                  </span>
                </div>
              </div>

              {/* Customer Explanation Quote */}
              <div className="p-3 bg-white/5 rounded border border-white/10 text-xs text-duskk-200">
                <span className="text-[10px] uppercase font-mono tracking-wider text-duskk-gold block mb-1">
                  Customer Explanation:
                </span>
                <p className="italic font-serif">&ldquo;{simulatorResult.explanation}&rdquo;</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-duskk-200">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-5 py-2.5 border border-duskk-300 hover:border-duskk-900 text-duskk-700 text-xs font-semibold uppercase tracking-wider rounded transition"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center space-x-2 shadow-lg disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save All Shipping Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal Before Disabling Shipping */}
      {showDisableConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl border border-duskk-200 animate-in fade-in">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-serif text-lg font-bold text-duskk-900">
                Disable Shipping Method?
              </h3>
            </div>
            <p className="text-xs text-duskk-600 leading-relaxed">
              Disabling the shipping method will mark shipping as inactive storefront-wide. Customers will not be charged shipping fees, and bags will indicate shipping is suspended.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-duskk-100">
              <button
                type="button"
                onClick={() => setShowDisableConfirm(false)}
                className="px-4 py-2 border border-duskk-300 text-duskk-700 text-xs font-semibold uppercase rounded hover:bg-duskk-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDisableShipping}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase rounded transition"
              >
                Confirm Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
