"use client";

import React from "react";
import { PageBannerConfig } from "@/types";
import { normalizeImageUrl, optimizeImageUrl } from "@/lib/utils";

interface CategoryPageBannerProps {
  banner?: PageBannerConfig | null;
  fallbackTitle?: string;
  fallbackLabel?: string;
  fallbackDescription?: string;
  children?: React.ReactNode;
  className?: string;
}

export function CategoryPageBanner({
  banner,
  fallbackTitle = "Collection",
  fallbackLabel = "COLLECTION",
  fallbackDescription,
  children,
  className = "",
}: CategoryPageBannerProps) {
  // If banner is explicitly disabled
  const isEnabled = banner?.isEnabled !== false;
  const title = (banner?.title || fallbackTitle).trim();
  const label = (banner?.label || fallbackLabel).trim();
  const rawDesc = banner?.description ?? fallbackDescription ?? "";
  const description = (typeof rawDesc === "string" ? rawDesc : "").trim();
  const imageUrl = (banner?.imageUrl || "").trim();
  const objectPosition = banner?.objectPosition || "center";
  const overlayOpacity = Math.max(0, Math.min(100, banner?.overlayOpacity ?? 40)) / 100;

  // Fallback if disabled: simple compact header
  if (!isEnabled) {
    return (
      <div className={`py-6 mb-8 border-b border-duskk-200 ${className}`}>
        <div className="max-w-xl">
          {label && (
            <span className="text-[11px] uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-1">
              {label}
            </span>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-duskk-600 leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden text-white rounded-none sm:rounded-lg mb-10 min-h-[220px] sm:min-h-[260px] md:min-h-[300px] flex items-center bg-duskk-900 shadow-md ${className}`}
    >
      {/* Background Image (when configured) */}
      {imageUrl && (
        <div className="absolute inset-0 w-full h-full">
          <img
            src={optimizeImageUrl(normalizeImageUrl(imageUrl), 1400)}
            alt={title}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover transition-opacity duration-500"
            style={{ objectPosition }}
            onError={(e) => {
              // Gracefully hide broken image element to preserve clean background
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Dark Overlay for Text Readability */}
      {imageUrl ? (
        <>
          <div
            className="absolute inset-0 bg-duskk-950 transition-opacity"
            style={{ opacity: overlayOpacity }}
          />
          {/* Subtle directional gradient to guarantee readable text on any photograph */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent pointer-events-none" />
        </>
      ) : (
        /* Subtle gold ambient glow when no custom image is uploaded */
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-duskk-gold/5 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Foreground Content */}
      <div className="relative z-10 w-full p-8 sm:p-12 max-w-3xl">
        {label && (
          <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2 font-semibold drop-shadow-sm">
            {label}
          </span>
        )}

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white font-normal mb-3 leading-tight tracking-tight drop-shadow-sm">
          {title}
        </h1>

        {description && (
          <p className="text-xs sm:text-sm text-duskk-100 max-w-2xl leading-relaxed font-light drop-shadow">
            {description}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}
