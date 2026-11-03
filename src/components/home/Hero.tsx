import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  title?: string;
  link?: string;
  imageUrl?: string;
  isActive?: boolean;
  headlineColor?: "light" | "dark";
}

export function Hero({
  title,
  link,
  imageUrl,
  isActive = true,
  headlineColor = "light",
}: HeroProps) {
  // If explicitly disabled in CMS, render nothing
  if (isActive === false) {
    return null;
  }

  const heroImage = imageUrl?.trim() || "";
  const targetLink = link?.trim() || "";
  const headline = title?.trim() || "";

  // Headline color variant: light or dark
  const headlineColorClass =
    headlineColor === "dark" ? "text-duskk-900" : "text-white";

  return (
    <section className="relative w-full h-[200px] md:h-auto md:aspect-[3/1] flex items-center overflow-hidden bg-duskk-900">
      {/* Background Image: 100% original CMS-uploaded image URL without transformations */}
      {heroImage && (
        <img
          src={heroImage}
          alt={headline || "DUSKK Hero Banner"}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />
      )}

      {/* Content Container: Left-aligned and vertically centered */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-2 sm:py-6 md:py-10">
        <div className="max-w-[65%] sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col items-start space-y-2 sm:space-y-4 md:space-y-6">
          {/* Main Headline */}
          {headline && (
            <h1
              className={`font-serif text-sm sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-normal tracking-tight leading-[1.12] sm:leading-tight ${headlineColorClass}`}
            >
              {headline}
            </h1>
          )}

          {/* Primary CTA Button: Render only when valid link is provided */}
          {targetLink && (
            <div>
              <Link
                href={targetLink}
                className="inline-flex items-center justify-center space-x-1 sm:space-x-1.5 md:space-x-2 px-3 py-1.5 sm:px-5 sm:py-2.5 md:px-7 md:py-3.5 bg-duskk-gold hover:bg-duskk-goldHover text-duskk-900 font-semibold text-[9px] sm:text-[11px] md:text-xs tracking-[0.18em] sm:tracking-[0.2em] uppercase rounded transition-colors duration-200 shadow-sm sm:shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-duskk-gold focus:ring-offset-1 sm:focus:ring-offset-2"
              >
                <span>SHOP ALL</span>
                <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 stroke-[2.25]" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
