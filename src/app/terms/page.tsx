import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAF8F5] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 border border-duskk-200 rounded-lg shadow-sm space-y-6 text-xs sm:text-sm text-duskk-700 leading-relaxed">
          <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block">
            LEGAL TERMS
          </span>
          <h1 className="font-serif text-3xl text-duskk-900 font-normal">Terms & Conditions</h1>

          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-duskk-900">1. Overview</h3>
            <p>
              Welcome to duskk.in, operated by DUSKK Retail Private Limited. By visiting our site or purchasing products from us, you agree to be bound by the terms and conditions set forth herein.
            </p>

            <h3 className="font-serif text-lg font-semibold text-duskk-900">2. Products & Pricing</h3>
            <p>
              All prices listed on DUSKK are in Indian Rupees (INR) and inclusive of applicable Goods and Services Tax (GST). We reserve the right to modify pricing or discontinue products at any time without prior notice.
            </p>

            <h3 className="font-serif text-lg font-semibold text-duskk-900">3. Payment & Settlement</h3>
            <p>
              Payments are authenticated in real-time via Razorpay. Orders will only be processed and dispatched upon verified payment settlement.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
