"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatPrice, optimizeImageUrl } from "@/lib/utils";
import { Combo } from "@/types";
import { useCart } from "@/context/CartContext";
import {
  Gift,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Star,
  ChevronRight,
  Package,
  Layers,
  Heart,
  Share2,
} from "lucide-react";

export function ComboDetailClient({ combo }: { combo: Combo }) {
  const { addComboToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gallery image selection
  const allImages = [
    combo.imageUrl,
    ...(combo.galleryImages || []),
    ...(combo.items?.map((i) => i.product.image).filter(Boolean) as string[]),
  ].filter((img): img is string => Boolean(img));

  const uniqueImages = Array.from(new Set(allImages));
  const [selectedImage, setSelectedImage] = useState<string>(
    uniqueImages[0] || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"
  );

  const handleAddToCart = () => {
    setIsAdding(true);
    addComboToCart(combo, quantity);
    setTimeout(() => {
      setIsAdding(false);
    }, 1500);
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasItems = Boolean(combo.items && combo.items.length > 0);
  const itemsCount = combo.items?.length || combo.itemsCount || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-duskk-500 font-mono">
        <Link href="/" className="hover:text-duskk-900 transition">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-duskk-300" />
        <Link href="/combos" className="hover:text-duskk-900 transition">
          Gift Sets & Combos
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-duskk-300" />
        <span className="text-duskk-900 font-semibold truncate max-w-xs sm:max-w-md">
          {combo.title}
        </span>
      </nav>

      {/* Main Detail Grid (Gallery + Purchase Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-duskk-200 shadow-sm">
            <img
              src={optimizeImageUrl(selectedImage, 800)}
              alt={combo.title}
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover transition-all duration-300"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col space-y-2">
              {combo.savingsPercent ? (
                <span className="bg-duskk-900 text-duskk-gold text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-md border border-duskk-gold/30">
                  Save {combo.savingsPercent}% OFF
                </span>
              ) : null}
              <span className="bg-white/90 backdrop-blur-md text-duskk-900 text-xs font-semibold px-3 py-1 rounded-lg shadow-sm border border-duskk-200 flex items-center space-x-1">
                <Gift className="w-3.5 h-3.5 text-duskk-gold" />
                <span>Luxury Gift Set</span>
              </span>
            </div>

            <button
              onClick={handleShare}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-md text-duskk-700 hover:text-duskk-900 shadow-sm border border-duskk-200 transition"
              title="Share Combo"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {copied && (
              <span className="absolute top-16 right-4 bg-duskk-900 text-white text-[11px] px-2.5 py-1 rounded shadow">
                Link copied!
              </span>
            )}
          </div>

          {/* Thumbnails Row */}
          {uniqueImages.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {uniqueImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${selectedImage === img
                      ? "border-duskk-gold shadow-md scale-95"
                      : "border-duskk-200 hover:border-duskk-400 bg-white"
                    }`}
                >
                  <img
                    src={optimizeImageUrl(img, 160)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Purchase (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header / Subtitle */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-duskk-500 font-medium">
                  5.0 (Handcrafted Demi-Fine Jewelry)
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-duskk-900 tracking-tight">
                {combo.title}
              </h1>

              {combo.shortDescription && (
                <p className="text-sm text-duskk-600 leading-relaxed">
                  {combo.shortDescription}
                </p>
              )}
            </div>

            {/* Price Breakdown Box */}
            <div className="p-5 bg-white rounded-2xl border border-duskk-200/90 shadow-sm space-y-3">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-serif font-bold text-duskk-900 font-mono">
                  {formatPrice(combo.price)}
                </span>
                {combo.mrp > combo.price && (
                  <span className="text-base text-duskk-400 line-through font-mono">
                    {formatPrice(combo.mrp)}
                  </span>
                )}
                {combo.savingsPercent ? (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {combo.savingsPercent}% OFF
                  </span>
                ) : null}
              </div>

              {combo.savingsAmount ? (
                <p className="text-xs text-emerald-700 font-medium flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  You save <strong>{formatPrice(combo.savingsAmount)}</strong> by purchasing this curated set together.
                </p>
              ) : null}

              <div className="pt-2 border-t border-duskk-100 flex items-center justify-between text-xs text-duskk-500">
                <span>Inclusive of all taxes (GST)</span>
                <span className="text-emerald-700 font-semibold uppercase flex items-center">
                  <Truck className="w-3.5 h-3.5 mr-1" />
                  Free Express Delivery
                </span>
              </div>
            </div>

            {/* Quantity & Add to Cart Controls */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-4">
                {/* Quantity Pill */}
                <div className="flex items-center border border-duskk-300 rounded-xl bg-white px-2 py-1 shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-duskk-600 hover:text-duskk-900 transition"
                  >
                    -
                  </button>
                  <span className="px-4 text-sm font-bold text-duskk-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-duskk-600 hover:text-duskk-900 transition"
                  >
                    +
                  </button>
                </div>

                {/* Primary Add Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`flex-1 py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest font-bold transition flex items-center justify-center space-x-2 shadow-lg ${isAdding
                      ? "bg-emerald-600 text-white"
                      : "bg-duskk-900 text-white hover:bg-duskk-gold hover:text-duskk-950"
                    }`}
                >
                  {isAdding ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      <span>Added to Your Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 mr-1.5" />
                      <span>Add Combo to Bag • {formatPrice(combo.price * quantity)}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-duskk-500">
                In Stock & Ready to Ship. Complete with signature packaging.
              </p>
            </div>
          </div>

          {/* Guarantee Badges Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-duskk-200 text-xs">
            <div className="p-3 bg-white rounded-xl border border-duskk-200 flex items-center space-x-2.5">
              <Gift className="w-4 h-4 text-duskk-gold flex-shrink-0" />
              <div>
                <p className="font-semibold text-duskk-900">Luxury Gift Box</p>
                <p className="text-[10px] text-duskk-500">Complimentary velvet box</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-duskk-200 flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-duskk-gold flex-shrink-0" />
              <div>
                <p className="font-semibold text-duskk-900">Certified Authentic</p>
                <p className="text-[10px] text-duskk-500">100% Quality Inspected</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-duskk-200 flex items-center space-x-2.5">
              <Truck className="w-4 h-4 text-duskk-gold flex-shrink-0" />
              <div>
                <p className="font-semibold text-duskk-900">Insured Delivery</p>
                <p className="text-[10px] text-duskk-500">Tamper-proof transit</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-duskk-200 flex items-center space-x-2.5">
              <RotateCcw className="w-4 h-4 text-duskk-gold flex-shrink-0" />
              <div>
                <p className="font-semibold text-duskk-900">7-Day Exchange</p>
                <p className="text-[10px] text-duskk-500">Hassle-free support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "WHAT'S IN THIS GIFT SET" Component Breakdown Section (for bundled combos) */}
      {hasItems && (
        <section className="bg-white rounded-2xl border border-duskk-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-duskk-100 pb-4">
            <div className="flex items-center space-x-2 text-duskk-gold mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs uppercase font-mono tracking-widest font-semibold">
                COMPLETE SET BREAKDOWN
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-duskk-900">
              What's Included in This Set ({itemsCount} Pieces)
            </h2>
            <p className="text-xs text-duskk-500 mt-1">
              Every item in this combo is an authentic individual DUSKK creation, packaged together in our signature gift box.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {combo.items?.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center space-x-4 p-4 rounded-xl border border-duskk-200/90 bg-duskk-50/50 hover:bg-duskk-50 transition"
              >
                <img
                  src={
                    item.product.image ||
                    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=200&q=80"
                  }
                  alt={item.product.title}
                  className="w-20 h-20 object-cover rounded-lg bg-white border border-duskk-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-duskk-200 text-duskk-800 rounded">
                    Piece {idx + 1} of {itemsCount} • Qty: {item.quantity}
                  </span>
                  <h4 className="text-sm font-semibold text-duskk-900 line-clamp-1">
                    {item.product.title}
                  </h4>
                  {item.variant && (
                    <p className="text-xs text-duskk-600 font-medium">
                      Variant: {item.variant.title}
                    </p>
                  )}
                  <div className="flex items-baseline space-x-2 text-xs">
                    <span className="font-bold text-duskk-900 font-mono">
                      Catalog Price: {formatPrice(item.product.basePrice)}
                    </span>
                    <span className="text-duskk-400 font-mono text-[10px]">
                      SKU: {item.product.sku}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full Description & Styling Guide */}
      {combo.description && (
        <section className="bg-white rounded-2xl border border-duskk-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="font-serif text-xl font-bold text-duskk-900">
            About This Curated Set
          </h3>
          <div className="text-sm text-duskk-700 leading-relaxed whitespace-pre-line">
            {combo.description}
          </div>
        </section>
      )}
    </div>
  );
}
