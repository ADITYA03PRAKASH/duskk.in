"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, Search, Menu, X, Compass, Sparkles } from "lucide-react";
import { D_LOGO_SRC } from "@/lib/logo";
import type { PublicPromotionalCoupon } from "@/services/pricing.service";

interface NavbarProps {
  initialPromoCoupon?: PublicPromotionalCoupon | null;
}

export function Navbar({ initialPromoCoupon }: NavbarProps = {}) {
  const { itemCount, openCart } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [promoCoupon, setPromoCoupon] = useState<PublicPromotionalCoupon | null>(
    initialPromoCoupon ?? null
  );
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (initialPromoCoupon !== undefined) return;
    let isMounted = true;
    fetch("/api/promotions/coupon")
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted && resData.success) {
          setPromoCoupon(resData.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load promotional coupon:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [initialPromoCoupon]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  // Close drawer & search on route change
  useEffect(() => {
    setIsDrawerOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted && resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
          setCategories(
            resData.data
              .filter((c: any) => c.is_active !== false)
              .map((c: any) => ({ name: c.name.toUpperCase(), slug: c.slug }))
          );
        }
      })
      .catch((err) => {
        console.warn("Failed to load categories for nav:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const allNavLinks = [
    { name: "SHOP ALL", href: "/shop" },
    { name: "GIFT SETS & COMBOS", href: "/combos" },
    ...(categories.length > 0
      ? categories.map((c) => ({ name: c.name, href: `/category/${c.slug}` }))
      : [
          { name: "EARRINGS", href: "/category/earrings" },
          { name: "NECKLACES", href: "/category/necklaces" },
          { name: "PAYALS", href: "/category/payals" },
          { name: "RINGS", href: "/category/rings" },
          { name: "BRACELETS", href: "/category/bracelets" },
        ]),
    { name: "ABOUT", href: "/about" },
  ];

  return (
    <>
      {/* Announcement Top Bar */}
      <div className="bg-duskk-900 text-duskk-champagne text-[11px] font-medium py-2 px-4 tracking-widest text-center uppercase flex items-center justify-center space-x-3 border-b border-white/10">
        <Sparkles className="w-3.5 h-3.5 text-duskk-gold animate-pulse flex-shrink-0" />
        <span>Complimentary Express Shipping Across India On Orders Above ₹999</span>
        {promoCoupon && (
          <>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline">
              Use Code: <strong className="text-white">{promoCoupon.code}</strong> For{" "}
              {promoCoupon.discountType === "PERCENT"
                ? `${promoCoupon.discountValue}% Off`
                : `₹${promoCoupon.discountValue} Off`}
              {promoCoupon.minOrderValue > 0
                ? ` Above ₹${promoCoupon.minOrderValue.toLocaleString("en-IN")}`
                : ""}
            </span>
          </>
        )}
      </div>

      {/* Main Sticky Navbar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled
          ? "bg-[#FAF8F5]/95 backdrop-blur-md shadow-sm border-b border-[#EAE3DA] py-2 md:py-2.5"
          : "bg-[#FAF8F5] border-b border-[#EAE3DA]/70 py-3 md:py-3.5"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* LEFT: Hamburger Menu Button */}
          <div className="flex-1 flex items-center justify-start">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="group flex items-center space-x-2 p-1.5 -ml-1.5 text-[#1F1F1F] hover:text-duskk-gold transition-colors focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6 stroke-[1.8] group-hover:scale-105 transition-transform" />
              <span className="hidden sm:inline-block text-[11px] uppercase tracking-[0.22em] font-medium text-[#7A6B58] group-hover:text-duskk-gold">
                MENU
              </span>
            </button>
          </div>

          {/* CENTER: Prominent Centered DUSKK Brand Logo */}
          <div className="flex-shrink-0 flex items-center justify-center text-center px-2">
            <Link href="/" className="inline-flex flex-col items-center group">
              <div className="flex items-center justify-center">
                {/* Original Gold Monogram D Logo — Enhanced Size */}
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={D_LOGO_SRC}
                    alt="D"
                    className="w-full h-full object-contain filter drop-shadow-[0_1px_3px_rgba(197,168,128,0.35)]"
                  />
                </div>

                {/* Wordmark USKK in matching Luxury Serif — Enhanced Size */}
                <span className="font-serif text-3xl sm:text-4xl md:text-[42px] tracking-[0.25em] uppercase font-bold text-[#1F1F1F] group-hover:text-duskk-gold transition-colors leading-none pl-1 sm:pl-1.5 select-none">
                  USKK
                </span>
              </div>
            </Link>
          </div>

          {/* RIGHT: Essential Action Icons (Search, Track, Cart) */}
          <div className="flex-1 flex items-center justify-end space-x-3 sm:space-x-5 md:space-x-6">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 text-[#1F1F1F] hover:text-duskk-gold transition-colors flex items-center space-x-1.5"
              title="Search collection"
              aria-label="Search"
            >
              <Search className="w-5 h-5 stroke-[1.8]" />
              <span className="hidden lg:inline-block text-[11px] uppercase tracking-[0.18em] font-medium text-[#7A6B58] hover:text-[#1F1F1F]">
                SEARCH
              </span>
            </button>

            {/* Track Order Link */}
            <Link
              href="/order/track"
              className="p-1.5 text-[#1F1F1F] hover:text-duskk-gold transition-colors hidden sm:flex items-center space-x-1.5"
              title="Track your order"
              aria-label="Track order"
            >
              <Compass className="w-5 h-5 stroke-[1.8]" />
              <span className="hidden lg:inline-block text-[11px] uppercase tracking-[0.18em] font-medium text-[#7A6B58] hover:text-[#1F1F1F]">
                TRACK
              </span>
            </Link>

            {/* Shopping Bag Button */}
            <button
              onClick={openCart}
              className="relative p-1.5 text-[#1F1F1F] hover:text-duskk-gold transition-colors flex items-center"
              aria-label="View shopping bag"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-duskk-900 text-white font-sans text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Search Modal/Bar */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-duskk-200 shadow-md py-4 px-4 sm:px-8 z-50 animate-fade-in">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-5 h-5 text-duskk-400 absolute left-4" />
                <input
                  type="text"
                  placeholder="Search earrings, 18k gold necklaces, pendants, rings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-12 pr-12 py-3 bg-duskk-50 border border-duskk-300 rounded text-sm text-duskk-900 placeholder-duskk-400 focus:outline-none focus:border-duskk-gold"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 p-1 text-duskk-400 hover:text-duskk-900"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>
              <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-duskk-500">
                <span className="font-medium text-duskk-700">Popular:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("pearl");
                    router.push("/shop?search=pearl");
                    setIsSearchOpen(false);
                  }}
                  className="px-2 py-0.5 bg-duskk-100 rounded hover:bg-duskk-200 text-duskk-800"
                >
                  Pearl Drops
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("gold");
                    router.push("/shop?search=gold");
                    setIsSearchOpen(false);
                  }}
                  className="px-2 py-0.5 bg-duskk-100 rounded hover:bg-duskk-200 text-duskk-800"
                >
                  Demi-Fine Gold
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("solitaire");
                    router.push("/shop?search=solitaire");
                    setIsSearchOpen(false);
                  }}
                  className="px-2 py-0.5 bg-duskk-100 rounded hover:bg-duskk-200 text-duskk-800"
                >
                  Solitaire Rings
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Navigation Side Drawer (Inspired by Salty.co.in) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content panel */}
          <div className="relative w-full max-w-sm sm:max-w-md bg-[#FAF8F5] h-full shadow-2xl flex flex-col justify-between z-10 animate-slide-right overflow-y-auto border-r border-[#EAE3DA]">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#EAE3DA]">
                <div className="flex items-center space-x-2">
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={D_LOGO_SRC}
                      alt="D"
                      className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(197,168,128,0.3)]"
                    />
                  </div>
                  <span className="font-serif text-xl tracking-[0.25em] uppercase font-bold text-[#1F1F1F]">
                    USKK
                  </span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-[#7A6B58] hover:text-[#1F1F1F] rounded-full hover:bg-black/5 transition-colors focus:outline-none"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="px-6 py-6 space-y-1">
                {allNavLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={`block py-3 px-3 text-xs sm:text-sm font-medium tracking-[0.25em] uppercase rounded transition-all duration-200 ${
                        isActive
                          ? "bg-duskk-900 text-duskk-champagne font-semibold pl-4"
                          : "text-[#1F1F1F] hover:bg-black/5 hover:text-duskk-gold hover:pl-4"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}

                <div className="pt-4 border-t border-[#EAE3DA]/80 mt-4">
                  <Link
                    href="/order/track"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center space-x-3 py-3 px-3 text-xs sm:text-sm font-medium tracking-[0.25em] uppercase text-[#1F1F1F] hover:text-duskk-gold hover:bg-black/5 rounded transition-all duration-200"
                  >
                    <Compass className="w-4 h-4 text-duskk-gold" />
                    <span>TRACK ORDER</span>
                  </Link>
                </div>
              </nav>
            </div>

            {/* Drawer Footer Information */}
            <div className="p-6 border-t border-[#EAE3DA] bg-[#F4EFEA]/60">
              <div className="text-[10px] tracking-[0.25em] uppercase text-[#8C8276] space-y-1.5 font-sans">
                <p className="font-medium text-[#1F1F1F]">DUSKK FINE JEWELRY</p>
                <p>Complimentary Insured Express Shipping Across India</p>
                {promoCoupon && (
                  <p className="text-duskk-gold font-semibold pt-1">
                    Use Code: {promoCoupon.code} for{" "}
                    {promoCoupon.discountType === "PERCENT"
                      ? `${promoCoupon.discountValue}% Off`
                      : `₹${promoCoupon.discountValue} Off`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
