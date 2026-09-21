import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { RefreshCw, CheckCircle, AlertTriangle, HelpCircle, ShieldCheck, Mail } from "lucide-react";

export const metadata = {
  title: "Returns & Replacements Policy | DUSKK",
  description: "Understand DUSKK's return, exchange, and refund policies for curated gifts and products.",
};

export default function ReturnPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAF8F5] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
              PEACE OF MIND ASSURANCE
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal">
              Returns & Replacements Policy
            </h1>
            <p className="text-xs sm:text-sm text-duskk-600 mt-3 leading-relaxed">
              We want every DUSKK gifting experience to bring delight and satisfaction. If you encounter any issue with your purchase, we are here to make things right.
            </p>
          </div>

          {/* Key Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-white p-5 rounded-lg border border-duskk-200 shadow-sm flex items-start space-x-3">
              <RefreshCw className="w-5 h-5 text-duskk-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-duskk-900">Return Window</h4>
                <p className="text-xs text-duskk-600 mt-1">[RETURN WINDOW] (7 days) from the date of confirmed delivery.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-duskk-200 shadow-sm flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-duskk-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-duskk-900">Doorstep Pickup</h4>
                <p className="text-xs text-duskk-600 mt-1">Convenient reverse pickup scheduled from your delivery address.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-duskk-200 shadow-sm flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-duskk-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-duskk-900">Prompt Refunds</h4>
                <p className="text-xs text-duskk-600 mt-1">Refunded to original payment method in [REFUND PROCESSING TIME] (5–7 days).</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white p-8 sm:p-12 border border-duskk-200 rounded-lg shadow-sm space-y-8 text-xs sm:text-sm text-duskk-700 leading-relaxed">
            
            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                1. Return & Replacement Eligibility
              </h2>
              <p>
                You may request a return or replacement for eligible products within <strong>[RETURN WINDOW]</strong> (e.g., 7 calendar days) of receiving your order.
              </p>
              <p>
                To qualify for a valid return or exchange:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-duskk-800">
                <li>The item must be unused, unwashed, and in the same pristine condition in which you received it.</li>
                <li>The product must be kept in its original brand packaging, including boxes, pouches, certificates, tags, instruction manuals, and complimentary accessories.</li>
                <li>The invoice or proof of purchase (Order ID and registered email) must be provided.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                2. Damaged, Defective, or Incorrect Products
              </h2>
              <p>
                We maintain rigorous quality checks prior to dispatching each gift. However, in the rare event that your product arrives damaged in transit, defective, or different from what was ordered:
              </p>
              <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-lg space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Report within 48 Hours:</span>
                </div>
                <p>
                  Please notify our support team within <strong>48 hours of delivery</strong> by emailing <a href="mailto:duskk.india@gmail.com" className="font-mono font-semibold underline">duskk.india@gmail.com</a> or contacting us via our <Link href="/contact" className="underline font-semibold">Contact Page</Link>.
                </p>
                <p>
                  Please attach clear photographs or a short video clip showing the outer shipping box, the shipping label, and the specific defect or damage on the item, along with your <strong>Order Number</strong>.
                </p>
              </div>
              <p>
                Once verified, we will immediately arrange a priority replacement or initiate a 100% refund at no extra cost to you.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                3. Non-Returnable & Non-Exchangeable Items
              </h2>
              <p>
                To ensure hygiene, safety, and brand integrity, the following categories of products cannot be returned or exchanged (unless delivered damaged or defective):
              </p>
              <ul className="list-disc pl-5 space-y-1 text-duskk-800">
                <li><strong>Customized & Personalized Gifts:</strong> Any items custom-engraved, monogrammed, or made-to-order specifically for you.</li>
                <li><strong>Perishable & Edible Goods:</strong> Gourmet chocolates, confectioneries, baked treats, or fresh floral arrangements.</li>
                <li><strong>Personal Care & Hygiene Items:</strong> Skincare, fragrances, bath items, or pierced accessories once the tamper seal has been broken.</li>
                <li><strong>Gift Cards & Promotional Vouchers:</strong> Digital or physical gift cards cannot be redeemed for cash or returned.</li>
                <li><strong>Clearance / Final Sale Items:</strong> Items explicitly marked as non-returnable on their product description page.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                4. Step-by-Step Return Process
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-duskk-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <div>
                    <h4 className="font-semibold text-duskk-900">Initiate Your Request</h4>
                    <p className="text-xs text-duskk-600 mt-0.5">
                      Email <a href="mailto:duskk.india@gmail.com" className="font-mono text-duskk-900 underline">duskk.india@gmail.com</a> with your <strong>Order Number</strong>, reason for return, and photos/videos (if damaged).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-duskk-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <div>
                    <h4 className="font-semibold text-duskk-900">Pickup Scheduling</h4>
                    <p className="text-xs text-duskk-600 mt-0.5">
                      Upon review and approval, our logistics partner will schedule a doorstep reverse pickup from your address within 24 to 48 hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-duskk-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <div>
                    <h4 className="font-semibold text-duskk-900">Quality Inspection & Resolution</h4>
                    <p className="text-xs text-duskk-600 mt-0.5">
                      Once the item reaches our fulfillment facility and passes physical inspection, we will immediately process your replacement or refund.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                5. Refund Timeline & Payment Modes
              </h2>
              <p>
                &bull; <strong>Online Prepaid Orders (UPI, Cards, Net Banking):</strong> Refunds are processed directly back to the original source payment method through our secure payment gateway partner (Razorpay). The credited amount typically reflects in your bank account or card within <strong>[REFUND PROCESSING TIME]</strong> (5 to 7 working business days, subject to your bank&apos;s processing cycle).
              </p>
              <p>
                &bull; <strong>Cash on Delivery (COD) Orders (if applicable):</strong> If you paid via Cash on Delivery, our support team will request your verified UPI ID or Bank Account Details (Account Number & IFSC Code) via email to initiate an instant NEFT/IMPS transfer.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                6. Order Cancellations
              </h2>
              <p>
                You may request cancellation of an order before it has been dispatched from our warehouse. Once an order is handed over to the courier and assigned an AWB tracking number, it cannot be cancelled mid-transit and must be processed under the standard return policy upon delivery.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                7. Contact Customer Care
              </h2>
              <p>
                If you have any questions regarding your return, exchange, or refund status, our support team is delighted to assist you. Please include your <strong>Order Number</strong> in all correspondence:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-duskk-800">
                <li><strong>Brand:</strong> DUSKK</li>
                <li><strong>Email:</strong> <a href="mailto:duskk.india@gmail.com" className="underline font-mono text-duskk-900">duskk.india@gmail.com</a></li>
                <li><strong>Helpline:</strong> <a href="tel:+917503462516" className="underline font-mono text-duskk-900">+91 75034 62516</a></li>
                <li><strong>Support Hours:</strong> Monday – Saturday, 10:00 AM – 7:00 PM IST</li>
                <li><strong>Help Desk:</strong> <Link href="/contact" className="text-duskk-gold underline">duskk.in/contact</Link></li>
              </ul>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
