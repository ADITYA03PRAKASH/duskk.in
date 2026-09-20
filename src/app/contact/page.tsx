"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Product Inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setName("");
        setEmail("");
        setPhone("");
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

      <main className="flex-1 bg-[#FAF8F5] py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
              CONCIERGE & CARE
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal">
              Contact DUSKK
            </h1>
            <p className="text-xs sm:text-sm text-duskk-500 mt-2">
              Have a question regarding styling, order status, or bespoke inquiries? Our concierge team is here to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Contact Info (5 cols) */}
            <div className="lg:col-span-5 bg-duskk-900 text-white p-8 rounded-lg space-y-6 shadow-md">
              <h3 className="font-serif text-xl font-medium text-white pb-3 border-b border-white/10">
                Atelier Headquarters
              </h3>

              <div className="space-y-4 text-xs text-duskk-300">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-duskk-gold flex-shrink-0 mt-0.5" />
                  <span>
                    DUSKK<br />
                    Plot no. 152-153 Sidhatri Enclave, Bhagwati Garden, Uttam Nagar, New Delhi - 110059, India
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-duskk-gold flex-shrink-0" />
                  <span>support@duskk.in &bull; Duskk.india@gmail.com</span>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-4 h-4 text-duskk-gold flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <a href="tel:+917503462516" className="hover:text-duskk-gold transition text-white font-mono">
                        +91 75034 62516
                      </a>
                      <span className="text-duskk-400">&bull;</span>
                      <a href="tel:+919142601081" className="hover:text-duskk-gold transition text-white font-mono">
                        +91 91426 01081
                      </a>
                    </div>
                    <span className="text-[11px] text-duskk-400">(Mon - Sat, 10 AM - 7 PM IST)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <span className="text-[11px] text-duskk-400 block font-mono uppercase tracking-wider">
                  Guest Order Assistance
                </span>
                <p className="text-xs text-duskk-300 mt-1">
                  Track orders without logging in anytime using your order number at{" "}
                  <a href="/order/track" className="text-duskk-gold underline">
                    duskk.in/order/track
                  </a>.
                </p>
              </div>
            </div>

            {/* Contact Form (7 cols) */}
            <div className="lg:col-span-7 bg-white p-8 border border-duskk-200 rounded-lg shadow-sm">
              {success ? (
                <div className="text-center py-10 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="font-serif text-2xl text-duskk-900">Message Received</h3>
                  <p className="text-xs text-duskk-600 max-w-sm mx-auto">
                    Thank you for contacting us. A DUSKK styling specialist will get back to your email within 24 hours.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-2 px-6 py-2 bg-duskk-900 text-white text-xs uppercase font-medium rounded"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Rohan Varma"
                        className="w-full px-3 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
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
                        placeholder="rohan@example.com"
                        className="w-full px-3 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                        Inquiry Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold bg-white"
                      >
                        <option value="Product Inquiry">Product Inquiry</option>
                        <option value="Order & Delivery">Order & Delivery</option>
                        <option value="Return / Exchange">Return / Exchange</option>
                        <option value="Bespoke / Gifting">Bespoke / Gifting</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
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
                      placeholder="How can we assist you today?"
                      className="w-full px-3 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
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
                        <span>Send Message</span>
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
