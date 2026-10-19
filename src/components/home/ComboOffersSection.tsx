"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Combo, CustomComboSettings } from "@/types";
import { useCart } from "@/context/CartContext";
import { Gift, ArrowRight, Check, ShoppingBag, Sparkles, Package, Layers } from "lucide-react";

export function ComboOffersSection({
  combos,
  builderSettings,
}: {
  combos: Combo[];
  builderSettings?: CustomComboSettings | null;
}) {
  const { addComboToCart } = useCart();
  const [addedComboId, setAddedComboId] = useState<string | null>(null);

  const hasCombos = combos && combos.length > 0;
  const showBuilder = Boolean(builderSettings?.isEnabled && builderSettings?.showOnHomepage);

  if (!hasCombos && !showBuilder) {
    return null;
  }

  const handleAddCombo = (combo: Combo) => {
    addComboToCart(combo, 1);
    setAddedComboId(combo.id);
    setTimeout(() => setAddedComboId(null), 2500);
  };

  return (
    <section className="py-20 bg-duskk-900 text-white relative overflow-hidden">
      {/* Subtle gold glow accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-duskk-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-duskk-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Mode B: Build Your Own Combo Feature Banner */}
        {showBuilder && builderSettings && (
          <div className="mb-14 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#211d17] via-duskk-950 to-[#272118] border border-duskk-gold/30 p-6 sm:p-8 md:p-10 shadow-2xl">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-duskk-gold/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center space-x-2 bg-duskk-gold/15 text-duskk-gold border border-duskk-gold/30 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive Combo Atelier</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium">
                  {builderSettings.title || "Build Your Own Custom Combo"}
                </h3>
                <p className="text-duskk-300 text-xs sm:text-sm mt-2 leading-relaxed">
                  {builderSettings.subtitle ||
                    "Handpick your favorite demi-fine earrings, necklaces, and rings to create a personalized gift set with instant bundle savings."}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-mono text-duskk-200">
                  <span className="flex items-center space-x-1.5 text-duskk-champagne">
                    <Check className="w-3.5 h-3.5 text-duskk-gold" />
                    <span>Choose {builderSettings.minItems}-{builderSettings.maxItems} pieces</span>
                  </span>
                  {builderSettings.discountType !== "none" && (
                    <span className="flex items-center space-x-1.5 text-duskk-champagne">
                      <Check className="w-3.5 h-3.5 text-duskk-gold" />
                      <span>
                        {builderSettings.discountType === "percentage"
                          ? `Flat ${builderSettings.discountValue}% Bundle Savings`
                          : `Save ₹${builderSettings.discountValue} Instantly`}
                      </span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1.5 text-duskk-champagne">
                    <Check className="w-3.5 h-3.5 text-duskk-gold" />
                    <span>Free Luxury Velvet Gift Box</span>
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <Link
                  href="/build-your-combo"
                  className="inline-flex items-center justify-center px-6 py-3.5 bg-duskk-gold text-duskk-950 hover:bg-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg hover:shadow-duskk-gold/20 hover:scale-[1.02]"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  <span>Design Your Combo</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Section Header (Curated Combos) */}
        {hasCombos && (
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="flex items-center space-x-2 text-duskk-gold mb-2">
                <Gift className="w-4 h-4" />
                <span className="text-xs uppercase font-mono tracking-[0.25em]">
                  CURATED GIFT SETS
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-white font-medium">
                Exclusive Combo Offers
              </h2>
              <p className="text-duskk-300 text-sm mt-2 max-w-lg">
                Complementary luxury pieces bundled together at exclusive gift prices. Complete with signature luxury gift box packaging.
              </p>
            </div>

            <Link
              href="/combos"
              className="group inline-flex items-center text-xs uppercase font-mono tracking-widest text-duskk-gold hover:text-white transition mt-4 md:mt-0"
            >
              Explore All Combos
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {/* Combos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {combos.slice(0, 4).map((combo) => {
            const isAdded = addedComboId === combo.id;
            const pieceCount = combo.itemsCount || combo.items?.length || 2;

            return (
              <div
                key={combo.id}
                className="group flex flex-col bg-duskk-800/80 border border-duskk-700/80 rounded-xl overflow-hidden hover:border-duskk-gold/60 transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                {/* Image Container with Badges */}
                <div className="relative aspect-square w-full overflow-hidden bg-duskk-950">
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

                  {/* Savings / Discount Badge */}
                  {combo.savingsPercent ? (
                    <div className="absolute top-3 left-3 bg-duskk-gold text-duskk-950 font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded shadow">
                      Save {combo.savingsPercent}%
                    </div>
                  ) : null}

                  {/* Items Count Pill */}
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center space-x-1">
                    <Package className="w-3 h-3 text-duskk-gold" />
                    <span>{pieceCount} Luxury Pieces</span>
                  </div>

                  {combo.isFeatured && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-amber-400 p-1.5 rounded-full">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <Link href={`/combos/${combo.slug}`}>
                      <h3 className="font-serif text-base font-semibold text-white group-hover:text-duskk-gold transition line-clamp-1">
                        {combo.title}
                      </h3>
                    </Link>

                    {combo.shortDescription ? (
                      <p className="text-xs text-duskk-400 mt-1 line-clamp-2">
                        {combo.shortDescription}
                      </p>
                    ) : (
                      <p className="text-xs text-duskk-400 mt-1 line-clamp-1 font-mono">
                        Includes: {combo.items?.map((i) => i.product.title).join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Pricing Details */}
                  <div className="pt-2 border-t border-duskk-700/60">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-lg font-bold font-mono text-duskk-gold">
                        {formatPrice(combo.price)}
                      </span>
                      {combo.mrp > combo.price && (
                        <span className="text-xs text-duskk-400 font-mono line-through">
                          {formatPrice(combo.mrp)}
                        </span>
                      )}
                    </div>
                    {combo.savingsAmount ? (
                      <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                        You save {formatPrice(combo.savingsAmount)}
                      </p>
                    ) : null}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/combos/${combo.slug}`}
                      className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-duskk-300 bg-duskk-700/60 hover:bg-duskk-700 hover:text-white rounded-lg transition"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleAddCombo(combo)}
                      disabled={isAdded}
                      className={`px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider rounded-lg transition flex items-center justify-center space-x-1 ${
                        isAdded
                          ? "bg-emerald-600 text-white"
                          : "bg-duskk-gold text-duskk-950 hover:bg-white"
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
      </div>
    </section>
  );
}
