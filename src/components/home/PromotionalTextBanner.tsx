import React from "react";

export function PromotionalTextBanner() {
  return (
    <section className="w-full bg-[#FAF8F5] border-y border-[#EAE3DA]/60 py-5 sm:py-6 md:py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 select-none">
        {/* MOBILE VIEW (< 768px): Two-row composition */}
        <div className="flex md:hidden flex-col items-center justify-center gap-3.5 text-center">
          {/* Row 1 — Side-by-side text with comfortable breathing room */}
          <div className="w-full flex items-center justify-between px-2 sm:px-6 max-w-sm">
            <span className="font-sans text-xs sm:text-[13px] uppercase tracking-[0.24em] font-medium text-duskk-800 whitespace-nowrap">
              STYLISH
            </span>
            <span className="font-sans text-xs sm:text-[13px] uppercase tracking-[0.24em] font-medium text-duskk-800 whitespace-nowrap">
              BRAND
            </span>
          </div>

          {/* Row 2 — Centered pill */}
          <div className="inline-flex items-center justify-center bg-[#800020] px-5 py-2 sm:px-6 sm:py-2.5 rounded-full shadow-[3px_3px_0px_#C5A880] max-w-full">
            <span className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.18em] font-semibold text-white whitespace-nowrap">
              EVERYDAY LUXURY COLLECTION
            </span>
          </div>
        </div>

        {/* TABLET / DESKTOP VIEW (>= 768px): Single horizontal row preserved exactly */}
        <div className="hidden md:flex flex-row items-center justify-center md:gap-10 lg:gap-14 text-center">
          {/* Left Text */}
          <span className="font-sans md:text-sm uppercase md:tracking-[0.24em] font-medium text-duskk-800 whitespace-nowrap">
            STYLISH
          </span>

          {/* Center Pill */}
          <div className="inline-flex items-center justify-center bg-[#800020] md:px-8 md:py-2.5 rounded-full md:shadow-[4px_4px_0px_#C5A880] flex-shrink-0">
            <span className="font-sans md:text-sm uppercase md:tracking-[0.2em] font-semibold text-white whitespace-nowrap">
              EVERYDAY LUXURY COLLECTION
            </span>
          </div>

          {/* Right Text */}
          <span className="font-sans md:text-sm uppercase md:tracking-[0.24em] font-medium text-duskk-800 whitespace-nowrap">
            BRAND
          </span>
        </div>
      </div>
    </section>
  );
}
