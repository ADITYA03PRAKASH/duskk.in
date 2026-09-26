"use client";

import React, { useState } from "react";
import { openRazorpayModal } from "@/lib/razorpay-client";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";

interface RazorpayCheckoutButtonProps {
  amountInPaise?: number; // e.g., 50000 for ₹500
  amountInRupees?: number; // e.g., 500 for ₹500
  currency?: string;
  name?: string;
  description?: string;
  receipt?: string;
  notes?: Record<string, string>;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  buttonText?: string;
  className?: string;
  onSuccess?: (data: {
    order_id: string;
    payment_id: string;
    signature: string;
    verified: boolean;
  }) => void;
  onFailure?: (error: any) => void;
}

export function RazorpayCheckoutButton({
  amountInPaise,
  amountInRupees,
  currency = "INR",
  name = "DUSKK",
  description = "Complete Payment",
  receipt,
  notes,
  customer,
  buttonText,
  className = "",
  onSuccess,
  onFailure,
}: RazorpayCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const calculatedPaise =
    amountInPaise !== undefined
      ? Math.round(amountInPaise)
      : amountInRupees !== undefined
      ? Math.round(amountInRupees * 100)
      : 100;

  const handleCheckout = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 1. Create order on backend (/api/create-order)
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: calculatedPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          notes,
        }),
      });

      const orderData = await res.json();

      if (!res.ok || !orderData.order_id) {
        throw new Error(orderData.message || "Failed to create Razorpay order.");
      }

      // 2. Open standard Razorpay Checkout modal
      await openRazorpayModal({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TgNaEy4Lcm7RMo",
        orderId: orderData.order_id,
        amount: orderData.amount || calculatedPaise,
        currency: orderData.currency || currency,
        name,
        description,
        customer,
        notes,
        onSuccess: async (paymentResponse) => {
          try {
            // 3. Verify signature on backend (/api/verify-payment)
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyResult = await verifyRes.json();

            if (verifyRes.ok && verifyResult.success) {
              if (onSuccess) {
                onSuccess({
                  order_id: paymentResponse.razorpay_order_id,
                  payment_id: paymentResponse.razorpay_payment_id,
                  signature: paymentResponse.razorpay_signature,
                  verified: true,
                });
              }
            } else {
              const msg = verifyResult.message || "Payment signature verification failed.";
              setErrorMessage(msg);
              if (onFailure) onFailure(new Error(msg));
            }
          } catch (verifyErr: any) {
            const msg = verifyErr.message || "Payment verification failed.";
            setErrorMessage(msg);
            if (onFailure) onFailure(verifyErr);
          } finally {
            setIsLoading(false);
          }
        },
        onDismiss: () => {
          setIsLoading(false);
        },
        onFailure: (error) => {
          console.error("Razorpay Payment Failed:", error);
          const msg = error?.description || "Payment failed or was cancelled.";
          setErrorMessage(msg);
          setIsLoading(false);
          if (onFailure) onFailure(error);
        },
      });
    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      setErrorMessage(err.message || "Could not initiate payment.");
      setIsLoading(false);
      if (onFailure) onFailure(err);
    }
  };

  return (
    <div className="w-full">
      {errorMessage && (
        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className={
          className ||
          "w-full py-3.5 px-6 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center justify-center space-x-2 shadow-md disabled:opacity-60"
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting to Razorpay...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>{buttonText || `Pay ₹${(calculatedPaise / 100).toFixed(2)} with Razorpay`}</span>
          </>
        )}
      </button>
    </div>
  );
}
