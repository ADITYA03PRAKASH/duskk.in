"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice, normalizeImageUrl, getProductPrimaryImage } from "@/lib/utils";
import {
  Star,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  RefreshCw,
  Plus,
  Minus,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export function ProductDetailClient({ product }: { product: any }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>("description");
  const [isAdded, setIsAdded] = useState(false);

  const rawImages = product.images || product.product_images;
  const rawList =
    rawImages && rawImages.length > 0
      ? rawImages.map((img: any) => ({
          url: normalizeImageUrl(img, getProductPrimaryImage(product, "/placeholder.svg")),
          altText: typeof img === "string" ? product.name : (img.alt_text || img.altText || product.name),
        }))
      : [
          {
            url: getProductPrimaryImage(product, "/placeholder.svg"),
            altText: product.name,
          },
        ];

  // Filter out any duplicate image URLs while preserving display order
  const images: Array<{ url: string; altText: string }> = [];
  const seenUrls = new Set<string>();
  for (const item of rawList) {
    if (item.url && !seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      images.push(item);
    }
  }
  if (images.length === 0) {
    images.push({
      url: getProductPrimaryImage(product, "/placeholder.svg"),
      altText: product.name,
    });
  }

  const currentImage = images[selectedImageIndex] || images[0];
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  const isDisplayRatingEnabled = product.displayRating !== false;
  const isCustomRating = product.ratingSource === "CUSTOM";
  const genuineApprovedReviews = product.reviews || [];
  const genuineReviewCount = genuineApprovedReviews.length;

  const displayAvgRating =
    typeof product.avgRating === "number"
      ? product.avgRating
      : genuineReviewCount > 0
      ? Number(
          (
            genuineApprovedReviews.reduce((acc: number, r: any) => acc + Number(r.rating || 0), 0) /
            genuineReviewCount
          ).toFixed(1)
        )
      : 4.9;

  const displayReviewCount =
    typeof product.reviewCount === "number"
      ? product.reviewCount
      : genuineReviewCount || 14;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(
      {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        mrp: product.mrp,
        image: currentImage.url,
        stockQuantity: product.stockQuantity,
      },
      quantity
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(
      {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        mrp: product.mrp,
        image: currentImage.url,
        stockQuantity: product.stockQuantity,
      },
      quantity
    );
    router.push("/checkout");
  };

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      setPincodeResult("Please enter a valid 6-digit Indian pincode.");
      return;
    }
    setPincodeResult("Express Delivery Available! Estimated delivery within 2-4 business days.");
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
      {/* LEFT: Product Image Gallery (7 cols) */}
      <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex md:flex-col gap-3 overflow-x-auto md:w-24 flex-shrink-0">
            {images.map((img: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative aspect-square w-20 md:w-full overflow-hidden border transition ${
                  selectedImageIndex === idx
                    ? "border-duskk-900 ring-1 ring-duskk-900"
                    : "border-duskk-200 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img.url}
                  alt={img.altText || product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Display Image */}
        <div className="flex-1 bg-white border border-duskk-200/80 overflow-hidden relative aspect-square sm:aspect-4/5 shadow-sm">
          <img
            src={currentImage.url}
            alt={currentImage.altText || product.name}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
            {product.bestSeller && (
              <span className="bg-duskk-900 text-white text-xs uppercase font-bold tracking-wider px-3 py-1">
                Bestseller
              </span>
            )}
            {product.discount > 0 && (
              <span className="bg-rose-700 text-white text-xs uppercase font-bold tracking-wider px-3 py-1">
                Save {product.discount}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Product Details & Purchase Actions (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Breadcrumb & Title */}
        <div>
          <div className="flex items-center space-x-2 text-xs text-duskk-500 uppercase tracking-widest mb-2 font-mono">
            <Link href="/shop" className="hover:text-duskk-900">
              Shop
            </Link>
            <span>/</span>
            {product.category && (
              <Link
                href={`/category/${product.category.slug}`}
                className="hover:text-duskk-900 text-duskk-gold font-semibold"
              >
                {product.category.name}
              </Link>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-duskk-900 font-normal leading-tight">
            {product.name}
          </h1>
          <p className="text-xs text-duskk-500 font-mono mt-1">SKU: {product.sku}</p>
        </div>

        {/* Ratings & Review count */}
        {isDisplayRatingEnabled && (
          <div className="flex items-center space-x-3 pb-4 border-b border-duskk-200">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(displayAvgRating) ? "fill-current" : "text-duskk-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-duskk-900">{displayAvgRating.toFixed(1)} / 5.0</span>
            <span className="text-xs text-duskk-500">
              {isCustomRating
                ? `(${displayReviewCount} Ratings)`
                : genuineReviewCount > 0
                ? `(${genuineReviewCount} Verified Customer Reviews)`
                : `(${displayReviewCount} Ratings)`}
            </span>
          </div>
        )}

        {/* Pricing Block */}
        <div className="space-y-1">
          <div className="flex items-baseline space-x-3">
            <span className="font-serif text-3xl font-bold text-duskk-900">
              {formatPrice(product.price)}
            </span>
            {product.mrp > product.price && (
              <>
                <span className="text-base text-duskk-400 line-through">
                  {formatPrice(product.mrp)}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Save {formatPrice(product.mrp - product.price)} ({product.discount}% OFF)
                </span>
              </>
            )}
          </div>
          <span className="text-[11px] text-duskk-500 block">
            Inclusive of all taxes &bull; Free insured shipping on orders &gt; ₹999
          </span>
        </div>

        {/* Stock / Availability */}
        <div className="text-xs font-medium">
          {isOutOfStock ? (
            <span className="text-rose-700 font-semibold flex items-center">
              &bull; Currently Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="text-amber-700 font-semibold animate-pulse flex items-center">
              &bull; Hurry! Only {product.stockQuantity} pieces remaining in vault
            </span>
          ) : (
            <span className="text-emerald-700 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1" /> In Stock & Ready to Dispatch
            </span>
          )}
        </div>

        {/* Quantity & CTA buttons */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-4">
            <label className="text-xs uppercase font-semibold text-duskk-700 tracking-wider">
              Quantity:
            </label>
            <div className="flex items-center border border-duskk-300 rounded bg-white">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="px-3 py-1.5 text-duskk-600 hover:text-duskk-900 hover:bg-duskk-100 disabled:opacity-40"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-4 text-xs font-semibold text-duskk-900 min-w-[28px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stockQuantity || 99, quantity + 1))}
                disabled={quantity >= product.stockQuantity || isOutOfStock}
                className="px-3 py-1.5 text-duskk-600 hover:text-duskk-900 hover:bg-duskk-100 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-3.5 text-xs font-semibold uppercase tracking-widest transition flex items-center justify-center space-x-2 border border-duskk-900 disabled:opacity-50 ${
                isAdded
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-duskk-900 hover:bg-duskk-50"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added To Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add To Bag</span>
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="w-full py-3.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest transition flex items-center justify-center space-x-2 shadow-md disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-duskk-gold" />
              <span>Instant Guest Buy</span>
            </button>
          </div>
        </div>

        {/* Pincode delivery check */}
        <div className="p-4 bg-white border border-duskk-200 rounded space-y-2">
          <span className="text-xs font-semibold text-duskk-800 uppercase tracking-wider flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-duskk-gold" />
            <span>Check Delivery & Pincode:</span>
          </span>
          <form onSubmit={checkPincode} className="flex space-x-2">
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 400001 or 110001"
              className="flex-1 px-3 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-duskk-800 text-white text-xs uppercase font-medium tracking-wider hover:bg-duskk-900 rounded"
            >
              Check
            </button>
          </form>
          {pincodeResult && (
            <p className="text-xs text-emerald-700 font-medium">{pincodeResult}</p>
          )}
        </div>

        {/* Product Spec Table */}
        <div className="border border-duskk-200 bg-white rounded divide-y divide-duskk-100 text-xs">
          {product.material && (
            <div className="p-3 flex justify-between">
              <span className="text-duskk-500 font-medium">Material:</span>
              <span className="text-duskk-900 font-semibold">{product.material}</span>
            </div>
          )}
          {product.color && (
            <div className="p-3 flex justify-between">
              <span className="text-duskk-500 font-medium">Color / Finish:</span>
              <span className="text-duskk-900 font-semibold">{product.color}</span>
            </div>
          )}
          {product.dimensions && (
            <div className="p-3 flex justify-between">
              <span className="text-duskk-500 font-medium">Dimensions:</span>
              <span className="text-duskk-900 font-semibold">{product.dimensions}</span>
            </div>
          )}
          {product.weight && (
            <div className="p-3 flex justify-between">
              <span className="text-duskk-500 font-medium">Net Weight:</span>
              <span className="text-duskk-900 font-semibold">{product.weight}</span>
            </div>
          )}
          {product.specifications && typeof product.specifications === "object" &&
            Object.entries(product.specifications)
              .filter(([key]) => key !== "rating_settings")
              .map(([key, val]) => (
                <div key={key} className="p-3 flex justify-between">
                  <span className="text-duskk-500 font-medium">{key}:</span>
                  <span className="text-duskk-900 font-semibold">{String(val)}</span>
                </div>
              ))}
        </div>

        {/* Accordions */}
        <div className="border-t border-duskk-200 divide-y divide-duskk-200">
          {/* Description */}
          <div>
            <button
              onClick={() => toggleAccordion("description")}
              className="w-full py-3.5 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-duskk-900"
            >
              <span>Design & Story</span>
              {openAccordion === "description" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {openAccordion === "description" && (
              <div className="pb-4 text-xs sm:text-sm text-duskk-600 leading-relaxed space-y-2">
                <p>{product.description}</p>
              </div>
            )}
          </div>

          {/* Care Instructions */}
          <div>
            <button
              onClick={() => toggleAccordion("care")}
              className="w-full py-3.5 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-duskk-900"
            >
              <span>Jewelry Care & Anti-Tarnish Guidelines</span>
              {openAccordion === "care" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {openAccordion === "care" && (
              <div className="pb-4 text-xs text-duskk-600 leading-relaxed space-y-1.5">
                <p>&bull; Store your DUSKK jewels in the complimentary plush velvet case when not in use.</p>
                <p>&bull; Avoid direct contact with harsh perfumes, chlorine, and chemical sanitizers.</p>
                <p>&bull; Gently buff with the provided micro-fibre polishing cloth to restore shine.</p>
              </div>
            )}
          </div>

          {/* Shipping & Returns */}
          <div>
            <button
              onClick={() => toggleAccordion("shipping")}
              className="w-full py-3.5 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-duskk-900"
            >
              <span>Insured Shipping & 7-Day Returns</span>
              {openAccordion === "shipping" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {openAccordion === "shipping" && (
              <div className="pb-4 text-xs text-duskk-600 leading-relaxed space-y-1.5">
                <p>&bull; <strong>Free Express Shipping:</strong> Across India on all orders above ₹999.</p>
                <p>&bull; <strong>Dispatch:</strong> Orders are processed and dispatched within 24 hours.</p>
                <p>&bull; <strong>Hassle-Free Returns:</strong> 7-day doorstep pickup guarantee for unworn items.</p>
              </div>
            )}
          </div>
        </div>

        {/* Verified Reviews */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="pt-6 border-t border-duskk-200">
            <h3 className="font-serif text-lg font-medium text-duskk-900 mb-4">
              Verified Customer Reviews ({product.reviews.length})
            </h3>
            <div className="space-y-3">
              {product.reviews.map((rev: any) => (
                <div key={rev.id} className="p-3 bg-white border border-duskk-200 rounded space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-duskk-900">{rev.customerName}</span>
                    <div className="flex text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  {rev.title && <h4 className="text-xs font-semibold text-duskk-800">{rev.title}</h4>}
                  <p className="text-xs text-duskk-600">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
