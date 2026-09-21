"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Truck, RefreshCw, Sparkles, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMsg(data.message || "Thank you for subscribing to DUSKK.");
        setEmail("");
      } else {
        setStatus("error");
        setMsg(data.message || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMsg("Connection error.");
    }
  };

  return (
    <footer className="bg-duskk-900 text-duskk-200 pt-16 pb-12 border-t border-duskk-800">
      {/* Brand Trust Badges Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 border-b border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="w-10 h-10 rounded-full bg-duskk-800 flex items-center justify-center text-duskk-gold flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-white text-base tracking-wide">Curated Gifting</h4>
              <p className="text-xs text-duskk-400 mt-0.5">Thoughtfully selected meaningful gifts.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="w-10 h-10 rounded-full bg-duskk-800 flex items-center justify-center text-duskk-gold flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-white text-base tracking-wide">Premium Quality</h4>
              <p className="text-xs text-duskk-400 mt-0.5">Inspected & gift-ready packaging.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="w-10 h-10 rounded-full bg-duskk-800 flex items-center justify-center text-duskk-gold flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-white text-base tracking-wide">Express Delivery</h4>
              <p className="text-xs text-duskk-400 mt-0.5">Free delivery across India on orders &gt; ₹999.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="w-10 h-10 rounded-full bg-duskk-800 flex items-center justify-center text-duskk-gold flex-shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-white text-base tracking-wide">7-Day Easy Returns</h4>
              <p className="text-xs text-duskk-400 mt-0.5">Hassle-free reverse pickup & refunds.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl tracking-[0.35em] uppercase text-white font-light">
                DUSKK
              </span>
              <span className="block text-[10px] tracking-[0.4em] uppercase text-duskk-gold font-sans -mt-1">
                CURATED GIFTS &bull; DUSKK.IN
              </span>
            </Link>
            <p className="text-xs text-duskk-300 leading-relaxed max-w-sm">
              Thoughtful Gifts. Meaningful Moments. DUSKK brings together curated lifestyle gifts and products to make every occasion, celebration, and surprise unforgettable.
            </p>
            <div className="pt-2">
              <span className="text-xs text-duskk-400 block mb-2">Join the Inner Circle for private vaults & 10% off:</span>
              {status === "success" ? (
                <div className="flex items-center space-x-2 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{msg}</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex max-w-sm">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-duskk-800 border border-duskk-700 text-xs text-white placeholder-duskk-500 rounded-l focus:outline-none focus:border-duskk-gold"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="px-4 py-2 bg-duskk-gold hover:bg-duskk-goldHover text-duskk-900 font-medium text-xs rounded-r transition flex items-center justify-center"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Collections */}
          <div>
            <h5 className="text-xs uppercase tracking-widest font-semibold text-white mb-4">
              Collections
            </h5>
            <ul className="space-y-2.5 text-xs text-duskk-400">
              <li>
                <Link href="/category/earrings" className="hover:text-duskk-gold transition">
                  Earrings & Studs
                </Link>
              </li>
              <li>
                <Link href="/category/necklaces" className="hover:text-duskk-gold transition">
                  Necklaces & Chants
                </Link>
              </li>
              <li>
                <Link href="/category/pendants" className="hover:text-duskk-gold transition">
                  Pendants & Medallions
                </Link>
              </li>
              <li>
                <Link href="/category/rings" className="hover:text-duskk-gold transition">
                  Rings & Solitaires
                </Link>
              </li>
              <li>
                <Link href="/category/bracelets" className="hover:text-duskk-gold transition">
                  Bracelets & Cuffs
                </Link>
              </li>
              <li>
                <Link href="/category/accessories" className="hover:text-duskk-gold transition">
                  Jewelry Cases & Organizers
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h5 className="text-xs uppercase tracking-widest font-semibold text-white mb-4">
              Customer Care
            </h5>
            <ul className="space-y-2.5 text-xs text-duskk-400">
              <li>
                <Link href="/order/track" className="text-duskk-gold font-medium hover:underline flex items-center">
                  Track Your Order &rarr;
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-duskk-gold transition">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-duskk-gold transition">
                  Contact Concierge
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-duskk-gold transition">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-duskk-gold transition">
                  Returns & Replacements
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h5 className="text-xs uppercase tracking-widest font-semibold text-white mb-4">
              Company & Contact
            </h5>
            <ul className="space-y-2.5 text-xs text-duskk-400">
              <li>
                <Link href="/about" className="hover:text-duskk-gold transition">
                  About DUSKK
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-duskk-gold transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-duskk-gold transition">
                  Terms of Service
                </Link>
              </li>
              <li className="pt-2 text-[11px] text-duskk-400 leading-relaxed">
                <span className="text-white block font-medium">Business Address:</span>
                Plot No. 152-153,<br />
                Sidhatri Enclave, Bhagwati Garden,<br />
                Uttam Nagar, New Delhi – 110059, India
              </li>
              <li className="text-[11px] text-duskk-400">
                <span className="text-white block font-medium">Helpline:</span>
                <a href="tel:+917503462516" className="hover:text-duskk-gold transition text-white font-mono">
                  +91 75034 62516
                </a>
              </li>
              <li className="text-[11px] text-duskk-400">
                <span className="text-white block font-medium">Email:</span>
                <a href="mailto:duskk.india@gmail.com" className="hover:text-duskk-gold transition text-duskk-300">
                  duskk.india@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-duskk-500">
        <p>&copy; {new Date().getFullYear()} DUSKK. All rights reserved.</p>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <span>Secured with 256-bit SSL &bull; Razorpay Verified Merchant</span>
        </div>
      </div>
    </footer>
  );
}
