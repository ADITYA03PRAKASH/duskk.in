"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Combo } from "@/types";
import { useCart } from "@/context/CartContext";
import {
  Gift,
  ShoppingBag,
  Check,
  Package,
  Sparkles,
  ShieldCheck,
  Truck,
  ArrowRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";

export function CombosCatalogClient({ initialCombos }: { initialCombos: Combo[] }) {
  const { addComboToCart } = useCart();
  const [combos] = useState<Combo[]>(initialCombos);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "savings">("featured");
  const [addedComboId, setAddedComboId] = useState<string | null>(null);

  const handleAddToCart = (combo: Combo) => {
    addComboToCart(combo, 1);
    setAddedComboId(combo.id);
    setTimeout(() => setAddedComboId(null), 2500);
  };

  const processedCombos = useMemo(() => {
    let result = [...combos];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.items?.some((i) => i.product.title.toLowerCase().includes(q))
      );
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "savings") {
      result.sort((a, b) => (b.savingsPercent || 0) - (a.savingsPercent || 0));
    } else {
      // featured first, then display_order
      result.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return a.displayOrder - b.displayOrder;
      });
    }

    return result;
  }, [combos, searchQuery, sortBy]);

  return (
    <div>
      {/* Hero Header Banner */}
      <section className="bg-duskk-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-duskk-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 text-duskk-gold bg-duskk-800/80 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase mb-4 border border-duskk-gold/20">
            <Gift className="w-3.5 h-3.5" />
            <span>Curated Gift Sets & Combos</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-white font-medium tracking-tight">
            Perfect Pairings, Exceptional Value
          </h1>
          <p className="text-duskk-300 text-sm sm:text-base max-w-2xl mx-auto mt-3">
            Handcrafted luxury jewelry pieces designed to dazzle together. Each gift set arrives packaged in our signature velvet-lined box with certificate of authenticity.
          </p>

          {/* Value Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-10 pt-8 border-t border-white/10 text-xs">
            <div className="flex items-center justify-center space-x-2 text-duskk-200">
              <Gift className="w-4 h-4 text-duskk-gold" />
              <span>Free Luxury Gift Box</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-duskk-200">
              <Sparkles className="w-4 h-4 text-duskk-gold" />
              <span>Up to 45% Bundle Savings</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-duskk-200">
              <ShieldCheck className="w-4 h-4 text-duskk-gold" />
              <span>100% Certified Authentic</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-duskk-200">
              <Truck className="w-4 h-4 text-duskk-gold" />
              <span>Free Insured Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Controls Bar: Search & Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-duskk-200 shadow-sm mb-8">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-duskk-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search gift sets or included pieces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-duskk-50 border border-duskk-300 rounded-lg text-duskk-900 placeholder-duskk-400 focus:outline-none focus:border-duskk-gold focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-duskk-500 font-medium">
              Showing <strong>{processedCombos.length}</strong> {processedCombos.length === 1 ? "combo" : "combos"}
            </span>

            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-duskk-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-duskk-50 border border-duskk-300 rounded-lg px-2.5 py-2 text-duskk-800 focus:outline-none focus:border-duskk-gold"
              >
                <option value="featured">Featured First</option>
                <option value="savings">Highest Savings</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {processedCombos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-duskk-200 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-duskk-50 flex items-center justify-center mx-auto text-duskk-gold mb-4">
              <Gift className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-duskk-900">
              No Gift Sets Found
            </h3>
            <p className="text-xs text-duskk-500 max-w-sm mx-auto mt-1">
              We couldn't find any combo offers matching your search criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSortBy("featured");
              }}
              className="mt-4 px-5 py-2 bg-duskk-900 text-white text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-duskk-800 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Combos Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {processedCombos.map((combo) => {
              const isAdded = addedComboId === combo.id;
              const pieceCount = combo.itemsCount || combo.items?.length || 2;

              return (
                <div
                  key={combo.id}
                  className="group flex flex-col bg-white border border-duskk-200/90 rounded-2xl overflow-hidden hover:border-duskk-gold/60 transition-all duration-300 shadow-sm hover:shadow-xl"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-duskk-50">
                    <Link href={`/combos/${combo.slug}`}>
                      <img
                        src={
                          combo.imageUrl ||
                          (combo.galleryImages && combo.galleryImages[0]) ||
                          "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=500&q=80"
                        }
                        alt={combo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    {/* Savings Pill */}
                    {combo.savingsPercent ? (
                      <div className="absolute top-3 left-3 bg-duskk-900 text-duskk-gold font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded shadow-md border border-duskk-gold/30">
                        Save {combo.savingsPercent}%
                      </div>
                    ) : null}

                    {/* Pieces Count Badge */}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-duskk-900 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-sm border border-duskk-200">
                      <Package className="w-3.5 h-3.5 text-duskk-gold" />
                      <span>{pieceCount} Luxury Pieces</span>
                    </div>

                    {combo.isFeatured && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white p-1 rounded-full shadow" title="Featured Gift Set">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <Link href={`/combos/${combo.slug}`}>
                        <h3 className="font-serif text-base font-semibold text-duskk-900 group-hover:text-duskk-gold transition line-clamp-1">
                          {combo.title}
                        </h3>
                      </Link>

                      {combo.shortDescription ? (
                        <p className="text-xs text-duskk-600 mt-1 line-clamp-2">
                          {combo.shortDescription}
                        </p>
                      ) : (
                        <p className="text-xs text-duskk-500 mt-1 line-clamp-1">
                          Includes: {combo.items?.map((i) => i.product.title).join(" + ")}
                        </p>
                      )}
                    </div>

                    {/* Price and Savings */}
                    <div className="pt-2 border-t border-duskk-100">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-lg font-bold font-mono text-duskk-900">
                          {formatPrice(combo.price)}
                        </span>
                        {combo.mrp > combo.price && (
                          <span className="text-xs text-duskk-400 font-mono line-through">
                            {formatPrice(combo.mrp)}
                          </span>
                        )}
                      </div>
                      {combo.savingsAmount ? (
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                          You save {formatPrice(combo.savingsAmount)} ({combo.savingsPercent}% off)
                        </p>
                      ) : null}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href={`/combos/${combo.slug}`}
                        className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-duskk-700 bg-duskk-100 hover:bg-duskk-200 rounded-lg transition"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleAddToCart(combo)}
                        disabled={isAdded}
                        className={`px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider rounded-lg transition flex items-center justify-center space-x-1 shadow-sm ${
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-duskk-900 text-white hover:bg-duskk-gold hover:text-duskk-900"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                            <span>Add Set</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
