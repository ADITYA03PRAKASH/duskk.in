"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, normalizeImageUrl } from "@/lib/utils";
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
  RotateCcw,
  XCircle,
  X,
  CreditCard,
  ArrowRight,
} from "lucide-react";

const TRACKING_STEPS = [
  { key: "CONFIRMED", label: "Order Confirmed", icon: CheckCircle2 },
  { key: "PROCESSING", label: "Processing", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Home },
];

const CANCELLATION_REASONS = [
  "Ordered by mistake / duplicate order",
  "Incorrect shipping address",
  "Changed my mind / No longer needed",
  "Found alternative jewellery piece",
  "Delivery timeframe too long",
  "Other reason",
];

const EXCHANGE_REASONS = [
  "Damaged or defective jewellery received",
  "Incorrect ring/bracelet size or variant",
  "Different item received than ordered",
  "Finishing or polishing issue",
  "Other exchange reason",
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

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0]);
  const [cancelDetails, setCancelDetails] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");

  // Exchange Modal State
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeItemId, setExchangeItemId] = useState("");
  const [exchangeReason, setExchangeReason] = useState(EXCHANGE_REASONS[0]);
  const [exchangeDetails, setExchangeDetails] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);
  const [exchangeError, setExchangeError] = useState("");
  const [exchangeSuccessMsg, setExchangeSuccessMsg] = useState("");

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
        if (data.data.items?.length > 0 && !exchangeItemId) {
          setExchangeItemId(data.data.items[0].id);
        }
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

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData) return;

    setCancelSubmitting(true);
    setCancelError("");
    setCancelSuccessMsg("");

    try {
      const res = await fetch("/api/order/cancellation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderData.orderNumber,
          email: orderData.customerEmail,
          reason: cancelReason,
          details: cancelDetails,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCancelSuccessMsg(data.message || "Cancellation request submitted.");
        setTimeout(() => {
          setShowCancelModal(false);
          setCancelSuccessMsg("");
          fetchOrderTracking(orderNumber, email);
        }, 1500);
      } else {
        setCancelError(data.message || "Failed to submit cancellation request.");
      }
    } catch {
      setCancelError("An error occurred while submitting cancellation request.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData || !exchangeItemId) return;

    setExchangeSubmitting(true);
    setExchangeError("");
    setExchangeSuccessMsg("");

    try {
      const res = await fetch("/api/order/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderData.orderNumber,
          email: orderData.customerEmail,
          orderItemId: exchangeItemId,
          reason: exchangeReason,
          details: exchangeDetails,
          evidenceUrls: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setExchangeSuccessMsg(data.message || "Exchange request submitted.");
        setTimeout(() => {
          setShowExchangeModal(false);
          setExchangeSuccessMsg("");
          fetchOrderTracking(orderNumber, email);
        }, 1500);
      } else {
        setExchangeError(data.message || "Failed to submit exchange request.");
      }
    } catch {
      setExchangeError("An error occurred while submitting exchange request.");
    } finally {
      setExchangeSubmitting(false);
    }
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

  const isEligibleForCancellation = (order: any) => {
    if (!order) return false;
    const cancellableStatuses = ["PENDING_PAYMENT", "CONFIRMED", "PAID", "PROCESSING"];
    if (!cancellableStatuses.includes(order.orderStatus)) return false;
    const hasPendingCancellation = (order.cancellations || []).some(
      (c: any) => c.status === "REQUESTED" || c.status === "APPROVED"
    );
    return !hasPendingCancellation;
  };

  const isEligibleForExchange = (order: any) => {
    if (!order) return false;
    if (order.orderStatus !== "DELIVERED") return false;
    const orderDeliveredDate = order.timeline?.find(
      (t: any) => t.status === "DELIVERED"
    )?.timestamp || order.createdAt;
    const daysSinceDelivery =
      (Date.now() - new Date(orderDeliveredDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceDelivery <= 7;
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
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-duskk-100 gap-3">
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

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    ORDER_STATUS_LABELS[orderData.orderStatus]?.color || "bg-duskk-100 text-duskk-800"
                  }`}
                >
                  {ORDER_STATUS_LABELS[orderData.orderStatus]?.label || orderData.orderStatus}
                </span>

                {/* Customer Action: Cancellation */}
                {isEligibleForCancellation(orderData) && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold uppercase tracking-wider transition"
                  >
                    Request Cancellation
                  </button>
                )}

                {/* Customer Action: Exchange */}
                {isEligibleForExchange(orderData) && (
                  <button
                    type="button"
                    onClick={() => setShowExchangeModal(true)}
                    className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-semibold uppercase tracking-wider transition flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Exchange</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Cancellation Notice Banner */}
            {orderData.cancellations && orderData.cancellations.length > 0 && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-900 font-semibold uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Cancellation Request Status</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-900">
                    {orderData.cancellations[0].status}
                  </span>
                </div>
                <p className="text-amber-800">
                  <strong>Reason:</strong> {orderData.cancellations[0].reason}
                </p>
                {orderData.cancellations[0].details && (
                  <p className="text-amber-700 italic">
                    &ldquo;{orderData.cancellations[0].details}&rdquo;
                  </p>
                )}
                {orderData.cancellations[0].admin_notes && (
                  <div className="p-2.5 bg-white border border-amber-200 rounded text-amber-900">
                    <span className="font-semibold">DUSKK Concierge Note: </span>
                    {orderData.cancellations[0].admin_notes}
                  </div>
                )}
              </div>
            )}

            {/* Active Exchange Notice Banner */}
            {orderData.exchanges && orderData.exchanges.length > 0 && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-900 font-semibold uppercase tracking-wider">
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                    <span>Product Exchange Request</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-200 text-blue-900">
                    {orderData.exchanges[0].status}
                  </span>
                </div>
                <p className="text-blue-800">
                  <strong>Reason:</strong> {orderData.exchanges[0].reason}
                </p>
                {orderData.exchanges[0].pickup_tracking_number && (
                  <p className="text-blue-700">
                    <strong>Pickup Courier:</strong> {orderData.exchanges[0].pickup_courier} | AWB:{" "}
                    <span className="font-mono font-semibold">{orderData.exchanges[0].pickup_tracking_number}</span>
                  </p>
                )}
                {orderData.exchanges[0].replacement_tracking_number && (
                  <p className="text-blue-700">
                    <strong>Replacement Courier:</strong> {orderData.exchanges[0].replacement_courier} | AWB:{" "}
                    <span className="font-mono font-semibold">{orderData.exchanges[0].replacement_tracking_number}</span>
                  </p>
                )}
                {orderData.exchanges[0].admin_notes && (
                  <div className="p-2.5 bg-white border border-blue-200 rounded text-blue-900">
                    <span className="font-semibold">Concierge Note: </span>
                    {orderData.exchanges[0].admin_notes}
                  </div>
                )}
              </div>
            )}

            {/* Active Refund Notice Banner */}
            {orderData.refunds && orderData.refunds.length > 0 && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-900 font-semibold uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Razorpay Refund Reconciled</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900">
                    {orderData.refunds[0].status}
                  </span>
                </div>
                <p className="text-emerald-800">
                  <strong>Refund Amount:</strong> {formatPrice(orderData.refunds[0].amount)}
                  {orderData.refunds[0].razorpay_refund_id && (
                    <span className="ml-3 font-mono text-[11px] text-emerald-700">
                      ID: {orderData.refunds[0].razorpay_refund_id}
                    </span>
                  )}
                </p>
                <p className="text-emerald-700 text-[11px]">
                  Processed back to your original payment method. Depending on your issuing bank, credits reflect in 5-7 business days.
                </p>
              </div>
            )}

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
                        src={normalizeImageUrl(item.productImage)}
                        alt={item.productName}
                        className="w-10 h-10 object-cover rounded bg-duskk-50 border border-duskk-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      <div>
                        <p className="font-semibold text-duskk-900">{item.productName}</p>
                        <p className="text-[10px] text-duskk-400 font-mono">
                          {item.variantTitle ? `${item.variantTitle} • ` : ""}Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-duskk-900 font-serif">
                      {formatPrice(item.totalPrice || item.price * item.quantity)}
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

      {/* Cancellation Request Modal */}
      {showCancelModal && orderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-lg w-full rounded-lg shadow-2xl border border-duskk-200 overflow-hidden">
            <div className="bg-duskk-900 text-white p-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-duskk-gold block">
                  ORDER LIFECYCLE
                </span>
                <h3 className="font-serif text-lg font-medium">
                  Request Order Cancellation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-duskk-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-5 space-y-4 text-xs">
              <p className="text-duskk-600">
                You are requesting cancellation for Order <strong className="text-duskk-900 font-mono">#{orderData.orderNumber}</strong>. If payment has been captured, an authorized refund will be queued back to your original payment account.
              </p>

              <div>
                <label className="block text-duskk-700 font-semibold uppercase tracking-wider mb-1">
                  Reason for Cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-900"
                >
                  {CANCELLATION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-duskk-700 font-semibold uppercase tracking-wider mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={cancelDetails}
                  onChange={(e) => setCancelDetails(e.target.value)}
                  placeholder="Tell us more about your reason for cancelling..."
                  className="w-full px-3 py-2 border border-duskk-300 rounded bg-white"
                />
              </div>

              {cancelError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}

              {cancelSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{cancelSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-duskk-100">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-duskk-300 rounded text-duskk-700 hover:bg-duskk-50 font-medium transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded font-semibold uppercase tracking-wider transition disabled:opacity-50 flex items-center space-x-1"
                >
                  {cancelSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Submit Cancellation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Exchange Modal */}
      {showExchangeModal && orderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-lg w-full rounded-lg shadow-2xl border border-duskk-200 overflow-hidden">
            <div className="bg-duskk-900 text-white p-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-duskk-gold block">
                  7-DAY SATISFACTION ASSURANCE
                </span>
                <h3 className="font-serif text-lg font-medium">
                  Request Product Exchange
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExchangeModal(false)}
                className="text-duskk-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExchangeSubmit} className="p-5 space-y-4 text-xs">
              <p className="text-duskk-600">
                Select the jewellery piece you wish to exchange. Our concierge team will review your request and arrange a complimentary insured pickup.
              </p>

              <div>
                <label className="block text-duskk-700 font-semibold uppercase tracking-wider mb-1">
                  Select Item to Exchange *
                </label>
                <select
                  value={exchangeItemId}
                  onChange={(e) => setExchangeItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-900"
                >
                  {orderData.items.map((i: any) => (
                    <option key={i.id} value={i.id}>
                      {i.productName} {i.variantTitle ? `(${i.variantTitle})` : ""} - Qty: {i.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-duskk-700 font-semibold uppercase tracking-wider mb-1">
                  Reason for Exchange *
                </label>
                <select
                  value={exchangeReason}
                  onChange={(e) => setExchangeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-900"
                >
                  {EXCHANGE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-duskk-700 font-semibold uppercase tracking-wider mb-1">
                  Details / Desired Replacement
                </label>
                <textarea
                  rows={3}
                  value={exchangeDetails}
                  onChange={(e) => setExchangeDetails(e.target.value)}
                  placeholder="Please specify size or desired replacement variant..."
                  className="w-full px-3 py-2 border border-duskk-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block text-duskk-700 font-semibold uppercase tracking-wider mb-1">
                  Evidence Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-duskk-300 rounded bg-white font-mono text-[11px]"
                />
                <p className="text-[10px] text-duskk-400 mt-1">
                  Provide an image link if item arrived damaged or defective.
                </p>
              </div>

              {exchangeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{exchangeError}</span>
                </div>
              )}

              {exchangeSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{exchangeSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-duskk-100">
                <button
                  type="button"
                  onClick={() => setShowExchangeModal(false)}
                  className="px-4 py-2 border border-duskk-300 rounded text-duskk-700 hover:bg-duskk-50 font-medium transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={exchangeSubmitting}
                  className="px-4 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white rounded font-semibold uppercase tracking-wider transition disabled:opacity-50 flex items-center space-x-1"
                >
                  {exchangeSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Submit Exchange Request</span>
                  )}
                </button>
              </div>
            </form>
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
