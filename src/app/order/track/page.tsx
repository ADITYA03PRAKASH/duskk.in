"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import {
  Compass,
  CheckCircle2,
  Package,
  Truck,
  Home,
  Clock,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Search,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

const TRACKING_STEPS = [
  { key: "CONFIRMED", label: "Order Confirmed", icon: CheckCircle2 },
  { key: "PROCESSING", label: "Processing", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Home },
];

function OrderTrackContent() {
  const searchParams = useSearchParams();
  const initialOrderNumber = searchParams.get("orderNumber") || "";
  const initialEmail = searchParams.get("email") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderData, setOrderData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchOrderTracking = async (ordNum: string, mail: string) => {
    if (!ordNum.trim() || !mail.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/order/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: ordNum.trim(),
          email: mail.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrderData(data.data);
      } else {
        setOrderData(null);
        setError(
          data.message || "No order found matching this Order Number and Email combination."
        );
      }
    } catch {
      setError("Unable to retrieve tracking information. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber && initialEmail) {
      fetchOrderTracking(initialOrderNumber, initialEmail);
    }
  }, [initialOrderNumber, initialEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrderTracking(orderNumber, email);
  };

  const getActiveStepIndex = (status: string) => {
    if (status === "PENDING_PAYMENT") return 0;
    if (status === "CONFIRMED" || status === "PAID") return 0;
    if (status === "PROCESSING") return 1;
    if (status === "SHIPPED") return 2;
    if (status === "OUT_FOR_DELIVERY") return 3;
    if (status === "DELIVERED") return 4;
    return 0;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
          DISPATCH & FULFILLMENT
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal">
          Track Your DUSKK Order
        </h1>
        <p className="text-xs sm:text-sm text-duskk-500 mt-2">
          Check live status, shipping courier progress, and delivery timelines without logging in.
        </p>
      </div>

      {/* Verification Search Form */}
      <div className="bg-white border border-duskk-200 p-6 sm:p-8 shadow-sm rounded-lg mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
              Order Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DUSK-2026-12345"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="w-full px-3 py-2.5 text-xs font-mono border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="The email used during checkout"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center justify-center space-x-1 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Track</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracking Result View */}
      {orderData && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white border border-duskk-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-duskk-100 gap-2">
              <div>
                <span className="text-xs text-duskk-400 font-mono uppercase tracking-wider">
                  Live Tracking
                </span>
                <h2 className="font-serif text-2xl text-duskk-900 font-bold">
                  Order #{orderData.orderNumber}
                </h2>
                <span className="text-xs text-duskk-500">
                  Placed on {formatDate(orderData.createdAt)}
                </span>
              </div>

              <div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    ORDER_STATUS_LABELS[orderData.orderStatus]?.color || "bg-duskk-100 text-duskk-800"
                  }`}
                >
                  {ORDER_STATUS_LABELS[orderData.orderStatus]?.label || orderData.orderStatus}
                </span>
              </div>
            </div>

            {/* Courier Tracking Details Banner */}
            {(orderData.courierName || orderData.trackingNumber) && (
              <div className="bg-duskk-50 border border-duskk-200/80 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-duskk-gold" />
                    <span className="font-semibold text-duskk-900 text-xs sm:text-sm">
                      {orderData.courierName || "Express Courier Partner"}
                    </span>
                  </div>
                  {orderData.trackingNumber && (
                    <div className="flex items-center space-x-2 text-xs text-duskk-600">
                      <span>AWB:</span>
                      <span className="font-mono font-semibold text-duskk-900">{orderData.trackingNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyAwb(orderData.trackingNumber)}
                        className="p-1 hover:bg-duskk-200 rounded text-duskk-700 transition flex items-center space-x-1 text-[10px]"
                        title="Copy AWB"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  )}
                  {orderData.estimatedDelivery && (
                    <p className="text-[11px] text-duskk-500">
                      Estimated Delivery by: <strong className="text-duskk-800">{orderData.estimatedDelivery}</strong>
                    </p>
                  )}
                </div>

                {orderData.trackingUrl && (
                  <div>
                    <a
                      href={orderData.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white rounded text-xs font-semibold uppercase tracking-wider transition shadow-sm"
                    >
                      <span>Track on Courier Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Visual Step-by-Step Tracker Progress */}
            <div className="py-6">
              <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-duskk-200 -translate-y-1/2 z-0" />
                <div
                  className="absolute top-1/2 left-0 h-1 bg-duskk-gold -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${(getActiveStepIndex(orderData.orderStatus) / (TRACKING_STEPS.length - 1)) * 100}%`,
                  }}
                />

                <div className="relative z-10 flex justify-between">
                  {TRACKING_STEPS.map((step, idx) => {
                    const currentStep = getActiveStepIndex(orderData.orderStatus);
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    const Icon = step.icon;

                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? "bg-duskk-900 text-duskk-gold ring-4 ring-duskk-cream"
                              : "bg-white border-2 border-duskk-300 text-duskk-400"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[11px] mt-2 font-medium text-center uppercase tracking-wider max-w-[80px] ${
                            isCurrent
                              ? "text-duskk-900 font-bold"
                              : isCompleted
                              ? "text-duskk-700"
                              : "text-duskk-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Timeline History log */}
            {orderData.timeline && orderData.timeline.length > 0 && (
              <div className="pt-4 border-t border-duskk-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-duskk-700 mb-3">
                  Activity Log
                </h4>
                <div className="space-y-2 text-xs">
                  {orderData.timeline.map((entry: any, i: number) => (
                    <div key={i} className="flex items-start space-x-3 text-duskk-600">
                      <Clock className="w-3.5 h-3.5 text-duskk-gold mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold text-duskk-900">
                          {ORDER_STATUS_LABELS[entry.status]?.label || entry.status}:
                        </span>{" "}
                        <span>{entry.note || "Status updated"}</span>
                      </div>
                      <span className="text-[11px] text-duskk-400 whitespace-nowrap">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Items & Shipping Snapshot Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-duskk-200 rounded-lg p-6 shadow-sm space-y-4">
              <h4 className="font-serif text-base font-semibold text-duskk-900 pb-2 border-b border-duskk-100">
                Purchased Items ({orderData.items.length})
              </h4>
              <div className="divide-y divide-duskk-100 max-h-60 overflow-y-auto">
                {orderData.items.map((item: any) => (
                  <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.productImage || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=150&q=80"}
                        alt={item.productName}
                        className="w-10 h-10 object-cover rounded bg-duskk-50 border border-duskk-100"
                      />
                      <div>
                        <p className="font-semibold text-duskk-900">{item.productName}</p>
                        <p className="text-[10px] text-duskk-400 font-mono">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-duskk-900 font-serif">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-duskk-200 rounded-lg p-6 shadow-sm space-y-4 text-xs">
              <h4 className="font-serif text-base font-semibold text-duskk-900 pb-2 border-b border-duskk-100">
                Delivery Address Snapshot
              </h4>
              <p className="text-duskk-700 leading-relaxed">
                <strong className="text-duskk-900">{orderData.customerName}</strong><br />
                {orderData.shippingAddress.addressLine1}
                {orderData.shippingAddress.addressLine2 ? `, ${orderData.shippingAddress.addressLine2}` : ""}<br />
                {orderData.shippingAddress.city}, {orderData.shippingAddress.state} - {orderData.shippingAddress.pincode}
                {orderData.shippingAddress.landmark ? ` (Landmark: ${orderData.shippingAddress.landmark})` : ""}
              </p>

              <div className="pt-3 border-t border-duskk-100 space-y-1 text-duskk-600">
                <div className="flex justify-between font-bold text-sm text-duskk-900 pt-1">
                  <span>Total Paid:</span>
                  <span>{formatPrice(orderData.financials.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAF8F5] py-12">
        <Suspense fallback={<div className="p-12 text-center text-xs text-duskk-500">Loading tracking portal...</div>}>
          <OrderTrackContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
