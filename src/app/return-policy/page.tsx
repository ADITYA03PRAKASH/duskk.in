import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ReturnPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAF8F5] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 border border-duskk-200 rounded-lg shadow-sm space-y-6 text-xs sm:text-sm text-duskk-700 leading-relaxed">
          <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block">
            POLICY & ASSURANCE
          </span>
          <h1 className="font-serif text-3xl text-duskk-900 font-normal">7-Day Return & Exchange Policy</h1>

          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-duskk-900">1. 7-Day Doorstep Returns</h3>
            <p>
              We want you to be completely enamored with your DUSKK jewelry. If for any reason you wish to return or exchange a piece, you may request a return within 7 calendar days of receiving delivery.
            </p>

            <h3 className="font-serif text-lg font-semibold text-duskk-900">2. Eligibility Conditions</h3>
            <p>
              To be eligible for a full refund or exchange:
              <br />&bull; The jewelry item must be unworn, in pristine brand-new condition without scratches or signs of wear.
              <br />&bull; Must be returned in the original velvet gift box with tags and brand cards intact.
            </p>

            <h3 className="font-serif text-lg font-semibold text-duskk-900">3. Doorstep Pickup & Refund Process</h3>
            <p>
              Once your return request is approved by our concierge, we schedule a free pickup from your delivery address. After inspection at our fulfillment facility, your refund will be credited back to your original payment method (via Razorpay) within 5-7 business days.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
