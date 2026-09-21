import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Sparkles, Heart, Gift, Smile, Award, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Thoughtful Gifts & Meaningful Moments",
  description:
    "At DUSKK, we believe the best gifts carry meaning. Learn about our story, beliefs, and mission to make thoughtful gifting simple, beautiful, and memorable.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#FAF8F5] py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-xs uppercase font-mono tracking-[0.3em] text-duskk-gold font-semibold block">
              ABOUT DUSKK
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-duskk-900 font-light tracking-tight">
              Thoughtful Gifts. Meaningful Moments.
            </h1>
            <p className="text-base sm:text-lg text-duskk-600 max-w-2xl mx-auto font-light leading-relaxed">
              At DUSKK, we believe the best gifts are the ones that carry a little meaning.
            </p>
          </div>

          {/* Hero Banner / Atelier Visual */}
          <div className="relative aspect-16/9 rounded-xl overflow-hidden shadow-2xl border border-duskk-200">
            <img
              src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85"
              alt="DUSKK Thoughtful Gifting"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-8 sm:p-12">
              <p className="text-white font-serif text-xl sm:text-2xl font-light tracking-wide italic">
                &ldquo;Gifts for a Brighter Tomorrow.&rdquo;
              </p>
            </div>
          </div>

          {/* Intro Philosophy */}
          <div className="bg-white p-8 sm:p-12 border border-duskk-200 rounded-xl space-y-6 text-sm sm:text-base text-duskk-700 leading-relaxed shadow-sm">
            <p className="text-base sm:text-lg font-serif text-duskk-900 leading-relaxed">
              We created DUSKK to make gifting simple, beautiful, and memorable. Our goal is to bring together thoughtfully selected products that help you find something special for the people who matter to you — whether it’s a birthday, anniversary, festival, celebration, milestone, or simply a way to say <span className="italic text-duskk-900 font-medium">“I’m thinking of you.”</span>
            </p>
          </div>

          {/* Our Story */}
          <div className="bg-white p-8 sm:p-12 border border-duskk-200 rounded-xl space-y-6 text-sm sm:text-base text-duskk-700 leading-relaxed shadow-sm">
            <div className="space-y-1">
              <span className="text-xs uppercase font-mono tracking-widest text-duskk-gold font-semibold block">
                THE GENESIS
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-duskk-900 font-light">
                Our Story
              </h2>
            </div>
            <p>
              Finding the right gift can sometimes be harder than giving one. There are countless choices, but finding something that truly feels right is what makes a gift special.
            </p>
            <p className="font-medium text-duskk-900">
              That’s where DUSKK comes in.
            </p>
            <p>
              We curate products with a focus on style, usefulness, thoughtfulness, and the joy of giving. From small surprises to memorable presents, we want every DUSKK order to feel like more than a purchase.
            </p>
          </div>

          {/* What We Believe - 4 Pillars */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs uppercase font-mono tracking-widest text-duskk-gold font-semibold block">
                CORE VALUES
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-duskk-900 font-light">
                What We Believe
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Belief 1 */}
              <div className="bg-white p-8 border border-duskk-200 rounded-xl space-y-3 shadow-sm hover:border-duskk-gold transition">
                <div className="w-10 h-10 rounded-full bg-duskk-50 flex items-center justify-center text-duskk-gold">
                  <Gift className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-duskk-900">
                  Gifting Should Feel Personal
                </h3>
                <p className="text-xs sm:text-sm text-duskk-600 leading-relaxed">
                  Every person and every occasion is different. Your gift should feel chosen, not random.
                </p>
              </div>

              {/* Belief 2 */}
              <div className="bg-white p-8 border border-duskk-200 rounded-xl space-y-3 shadow-sm hover:border-duskk-gold transition">
                <div className="w-10 h-10 rounded-full bg-duskk-50 flex items-center justify-center text-duskk-gold">
                  <Smile className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-duskk-900">
                  Small Gestures Matter
                </h3>
                <p className="text-xs sm:text-sm text-duskk-600 leading-relaxed">
                  Sometimes the smallest gift can create the biggest smile.
                </p>
              </div>

              {/* Belief 3 */}
              <div className="bg-white p-8 border border-duskk-200 rounded-xl space-y-3 shadow-sm hover:border-duskk-gold transition">
                <div className="w-10 h-10 rounded-full bg-duskk-50 flex items-center justify-center text-duskk-gold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-duskk-900">
                  Moments Are Worth Celebrating
                </h3>
                <p className="text-xs sm:text-sm text-duskk-600 leading-relaxed">
                  Birthdays, festivals, achievements, relationships, and everyday moments — every occasion deserves a little thought.
                </p>
              </div>

              {/* Belief 4 */}
              <div className="bg-white p-8 border border-duskk-200 rounded-xl space-y-3 shadow-sm hover:border-duskk-gold transition">
                <div className="w-10 h-10 rounded-full bg-duskk-50 flex items-center justify-center text-duskk-gold">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-duskk-900">
                  Quality Meets Simplicity
                </h3>
                <p className="text-xs sm:text-sm text-duskk-600 leading-relaxed">
                  We aim to make discovering and buying beautiful gifts easy, convenient, and enjoyable.
                </p>
              </div>
            </div>
          </div>

          {/* Our Mission */}
          <div className="bg-duskk-900 text-white p-8 sm:p-14 rounded-2xl space-y-6 text-center shadow-xl border border-duskk-800">
            <span className="text-xs uppercase font-mono tracking-[0.3em] text-duskk-gold font-semibold block">
              OUR MISSION
            </span>
            <blockquote className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-snug">
              &ldquo;To make thoughtful gifting easier and help people create moments worth remembering.&rdquo;
            </blockquote>
            <p className="text-xs sm:text-sm text-duskk-300 max-w-xl mx-auto font-light leading-relaxed">
              Whether you&apos;re shopping for someone special or simply looking for something that catches your eye, DUSKK is here to help you find a gift worth giving.
            </p>
          </div>

          {/* Welcome CTA */}
          <div className="bg-white border border-duskk-200 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
            <span className="font-serif text-2xl sm:text-3xl text-duskk-900 block font-light tracking-wide uppercase">
              Welcome to DUSKK
            </span>
            <p className="text-base text-duskk-600 font-serif italic max-w-md mx-auto">
              Find something meaningful. Give something memorable.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center space-x-2 px-8 py-3.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition shadow-lg"
              >
                <span>Explore the Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-xs font-mono text-duskk-400 tracking-wider uppercase pt-4 border-t border-duskk-100">
              DUSKK &bull; Gifts for a Brighter Tomorrow
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
