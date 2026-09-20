"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { RazorpayPaymentModal } from "@/components/cart/RazorpayModal";
import { formatPrice } from "@/lib/utils";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CreditCard,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, subtotal } = useCart();

  // Customer Contact State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Shipping Address State
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");

  // Coupon & Notes
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountValue: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [notes, setNotes] = useState("");

  // Processing & Payment Modal State
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentModalData, setPaymentModalData] = useState<any | null>(null);

  // Auto-redirect if cart is empty and not processing
  useEffect(() => {
    if (items.length === 0 && !paymentModalData) {
      // Allow viewing or redirect
    }
  }, [items, paymentModalData]);

  const statesOfIndia = [
    "Andhra Pradesh",
    "Assam",
    "Bihar",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Punjab",
    "Rajasthan",
    "Tamil Nadu",
    "Telangana",
    "Uttar Pradesh",
    "West Bengal",
    "Other States / UTs",
  ];

  // Calculated totals
  const discount = couponApplied?.discountValue || 0;
  const shippingCharge = subtotal >= 999 ? 0 : 99;
  const totalAmount = Math.max(0, subtotal - discount + shippingCharge);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    if (!couponCode.trim()) return;

    try {
      const res = await fetch("/api/checkout/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          couponCode: couponCode.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.data?.couponApplied) {
        setCouponApplied(data.data.couponApplied);
        setCouponError("");
      } else {
        setCouponApplied(null);
        setCouponError(data.message || "Invalid coupon code.");
      }
    } catch {
      setCouponError("Could not validate coupon.");
    }
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage("Please fill in your name, email, and mobile number.");
      return;
    }

    if (!email.includes("@") || email.length < 5) {
      setErrorMessage("Please enter a valid email address for order tracking & receipt.");
      return;
    }

    if (phone.replace(/\D/g, "").length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setErrorMessage("Please provide complete delivery address details.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    setIsInitializingPayment(true);

    try {
      // 1. Send checkout payload to backend
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, email, phone },
          shippingAddress: {
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            landmark,
          },
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            image: i.image,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          couponCode: couponApplied?.code || couponCode.trim() || undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to initialize order.");
      }

      // 2. Open payment modal with backend data
      setPaymentModalData(data.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Checkout could not be initialized.");
    } finally {
      setIsInitializingPayment(false);
    }
  };

  const handlePaymentSuccess = (confirmedOrder: any) => {
    clearCart();
    setPaymentModalData(null);
    router.push(
      `/order/success?orderNumber=${encodeURIComponent(confirmedOrder.orderNumber)}&email=${encodeURIComponent(
        confirmedOrder.customerEmail
      )}`
    );
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#FAF8F5] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Banner: Guest Checkout Assurance */}
          <div className="bg-duskk-cream border border-duskk-gold/30 p-4 mb-8 flex flex-col sm:flex-row items-center justify-between text-xs text-duskk-800 rounded">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-duskk-gold" />
              <span>
                <strong>Express Guest Checkout:</strong> No password or OTP required. Simply fill your shipping address and pay securely.
              </span>
            </div>
            <div className="flex items-center space-x-1 text-duskk-600 mt-2 sm:mt-0 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Verified Gateway</span>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="bg-white p-12 text-center border border-duskk-200 max-w-lg mx-auto space-y-4">
              <ShoppingBag className="w-12 h-12 text-duskk-400 mx-auto" />
              <h2 className="font-serif text-2xl text-duskk-900">Your bag is empty</h2>
              <p className="text-xs text-duskk-500">Add pieces to your bag before checking out.</p>
              <Link
                href="/shop"
                className="inline-block px-6 py-2.5 bg-duskk-900 text-white text-xs uppercase tracking-widest font-semibold"
              >
                Go to Shop
              </Link>
            </div>
          ) : (
            <form onSubmit={handleProceedToPayment}>
              {errorMessage && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT: Customer details + Shipping Address (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* SECTION 1: Customer Details */}
                  <div className="bg-white border border-duskk-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center space-x-2 pb-3 border-b border-duskk-100">
                      <span className="w-6 h-6 rounded-full bg-duskk-900 text-white text-xs flex items-center justify-center font-bold">
                        1
                      </span>
                      <h3 className="font-serif text-base sm:text-lg font-semibold text-duskk-900">
                        Customer Details (Guest Checkout)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded bg-duskk-50/50 focus:bg-white focus:outline-none focus:border-duskk-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="rahul@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded bg-duskk-50/50 focus:bg-white focus:outline-none focus:border-duskk-gold"
                        />
                        <span className="text-[10px] text-duskk-400 mt-0.5 block">
                          Order receipt and live tracking updates will be sent here.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded bg-duskk-50/50 focus:bg-white focus:outline-none focus:border-duskk-gold"
                        />
                        <span className="text-[10px] text-duskk-400 mt-0.5 block">
                          For delivery agent coordination (No OTP required).
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Shipping Address */}
                  <div className="bg-white border border-duskk-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center space-x-2 pb-3 border-b border-duskk-100">
                      <span className="w-6 h-6 rounded-full bg-duskk-900 text-white text-xs flex items-center justify-center font-bold">
                        2
                      </span>
                      <h3 className="font-serif text-base sm:text-lg font-semibold text-duskk-900">
                        Shipping Address
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                          Address Line 1 (Flat, House No., Building, Street) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Flat 402, Sunset Heights, Linking Road"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded bg-duskk-50/50 focus:bg-white focus:outline-none focus:border-duskk-gold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                          Address Line 2 (Area, Sector, Colony - Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Bandra West"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded bg-duskk-50/50 focus:bg-white focus:outline-none focus:border-duskk-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Mumbai"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded bg-duskk-50/50 focus:bg-white focus:outline-none focus:border-duskk-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                          State *
                        </label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded bg-duskk-50/50 focus:bg-white focus:outline-none focus:border-duskk-gold"
                        >
                          {statesOfIndia.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="400050"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                          className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded bg-duskk-50/50 focus:bg-white focus:outline-none focus:border-duskk-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Near St. Andrews Church"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded bg-duskk-50/50 focus:bg-white focus:outline-none focus:border-duskk-gold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                          Delivery Instructions / Gift Note (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Please ring doorbell or leave with security"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-duskk-300 rounded bg-duskk-50/50 focus:bg-white focus:outline-none focus:border-duskk-gold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Order Summary & Payment Button (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-duskk-200 p-6 shadow-sm space-y-5">
                    <div className="flex items-center space-x-2 pb-3 border-b border-duskk-100">
                      <span className="w-6 h-6 rounded-full bg-duskk-900 text-white text-xs flex items-center justify-center font-bold">
                        3
                      </span>
                      <h3 className="font-serif text-base sm:text-lg font-semibold text-duskk-900">
                        Order Summary ({items.length} items)
                      </h3>
                    </div>

                    {/* Compact Item Review */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-duskk-100 pr-1">
                      {items.map((i) => (
                        <div key={i.productId} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3 min-w-0 pr-2">
                            <img
                              src={i.image || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=150&q=80"}
                              alt={i.name}
                              className="w-10 h-10 object-cover rounded bg-duskk-50 border border-duskk-100 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-duskk-900 line-clamp-1">{i.name}</p>
                              <p className="text-[11px] text-duskk-500 font-mono">Qty: {i.quantity}</p>
                            </div>
                          </div>
                          <span className="font-medium text-duskk-900 whitespace-nowrap">
                            {formatPrice(i.price * i.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Coupon Section */}
                    <div className="pt-2 border-t border-duskk-100">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Promo code (e.g. DUSKK10)"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 text-xs uppercase border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="px-3 py-2 bg-duskk-800 text-white text-xs font-semibold uppercase rounded hover:bg-duskk-900 transition"
                        >
                          Apply
                        </button>
                      </div>
                      {couponApplied && (
                        <p className="text-xs text-emerald-700 mt-1 flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Code {couponApplied.code} applied! Saved {formatPrice(couponApplied.discountValue)}
                        </p>
                      )}
                      {couponError && (
                        <p className="text-xs text-rose-600 mt-1">{couponError}</p>
                      )}
                    </div>

                    {/* Financial Breakdown */}
                    <div className="space-y-2 text-xs text-duskk-600 pt-3 border-t border-duskk-200">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="text-duskk-900 font-medium">{formatPrice(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Discount Savings:</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Insured Express Shipping:</span>
                        <span className="text-duskk-900 font-medium">
                          {shippingCharge === 0 ? <span className="text-emerald-700 font-bold uppercase">FREE</span> : formatPrice(shippingCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between text-duskk-500 text-[11px]">
                        <span>Taxes:</span>
                        <span>Inclusive (3% GST)</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-duskk-200 text-sm font-bold text-duskk-900">
                        <span>Grand Total Payable:</span>
                        <span className="font-serif text-xl text-duskk-900">{formatPrice(totalAmount)}</span>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <button
                      type="submit"
                      disabled={isInitializingPayment}
                      className="w-full py-4 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center justify-center space-x-2 shadow-xl disabled:opacity-60"
                    >
                      {isInitializingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Initiating Secure Payment...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 text-duskk-gold" />
                          <span>Pay {formatPrice(totalAmount)} via Razorpay</span>
                        </>
                      )}
                    </button>

                    <div className="pt-1 text-center text-[11px] text-duskk-500 space-y-1">
                      <p className="flex items-center justify-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Secured by Razorpay. 100% Encrypted Payment.</span>
                      </p>
                      <p>Doorstep Delivery &bull; Free 7-Day Returns</p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Razorpay Interactive Payment Modal */}
      <RazorpayPaymentModal
        isOpen={!!paymentModalData}
        onClose={() => setPaymentModalData(null)}
        orderData={paymentModalData}
        onSuccess={handlePaymentSuccess}
      />

      <Footer />
    </>
  );
}
