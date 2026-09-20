import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ShippingPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAF8F5] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 border border-duskk-200 rounded-lg shadow-sm space-y-6 text-xs sm:text-sm text-duskk-700 leading-relaxed">
          <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block">
            POLICY & DELIVERY
          </span>
          <h1 className="font-serif text-3xl text-duskk-900 font-normal">Shipping Policy</h1>

          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-duskk-900">1. Free Shipping Threshold</h3>
            <p>
              DUSKK offers complimentary insured express shipping across India on all orders of ₹999 and above. For orders below ₹999, a flat shipping fee of ₹99 applies.
            </p>

            <h3 className="font-serif text-lg font-semibold text-duskk-900">2. Processing and Dispatch</h3>
            <p>
              All orders placed before 3:00 PM IST on business days (Monday to Friday) are inspected by our quality assurance jewelers and dispatched within 24 hours.
            </p>

            <h3 className="font-serif text-lg font-semibold text-duskk-900">3. Delivery Timelines</h3>
            <p>
              &bull; <strong>Metro Cities (Mumbai, Delhi NCR, Bengaluru, Chennai, Hyderabad, Kolkata):</strong> 2 to 3 business days.<br />
              &bull; <strong>Rest of India (Tier 2 & 3 Cities, 26,000+ pincodes):</strong> 3 to 5 business days.
            </p>

            <h3 className="font-serif text-lg font-semibold text-duskk-900">4. Tamper-Proof Luxury Unboxing</h3>
            <p>
              Every DUSKK jewel is dispatched in an insured, tamper-evident outer courier parcel containing our signature velvet jewelry keepsake box and certificate of authenticity.
            </p>

            <h3 className="font-serif text-lg font-semibold text-duskk-900">5. Guest Order Tracking</h3>
            <p>
              Customers who checkout as a guest can track their shipment in real-time at <a href="/order/track" className="text-duskk-gold underline">duskk.in/order/track</a> with their Order Number and Email Address.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
