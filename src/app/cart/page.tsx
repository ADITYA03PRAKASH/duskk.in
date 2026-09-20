"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Truck, Tag } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, subtotal, itemCount } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const freeShippingThreshold = 999;
  const shippingCharge = subtotal >= freeShippingThreshold ? 0 : 99;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCharge);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const code = couponCode.trim().toUpperCase();
    if (code === "DUSKK10") {
      const disc = Math.round(subtotal * 0.1);
      setDiscountAmount(disc);
      setCouponStatus(`Coupon ${code} applied! Saved ${formatPrice(disc)}`);
    } else if (code === "WELCOME500" && subtotal >= 2499) {
      setDiscountAmount(500);
      setCouponStatus(`Coupon ${code} applied! Saved ₹500`);
    } else {
      setCouponStatus("Invalid or inapplicable coupon code.");
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#FAF8F5] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
              YOUR ATELIER BAG
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal">
              Shopping Bag ({itemCount})
            </h1>
          </div>

          {items.length === 0 ? (
            <div className="bg-white p-12 text-center border border-duskk-200 max-w-lg mx-auto space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-duskk-cream text-duskk-gold mx-auto flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl text-duskk-900">Your bag is empty</h2>
              <p className="text-xs text-duskk-500">
                Explore our fine jewelry collection and find your next signature piece.
              </p>
              <Link
                href="/shop"
                className="inline-block px-8 py-3 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs uppercase tracking-widest font-semibold transition"
              >
                Discover Collection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Items List (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-duskk-200 shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-duskk-200">
                  <h3 className="font-serif text-lg font-semibold text-duskk-900">
                    Selected Pieces
                  </h3>
                  <button
                    onClick={clearCart}
                    className="text-xs text-duskk-500 hover:text-rose-600 underline"
                  >
                    Clear Bag
                  </button>
                </div>

                <div className="divide-y divide-duskk-100">
                  {items.map((item) => (
                    <div key={item.productId} className="py-4 flex space-x-4 items-center">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=300&q=80"}
                        alt={item.name}
                        className="w-20 h-20 object-cover bg-duskk-50 rounded border border-duskk-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-duskk-900">{item.name}</h4>
                        <p className="text-xs text-duskk-400 font-mono mt-0.5">SKU: {item.sku}</p>
                        <div className="flex items-baseline space-x-2 mt-1">
                          <span className="text-sm font-bold text-duskk-900">
                            {formatPrice(item.price)}
                          </span>
                          {item.mrp > item.price && (
                            <span className="text-xs text-duskk-400 line-through">
                              {formatPrice(item.mrp)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity & Subtotal */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center border border-duskk-300 rounded bg-white">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="px-2.5 py-1 text-duskk-600 hover:text-duskk-900"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-duskk-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="px-2.5 py-1 text-duskk-600 hover:text-duskk-900"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold font-serif text-duskk-900 min-w-[70px] text-right">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-duskk-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary Box (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-duskk-200 shadow-sm p-6 space-y-6">
                <h3 className="font-serif text-lg font-semibold text-duskk-900 pb-3 border-b border-duskk-200">
                  Order Summary
                </h3>

                {/* Coupon input */}
                <div>
                  <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Coupon (e.g. DUSKK10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 text-xs uppercase border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-duskk-800 hover:bg-duskk-900 text-white text-xs uppercase font-medium rounded"
                    >
                      Apply
                    </button>
                  </form>
                  {couponStatus && (
                    <p className={`text-xs mt-1.5 ${discountAmount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {couponStatus}
                    </p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-xs text-duskk-600 pt-2 border-t border-duskk-100">
                  <div className="flex justify-between">
                    <span>Bag Subtotal:</span>
                    <span className="text-duskk-900 font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Coupon Savings:</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Insured Express Shipping:</span>
                    <span className="text-duskk-900 font-medium">
                      {shippingCharge === 0 ? <span className="text-emerald-600 uppercase font-semibold">FREE</span> : formatPrice(shippingCharge)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-duskk-200 text-sm font-bold text-duskk-900">
                    <span>Total Amount:</span>
                    <span className="font-serif text-lg text-duskk-900">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full py-4 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs uppercase tracking-widest font-semibold transition flex items-center justify-center space-x-2 shadow-lg"
                >
                  <span>Proceed to Guest Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 text-[11px] text-duskk-500 space-y-1 text-center">
                  <p>🔒 256-Bit SSL Encrypted Razorpay Checkout</p>
                  <p>✨ No mandatory account or mobile OTP required</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
