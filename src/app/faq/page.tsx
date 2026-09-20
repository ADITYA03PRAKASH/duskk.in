import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { HelpCircle } from "lucide-react";

export default function FAQPage() {
  const faqs = [
    {
      q: "Can I place an order without creating an account or logging in?",
      a: "Yes, absolutely! At DUSKK, guest checkout is fully supported. You can browse, add pieces to your bag, enter your shipping address, and pay via Razorpay in under 60 seconds without creating a password or undergoing mobile OTP verification.",
    },
    {
      q: "How can I track my guest order without an account?",
      a: "You can track any order anytime at duskk.in/order/track simply by providing your Order Number (e.g. DUSK-2026-10245) and the Email Address you entered during checkout.",
    },
    {
      q: "What materials do you use in DUSKK jewellery?",
      a: "We use high-grade Demi-Fine Gold layered over hypoallergenic 925 Sterling Silver and medical-grade 316L Stainless Steel. Our stones are authentic freshwater cultured pearls and grade 5A cubic zirconia crystals.",
    },
    {
      q: "What is your shipping timeline and policy?",
      a: "We offer complimentary express shipping across India on all orders above ₹999. Orders are packed in signature tamper-proof velvet unboxings and dispatched within 24 hours. Delivery takes 2-4 business days across major cities.",
    },
    {
      q: "What is your return and exchange policy?",
      a: "We offer a 7-day hassle-free return and exchange policy for unworn items in original packaging. Return pickups are arranged at your doorstep with full refund credit.",
    },
    {
      q: "Can I link my previous guest orders to an account later?",
      a: "Yes! If you choose to create an account at a later date using the same email address, all your historical guest orders will be unified under your profile.",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#FAF8F5] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block">
              HELP & CONCIERGE
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-duskk-500">
              Everything you need to know about purchasing, shipping, and caring for DUSKK jewellery.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 border border-duskk-200 rounded-lg shadow-sm divide-y divide-duskk-100">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-5 first:pt-0 last:pb-0 space-y-2">
                <h3 className="font-serif text-base sm:text-lg font-semibold text-duskk-900">
                  {faq.q}
                </h3>
                <p className="text-xs sm:text-sm text-duskk-600 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center bg-duskk-cream border border-duskk-200 p-6 rounded text-xs text-duskk-700">
            <span>Still have questions? Our concierge is here to help &bull; </span>
            <Link href="/contact" className="font-semibold text-duskk-900 underline ml-1">
              Contact Concierge
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
