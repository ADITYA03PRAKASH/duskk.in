"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice, getProductPrimaryImage, normalizeImageUrl, optimizeImageUrl } from "@/lib/utils";
import { Star, ShoppingBag, Check } from "lucide-react";

export interface ProductCardProps {
  product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    discount?: number;
    stockQuantity: number;
    featured?: boolean;
    bestSeller?: boolean;
    newArrival?: boolean;
    category?: { name: string; slug: string };
    primaryImage?: string;
    secondaryImage?: string;
    avgRating?: number;
    reviewCount?: number;
    displayRating?: boolean;
    ratingSource?: string;
  };
}

export function ProductCard({ product }: { product: any }) {
  const { addItem } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const primaryImg = getProductPrimaryImage(product, "/placeholder.svg");
  const optimizedPrimaryImg = optimizeImageUrl(primaryImg, 500);

  const secondaryImg =
    normalizeImageUrl(product.secondaryImage, "") ||
    normalizeImageUrl(product.images?.[1], "") ||
    primaryImg;
  const optimizedSecondaryImg = optimizeImageUrl(secondaryImg, 500);

  const isOutOfStock = product.stockQuantity <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      mrp: product.mrp,
      image: primaryImg,
      stockQuantity: product.stockQuantity,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const hasBackImage = Boolean(secondaryImg && secondaryImg !== primaryImg && secondaryImg !== "/placeholder.svg");

  const [activeImageSide, setActiveImageSide] = useState<"front" | "back">("front");

  // Determine whether to show the back image: either user tapped on mobile, or hovered on desktop
  const showBackImage = hasBackImage && (activeImageSide === "back" || (isHovered && activeImageSide === "front"));

  const toggleImageSide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasBackImage) return;
    setActiveImageSide((prev) => (prev === "front" ? "back" : "front"));
  };

  return (
    <div
      className="group relative bg-white border border-duskk-200/70 rounded-none overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveImageSide("front");
      }}
    >
      {/* Product Image Link & Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-duskk-cream">
        <Link href={`/product/${product.slug}`} className="block w-full h-full relative" tabIndex={0}>
          {/* Front Image */}
          <img
            src={optimizedPrimaryImg}
            alt={`${product.name} - Front view`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
              showBackImage ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />

          {/* Back Image (renders with smooth opacity transition if available) */}
          {hasBackImage && (
            <img
              src={optimizedSecondaryImg}
              alt={`${product.name} - Alternate back view`}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
                showBackImage ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = primaryImg;
              }}
            />
          )}
        </Link>

        {/* Mobile / Accessible Switch View Button (if back image exists) */}
        {hasBackImage && (
          <button
            type="button"
            onClick={toggleImageSide}
            className="absolute bottom-2.5 right-2.5 z-20 px-2 py-1 bg-white/90 hover:bg-white text-duskk-800 text-[10px] font-mono uppercase tracking-wider rounded shadow-sm border border-duskk-200 backdrop-blur-xs transition hover:text-duskk-900 focus:outline-none focus:ring-1 focus:ring-duskk-900"
            aria-label={`Switch to ${showBackImage ? "front view" : "back view"} for ${product.name}`}
            title="Toggle front/back view"
          >
            {showBackImage ? "Front" : "Back"}
          </button>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.bestSeller && (
            <span className="bg-duskk-900 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 shadow-sm">
              Bestseller
            </span>
          )}
          {product.newArrival && (
            <span className="bg-duskk-gold text-duskk-900 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 shadow-sm">
              New
            </span>
          )}
          {product.discount && product.discount > 0 ? (
            <span className="bg-rose-700 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 shadow-sm">
              {product.discount}% OFF
            </span>
          ) : null}
        </div>

        {/* Sold Out Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="bg-white text-duskk-900 text-xs font-bold uppercase tracking-widest px-3 py-1.5 shadow">
              Sold Out
            </span>
          </div>
        )}

        {/* Quick Add Button Overlay */}
        {!isOutOfStock && (
          <div className="absolute bottom-0 inset-x-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden sm:block z-20">
            <button
              onClick={handleQuickAdd}
              disabled={isAdded}
              className={`w-full py-2.5 text-xs font-medium uppercase tracking-widest transition flex items-center justify-center space-x-1.5 shadow-md ${
                isAdded
                  ? "bg-emerald-700 text-white"
                  : "bg-white/95 hover:bg-duskk-900 text-duskk-900 hover:text-white backdrop-blur-sm"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Bag</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col flex-1 justify-between space-y-2">
        <div>
          {product.category && (
            <span className="text-[10px] uppercase tracking-widest text-duskk-500 block mb-0.5">
              {product.category.name}
            </span>
          )}
          <Link
            href={`/product/${product.slug}`}
            className="block text-sm font-medium text-duskk-900 hover:text-duskk-gold transition line-clamp-1"
          >
            {product.name}
          </Link>

          {/* Rating */}
          {product.displayRating !== false && (
            <div className="flex items-center space-x-1 mt-1">
              <div className="flex items-center text-amber-500">
                <Star className="w-3 h-3 fill-current" />
              </div>
              <span className="text-[11px] font-semibold text-duskk-800">
                {typeof product.avgRating === "number"
                  ? product.avgRating.toFixed(1)
                  : (product.avgRating || "4.9")}
              </span>
              <span className="text-[11px] text-duskk-400">
                ({product.reviewCount !== undefined && product.reviewCount !== null ? product.reviewCount : 14})
              </span>
            </div>
          )}
        </div>

        {/* Pricing & Mobile Add */}
        <div className="pt-2 border-t border-duskk-100 flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-serif font-bold text-duskk-900">
              {formatPrice(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-duskk-400 line-through">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>

          {/* Mobile Quick Add Icon */}
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="sm:hidden p-1.5 bg-duskk-900 text-white rounded-full disabled:opacity-50"
            aria-label="Add to Bag"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
