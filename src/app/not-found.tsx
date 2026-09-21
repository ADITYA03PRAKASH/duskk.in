import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Compass, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAF8F5] py-20 sm:py-28 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center space-y-6">
          <span className="text-xs uppercase font-mono tracking-[0.3em] text-duskk-gold block">
            404 &bull; PAGE NOT FOUND
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-duskk-900 font-light">
            Piece Not Found
          </h1>
          <p className="text-xs sm:text-sm text-duskk-600 leading-relaxed">
            The page or curated collection you are looking for might have been moved or is currently unavailable.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/shop"
              className="w-full sm:w-auto px-6 py-3 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest transition rounded shadow"
            >
              Explore Collection
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 border border-duskk-300 hover:border-duskk-900 text-duskk-800 text-xs font-semibold uppercase tracking-widest transition rounded"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
