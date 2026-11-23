import React from "react";
import Link from "next/link";

interface HeroProps {
  link?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export function Hero({
  link,
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
    <Link
      href={targetLink}
      aria-label="Shop All Jewellery Collection"
      className="group relative block w-full h-[200px] md:h-auto md:aspect-[3/1] overflow-hidden bg-duskk-900 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-duskk-gold focus-visible:ring-inset"
    >
      {/* Background Image: 100% original CMS-uploaded image URL without transformations */}
      {heroImage ? (
        <img
          src={heroImage}
          alt="DUSKK Demi-Fine Jewellery Collection"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center select-none transition-transform duration-700 ease-out group-hover:scale-[1.01]"
        />
      ) : (
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2000"
          alt="DUSKK Demi-Fine Jewellery Collection"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center select-none transition-transform duration-700 ease-out group-hover:scale-[1.01]"
        />
      )}
    </Link>
  );
}
