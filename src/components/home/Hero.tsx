import React from "react";
import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";

interface HeroProps {
  title?: string;
  subtitle?: string;
  link?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export function Hero({
  title = "Thoughtful Gifts. Meaningful Moments.",
  subtitle = "Discover gifts made for celebrations, connections, and everyday moments.",
  link = "/shop",
  imageUrl,
  isActive = true,
}: HeroProps) {
  // If explicitly disabled in CMS, render nothing
  if (isActive === false) {
    return null;
  }

  const heroImage = imageUrl?.trim() || "";
  const targetLink = link?.trim() || "/shop";

  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center bg-duskk-900 text-white overflow-hidden">
      {/* 1. LAYER 0: HERO IMAGE BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {heroImage && (
          <img
            src={heroImage}
            alt={title}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-center opacity-40 sm:opacity-50"
          />
        )}

        {/* 2. LAYER 1: DARK LUXURY OVERLAY FOR TEXT CONTRAST */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(15,15,15,0.85) 0%, rgba(15,15,15,0.65) 45%, rgba(15,15,15,0.35) 100%)",
          }}
        />

        {/* Top and bottom subtle vignette to blend with navbar and next section */}
        <div className="absolute inset-0 bg-gradient-to-t from-duskk-900 via-transparent to-duskk-900/50" />
      </div>

      {/* 3. LAYER 2: HERO TEXT & CMS TARGET LINK */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 flex flex-col items-start w-full">
        <div className="max-w-2xl space-y-6">
          {/* Brand Badge */}
          <div className="inline-flex items-center space-x-2 text-xs font-mono tracking-[0.25em] uppercase text-duskk-gold border border-duskk-gold/40 px-3.5 py-1.5 rounded-full bg-duskk-900/70 backdrop-blur-md shadow-sm">
            <Gift className="w-3.5 h-3.5 text-duskk-gold" />
            <span>DUSKK &bull; MADE TO GLOW</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.15] drop-shadow-md">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm sm:text-base lg:text-lg text-duskk-100/90 leading-relaxed font-light max-w-xl drop-shadow">
              {subtitle}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="relative z-20 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <Link
              href={targetLink}
              className="px-8 py-4 bg-duskk-gold hover:bg-duskk-goldHover text-duskk-900 font-semibold text-xs tracking-[0.2em] uppercase transition duration-300 text-center shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 rounded-sm"
            >
              <span>SHOP ALL</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/shop"
              className="px-8 py-4 border border-white/50 hover:border-white text-white font-semibold text-xs tracking-[0.2em] uppercase transition duration-300 text-center bg-black/20 hover:bg-white/10 backdrop-blur-sm rounded-sm"
            >
              <span>EXPLORE GIFTS</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
