"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Combo, ComboInput } from "@/types";
import {
  Gift,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  Sparkles,
  ExternalLink,
  Package,
  X,
  Layers,
  Percent,
  RefreshCw,
} from "lucide-react";
import { CustomComboSettingsTab } from "./CustomComboSettingsTab";

interface ProductOption {
  id: string;
  title: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  image?: string;
  variants?: {
    id: string;
    title: string;
    sku: string;
    price?: number;
    stockQuantity: number;
  }[];
}

export default function AdminCombosPage() {
  const [activeTab, setActiveTab] = useState<"PREDEFINED" | "CUSTOM_BUILDER">("PREDEFINED");
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [featuredFilter, setFeaturedFilter] = useState<"ALL" | "FEATURED">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Confirm Modal
  const [deletingCombo, setDeletingCombo] = useState<Combo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Available Products for Builder
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    price: string;
    mrp: string;
    imageUrl: string;
    galleryImagesText: string;
    isActive: boolean;
    isFeatured: boolean;
    displayOrder: string;
    items: {
      productId: string;
      variantId?: string | null;
      quantity: number;
      productTitle?: string;
      productSku?: string;
      basePrice?: number;
      image?: string;
    }[];
  }>({
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    price: "",
    mrp: "",
    imageUrl: "",
    galleryImagesText: "",
    isActive: true,
    isFeatured: false,
    displayOrder: "0",
    items: [],
  });

  const fetchCombos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/combos");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load combo offers");
      }
      setCombos(data.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load combo offers");
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        const formatted: ProductOption[] = data.data.map((p: any) => ({
          id: p.id,
          title: p.name || p.title,
          sku: p.sku || "",
          basePrice: Number(p.base_price || p.basePrice || 0),
          salePrice: p.sale_price !== null ? Number(p.sale_price) : null,
          image: p.images?.[0]?.url || p.images?.[0]?.image_url || p.image || null,
          variants: (p.variants || []).map((v: any) => ({
            id: v.id,
            title: v.title || v.name,
            sku: v.sku,
            price: v.price_override || v.sale_price_override,
            stockQuantity: v.stock_quantity || 0,
          })),
        }));
        setAvailableProducts(formatted);
      }
    } catch (err) {
      console.warn("Could not load catalog products for combo builder:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCombos();
    fetchCatalogProducts();
  }, []);

  // Quick Status Toggle
  const handleToggleStatus = async (combo: Combo) => {
    try {
      const newStatus = !combo.isActive;
      // Optimistic update
      setCombos((prev) =>
        prev.map((c) => (c.id === combo.id ? { ...c, isActive: newStatus } : c))
      );

      const res = await fetch(`/api/admin/combos/${combo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }
      setSuccessMessage(`"${combo.title}" is now ${newStatus ? "LIVE" : "UNPUBLISHED"}.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      // Revert on error
      fetchCombos();
      setError(err.message || "Failed to toggle combo status");
    }
  };

  // Quick Featured Toggle
  const handleToggleFeatured = async (combo: Combo) => {
    try {
      const newFeatured = !combo.isFeatured;
      setCombos((prev) =>
        prev.map((c) => (c.id === combo.id ? { ...c, isFeatured: newFeatured } : c))
      );

      const res = await fetch(`/api/admin/combos/${combo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: newFeatured }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update featured flag");
      }
      setSuccessMessage(`"${combo.title}" ${newFeatured ? "is now Featured on Homepage" : "removed from Featured"}.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      fetchCombos();
      setError(err.message || "Failed to update featured status");
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingComboId(null);
    setModalError(null);
    setFormData({
      title: "",
      slug: "",
      shortDescription: "",
      description: "",
      price: "",
      mrp: "",
      imageUrl: "",
      galleryImagesText: "",
      isActive: true,
      isFeatured: false,
      displayOrder: (combos.length * 10).toString(),
      items: [],
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (combo: Combo) => {
    setEditingComboId(combo.id);
    setModalError(null);

    const items = (combo.items || []).map((ci) => ({
      productId: ci.productId,
      variantId: ci.variantId || null,
      quantity: ci.quantity || 1,
      productTitle: ci.product?.title,
      productSku: ci.product?.sku,
      basePrice: ci.product?.basePrice,
      image: ci.product?.image || undefined,
    }));

    setFormData({
      title: combo.title,
      slug: combo.slug,
      shortDescription: combo.shortDescription || "",
      description: combo.description || "",
      price: combo.price.toString(),
      mrp: combo.mrp.toString(),
      imageUrl: combo.imageUrl || "",
      galleryImagesText: (combo.galleryImages || []).join("\n"),
      isActive: combo.isActive,
      isFeatured: combo.isFeatured,
      displayOrder: combo.displayOrder.toString(),
      items,
    });

    setIsModalOpen(true);
  };

  // Auto-calculated component MRP
  const calculatedComponentMrp = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const price = item.basePrice || 0;
      return sum + price * item.quantity;
    }, 0);
  }, [formData.items]);

  // Live savings preview
  const liveSavings = useMemo(() => {
    const priceNum = parseFloat(formData.price) || 0;
    const mrpNum = parseFloat(formData.mrp) || calculatedComponentMrp || priceNum;
    const diff = Math.max(0, mrpNum - priceNum);
    const pct = mrpNum > 0 ? Math.round((diff / mrpNum) * 100) : 0;
    return { diff, pct, mrpNum, priceNum };
  }, [formData.price, formData.mrp, calculatedComponentMrp]);

  // Add product to combo builder
  const handleAddProductToCombo = (prod: ProductOption, variantId?: string | null) => {
    const existingIndex = formData.items.findIndex(
      (i) => i.productId === prod.id && (variantId ? i.variantId === variantId : true)
    );

    if (existingIndex >= 0) {
      // Increase quantity
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((i, idx) =>
          idx === existingIndex ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }));
    } else {
      // Add new
      setFormData((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            productId: prod.id,
            variantId: variantId || null,
            quantity: 1,
            productTitle: prod.title,
            productSku: prod.sku,
            basePrice: prod.basePrice,
            image: prod.image,
          },
        ],
      }));
    }

    // Auto set MRP if not explicitly edited
    if (!formData.mrp || Number(formData.mrp) === calculatedComponentMrp) {
      const newMrp = calculatedComponentMrp + prod.basePrice;
      setFormData((prev) => ({ ...prev, mrp: newMrp.toString() }));
    }
  };

  // Remove item from combo builder
  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  // Update item quantity in builder
  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === index ? { ...item, quantity } : item
      ),
    }));
  };

  // Submit Modal (Create or Update)
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.title.trim()) {
      setModalError("Please provide a combo title.");
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setModalError("Please provide a valid selling price.");
      return;
    }

    const mrpNum = parseFloat(formData.mrp) || calculatedComponentMrp || priceNum;
    if (mrpNum < priceNum) {
      setModalError("Original MRP cannot be less than the combo selling price.");
      return;
    }

    if (formData.items.length === 0) {
      setModalError("Please add at least one product to this combo.");
      return;
    }

    const galleryImages = formData.galleryImagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);

    try {
      const payload: Partial<ComboInput> = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || undefined,
        shortDescription: formData.shortDescription.trim() || undefined,
        description: formData.description.trim() || undefined,
        price: priceNum,
        mrp: mrpNum,
        imageUrl: formData.imageUrl.trim() || undefined,
        galleryImages,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        displayOrder: parseInt(formData.displayOrder || "0", 10),
        items: formData.items.map((i, idx) => ({
          productId: i.productId,
          variantId: i.variantId || null,
          quantity: i.quantity,
          sortOrder: idx,
        })),
      };

      const url = editingComboId
        ? `/api/admin/combos/${editingComboId}`
        : "/api/admin/combos";
      const method = editingComboId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save combo offer");
      }

      setSuccessMessage(
        editingComboId ? "Combo offer updated successfully!" : "Combo offer created successfully!"
      );
      setTimeout(() => setSuccessMessage(null), 3500);

      setIsModalOpen(false);
      fetchCombos();
    } catch (err: any) {
      setModalError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Combo Action
  const handleDeleteCombo = async () => {
    if (!deletingCombo) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/combos/${deletingCombo.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete combo");
      }

      setSuccessMessage(`"${deletingCombo.title}" was permanently deleted.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setDeletingCombo(null);
      fetchCombos();
    } catch (err: any) {
      setError(err.message || "Failed to delete combo");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Combos List
  const filteredCombos = useMemo(() => {
    return combos.filter((combo) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = combo.title.toLowerCase().includes(q);
        const matchSlug = combo.slug.toLowerCase().includes(q);
        const matchItem = combo.items?.some((i) =>
          i.product.title.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchSlug && !matchItem) return false;
      }

      // Status filter
      if (statusFilter === "ACTIVE" && !combo.isActive) return false;
      if (statusFilter === "INACTIVE" && combo.isActive) return false;

      // Featured filter
      if (featuredFilter === "FEATURED" && !combo.isFeatured) return false;

      return true;
    });
  }, [combos, searchQuery, statusFilter, featuredFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = combos.length;
    const active = combos.filter((c) => c.isActive).length;
    const inactive = total - active;
    const featured = combos.filter((c) => c.isFeatured).length;
    const avgSavings =
      total > 0
        ? Math.round(
            combos.reduce((acc, c) => acc + (c.savingsPercent || 0), 0) / total
          )
        : 0;

    return { total, active, inactive, featured, avgSavings };
  }, [combos]);

  // Filtered available products for picker
  const filteredAvailableProducts = useMemo(() => {
    if (!productSearch.trim()) return availableProducts.slice(0, 15);
    const q = productSearch.toLowerCase();
    return availableProducts
      .filter((p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 15);
  }, [availableProducts, productSearch]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-duskk-200 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-duskk-gold mb-1">
            <Gift className="w-6 h-6" />
            <span className="text-xs font-semibold tracking-widest uppercase">
              Exclusive Curations & Bundles
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-duskk-900 tracking-tight">
            Combo Offers Management
          </h1>
          <p className="text-sm text-duskk-600 mt-1">
            Build, price, bundle, and feature multi-product luxury jewelry sets with automatic inventory reservation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCombos}
            disabled={loading}
            className="p-2.5 text-duskk-600 hover:text-duskk-900 hover:bg-white rounded-lg border border-duskk-300 transition shadow-sm"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-duskk-gold" : ""}`} />
          </button>
          <Link
            href="/combos"
            target="_blank"
            className="inline-flex items-center px-4 py-2.5 text-xs uppercase tracking-wider font-semibold text-duskk-800 bg-white border border-duskk-300 hover:bg-duskk-50 rounded-lg shadow-sm transition"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            View Storefront
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-5 py-2.5 bg-duskk-900 text-white text-xs uppercase tracking-widest font-semibold hover:bg-duskk-800 rounded-lg shadow-md transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Combo
          </button>
        </div>
      </div>

      {/* Experience Mode Tab Switcher */}
      <div className="flex border-b border-duskk-200 gap-6 sm:gap-8">
        <button
          type="button"
          onClick={() => setActiveTab("PREDEFINED")}
          className={`flex items-center space-x-2 pb-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition ${
            activeTab === "PREDEFINED"
              ? "border-duskk-900 text-duskk-900"
              : "border-transparent text-duskk-400 hover:text-duskk-800"
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Curated Combos (Admin-Created)</span>
          <span className="ml-1.5 px-2 py-0.5 text-[10px] bg-duskk-100 text-duskk-700 rounded-full font-mono">
            {combos.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CUSTOM_BUILDER")}
          className={`flex items-center space-x-2 pb-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition ${
            activeTab === "CUSTOM_BUILDER"
              ? "border-duskk-900 text-duskk-900"
              : "border-transparent text-duskk-400 hover:text-duskk-800"
          }`}
        >
          <Sparkles className="w-4 h-4 text-duskk-gold" />
          <span>Build Your Own Combo (Customer Builder Config)</span>
          <span className="ml-1.5 px-2 py-0.5 text-[10px] bg-duskk-gold/20 text-duskk-900 font-bold rounded-full font-mono">
            Mode B
          </span>
        </button>
      </div>

      {activeTab === "CUSTOM_BUILDER" ? (
        <CustomComboSettingsTab />
      ) : (
        <>
          {/* Success Notification Alert */}
          {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-3 text-sm animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs uppercase font-bold text-rose-600 hover:text-rose-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-duskk-200 shadow-sm">
          <p className="text-xs text-duskk-500 font-medium uppercase tracking-wider">Total Combos</p>
          <p className="text-2xl font-serif font-bold text-duskk-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-duskk-200 shadow-sm">
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Active Live</p>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-duskk-200 shadow-sm">
          <p className="text-xs text-duskk-400 font-medium uppercase tracking-wider">Unpublished</p>
          <p className="text-2xl font-serif font-bold text-duskk-600 mt-1">{stats.inactive}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-duskk-200 shadow-sm">
          <p className="text-xs text-duskk-gold font-medium uppercase tracking-wider">Featured</p>
          <p className="text-2xl font-serif font-bold text-duskk-900 mt-1">{stats.featured}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-duskk-200 shadow-sm">
          <p className="text-xs text-duskk-700 font-medium uppercase tracking-wider">Avg Discount</p>
          <p className="text-2xl font-serif font-bold text-duskk-900 mt-1">
            {stats.avgSavings}%
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-duskk-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-duskk-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, slug, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-duskk-50 border border-duskk-300 rounded-lg text-sm text-duskk-900 placeholder-duskk-400 focus:outline-none focus:border-duskk-gold focus:bg-white transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-duskk-500 font-medium mr-1 uppercase tracking-wider">
            Status:
          </span>
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              statusFilter === "ALL"
                ? "bg-duskk-900 text-white"
                : "bg-duskk-100 text-duskk-700 hover:bg-duskk-200"
            }`}
          >
            All ({combos.length})
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              statusFilter === "ACTIVE"
                ? "bg-emerald-700 text-white"
                : "bg-duskk-100 text-duskk-700 hover:bg-duskk-200"
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setStatusFilter("INACTIVE")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              statusFilter === "INACTIVE"
                ? "bg-duskk-700 text-white"
                : "bg-duskk-100 text-duskk-700 hover:bg-duskk-200"
            }`}
          >
            Inactive ({stats.inactive})
          </button>

          <span className="text-xs text-duskk-300 mx-1">|</span>

          <button
            onClick={() =>
              setFeaturedFilter(featuredFilter === "FEATURED" ? "ALL" : "FEATURED")
            }
            className={`px-3 py-1.5 text-xs rounded-lg font-medium flex items-center space-x-1 transition ${
              featuredFilter === "FEATURED"
                ? "bg-duskk-gold text-duskk-900 font-bold"
                : "bg-duskk-100 text-duskk-700 hover:bg-duskk-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Featured ({stats.featured})
          </button>
        </div>
      </div>

      {/* Main Combos Table */}
      <div className="bg-white rounded-xl border border-duskk-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-duskk-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-duskk-gold" />
            <p className="text-sm font-medium">Loading combo offers...</p>
          </div>
        ) : filteredCombos.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-duskk-50 flex items-center justify-center mx-auto text-duskk-gold">
              <Gift className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-duskk-900">
              No Combo Offers Found
            </h3>
            <p className="text-xs text-duskk-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "ALL" || featuredFilter !== "ALL"
                ? "Try clearing your filters or search keywords."
                : "Start bundling multiple jewelry products into high-converting gift sets."}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center px-4 py-2 bg-duskk-900 text-white text-xs uppercase tracking-wider font-semibold hover:bg-duskk-800 rounded-lg shadow transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create First Combo
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-duskk-50 border-b border-duskk-200 text-xs font-semibold text-duskk-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Combo</th>
                  <th className="py-3.5 px-4">Included Products</th>
                  <th className="py-3.5 px-4">Original MRP</th>
                  <th className="py-3.5 px-4">Combo Price</th>
                  <th className="py-3.5 px-4">Savings</th>
                  <th className="py-3.5 px-4 text-center">Featured</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Order</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-duskk-100">
                {filteredCombos.map((combo) => (
                  <tr
                    key={combo.id}
                    className="hover:bg-duskk-50/70 transition-colors group"
                  >
                    {/* Thumbnail & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3 min-w-[200px]">
                        <img
                          src={
                            combo.imageUrl ||
                            (combo.galleryImages && combo.galleryImages[0]) ||
                            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=150&q=80"
                          }
                          alt={combo.title}
                          className="w-12 h-12 object-cover rounded-lg bg-duskk-100 border border-duskk-200 flex-shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-duskk-900 group-hover:text-duskk-gold transition">
                            {combo.title}
                          </p>
                          <p className="text-xs text-duskk-400 font-mono">
                            /{combo.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Included Items Preview */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-duskk-100 text-duskk-800">
                          <Package className="w-3 h-3 mr-1 text-duskk-gold" />
                          {combo.itemsCount || combo.items?.length || 0} Products
                        </span>
                        <div className="text-[11px] text-duskk-500 line-clamp-1 max-w-[220px]">
                          {combo.items?.map((i) => i.product.title).join(", ") ||
                            "Included items"}
                        </div>
                      </div>
                    </td>

                    {/* MRP */}
                    <td className="py-3.5 px-4 font-mono text-xs text-duskk-500 line-through">
                      {formatPrice(combo.mrp)}
                    </td>

                    {/* Selling Price */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-duskk-900 font-mono text-sm">
                        {formatPrice(combo.price)}
                      </span>
                    </td>

                    {/* Savings Badge */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {combo.savingsPercent}% OFF
                        </span>
                        <p className="text-[11px] text-emerald-600 font-medium">
                          Save {formatPrice(combo.savingsAmount || 0)}
                        </p>
                      </div>
                    </td>

                    {/* Featured Star/Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(combo)}
                        className={`p-1.5 rounded-full transition ${
                          combo.isFeatured
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "text-duskk-300 hover:text-amber-500 hover:bg-duskk-100"
                        }`}
                        title={
                          combo.isFeatured ? "Featured on Homepage" : "Click to Feature"
                        }
                      >
                        <Sparkles
                          className={`w-4 h-4 ${
                            combo.isFeatured ? "fill-amber-500 text-amber-600" : ""
                          }`}
                        />
                      </button>
                    </td>

                    {/* Status Switch */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(combo)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition ${
                          combo.isActive
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            : "bg-duskk-100 text-duskk-600 hover:bg-duskk-200 border border-duskk-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            combo.isActive ? "bg-emerald-600" : "bg-duskk-400"
                          }`}
                        />
                        {combo.isActive ? "Published" : "Draft"}
                      </button>
                    </td>

                    {/* Display Order */}
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-duskk-500">
                      #{combo.displayOrder}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Link
                          href={`/combos/${combo.slug}`}
                          target="_blank"
                          className="p-1.5 text-duskk-400 hover:text-duskk-900 hover:bg-duskk-100 rounded transition"
                          title="View on Storefront"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(combo)}
                          className="p-1.5 text-duskk-600 hover:text-duskk-900 hover:bg-duskk-100 rounded transition"
                          title="Edit Combo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCombo(combo)}
                          className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          title="Delete Combo"
                        >
                          <Trash2 className="w-4 h-4" />
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
      </>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl border border-duskk-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 bg-duskk-cream border-b border-duskk-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-duskk-900 text-duskk-gold flex items-center justify-center shadow">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-duskk-900">
                    {editingComboId ? "Edit Combo Offer" : "Create New Combo Offer"}
                  </h3>
                  <p className="text-xs text-duskk-500">
                    Bundle products together with special promotional pricing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-duskk-400 hover:text-duskk-900 hover:bg-duskk-200 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitModal} className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-duskk-800 uppercase tracking-wider">
                    Combo Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Celestial Heart Gift Set"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-duskk-50 border border-duskk-300 rounded-lg text-sm text-duskk-900 focus:outline-none focus:border-duskk-gold focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-duskk-800 uppercase tracking-wider">
                    Custom Slug (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. celestial-heart-gift-set (auto-generated if empty)"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-duskk-50 border border-duskk-300 rounded-lg text-sm text-duskk-900 focus:outline-none focus:border-duskk-gold focus:bg-white"
                  />
                </div>
              </div>

              {/* Short & Full Descriptions */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-duskk-800 uppercase tracking-wider">
                    Short Description (For Cards & Badges)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Handcrafted Rose Gold Ring and Crystal Earrings in luxury packaging."
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full px-3.5 py-2 bg-duskk-50 border border-duskk-300 rounded-lg text-sm text-duskk-900 focus:outline-none focus:border-duskk-gold focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-duskk-800 uppercase tracking-wider">
                    Full Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Detailed explanation of the combination, styling notes, authenticity..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-duskk-50 border border-duskk-300 rounded-lg text-sm text-duskk-900 focus:outline-none focus:border-duskk-gold focus:bg-white"
                  />
                </div>
              </div>

              {/* PRODUCT BUNDLE BUILDER */}
              <div className="border border-duskk-200 rounded-xl p-4 bg-duskk-50/50 space-y-4">
                <div className="flex items-center justify-between border-b border-duskk-200 pb-3">
                  <div>
                    <h4 className="font-serif text-sm font-bold text-duskk-900 uppercase tracking-wider flex items-center">
                      <Layers className="w-4 h-4 mr-1.5 text-duskk-gold" />
                      Bundled Products ({formData.items.length})
                    </h4>
                    <p className="text-xs text-duskk-500">
                      Select products from your catalog to include in this combo.
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-duskk-500">Components Combined MRP:</span>
                    <p className="text-sm font-bold text-duskk-900 font-mono">
                      {formatPrice(calculatedComponentMrp)}
                    </p>
                  </div>
                </div>

                {/* Selected Items In Combo Table */}
                {formData.items.length === 0 ? (
                  <div className="p-4 text-center bg-white rounded-lg border border-dashed border-duskk-300 text-xs text-duskk-500">
                    No products added to this combo yet. Use the catalog picker below to add items.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.items.map((item, idx) => (
                      <div
                        key={`${item.productId}_${idx}`}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-duskk-200 shadow-sm"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              className="w-10 h-10 object-cover rounded bg-duskk-50 border border-duskk-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-duskk-100 flex items-center justify-center text-duskk-400">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-duskk-900 line-clamp-1">
                              {item.productTitle || item.productId}
                            </p>
                            <p className="text-[11px] text-duskk-500 font-mono">
                              SKU: {item.productSku || "DSK-SKU"} • {formatPrice(item.basePrice || 0)} each
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {/* Quantity control */}
                          <div className="flex items-center border border-duskk-300 rounded bg-duskk-50">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-duskk-600 hover:text-duskk-900"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold text-duskk-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-duskk-600 hover:text-duskk-900"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-mono text-xs font-bold text-duskk-900 min-w-[70px] text-right">
                            {formatPrice((item.basePrice || 0) * item.quantity)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-duskk-400 hover:text-rose-600 p-1 transition"
                            title="Remove from combo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Catalog Product Picker Search */}
                <div className="pt-2">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-duskk-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search catalog to add jewelry pieces..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-duskk-300 rounded-lg text-xs text-duskk-900 placeholder-duskk-400 focus:outline-none focus:border-duskk-gold"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto divide-y divide-duskk-100 bg-white rounded-lg border border-duskk-200">
                    {loadingProducts ? (
                      <p className="p-3 text-center text-xs text-duskk-400">Loading catalog...</p>
                    ) : filteredAvailableProducts.length === 0 ? (
                      <p className="p-3 text-center text-xs text-duskk-400">No matching products found.</p>
                    ) : (
                      filteredAvailableProducts.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 flex items-center justify-between text-xs hover:bg-duskk-50 transition"
                        >
                          <div className="flex items-center space-x-2 min-w-0 pr-2">
                            <span className="font-medium text-duskk-900 line-clamp-1">
                              {p.title}
                            </span>
                            <span className="text-duskk-400 font-mono text-[10px]">
                              ({p.sku})
                            </span>
                            <span className="text-duskk-700 font-semibold font-mono text-[11px]">
                              {formatPrice(p.basePrice)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddProductToCombo(p)}
                            className="px-2.5 py-1 bg-duskk-100 hover:bg-duskk-900 hover:text-white text-duskk-800 rounded font-medium text-[11px] transition"
                          >
                            + Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* PRICING & SAVINGS ROW */}
              <div className="bg-duskk-gold/10 border border-duskk-gold/30 rounded-xl p-4 space-y-4">
                <h4 className="font-serif text-xs font-bold text-duskk-900 uppercase tracking-wider flex items-center">
                  <Percent className="w-4 h-4 mr-1 text-duskk-gold" />
                  Pricing & Promotional Discount Calculation
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* MRP */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-duskk-800 uppercase tracking-wider">
                      Original Combined MRP (₹) *
                    </label>
                    <input
                      type="number"
                      placeholder={calculatedComponentMrp.toString()}
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-duskk-300 rounded-lg text-sm font-mono text-duskk-900 focus:outline-none focus:border-duskk-gold"
                    />
                    <p className="text-[10px] text-duskk-500">
                      Calculated component total: {formatPrice(calculatedComponentMrp)}
                    </p>
                  </div>

                  {/* Selling Price */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-duskk-800 uppercase tracking-wider">
                      Combo Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1999"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-duskk-300 rounded-lg text-sm font-mono text-duskk-900 font-bold focus:outline-none focus:border-duskk-gold"
                    />
                  </div>

                  {/* Live Savings Card */}
                  <div className="bg-white p-3 rounded-lg border border-duskk-200 flex flex-col justify-center">
                    <span className="text-[11px] text-duskk-500 font-medium">Customer Savings:</span>
                    <div className="flex items-baseline space-x-2 mt-0.5">
                      <span className="text-base font-bold text-emerald-700 font-mono">
                        Save {formatPrice(liveSavings.diff)}
                      </span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {liveSavings.pct}% OFF
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MEDIA & IMAGES */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-duskk-800 uppercase tracking-wider">
                    Primary Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://... / image URL"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3.5 py-2 bg-duskk-50 border border-duskk-300 rounded-lg text-sm text-duskk-900 focus:outline-none focus:border-duskk-gold focus:bg-white"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 flex items-center space-x-2">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border border-duskk-200"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      <span className="text-xs text-duskk-500">Primary preview</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-duskk-800 uppercase tracking-wider">
                    Additional Gallery Images (One URL per line)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="https://images.../angle2.jpg&#10;https://images.../angle3.jpg"
                    value={formData.galleryImagesText}
                    onChange={(e) => setFormData({ ...formData, galleryImagesText: e.target.value })}
                    className="w-full px-3.5 py-2 bg-duskk-50 border border-duskk-300 rounded-lg text-xs font-mono text-duskk-900 focus:outline-none focus:border-duskk-gold focus:bg-white"
                  />
                </div>
              </div>

              {/* SETTINGS: PUBLISH, FEATURED, DISPLAY ORDER */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-duskk-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-duskk-900 focus:ring-duskk-gold"
                  />
                  <label htmlFor="isActive" className="text-xs font-semibold text-duskk-800 cursor-pointer">
                    Active & Published Live
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-duskk-900 focus:ring-duskk-gold"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-semibold text-duskk-800 cursor-pointer flex items-center">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1" />
                    Feature on Homepage
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-duskk-800 uppercase tracking-wider">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-duskk-50 border border-duskk-300 rounded-lg text-xs font-mono text-duskk-900 focus:outline-none focus:border-duskk-gold"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-duskk-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-duskk-100 hover:bg-duskk-200 text-duskk-700 text-xs uppercase tracking-wider font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-duskk-900 hover:bg-duskk-800 text-white text-xs uppercase tracking-widest font-semibold rounded-lg shadow-md transition flex items-center"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  {editingComboId ? "Update Combo Offer" : "Save & Publish Combo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-duskk-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-serif text-lg font-bold text-duskk-900">
                Delete Combo Offer?
              </h3>
              <p className="text-xs text-duskk-500">
                Are you sure you want to permanently delete{" "}
                <strong className="text-duskk-900">"{deletingCombo.title}"</strong>?
              </p>
              <p className="text-[11px] text-duskk-400 bg-duskk-50 p-2.5 rounded-lg border border-duskk-200">
                Note: Individual products in this combo will remain intact in your catalog. Only the combo bundle and its promotional pricing will be removed.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setDeletingCombo(null)}
                className="px-4 py-2 bg-duskk-100 hover:bg-duskk-200 text-duskk-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCombo}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow transition flex items-center"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Yes, Delete Combo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
