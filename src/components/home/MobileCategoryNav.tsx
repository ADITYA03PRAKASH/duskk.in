import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { optimizeImageUrl } from "@/lib/utils";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  image?: string | null;
  is_active?: boolean;
}

interface MobileCategoryNavProps {
  categories: CategoryItem[];
}

export function MobileCategoryNav({ categories }: MobileCategoryNavProps) {
  // Only render on mobile when categories are available
  const activeCategories = (categories || []).filter(
    (cat) => cat.is_active !== false
  );

  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Category Navigation"
      className="block md:hidden bg-[#FAF8F5] border-b border-[#EAE3DA]/80 py-3"
    >
      <div className="flex items-center space-x-4 overflow-x-auto px-4 scroll-smooth no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activeCategories.map((cat) => {
          const rawImg = cat.image_url?.trim() || cat.image?.trim() || "";
          const imgSrc = rawImg ? optimizeImageUrl(rawImg, 160) : "";

          return (
            <Link
              key={cat.id || cat.slug}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center flex-shrink-0 group focus:outline-none"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-[#EAE3DA] bg-duskk-100 shadow-sm transition-transform duration-200 group-hover:scale-105 group-active:scale-95 flex items-center justify-center">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={cat.name}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover object-center select-none"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-duskk-50 text-duskk-gold">
                    <Sparkles className="w-5 h-5 opacity-70" />
                  </div>
                )}
              </div>
              <span className="mt-1.5 text-[10px] tracking-wider uppercase font-medium text-duskk-900 group-hover:text-duskk-gold transition-colors text-center max-w-[68px] truncate">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
