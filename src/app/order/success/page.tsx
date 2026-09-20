"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle2,
  Compass,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Lock,
  UserCheck,
  Mail,
  Truck,
  Sparkles,
  Loader2,
} from "lucide-react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const customerEmail = searchParams.get("email") || "";

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Optional Account Creation State
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [password, setPassword] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [accountMsg, setAccountMsg] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    if (orderNumber && customerEmail) {
      fetch("/api/order/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email: customerEmail }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOrder(data.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderNumber, customerEmail]);

  const handleCreateOptionalAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setAccountMsg("Password must be at least 6 characters.");
      return;
    }

    setIsCreatingAccount(true);
    setAccountMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: order?.customerName || "DUSKK Patron",
          email: customerEmail,
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAccountCreated(true);
        setAccountMsg(data.message || "Account created! All your orders are now linked.");
      } else {
        setAccountMsg(data.message || "Could not link account.");
      }
    } catch {
      setAccountMsg("Account creation failed.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Order Confirmed Banner */}
      <div className="bg-white border border-duskk-200 shadow-sm p-8 sm:p-12 text-center rounded-lg space-y-4 mb-8">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block">
          PAYMENT VERIFIED & CONFIRMED
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal">
          Your Order Has Been Placed Successfully
        </h1>

        <p className="text-xs sm:text-sm text-duskk-600 max-w-lg mx-auto">
          Thank you for choosing DUSKK. We have sent a detailed confirmation receipt to{" "}
          <strong className="text-duskk-900">{customerEmail || "your email"}</strong>.
        </p>

        <div className="inline-block bg-duskk-50 border border-duskk-200 px-6 py-3 rounded">
          <span className="text-xs text-duskk-500 uppercase tracking-widest block font-mono">
            Order Reference Number
          </span>
          <span className="font-serif text-2xl font-bold text-duskk-900 tracking-wider">
            {orderNumber || "DUSK-CONFIRMED"}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href={`/order/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(
              customerEmail
            )}`}
            className="px-6 py-3 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest transition flex items-center space-x-2 rounded shadow"
          >
            <Compass className="w-4 h-4 text-duskk-gold" />
            <span>Track Live Order Status</span>
          </Link>

          <Link
            href="/shop"
            className="px-6 py-3 border border-duskk-300 hover:border-duskk-900 text-duskk-800 text-xs font-semibold uppercase tracking-widest transition rounded"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Optional Customer Account Banner (Requirement #4) */}
      <div className="bg-gradient-to-r from-duskk-900 to-duskk-850 text-white p-8 rounded-lg shadow-md mb-8">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-duskk-gold/20 flex items-center justify-center text-duskk-gold flex-shrink-0 mt-1">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-duskk-gold block">
              OPTIONAL MEMBERSHIP
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-white">
              Want to save your details and track all your DUSKK orders in one place?
            </h3>
            <p className="text-xs text-duskk-300 leading-relaxed max-w-xl">
              Save a password to create your DUSKK account. All past and present orders placed with{" "}
              <strong className="text-white">{customerEmail}</strong> will be linked automatically.
            </p>

            {accountCreated ? (
              <div className="p-4 bg-emerald-900/60 border border-emerald-500 rounded text-emerald-200 text-xs flex items-center space-x-2 mt-4">
                <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{accountMsg}</span>
              </div>
            ) : showAccountForm ? (
              <form onSubmit={handleCreateOptionalAccount} className="pt-4 max-w-md space-y-3">
                <div>
                  <label className="block text-xs font-medium text-duskk-200 mb-1">
                    Choose a Password:
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-duskk-800 border border-duskk-700 rounded text-white placeholder-duskk-500 focus:outline-none focus:border-duskk-gold"
                  />
                </div>
                {accountMsg && <p className="text-xs text-rose-400">{accountMsg}</p>}
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isCreatingAccount}
                    className="px-5 py-2.5 bg-duskk-gold hover:bg-duskk-goldHover text-duskk-900 text-xs font-bold uppercase tracking-wider rounded transition flex items-center space-x-1"
                  >
                    {isCreatingAccount ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Linking Orders...</span>
                      </>
                    ) : (
                      <span>Create Account & Link Orders</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAccountForm(false)}
                    className="px-4 py-2.5 border border-duskk-700 text-duskk-400 text-xs hover:text-white rounded"
                  >
                    Maybe Later
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-3 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowAccountForm(true)}
                  className="px-5 py-2.5 bg-duskk-gold hover:bg-duskk-goldHover text-duskk-900 text-xs font-bold uppercase tracking-wider rounded transition"
                >
                  Continue with Email & Password
                </button>
                <button
                  onClick={() => {
                    setShowAccountForm(true);
                  }}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium uppercase tracking-wider rounded transition"
                >
                  Continue with Google
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Breakdown */}
      {order && (
        <div className="bg-white border border-duskk-200 rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-duskk-900 pb-3 border-b border-duskk-200">
            Order Snapshot
          </h3>

          {/* Items */}
          <div className="divide-y divide-duskk-100">
            {order.items.map((item: any) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-duskk-900">{item.productName}</p>
                  <p className="text-duskk-400 font-mono">
                    SKU: {item.productSku} &bull; Qty: {item.quantity}
                  </p>
                </div>
                <span className="font-medium text-duskk-900 font-serif text-sm">
                  {formatPrice(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Delivery Address Snapshot */}
          <div className="pt-4 border-t border-duskk-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-duskk-500 font-semibold uppercase tracking-wider block mb-1">
                Shipping Destination:
              </span>
              <p className="text-duskk-800 leading-relaxed">
                {order.customerName}<br />
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
            </div>

            <div>
              <span className="text-duskk-500 font-semibold uppercase tracking-wider block mb-1">
                Payment Summary:
              </span>
              <div className="space-y-1 text-duskk-700">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.financials.subtotal)}</span>
                </div>
                {order.financials.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatPrice(order.financials.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{order.financials.shippingCharge === 0 ? "FREE" : formatPrice(order.financials.shippingCharge)}</span>
                </div>
                <div className="flex justify-between font-bold text-duskk-900 pt-1 border-t border-duskk-100">
                  <span>Paid Total:</span>
                  <span>{formatPrice(order.financials.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAF8F5] py-12">
        <Suspense fallback={<div className="p-12 text-center text-xs text-duskk-500">Loading order receipt...</div>}>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
