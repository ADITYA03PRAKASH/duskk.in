"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { CustomComboSettings } from "@/types";
import { useCart, CustomComboComponentCart } from "@/context/CartContext";
import {
  Gift,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Truck,
  ArrowRight,
  Check,
  Search,
  SlidersHorizontal,
  Package,
  AlertCircle,
  Eye,
  Info,
  X,
  ChevronDown,
} from "lucide-react";

interface ProductVariantOption {
  id: string;
  title: string;
  sku: string;
  price: number;
  stockQuantity: number;
  image: string;
}

interface BuilderProduct {
  id: string;
  title: string;
  slug: string;
  sku: string;
  price: number;
  mrp: number;
  image: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  availableStock: number;
  inStock: boolean;
  variants: ProductVariantOption[];
}

interface SelectedComboItem {
  productId: string;
  variantId?: string | null;
  productTitle: string;
  variantTitle?: string | null;
  sku: string;
  price: number;
  mrp: number;
  image: string;
  quantity: number;
  maxAvailableStock: number;
}

export function BuildYourComboClient({
  initialSettings,
  initialCategories,
  initialProducts,
}: {
  initialSettings: CustomComboSettings;
  initialCategories: any[];
  initialProducts: BuilderProduct[];
}) {
  const { addCustomComboToCart } = useCart();

  const [settings] = useState<CustomComboSettings>(initialSettings);
  const [categories] = useState<any[]>(initialCategories);
  const [products] = useState<BuilderProduct[]>(initialProducts);

  // Selected products for the custom combo
  const [selectedItems, setSelectedItems] = useState<SelectedComboItem[]>([]);

  // Selected variants per product (productId -> variantId)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [addedNotification, setAddedNotification] = useState(false);

  // Promotion date check
  const now = new Date();
  const isStarted = !settings.startsAt || now >= new Date(settings.startsAt);
  const isEnded = settings.endsAt && now > new Date(settings.endsAt);
  const isFeatureAvailable = settings.isEnabled && isStarted && !isEnded;

  // Initialize default variants
  useEffect(() => {
    const defaults: Record<string, string> = {};
    for (const prod of products) {
      if (prod.variants && prod.variants.length > 0) {
        defaults[prod.id] = prod.variants[0].id;
      }
    }
    setSelectedVariants(defaults);
  }, [products]);

  // Handle variant change for a product card
  const handleVariantSelect = (productId: string, variantId: string) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId }));

    // If already in combo, update the variant in the combo selection
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const prod = products.find((p) => p.id === productId);
          const newVariant = prod?.variants.find((v) => v.id === variantId);
          if (newVariant) {
            return {
              ...item,
              variantId: newVariant.id,
              variantTitle: newVariant.title !== "Standard" ? newVariant.title : null,
              sku: newVariant.sku,
              price: newVariant.price,
              image: newVariant.image || item.image,
              maxAvailableStock: newVariant.stockQuantity,
            };
          }
        }
        return item;
      })
    );
  };

  // Add product to custom combo
  const handleAddProduct = (prod: BuilderProduct) => {
    if (!prod.inStock) return;

    const chosenVariantId = selectedVariants[prod.id] || prod.variants?.[0]?.id || null;
    const variantObj = prod.variants?.find((v) => v.id === chosenVariantId);

    const price = variantObj ? variantObj.price : prod.price;
    const sku = variantObj ? variantObj.sku : prod.sku;
    const variantTitle = variantObj && variantObj.title !== "Standard" ? variantObj.title : null;
    const image = variantObj?.image || prod.image;
    const availableStock = variantObj ? variantObj.stockQuantity : prod.availableStock;

    setSelectedItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === prod.id);

      if (existingIndex >= 0) {
        // Increase quantity up to maxQuantityPerProduct and availableStock
        const existing = prev[existingIndex];
        const newQty = Math.min(
          existing.quantity + 1,
          settings.maxQuantityPerProduct,
          existing.maxAvailableStock
        );
        return prev.map((item, idx) => (idx === existingIndex ? { ...item, quantity: newQty } : item));
      }

      // Check if max items limit reached
      if (prev.length >= settings.maxItems) {
        alert(`You can select a maximum of ${settings.maxItems} distinct products for your combo.`);
        return prev;
      }

      return [
        ...prev,
        {
          productId: prod.id,
          variantId: chosenVariantId,
          productTitle: prod.title,
          variantTitle,
          sku,
          price,
          mrp: prod.mrp,
          image,
          quantity: settings.minQuantityPerProduct || 1,
          maxAvailableStock: availableStock,
        },
      ];
    });
  };

  // Update item quantity in selection
  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const clampedQty = Math.min(
            Math.max(newQty, settings.minQuantityPerProduct),
            settings.maxQuantityPerProduct,
            item.maxAvailableStock
          );
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  // Remove item from selection
  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Clear entire combo selection
  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  // Filtered & sorted catalog products
  const displayProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory !== "ALL") {
      result = result.filter(
        (p) => p.categoryId === selectedCategory || p.categorySlug === selectedCategory
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Live Pricing Calculation
  const comboCalculation = useMemo(() => {
    const rawTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const rawMrp = selectedItems.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
    const totalPieces = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

    const isComplete = selectedItems.length >= settings.minItems && selectedItems.length <= settings.maxItems;

    let discount = 0;
    if (isComplete && rawTotal > 0) {
      if (settings.discountType === "percentage") {
        let calculated = (rawTotal * (settings.discountValue || 0)) / 100;
        if (settings.maxDiscountAmount && calculated > settings.maxDiscountAmount) {
          calculated = settings.maxDiscountAmount;
        }
        discount = Math.round(calculated);
      } else if (settings.discountType === "fixed_amount") {
        discount = Math.min(settings.discountValue || 0, rawTotal);
        if (settings.maxDiscountAmount && discount > settings.maxDiscountAmount) {
          discount = settings.maxDiscountAmount;
        }
      }
    }

    const finalPrice = Math.max(0, rawTotal - discount);
    const totalSavings = Math.max(0, rawMrp - finalPrice);
    const savingsPercent = rawMrp > 0 ? Math.round((totalSavings / rawMrp) * 100) : 0;

    return {
      rawTotal,
      rawMrp,
      discount,
      finalPrice,
      totalSavings,
      savingsPercent,
      totalPieces,
      isComplete,
      itemsNeeded: Math.max(0, settings.minItems - selectedItems.length),
    };
  }, [selectedItems, settings]);

  // Final Action: Add Custom Combo to Cart
  const handleAddToCart = () => {
    if (!comboCalculation.isComplete) return;

    const components: CustomComboComponentCart[] = selectedItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || null,
      name: item.productTitle,
      variantTitle: item.variantTitle,
      sku: item.sku,
      price: item.price,
      mrp: item.mrp,
      image: item.image,
      quantity: item.quantity,
    }));

    addCustomComboToCart({
      id: `custom_combo_${Date.now()}`,
      title: `${settings.title} (${comboCalculation.totalPieces} Pieces)`,
      price: comboCalculation.finalPrice,
      mrp: comboCalculation.rawMrp,
      image: selectedItems[0]?.image || "/placeholder.jpg",
      components,
    });

    setIsReviewModalOpen(false);
    setAddedNotification(true);
    setTimeout(() => setAddedNotification(false), 3000);
  };

  // If feature is disabled by admin
  if (!isFeatureAvailable) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-duskk-cream flex items-center justify-center text-duskk-gold mx-auto">
          <Gift className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-duskk-900">
          Build Your Own Combo
        </h1>
        <p className="text-duskk-600 text-sm max-w-md mx-auto leading-relaxed">
          Our custom combo builder is currently resting while we prepare new bespoke collections.
          In the meantime, explore our curated luxury gift sets and signature pieces.
        </p>
        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <Link
            href="/combos"
            className="px-6 py-3 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest transition shadow-md"
          >
            Explore Curated Gift Sets
          </Link>
          <Link
            href="/shop"
            className="px-6 py-3 bg-white hover:bg-duskk-100 text-duskk-900 border border-duskk-300 text-xs font-semibold uppercase tracking-widest transition"
          >
            Browse All Jewelry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* 1. HERO HEADER */}
      <section className="bg-duskk-900 text-white py-14 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-duskk-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 text-duskk-gold bg-duskk-800/80 px-3.5 py-1 rounded-full text-xs font-mono tracking-widest uppercase mb-3 border border-duskk-gold/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Custom Atelier</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-white">
            {settings.title}
          </h1>

          <p className="text-duskk-300 text-xs sm:text-sm max-w-2xl mx-auto mt-2 leading-relaxed">
            {settings.subtitle}
          </p>

          {/* Discount Policy Pill Banner */}
          {settings.discountType !== "none" && (
            <div className="mt-6 inline-flex items-center space-x-2 bg-duskk-gold/15 border border-duskk-gold/40 text-duskk-champagne px-4 py-1.5 rounded-full text-xs font-medium">
              <Gift className="w-4 h-4 text-duskk-gold flex-shrink-0" />
              <span>
                Select between <strong>{settings.minItems}</strong> and <strong>{settings.maxItems}</strong> eligible pieces to unlock{" "}
                <strong className="text-white">
                  {settings.discountType === "percentage"
                    ? `${settings.discountValue}% OFF`
                    : `₹${settings.discountValue} OFF`}
                </strong>
                {settings.maxDiscountAmount ? ` (Up to ₹${settings.maxDiscountAmount})` : ""}
              </span>
            </div>
          )}

          {/* 3 Step Interactive Progress Pills */}
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto mt-8 text-xs border-t border-white/10 pt-6">
            <div className={`flex flex-col items-center text-center space-y-1 ${selectedItems.length > 0 ? "text-duskk-gold" : "text-duskk-400"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedItems.length > 0 ? "bg-duskk-gold text-duskk-900" : "bg-white/10 text-white"}`}>
                1
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider">Browse & Pick</span>
            </div>

            <div className={`flex flex-col items-center text-center space-y-1 ${comboCalculation.isComplete ? "text-duskk-gold" : "text-duskk-400"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${comboCalculation.isComplete ? "bg-duskk-gold text-duskk-900" : "bg-white/10 text-white"}`}>
                2
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider">Configure Sizes</span>
            </div>

            <div className={`flex flex-col items-center text-center space-y-1 ${comboCalculation.isComplete ? "text-emerald-400 font-semibold" : "text-duskk-400"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${comboCalculation.isComplete ? "bg-emerald-500 text-white" : "bg-white/10 text-white"}`}>
                3
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider">Review & Save</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATALOG FILTERS & SEARCH BAR */}
      <section className="bg-white border-b border-duskk-200 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase transition whitespace-nowrap ${
                  selectedCategory === "ALL"
                    ? "bg-duskk-900 text-white font-semibold shadow-xs"
                    : "bg-duskk-100 text-duskk-700 hover:bg-duskk-200"
                }`}
              >
                All Pieces ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug || cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase transition whitespace-nowrap ${
                    selectedCategory === cat.slug || selectedCategory === cat.id
                      ? "bg-duskk-900 text-white font-semibold shadow-xs"
                      : "bg-duskk-100 text-duskk-700 hover:bg-duskk-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-60">
                <Search className="w-3.5 h-3.5 text-duskk-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search jewelry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-duskk-300 rounded-full text-xs bg-duskk-50 focus:bg-white focus:outline-none focus:border-duskk-gold"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 border border-duskk-300 rounded-full text-xs bg-white text-duskk-800 focus:outline-none focus:border-duskk-gold font-medium"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT CARDS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {displayProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white border border-duskk-200 rounded-xl p-8">
            <Package className="w-10 h-10 text-duskk-300 mx-auto" />
            <h3 className="font-serif text-lg font-medium text-duskk-900">
              No matching products found
            </h3>
            <p className="text-xs text-duskk-500 max-w-sm mx-auto">
              Try adjusting your search query or selecting a different jewelry category.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("ALL");
                setSearchQuery("");
              }}
              className="mt-2 px-4 py-2 bg-duskk-100 hover:bg-duskk-200 text-duskk-800 text-xs font-semibold rounded-lg uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayProducts.map((prod) => {
              const inComboItem = selectedItems.find((i) => i.productId === prod.id);
              const isSelected = Boolean(inComboItem);
              const chosenVariantId = selectedVariants[prod.id] || prod.variants?.[0]?.id;
              const activeVariant = prod.variants?.find((v) => v.id === chosenVariantId);

              const currentPrice = activeVariant ? activeVariant.price : prod.price;
              const currentStock = activeVariant ? activeVariant.stockQuantity : prod.availableStock;
              const isOutOfStock = !prod.inStock || currentStock <= 0;

              return (
                <div
                  key={prod.id}
                  className={`group bg-white rounded-xl border overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                    isSelected
                      ? "border-duskk-900 ring-2 ring-duskk-gold/40 shadow-lg"
                      : "border-duskk-200 hover:border-duskk-gold/60 hover:shadow-md"
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-duskk-100">
                    <img
                      src={activeVariant?.image || prod.image || "/placeholder.jpg"}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Category Pill */}
                    <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-white text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded">
                      {prod.categoryName}
                    </div>

                    {/* Stock Alert Pill */}
                    {isOutOfStock ? (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-rose-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded shadow">
                          Sold Out
                        </span>
                      </div>
                    ) : currentStock <= 5 ? (
                      <div className="absolute top-2.5 right-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        Only {currentStock} Left
                      </div>
                    ) : null}

                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute bottom-2.5 right-2.5 bg-duskk-900 text-duskk-gold px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-md">
                        <Check className="w-3.5 h-3.5 text-duskk-gold" />
                        <span>In Combo</span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-serif text-sm font-semibold text-duskk-900 line-clamp-1 group-hover:text-duskk-gold transition">
                        {prod.title}
                      </h3>
                      <p className="text-[10px] text-duskk-400 font-mono mt-0.5">SKU: {activeVariant?.sku || prod.sku}</p>

                      {/* Price Display */}
                      <div className="flex items-baseline space-x-2 mt-1.5">
                        <span className="text-sm font-bold font-serif text-duskk-900">
                          {formatPrice(currentPrice)}
                        </span>
                        {prod.mrp > currentPrice && (
                          <span className="text-xs text-duskk-400 line-through">
                            {formatPrice(prod.mrp)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Variant Selector (if variants exist) */}
                    {prod.variants && prod.variants.length > 1 && (
                      <div className="pt-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-duskk-500 block mb-1">
                          Select Variant / Size:
                        </label>
                        <select
                          value={chosenVariantId || ""}
                          onChange={(e) => handleVariantSelect(prod.id, e.target.value)}
                          disabled={isOutOfStock}
                          className="w-full px-2 py-1 border border-duskk-300 rounded text-xs bg-white text-duskk-800 focus:outline-none focus:border-duskk-gold"
                        >
                          {prod.variants.map((v) => (
                            <option key={v.id} value={v.id} disabled={v.stockQuantity <= 0}>
                              {v.title} {v.stockQuantity <= 0 ? "(Out of stock)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Add to Combo Button or Quantity Stepper */}
                    <div className="pt-2">
                      {inComboItem ? (
                        <div className="flex items-center justify-between bg-duskk-100 rounded-lg p-1 border border-duskk-300">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(prod.id, inComboItem.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded text-duskk-700 hover:text-duskk-900 hover:bg-duskk-50 shadow-xs transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-duskk-900 font-mono">
                            Qty: {inComboItem.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(prod.id, inComboItem.quantity + 1)}
                            disabled={
                              inComboItem.quantity >= settings.maxQuantityPerProduct ||
                              inComboItem.quantity >= inComboItem.maxAvailableStock
                            }
                            className="w-7 h-7 flex items-center justify-center bg-white rounded text-duskk-700 hover:text-duskk-900 hover:bg-duskk-50 disabled:opacity-40 shadow-xs transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddProduct(prod)}
                          disabled={isOutOfStock}
                          className="w-full py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 disabled:bg-duskk-200 disabled:text-duskk-400 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center justify-center space-x-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isOutOfStock ? "Unavailable" : "Add to Combo"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. PERSISTENT FLOATING STICKY COMBO BAR */}
      <aside className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-duskk-300 shadow-2xl py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Selected Items Thumbnails Preview */}
          <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto scrollbar-none">
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <span className="text-xs font-bold text-duskk-900 uppercase tracking-wider">
                Your Set ({selectedItems.length}/{settings.maxItems}):
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <span className="text-xs text-duskk-400 italic">
                Pick at least {settings.minItems} items to construct your combo
              </span>
            ) : (
              <div className="flex items-center space-x-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.productId}
                    className="relative group w-10 h-10 rounded-lg overflow-hidden border border-duskk-300 flex-shrink-0 bg-duskk-50"
                  >
                    <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.productId)}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {item.quantity > 1 && (
                      <span className="absolute bottom-0 right-0 bg-duskk-900 text-white text-[9px] font-bold px-1 rounded-tl">
                        {item.quantity}
                      </span>
                    )}
                  </div>
                ))}
                {selectedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[11px] text-duskk-400 hover:text-rose-600 underline whitespace-nowrap pl-2"
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Pricing, Status Pill & Review Button */}
          <div className="flex items-center justify-between md:justify-end space-x-4 w-full md:w-auto">
            {/* Running Calculation */}
            <div className="text-right">
              {comboCalculation.discount > 0 && (
                <div className="flex items-center space-x-1.5 justify-end text-[11px]">
                  <span className="line-through text-duskk-400">
                    {formatPrice(comboCalculation.rawTotal)}
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                    Save {formatPrice(comboCalculation.discount)}
                  </span>
                </div>
              )}
              <div className="text-base sm:text-lg font-bold font-serif text-duskk-900">
                Total: {formatPrice(comboCalculation.finalPrice)}
              </div>
            </div>

            {/* Action Trigger */}
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              disabled={!comboCalculation.isComplete}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all shadow-md flex items-center space-x-2 ${
                comboCalculation.isComplete
                  ? "bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white cursor-pointer"
                  : "bg-duskk-200 text-duskk-400 cursor-not-allowed"
              }`}
            >
              <span>
                {comboCalculation.itemsNeeded > 0
                  ? `Select ${comboCalculation.itemsNeeded} More`
                  : "Review & Purchase"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 5. REVIEW CUSTOM COMBO MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-duskk-200 shadow-2xl overflow-hidden my-auto flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-duskk-cream border-b border-duskk-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5 text-duskk-gold" />
                <h3 className="font-serif text-lg font-bold text-duskk-900">
                  Review Your Custom Combo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 text-duskk-400 hover:text-duskk-900 rounded-full hover:bg-duskk-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Components List */}
            <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto divide-y divide-duskk-100 text-xs">
              {selectedItems.map((item) => (
                <div key={item.productId} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.productTitle}
                      className="w-14 h-14 object-cover rounded-lg border border-duskk-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-duskk-900 line-clamp-1">{item.productTitle}</h4>
                      {item.variantTitle && (
                        <p className="text-[11px] text-duskk-600 font-medium">{item.variantTitle}</p>
                      )}
                      <p className="text-[10px] text-duskk-400 font-mono mt-0.5">SKU: {item.sku}</p>
                      <div className="text-xs font-semibold text-duskk-900 mt-1">
                        {formatPrice(item.price)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className="flex items-center border border-duskk-300 rounded bg-white">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                        className="px-2 py-1 text-duskk-600 hover:bg-duskk-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-duskk-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        disabled={
                          item.quantity >= settings.maxQuantityPerProduct ||
                          item.quantity >= item.maxAvailableStock
                        }
                        className="px-2 py-1 text-duskk-600 hover:bg-duskk-100 disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.productId)}
                      className="p-1.5 text-duskk-400 hover:text-rose-600 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Pricing Summary */}
            <div className="p-5 bg-duskk-50 border-t border-duskk-200 space-y-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-duskk-600">
                  <span>Combined Original Price:</span>
                  <span className="font-medium text-duskk-900">{formatPrice(comboCalculation.rawTotal)}</span>
                </div>

                {comboCalculation.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>
                      Combo Discount ({settings.discountType === "percentage" ? `${settings.discountValue}%` : "Fixed"}):
                    </span>
                    <span>-{formatPrice(comboCalculation.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-duskk-600">
                  <span>Complimentary Shipping:</span>
                  <span className="text-emerald-700 font-semibold">FREE (Express Insured)</span>
                </div>

                <div className="flex justify-between text-duskk-600">
                  <span>Luxury Gift Packaging:</span>
                  <span className="text-duskk-900 font-semibold">Complimentary Box & Velvet Pouch</span>
                </div>
              </div>

              <div className="pt-3 border-t border-duskk-200 flex justify-between items-baseline">
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-duskk-500 block">
                    Final Combo Price
                  </span>
                  <span className="text-2xl font-serif font-bold text-duskk-900">
                    {formatPrice(comboCalculation.finalPrice)}
                  </span>
                </div>

                {comboCalculation.totalSavings > 0 && (
                  <span className="bg-duskk-gold text-duskk-950 font-bold text-xs uppercase px-2.5 py-1 rounded shadow-sm">
                    Total Savings: {formatPrice(comboCalculation.totalSavings)}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="w-full sm:w-1/3 py-3 border border-duskk-300 bg-white hover:bg-duskk-100 text-duskk-800 text-xs font-semibold uppercase tracking-wider rounded-lg transition"
                >
                  Edit Selection
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full sm:w-2/3 py-3 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded-lg transition-all shadow-lg flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add Custom Combo to Bag</span>
                </button>
              </div>

              <p className="text-[11px] text-duskk-400 text-center pt-1">
                Prices and inventory are securely verified on server during checkout.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
