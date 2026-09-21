"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Loader2, Compass, Clock, Gift } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [subject, setSubject] = useState("Product & Gifting Inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Prepare compiled message with order number if present
    const compiledMessage = orderNumber.trim()
      ? `[Order Reference: ${orderNumber.trim()}]\n\n${message}`
      : message;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject,
          message: compiledMessage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setName("");
        setEmail("");
        setPhone("");
        setOrderNumber("");
        setMessage("");
      } else {
        setError(data.message || "Failed to submit message.");
      }
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#FAF8F5] py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
              WE&apos;RE HERE TO HELP
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal">
              Contact DUSKK
            </h1>
            <p className="text-xs sm:text-sm text-duskk-600 mt-2 leading-relaxed">
              For questions about products, orders, shipping, returns, replacements, or anything else, reach out to the DUSKK team.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Contact Information Column (5 cols) */}
            <div className="lg:col-span-5 bg-duskk-900 text-white p-8 rounded-lg space-y-6 shadow-md">
              <div className="border-b border-white/10 pb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-duskk-gold font-mono block">
                  DUSKK CUSTOMER CARE
                </span>
                <h3 className="font-serif text-xl font-medium text-white mt-1">
                  Get in Touch
                </h3>
              </div>

              <div className="space-y-5 text-xs text-duskk-300">
                <div className="flex items-start space-x-3.5">
                  <Mail className="w-4 h-4 text-duskk-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium block">Email:</span>
                    <a
                      href="mailto:duskk.india@gmail.com"
                      className="text-duskk-200 hover:text-duskk-gold transition underline"
                    >
                      duskk.india@gmail.com
                    </a>
                    <p className="text-[11px] text-duskk-400 mt-0.5">Response within 24 business hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <Phone className="w-4 h-4 text-duskk-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium block">Helpline:</span>
                    <a
                      href="tel:+917503462516"
                      className="text-white font-mono hover:text-duskk-gold transition"
                    >
                      +91 75034 62516
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <MapPin className="w-4 h-4 text-duskk-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium block">Business Address:</span>
                    <span className="leading-relaxed">
                      DUSKK<br />
                      Plot No. 152-153,<br />
                      Sidhatri Enclave, Bhagwati Garden,<br />
                      Uttam Nagar, New Delhi – 110059,<br />
                      India
                    </span>
                  </div>
                </div>
              </div>

              {/* Guest Self-Service Tracker */}
              <div className="pt-5 border-t border-white/10 space-y-2 bg-white/5 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-duskk-champagne">
                  <Compass className="w-4 h-4 text-duskk-gold" />
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                    Instant Order Tracking
                  </span>
                </div>
                <p className="text-xs text-duskk-300 leading-relaxed">
                  Checked out as a guest? Track live dispatch and delivery updates in real-time without logging in.
                </p>
                <Link
                  href="/order/track"
                  className="inline-block mt-1 text-xs font-semibold text-duskk-gold hover:underline"
                >
                  Track Your Order Online &rarr;
                </Link>
              </div>

              {/* Corporate / Bulk Gifting */}
              <div className="pt-2">
                <div className="flex items-center space-x-2 text-xs text-duskk-300">
                  <Gift className="w-4 h-4 text-duskk-gold" />
                  <span>Looking for Bulk or Corporate Gifting? Select &ldquo;Corporate / Bulk Gifting&rdquo; in the form.</span>
                </div>
              </div>
            </div>

            {/* Contact Form Column (7 cols) */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 border border-duskk-200 rounded-lg shadow-sm">
              {success ? (
                <div className="text-center py-12 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="font-serif text-2xl text-duskk-900">Message Received</h3>
                  <p className="text-xs sm:text-sm text-duskk-600 max-w-md mx-auto leading-relaxed">
                    Thank you for contacting DUSKK. Your inquiry has been received, and our support team will get back to you at your provided email address shortly.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-4 px-6 py-2.5 bg-duskk-900 text-white text-xs uppercase font-medium rounded hover:bg-duskk-gold hover:text-duskk-900 transition"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="border-b border-duskk-100 pb-3 mb-4">
                    <h3 className="font-serif text-xl text-duskk-900 font-normal">
                      Send Us a Message
                    </h3>
                    <p className="text-xs text-duskk-500 mt-1">
                      Fill out the form below and we will respond within 24 hours.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Aditya Sharma"
                        className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="aditya@example.com"
                        className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                        Order Number (If Applicable)
                      </label>
                      <input
                        type="text"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="DUSK-2026-XXXX"
                        className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                      Inquiry Category *
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold bg-white"
                    >
                      <option value="Product & Gifting Inquiry">Product & Gifting Inquiry</option>
                      <option value="Order Tracking & Delivery">Order Tracking & Delivery</option>
                      <option value="Return, Exchange & Refund">Return, Exchange & Refund</option>
                      <option value="Damaged or Defective Item Received">Damaged or Defective Item Received</option>
                      <option value="Corporate / Bulk Gifting">Corporate / Bulk Gifting</option>
                      <option value="General Query / Other">General Query / Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe how we can help you..."
                      className="w-full px-3 py-2.5 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs uppercase tracking-widest font-semibold rounded transition flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
