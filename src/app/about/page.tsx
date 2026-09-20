import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Sparkles, ShieldCheck, Heart, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#FAF8F5] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block">
              OUR PROMISE
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl text-duskk-900 font-light">
              About DUSKK
            </h1>
            <p className="text-sm text-duskk-600 max-w-xl mx-auto font-light leading-relaxed">
              Born at the intersection of quiet luxury, modern Indian sensibilities, and artisanal jewellery craftsmanship.
            </p>
          </div>

          {/* Hero Image */}
          <div className="aspect-16/9 rounded-lg overflow-hidden shadow-xl border border-duskk-200">
            <img
              src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80"
              alt="DUSKK Atelier"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Philosophy */}
          <div className="bg-white p-8 sm:p-12 border border-duskk-200 rounded-lg space-y-6 text-sm text-duskk-700 leading-relaxed">
            <h2 className="font-serif text-2xl sm:text-3xl text-duskk-900 font-normal">
              Democratizing Demi-Fine Luxury
            </h2>
            <p>
              At DUSKK (duskk.in), we believe modern accessories should be neither fleeting fast-fashion trinkets that tarnish after two wears nor exorbitantly priced heirlooms locked away for special occasions.
            </p>
            <p>
              We craft demi-fine jewelry designed to be lived in. Each creation combines anti-tarnish stainless steel and 925 sterling silver with premium gold layering, natural baroque pearls, and grade 5A cubic zirconia.
            </p>
            <p>
              Whether you are dressing for a keynote presentation, a twilight dinner, or an intimate weekend brunch, DUSKK is engineered to accentuate your distinct personality with effortless poise.
            </p>
          </div>

          {/* 4 Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="bg-white p-6 border border-duskk-200 rounded space-y-2">
              <Sparkles className="w-6 h-6 text-duskk-gold mx-auto" />
              <h3 className="font-serif text-base font-bold text-duskk-900">Anti-Tarnish 365+</h3>
              <p className="text-xs text-duskk-500">PVD vacuum layered gold finishes that resist daily wear.</p>
            </div>
            <div className="bg-white p-6 border border-duskk-200 rounded space-y-2">
              <ShieldCheck className="w-6 h-6 text-duskk-gold mx-auto" />
              <h3 className="font-serif text-base font-bold text-duskk-900">100% Skin Safe</h3>
              <p className="text-xs text-duskk-500">Nickel-free, cadmium-free, and safe on sensitive skin.</p>
            </div>
            <div className="bg-white p-6 border border-duskk-200 rounded space-y-2">
              <Heart className="w-6 h-6 text-duskk-gold mx-auto" />
              <h3 className="font-serif text-base font-bold text-duskk-900">Zero-Friction Buying</h3>
              <p className="text-xs text-duskk-500">Fast guest checkout without forced passwords or mobile OTP fatigue.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
