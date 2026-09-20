"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from "lucide-react";

export function CartDrawer() {
  const { items, isCartOpen, closeCart, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/checkout" && isCartOpen) {
      closeCart();
    }
  }, [pathname, isCartOpen, closeCart]);

  if (!isCartOpen || pathname === "/checkout") return null;

  const freeShippingThreshold = 999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-duskk-cream border-b border-duskk-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-duskk-900" />
              <h2 className="text-lg font-serif tracking-wider font-semibold text-duskk-900 uppercase">
                Your Shopping Bag ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1 text-duskk-500 hover:text-duskk-900 hover:bg-duskk-200 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-6 py-3 bg-duskk-50 border-b border-duskk-200">
            {remainingForFreeShipping > 0 ? (
              <p className="text-xs text-duskk-700 mb-1.5 flex items-center justify-between">
                <span>
                  Add <strong className="text-duskk-900">{formatPrice(remainingForFreeShipping)}</strong> more for <strong>FREE Delivery</strong>
                </span>
                <Truck className="w-4 h-4 text-duskk-gold" />
              </p>
            ) : (
              <p className="text-xs font-medium text-emerald-700 mb-1.5 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
                Congratulations! You unlocked FREE Express Shipping!
              </p>
            )}
            <div className="w-full bg-duskk-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-duskk-gold h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-duskk-cream flex items-center justify-center text-duskk-gold">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl text-duskk-900 font-medium">Your bag is empty</h3>
                <p className="text-sm text-duskk-500 max-w-xs">
                  Discover our timeless collection of handcrafted luxury jewels and accessories.
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    router.push("/shop");
                  }}
                  className="mt-2 px-6 py-2.5 bg-duskk-900 text-white text-xs uppercase tracking-widest font-medium hover:bg-duskk-gold transition"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="flex space-x-4 py-3 border-b border-duskk-100 last:border-0"
                >
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=300&q=80"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded bg-duskk-50 flex-shrink-0 border border-duskk-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-duskk-900 line-clamp-1">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-duskk-400 hover:text-rose-600 transition p-1 ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-duskk-500 font-mono mt-0.5">SKU: {item.sku}</p>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-sm font-semibold text-duskk-900">
                        {formatPrice(item.price)}
                      </span>
                      {item.mrp > item.price && (
                        <span className="text-xs text-duskk-400 line-through">
                          {formatPrice(item.mrp)}
                        </span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center space-x-3 mt-3">
                      <div className="flex items-center border border-duskk-300 rounded bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-1 text-duskk-600 hover:text-duskk-900 hover:bg-duskk-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-medium text-duskk-900 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-2 py-1 text-duskk-600 hover:text-duskk-900 hover:bg-duskk-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs text-duskk-500">
                        Subtotal: <strong className="text-duskk-900">{formatPrice(item.price * item.quantity)}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-6 bg-duskk-cream border-t border-duskk-200 space-y-4">
              <div className="flex justify-between items-baseline text-sm">
                <span className="text-duskk-600">Subtotal:</span>
                <span className="text-lg font-bold font-serif text-duskk-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-xs text-duskk-500">
                Taxes calculated at checkout. Express shipping insured across India.
              </p>

              <button
                onClick={handleCheckout}
                className="w-full py-3.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white font-medium text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>Fast Guest Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center space-x-4 pt-1 text-[11px] text-duskk-500">
                <span className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> 100% Skin Safe
                </span>
                <span>&bull;</span>
                <span>7-Day Easy Returns</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
