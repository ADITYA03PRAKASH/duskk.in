"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { 
  HelpCircle, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  RefreshCw, 
  Gift, 
  Headphones, 
  ChevronDown,
  Search,
  Sparkles
} from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>("general-0");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories: FAQCategory[] = [
    {
      id: "general",
      title: "General & Brand",
      icon: <Sparkles className="w-4 h-4" />,
      items: [
        {
          q: "What is DUSKK?",
          a: "DUSKK is a modern Indian online shopping and gifting brand. We believe the best gifts are the ones that carry meaning. We curate thoughtful, high-quality gift items and lifestyle products designed to make personal celebrations, festivals, milestones, and everyday surprises effortless and memorable.",
        },
        {
          q: "Where is DUSKK based?",
          a: "DUSKK is based in New Delhi, India, with operations and registered address at Plot No. 152-153, Sidhatri Enclave, Bhagwati Garden, Uttam Nagar, New Delhi – 110059, India. All orders are dispatched from our partner fulfillment facilities across India.",
        },
        {
          q: "Are all products original and quality-tested?",
          a: "Yes. Every single item showcased on DUSKK is carefully sourced, individually inspected for quality, and packaged with premium care before dispatch.",
        },
      ],
    },
    {
      id: "orders",
      title: "Orders & Guest Checkout",
      icon: <ShoppingBag className="w-4 h-4" />,
      items: [
        {
          q: "Can I place an order as a guest without creating an account?",
          a: "Yes, absolutely! At DUSKK, guest checkout is fully enabled. You do not need to create an account, register a password, or download an app. You can simply add products to your bag, enter your delivery address, and complete your payment seamlessly.",
        },
        {
          q: "How do I track my order if I checked out as a guest?",
          a: "You can track your order at any time on our website at duskk.in/order/track. All you need is your Order Number (e.g. DUSK-2026-XXXX) and the Email Address you entered during checkout.",
        },
        {
          q: "Can I modify my delivery address after placing an order?",
          a: "If your order has not yet been handed over to the courier partner, our support team can update your delivery details. Please reach out immediately to duskk.india@gmail.com or call +91 75034 62516 with your Order Number.",
        },
        {
          q: "Will I receive order confirmation and invoices?",
          a: "Yes! Immediately after successful payment, an order confirmation with your detailed GST tax invoice and itemized breakdown is sent to your registered email and mobile number.",
        },
      ],
    },
    {
      id: "payments",
      title: "Payments & Security",
      icon: <CreditCard className="w-4 h-4" />,
      items: [
        {
          q: "What payment methods do you accept?",
          a: "We accept all major secure Indian payment methods via our verified payment gateway (Razorpay), including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit Cards (Visa, MasterCard, RuPay, Amex), Debit Cards, and Net Banking across all major Indian banks.",
        },
        {
          q: "Is my online payment safe and secure?",
          a: "100% safe. All transactions are encrypted with 256-bit SSL encryption and processed directly through RBI-compliant, PCI-DSS Level 1 certified payment gateways. DUSKK never stores your credit/debit card numbers, CVVs, or banking passwords.",
        },
        {
          q: "Are the prices inclusive of GST?",
          a: "Yes. All product prices listed on DUSKK are inclusive of all applicable Indian taxes (GST). There are no hidden fees or surprise taxes added at checkout.",
        },
      ],
    },
    {
      id: "shipping",
      title: "Shipping & Delivery",
      icon: <Truck className="w-4 h-4" />,
      items: [
        {
          q: "Where do you deliver?",
          a: "We deliver across India to over 26,000+ pin codes spanning all states and Union Territories through top national logistics partners.",
        },
        {
          q: "How long does shipping take?",
          a: "Orders are dispatched within 1–2 business days. Delivery typically takes 2–4 business days for metro cities and 3–7 business days for the rest of India.",
        },
        {
          q: "What are the shipping charges?",
          a: "We offer complimentary Free Shipping across India on all eligible orders above ₹999. For orders below this threshold, a flat nominal delivery fee of ₹99 is applied.",
        },
      ],
    },
    {
      id: "returns",
      title: "Returns & Replacements",
      icon: <RefreshCw className="w-4 h-4" />,
      items: [
        {
          q: "What is DUSKK's return policy?",
          a: "We offer a 7-day return policy from the date of confirmed delivery for unused, unopened products in their original packaging.",
        },
        {
          q: "What should I do if I receive a damaged, broken, or incorrect product?",
          a: "If your parcel arrives damaged or with missing/incorrect items, please email us within 48 hours at duskk.india@gmail.com with your Order Number and photos/videos of the package and item. We will arrange an immediate replacement or full refund at no cost to you.",
        },
        {
          q: "How and when will I receive my refund?",
          a: "Once your returned item is received and inspected at our fulfillment center, refunds are processed back to your original payment method via Razorpay within 5–7 business days.",
        },
      ],
    },
    {
      id: "gifting",
      title: "Gifting & Packaging",
      icon: <Gift className="w-4 h-4" />,
      items: [
        {
          q: "Can I send an order directly as a gift to someone else?",
          a: "Yes! You can enter the recipient's shipping address at checkout and provide your own billing details. DUSKK products are presented in gift-ready aesthetic packaging.",
        },
        {
          q: "Do you offer corporate or bulk gifting?",
          a: "Yes, we collaborate with companies and event planners for corporate gifting, employee appreciation kits, and festive bulk hampers. Please contact us at duskk.india@gmail.com with your requirements.",
        },
      ],
    },
    {
      id: "support",
      title: "Customer Support",
      icon: <Headphones className="w-4 h-4" />,
      items: [
        {
          q: "How can I contact the DUSKK customer team?",
          a: "You can contact DUSKK at: +91 75034 62516 or duskk.india@gmail.com. Our customer support helpline is available Monday through Saturday, 10:00 AM – 7:00 PM IST.",
        },
      ],
    },
  ];

  const filteredCategories = categories.map((cat) => {
    if (activeCategory !== "all" && cat.id !== activeCategory) {
      return { ...cat, items: [] };
    }
    if (!searchQuery.trim()) {
      return cat;
    }
    const query = searchQuery.toLowerCase();
    const filteredItems = cat.items.filter(
      (item) => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
    );
    return { ...cat, items: filteredItems };
  }).filter((cat) => cat.items.length > 0);

  const toggleAccordion = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#FAF8F5] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block">
              HELP & ASSISTANCE
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-duskk-600 leading-relaxed">
              Find quick answers about shopping, guest orders, deliveries, payments, and gifting with DUSKK.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="w-4 h-4 text-duskk-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for answers (e.g., tracking, returns, guest checkout)..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-duskk-200 rounded-lg text-xs sm:text-sm text-duskk-900 placeholder-duskk-400 focus:outline-none focus:border-duskk-gold shadow-sm"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                activeCategory === "all"
                  ? "bg-duskk-900 text-white"
                  : "bg-white text-duskk-700 border border-duskk-200 hover:border-duskk-gold"
              }`}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center space-x-1.5 ${
                  activeCategory === cat.id
                    ? "bg-duskk-900 text-white"
                    : "bg-white text-duskk-700 border border-duskk-200 hover:border-duskk-gold"
                }`}
              >
                <span>{cat.title}</span>
              </button>
            ))}
          </div>

          {/* FAQs Container */}
          <div className="space-y-8">
            {filteredCategories.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-lg border border-duskk-200">
                <HelpCircle className="w-10 h-10 text-duskk-300 mx-auto mb-3" />
                <h3 className="font-serif text-lg text-duskk-900">No matching answers found</h3>
                <p className="text-xs text-duskk-500 mt-1">Try searching with a different keyword or browse all topics.</p>
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-lg border border-duskk-200 shadow-sm overflow-hidden">
                  <div className="bg-duskk-50/80 px-6 py-3.5 border-b border-duskk-200 flex items-center space-x-2 text-duskk-900">
                    <span className="text-duskk-gold">{cat.icon}</span>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono">
                      {cat.title}
                    </h3>
                  </div>

                  <div className="divide-y divide-duskk-100">
                    {cat.items.map((item, idx) => {
                      const itemKey = `${cat.id}-${idx}`;
                      const isOpen = openIndex === itemKey;
                      return (
                        <div key={idx} className="transition">
                          <button
                            onClick={() => toggleAccordion(itemKey)}
                            className="w-full text-left px-6 py-4 flex items-center justify-between space-x-4 hover:bg-duskk-50/50 transition"
                          >
                            <span className="font-serif text-sm sm:text-base text-duskk-900 font-medium">
                              {item.q}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-duskk-500 flex-shrink-0 transition-transform duration-200 ${
                                isOpen ? "rotate-180 text-duskk-gold" : ""
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-duskk-600 leading-relaxed bg-[#FAF8F5]/40 border-t border-duskk-50">
                              <p>{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Help Banner */}
          <div className="bg-duskk-900 text-white p-6 sm:p-8 rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 text-center sm:text-left">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white font-normal">Need further personal assistance?</h4>
              <p className="text-xs text-duskk-300">
                Our support team is available Monday to Saturday to answer any questions.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/order/track"
                className="px-4 py-2 border border-white/20 text-white rounded text-xs uppercase tracking-wider font-semibold hover:bg-white/10 transition"
              >
                Track Order
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 bg-duskk-gold text-duskk-900 rounded text-xs uppercase tracking-wider font-semibold hover:bg-duskk-goldHover transition"
              >
                Contact Concierge
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
