import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAF8F5] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 border border-duskk-200 rounded-lg shadow-sm space-y-6 text-xs sm:text-sm text-duskk-700 leading-relaxed">
          <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block">
            DATA SECURITY & PRIVACY
          </span>
          <h1 className="font-serif text-3xl text-duskk-900 font-normal">Privacy Policy</h1>

          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-duskk-900">1. Information Collection</h3>
            <p>
              DUSKK (duskk.in) collects your full name, shipping destination address, email address, and mobile number solely for the purpose of order processing, fulfillment, and customer care. We do not sell or rent customer data to any third party.
            </p>

            <h3 className="font-serif text-lg font-semibold text-duskk-900">2. Guest Checkout & Payment Security</h3>
            <p>
              When checking out as a guest, your payment details are processed directly through 256-bit SSL encrypted PCI-DSS Level 1 compliant Razorpay servers. DUSKK never stores or has access to your credit/debit card numbers, UPI PINs, or bank passwords.
            </p>

            <h3 className="font-serif text-lg font-semibold text-duskk-900">3. Optional Account Linking</h3>
            <p>
              If you subsequently choose to register a DUSKK account, we link your historical orders associated with your verified email address to provide an integrated patron dashboard.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
