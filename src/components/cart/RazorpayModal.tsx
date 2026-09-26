"use client";

import React, { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { openRazorpayModal } from "@/lib/razorpay-client";
import { ShieldCheck, CreditCard, Lock, AlertCircle, Loader2 } from "lucide-react";

interface RazorpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    orderNumber: string;
    razorpayOrderId: string;
    amount: number;
    currency?: string;
    keyId?: string;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !orderData) return null;

  const handleTriggerStandardCheckout = async () => {
    setIsProcessing(true);
    setErrorMessage("");

    try {
      await openRazorpayModal({
        key: orderData.keyId,
        orderId: orderData.razorpayOrderId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || "INR",
        name: "DUSKK Jewellery",
        description: `Order #${orderData.orderNumber}`,
        image: "/icon.png",
        customer: {
          name: orderData.customer.name,
          email: orderData.customer.email,
          phone: orderData.customer.phone,
        },
        themeColor: "#0F0F0F",
        onSuccess: async (response) => {
          try {
            const res = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
              onSuccess(data.data);
            } else {
              throw new Error(data.message || "Payment signature verification failed.");
            }
          } catch (err: any) {
            setErrorMessage(err.message || "Payment verification failed.");
            setIsProcessing(false);
          }
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
        onFailure: (error) => {
          console.error("Razorpay payment failed:", error);
          setErrorMessage(error?.description || "Payment failed. Please try again.");
          setIsProcessing(false);
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Could not launch Razorpay checkout.");
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

        <div className="p-5 space-y-4">
          <div className="text-xs text-duskk-600 bg-duskk-50 p-3 rounded border border-duskk-100 space-y-1">
            <div className="flex justify-between">
              <span>Customer:</span>
              <strong className="text-duskk-900">{orderData.customer.name}</strong>
            </div>
            <div className="flex justify-between">
              <span>Email:</span>
              <span>{orderData.customer.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Razorpay Order ID:</span>
              <span className="font-mono text-[11px] text-duskk-700">{orderData.razorpayOrderId}</span>
            </div>
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
            onClick={handleTriggerStandardCheckout}
            disabled={isProcessing}
            className="flex-1 py-3 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center justify-center space-x-2 shadow-md disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 text-duskk-gold" />
                <span>Pay {formatPrice(orderData.amount)} with Razorpay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
