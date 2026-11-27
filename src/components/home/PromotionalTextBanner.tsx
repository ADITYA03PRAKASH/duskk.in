import React from "react";

export function PromotionalTextBanner() {
  return (
    <section className="w-full bg-[#FAF8F5] border-y border-[#EAE3DA]/60 py-7 sm:py-8 md:py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 select-none">
        {/* MOBILE VIEW (< 768px): Two-row composition */}
        <div className="flex md:hidden flex-col items-center justify-center gap-3.5 text-center">
          {/* Row 1 — Side-by-side text with comfortable breathing room */}
          <div className="w-full flex items-center justify-between px-2 sm:px-6 max-w-sm">
            <span className="font-['Bodoni_Moda',Georgia,serif] text-[30px] sm:text-[36px] uppercase tracking-[0.06em] sm:tracking-[0.08em] font-normal text-duskk-800 whitespace-nowrap leading-none">
              STYLISH
            </span>
            <span className="font-['Bodoni_Moda',Georgia,serif] text-[30px] sm:text-[36px] uppercase tracking-[0.06em] sm:tracking-[0.08em] font-normal text-duskk-800 whitespace-nowrap leading-none">
              BRAND
            </span>
          </div>

          {/* Row 2 — Centered pill */}
          <div className="inline-flex items-center justify-center bg-[#800020] px-4 py-2 sm:px-6 sm:py-2.5 rounded-full shadow-[3px_3px_0px_#C5A880] max-w-full">
            <span className="font-sans text-xs sm:text-sm uppercase tracking-[0.12em] sm:tracking-[0.15em] font-bold text-white whitespace-nowrap leading-none">
              EVERYDAY LUXURY COLLECTION
            </span>
          </div>
        </div>

        {/* TABLET / DESKTOP VIEW (>= 768px): Single horizontal row */}
        <div className="hidden md:flex flex-row items-center justify-center md:gap-4 lg:gap-6 xl:gap-10 text-center">
          {/* Left Text */}
          <span className="font-['Bodoni_Moda',Georgia,serif] md:text-[42px] lg:text-[52px] xl:text-[60px] uppercase tracking-[0.06em] lg:tracking-[0.08em] font-normal text-duskk-800 whitespace-nowrap leading-none">
            STYLISH
          </span>

          {/* Center Pill */}
          <div className="inline-flex items-center justify-center bg-[#800020] md:px-6 md:py-2.5 lg:px-8 lg:py-3 xl:px-10 xl:py-3.5 rounded-full md:shadow-[4px_4px_0px_#C5A880] lg:shadow-[5px_5px_0px_#C5A880] flex-shrink-0">
            <span className="font-sans md:text-lg lg:text-2xl xl:text-[28px] uppercase md:tracking-[0.12em] lg:tracking-[0.14em] font-bold text-white whitespace-nowrap leading-none">
              EVERYDAY LUXURY COLLECTION
            </span>
          </div>

          {/* Right Text */}
          <span className="font-['Bodoni_Moda',Georgia,serif] md:text-[42px] lg:text-[52px] xl:text-[60px] uppercase tracking-[0.06em] lg:tracking-[0.08em] font-normal text-duskk-800 whitespace-nowrap leading-none">
            BRAND
          </span>
        </div>
      </div>
    </section>
  );
}
