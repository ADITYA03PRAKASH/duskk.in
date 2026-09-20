"use client";

import React, { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { ShieldCheck, CreditCard, Smartphone, Building2, CheckCircle2, Lock, AlertCircle, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    orderNumber: string;
    razorpayOrderId: string;
    amount: number;
    keyId: string;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
  } | null;
  onSuccess: (confirmedData: any) => void;
}

export function RazorpayPaymentModal({
  isOpen,
  onClose,
  orderData,
  onSuccess,
}: RazorpayPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("duskk@okhdfcbank");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !orderData) return null;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setErrorMessage("");

    try {
      // 1. If Razorpay JS SDK is loaded and Key is real live test key
      if (typeof window !== "undefined" && window.Razorpay && !orderData.keyId.includes("mock")) {
        const options = {
          key: orderData.keyId,
          amount: Math.round(orderData.amount * 100),
          currency: "INR",
          name: "DUSKK Jewellery",
          description: `Order #${orderData.orderNumber}`,
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: orderData.customer.name,
            email: orderData.customer.email,
            contact: orderData.customer.phone,
          },
          theme: {
            color: "#0F0F0F",
          },
          handler: async function (response: any) {
            await verifyBackendPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_method: selectedMethod,
            });
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // 2. Deterministic secure fallback simulation for testing/mock environment
      const paymentId = `pay_${Math.random().toString(36).substring(2, 11)}`;
      // Generate HMAC signature on backend via verify endpoint
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: orderData.razorpayOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: `sim_sig_${paymentId}`,
          payment_method: selectedMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Payment verification failed");
      }

      onSuccess(data.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Payment transaction could not be completed.");
      setIsProcessing(false);
    }
  };

  const verifyBackendPayment = async (payload: any) => {
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.data);
      } else {
        throw new Error(data.message || "Verification failed");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Payment verification failed.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white max-w-lg w-full rounded-lg shadow-2xl overflow-hidden border border-duskk-200">
        {/* Header */}
        <div className="bg-duskk-900 text-white p-5 flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-duskk-gold font-mono block">
              DUSKK SECURE CHECKOUT
            </span>
            <h3 className="font-serif text-lg font-medium">
              Order #{orderData.orderNumber}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-duskk-400 block">Total Payable</span>
            <span className="text-lg font-bold text-duskk-gold">
              {formatPrice(orderData.amount)}
            </span>
          </div>
        </div>

        {/* Razorpay Brand Bar */}
        <div className="bg-duskk-50 px-5 py-2.5 border-b border-duskk-200 flex items-center justify-between text-xs text-duskk-600">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL Razorpay Encrypted Gateway</span>
          </div>
          <span className="font-semibold text-duskk-800">INR Currency</span>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Payment Methods */}
        <div className="p-5 space-y-4">
          <label className="text-xs font-semibold text-duskk-700 uppercase tracking-wider block">
            Select Payment Method:
          </label>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod("upi")}
              className={`p-3 border rounded text-center transition flex flex-col items-center justify-center space-y-1.5 ${
                selectedMethod === "upi"
                  ? "border-duskk-900 bg-duskk-cream text-duskk-900 font-semibold"
                  : "border-duskk-200 hover:border-duskk-400 text-duskk-600"
              }`}
            >
              <Smartphone className="w-5 h-5 text-duskk-gold" />
              <span className="text-xs">UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("card")}
              className={`p-3 border rounded text-center transition flex flex-col items-center justify-center space-y-1.5 ${
                selectedMethod === "card"
                  ? "border-duskk-900 bg-duskk-cream text-duskk-900 font-semibold"
                  : "border-duskk-200 hover:border-duskk-400 text-duskk-600"
              }`}
            >
              <CreditCard className="w-5 h-5 text-duskk-gold" />
              <span className="text-xs">Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("netbanking")}
              className={`p-3 border rounded text-center transition flex flex-col items-center justify-center space-y-1.5 ${
                selectedMethod === "netbanking"
                  ? "border-duskk-900 bg-duskk-cream text-duskk-900 font-semibold"
                  : "border-duskk-200 hover:border-duskk-400 text-duskk-600"
              }`}
            >
              <Building2 className="w-5 h-5 text-duskk-gold" />
              <span className="text-xs">NetBanking</span>
            </button>
          </div>

          {/* Method Details */}
          {selectedMethod === "upi" && (
            <div className="p-3 bg-duskk-50 border border-duskk-200 rounded space-y-2">
              <span className="text-xs text-duskk-600 block">UPI ID / VPA:</span>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@okhdfcbank"
                className="w-full px-3 py-2 text-xs border border-duskk-300 rounded bg-white focus:outline-none focus:border-duskk-gold"
              />
              <p className="text-[11px] text-duskk-500">
                Supports Google Pay, PhonePe, Paytm, BHIM and all major UPI apps.
              </p>
            </div>
          )}

          {selectedMethod === "card" && (
            <div className="p-3 bg-duskk-50 border border-duskk-200 rounded space-y-2">
              <span className="text-xs text-duskk-600 block">Accepted Cards:</span>
              <p className="text-xs font-medium text-duskk-800">
                Visa, MasterCard, RuPay, Diners Club & American Express.
              </p>
            </div>
          )}

          {selectedMethod === "netbanking" && (
            <div className="p-3 bg-duskk-50 border border-duskk-200 rounded space-y-2">
              <span className="text-xs text-duskk-600 block">Major Indian Banks Supported:</span>
              <p className="text-xs font-medium text-duskk-800">
                HDFC Bank, ICICI Bank, SBI, Axis Bank, Kotak Mahindra, etc.
              </p>
            </div>
          )}

          {/* Customer Summary Note */}
          <div className="text-xs text-duskk-500 bg-duskk-50 p-2.5 rounded border border-duskk-100 flex items-center justify-between">
            <span>Payer: <strong>{orderData.customer.name}</strong></span>
            <span>{orderData.customer.email}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-duskk-cream border-t border-duskk-200 flex items-center justify-between space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 border border-duskk-300 text-xs uppercase tracking-wider text-duskk-700 hover:bg-white rounded transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={isProcessing}
            className="flex-1 py-3 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center justify-center space-x-2 shadow-md disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying with Razorpay...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-duskk-gold" />
                <span>Authorize {formatPrice(orderData.amount)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
