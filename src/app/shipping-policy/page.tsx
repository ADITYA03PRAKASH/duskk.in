import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Truck, Clock, PackageCheck, ShieldAlert, MapPin, Compass } from "lucide-react";

export const metadata = {
  title: "Shipping & Delivery Policy | DUSKK",
  description: "Learn about DUSKK's shipping rates, delivery timelines, order tracking, and packaging standards across India.",
};

export default function ShippingPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAF8F5] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
              DISPATCH & DELIVERY
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal">
              Shipping & Delivery Policy
            </h1>
            <p className="text-xs sm:text-sm text-duskk-600 mt-3 leading-relaxed">
              At DUSKK, we are committed to delivering your gifts and curated products safely, swiftly, and beautifully packaged anywhere in India.
            </p>
          </div>

          {/* Quick Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-white p-5 rounded-lg border border-duskk-200 shadow-sm flex items-start space-x-3">
              <Clock className="w-5 h-5 text-duskk-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-duskk-900">Fast Processing</h4>
                <p className="text-xs text-duskk-600 mt-1">Orders dispatched within [PROCESSING TIME] (1–2 business days).</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-duskk-200 shadow-sm flex items-start space-x-3">
              <Truck className="w-5 h-5 text-duskk-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-duskk-900">Pan-India Delivery</h4>
                <p className="text-xs text-duskk-600 mt-1">Delivered across India in [DELIVERY TIME] (3–7 business days).</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-duskk-200 shadow-sm flex items-start space-x-3">
              <PackageCheck className="w-5 h-5 text-duskk-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-duskk-900">Free Shipping</h4>
                <p className="text-xs text-duskk-600 mt-1">Free delivery on eligible orders above [FREE SHIPPING THRESHOLD].</p>
              </div>
            </div>
          </div>

          {/* Detailed Content Box */}
          <div className="bg-white p-8 sm:p-12 border border-duskk-200 rounded-lg shadow-sm space-y-8 text-xs sm:text-sm text-duskk-700 leading-relaxed">
            
            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                1. Shipping Coverage & Destinations
              </h2>
              <p>
                DUSKK currently delivers to pin codes across all states and Union Territories in India. We partner with reputable national courier and logistics aggregators to ensure dependable and timely delivery of your gift orders.
              </p>
              <p>
                At this time, we only fulfill orders within India. International shipping is not supported.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                2. Order Processing & Dispatch Timelines
              </h2>
              <p>
                &bull; <strong>Standard Processing:</strong> All confirmed orders are carefully quality-checked, gift-wrapped, and dispatched within [PROCESSING TIME] (typically 24 to 48 business hours, Monday through Saturday).
              </p>
              <p>
                &bull; <strong>Orders on Weekends & Public Holidays:</strong> Orders placed on Sundays or gazetted public holidays will be queued for processing on the immediate next working business day.
              </p>
              <p>
                &bull; <strong>Personalized / Made-to-Order Items:</strong> If an order contains customized or personalized gift items, additional processing time may be required as stated on the product page.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                3. Estimated Delivery Timelines
              </h2>
              <p>
                Estimated delivery timelines begin from the date of courier dispatch:
              </p>
              <div className="bg-duskk-50 border border-duskk-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-duskk-200">
                  <span className="font-semibold text-duskk-900">Metro Cities (Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata)</span>
                  <span className="text-duskk-800 font-mono">2 – 4 Business Days</span>
                </div>
                <div className="flex justify-between py-1 border-b border-duskk-200">
                  <span className="font-semibold text-duskk-900">Tier 2 & Tier 3 Cities (Major urban centers across India)</span>
                  <span className="text-duskk-800 font-mono">3 – 5 Business Days</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-duskk-900">Remote & Northeast / Regional Pincodes</span>
                  <span className="text-duskk-800 font-mono">5 – 7 Business Days</span>
                </div>
              </div>
              <p className="text-duskk-500 italic text-[11px]">
                * Note: Delivery times are estimates provided by courier partners and may occasionally vary during peak festive seasons, severe weather, or unforeseen regional logistics disruptions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                4. Shipping Charges & Free Shipping Threshold
              </h2>
              <p>
                &bull; <strong>Free Delivery:</strong> Orders exceeding [FREE SHIPPING THRESHOLD] (e.g. ₹999) qualify for complimentary standard shipping across India.
              </p>
              <p>
                &bull; <strong>Standard Shipping Fee:</strong> For orders below the free shipping threshold, a nominal flat shipping fee of [SHIPPING FEE] (e.g. ₹99) is added at checkout.
              </p>
              <p>
                &bull; All applicable shipping fees are explicitly displayed on the checkout summary page before you finalize your payment.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                5. Guest Checkout & Real-Time Tracking
              </h2>
              <p>
                At DUSKK, you do not need to create an account or password to shop. Once your order has been dispatched, you will receive an SMS and email notification containing your courier tracking number (AWB) and a direct tracking link.
              </p>
              <div className="bg-duskk-100/60 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-duskk-900 block">Want to track your shipment right now?</span>
                  <span className="text-xs text-duskk-600">Enter your Order ID and Email Address to get live updates.</span>
                </div>
                <Link
                  href="/order/track"
                  className="px-4 py-2 bg-duskk-900 text-white rounded text-xs font-semibold hover:bg-duskk-gold hover:text-duskk-900 transition flex items-center space-x-1 flex-shrink-0 ml-3"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Track Order</span>
                </Link>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                6. Packaging, Unboxing & Safe Transit
              </h2>
              <p>
                Every DUSKK gift order is packaged with utmost care in secure, tamper-evident outer packaging to prevent damage during transit. Inside, products are cushioned with protective materials and presented in our signature gift-ready packaging.
              </p>
              <p className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded text-xs">
                <strong>Important:</strong> If the outer courier parcel appears noticeably opened, cut, or damaged at the time of delivery, please do NOT accept the parcel. Take a photo of the package and immediately report the issue to our support team.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                7. Address Accuracy & Failed Deliveries
              </h2>
              <p>
                Please ensure that your complete shipping address (including House/Flat number, Street, Landmark, City, State, Pin Code, and working 10-digit mobile number) is accurately entered at checkout.
              </p>
              <p>
                Courier delivery agents will make up to three (3) delivery attempts. If a shipment is returned to origin (RTO) due to an incorrect address, non-reachable phone number, or customer unavailability, re-shipping charges may apply.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                8. Support & Shipping Assistance
              </h2>
              <p>
                For any questions regarding your shipment, delivery status, or address modifications prior to dispatch, please reach out to our team:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-duskk-800">
                <li><strong>Brand:</strong> DUSKK</li>
                <li><strong>Email:</strong> <a href="mailto:duskk.india@gmail.com" className="underline font-mono text-duskk-900">duskk.india@gmail.com</a></li>
                <li><strong>Helpline:</strong> <a href="tel:+917503462516" className="underline font-mono text-duskk-900">+91 75034 62516</a></li>
                <li><strong>Self-Service Tracking:</strong> <Link href="/order/track" className="text-duskk-gold underline font-medium">duskk.in/order/track</Link></li>
              </ul>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
