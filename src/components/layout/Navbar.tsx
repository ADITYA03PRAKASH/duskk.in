"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, Search, Menu, X, Compass, User, Sparkles } from "lucide-react";

export function Navbar() {
  const { itemCount, openCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const navLinks = [
    { name: "Shop All", href: "/shop" },
    { name: "Earrings", href: "/category/earrings" },
    { name: "Necklaces", href: "/category/necklaces" },
    { name: "Pendants", href: "/category/pendants" },
    { name: "Rings", href: "/category/rings" },
    { name: "Bracelets", href: "/category/bracelets" },
    { name: "About", href: "/about" },
  ];

  return (
    <>
      {/* Announcement Top Bar */}
      <div className="bg-duskk-900 text-duskk-champagne text-[11px] font-medium py-2 px-4 tracking-widest text-center uppercase flex items-center justify-center space-x-3 border-b border-white/10">
        <Sparkles className="w-3.5 h-3.5 text-duskk-gold animate-pulse" />
        <span>Complimentary Express Shipping Across India On Orders Above ₹999</span>
        <span className="hidden sm:inline">&bull;</span>
        <span className="hidden sm:inline">Use Code: <strong className="text-white">DUSKK10</strong> For 10% Off</span>
      </div>

      {/* Main Sticky Navbar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-duskk-200 py-3"
            : "bg-[#FAF8F5] border-b border-duskk-200/60 py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-duskk-900 hover:text-duskk-gold"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-duskk-900 hover:text-duskk-gold ml-1"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Left Nav Links */}
          <nav className="hidden lg:flex items-center space-x-7">
            {navLinks.slice(0, 4).map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs uppercase tracking-widest font-medium transition-colors hover:text-duskk-gold ${
                  pathname === link.href ? "text-duskk-gold font-semibold" : "text-duskk-800"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Center Brand Logo */}
          <div className="flex-1 text-center lg:flex-none">
            <Link href="/" className="inline-block group">
              <span className="font-serif text-2xl sm:text-3xl tracking-[0.35em] uppercase font-light text-duskk-900 group-hover:text-duskk-gold transition-colors">
                DUSKK
              </span>
              <span className="block text-[9px] tracking-[0.45em] uppercase text-duskk-500 font-sans text-center -mt-1">
                JEWELLERY
              </span>
            </Link>
          </div>

          {/* Desktop Right Nav Links & Actions */}
          <div className="flex items-center space-x-6">
            <nav className="hidden lg:flex items-center space-x-7 mr-2">
              {navLinks.slice(4).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs uppercase tracking-widest font-medium transition-colors hover:text-duskk-gold ${
                    pathname === link.href ? "text-duskk-gold font-semibold" : "text-duskk-800"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden lg:flex items-center text-xs tracking-wider uppercase text-duskk-700 hover:text-duskk-gold transition space-x-1"
              title="Search collection"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            {/* Track Order Link */}
            <Link
              href="/order/track"
              className="hidden md:flex items-center text-xs tracking-wider uppercase text-duskk-700 hover:text-duskk-gold transition space-x-1"
              title="Track your order"
            >
              <Compass className="w-4 h-4" />
              <span>Track</span>
            </Link>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2 text-duskk-900 hover:text-duskk-gold transition flex items-center"
              aria-label="View shopping bag"
            >
              <ShoppingBag className="w-5 h-5" />
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

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-duskk-200 px-6 py-6 space-y-4 shadow-xl">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium tracking-wider uppercase text-duskk-900 hover:text-duskk-gold py-1 border-b border-duskk-50"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/order/track"
                className="text-sm font-medium tracking-wider uppercase text-duskk-900 hover:text-duskk-gold py-1 border-b border-duskk-50 flex items-center space-x-2"
              >
                <Compass className="w-4 h-4 text-duskk-gold" />
                <span>Track My Order</span>
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
