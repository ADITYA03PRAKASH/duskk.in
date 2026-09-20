import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { getProducts, getCategories, getBanners } from "@/services/catalog.service";
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCw, Gem, Heart, Star, Award } from "lucide-react";

export const revalidate = 60; // ISR cache 60 seconds

export default async function HomePage() {
  const [categories, featuredResult, bestSellersResult, banners] = await Promise.all([
    getCategories(),
    getProducts({ limit: 4, featured: true }),
    getProducts({ limit: 4, bestSeller: true }),
    getBanners(),
  ]);

  const featuredProducts = featuredResult.products;
  const bestSellers = bestSellersResult.products;
  const heroBanner = banners.find((b: any) => b.banner_type === "hero") || banners[0];
  const heroImage = heroBanner?.image_url_desktop || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1920&q=85";
  const heroTitle = heroBanner?.title || "Where Modern Allure Meets Timeless Craft";
  const heroSubtitle = heroBanner?.subtitle || "Elevate your signature silhouette with artisanal jewelry crafted in demi-fine gold, authentic pearls, and celestial zircons.";
  const heroLink = heroBanner?.link_url || "/shop";

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative min-h-[85vh] flex items-center bg-duskk-900 text-white overflow-hidden">
          {/* Hero background image with dark gradient */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroImage}
              alt="DUSKK Hero Collection"
              className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105 transform hover:scale-100 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-duskk-900 via-duskk-900/60 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col items-start max-w-2xl">
            <span className="inline-flex items-center space-x-2 text-xs font-mono tracking-[0.3em] uppercase text-duskk-gold mb-4 border border-duskk-gold/30 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-duskk-gold" />
              <span>AUTUMN / WINTER 2026</span>
            </span>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-wide text-white leading-tight mb-6">
              {heroTitle}
            </h1>

            <p className="text-sm sm:text-base text-duskk-200 leading-relaxed font-light mb-8 max-w-xl">
              {heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <Link
                href={heroLink}
                className="px-8 py-4 bg-duskk-gold hover:bg-duskk-goldHover text-duskk-900 font-medium text-xs tracking-[0.2em] uppercase transition duration-300 text-center shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/category/earrings"
                className="px-8 py-4 border border-white/40 hover:border-white text-white font-medium text-xs tracking-[0.2em] uppercase transition duration-300 text-center hover:bg-white/10"
              >
                <span>New Arrivals</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 2. FEATURED CATEGORIES */}
        <section className="py-20 bg-duskk-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-14">
              <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
                CURATED ATELIER
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-medium">
                Shop By Category
              </h2>
              <div className="w-12 h-0.5 bg-duskk-gold mx-auto mt-4" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group flex flex-col items-center text-center bg-white p-3 border border-duskk-200/80 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-duskk-100 mb-3">
                    <img
                      src={cat.image_url || cat.image || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80"}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-serif text-sm font-semibold text-duskk-900 group-hover:text-duskk-gold transition">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-duskk-500 mt-0.5">Explore &rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 3. NEW ARRIVALS & FEATURED PIECES */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
                  FRESH AT THE VAULT
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-medium">
                  New Arrivals
                </h2>
              </div>
              <Link
                href="/shop?sort=newest"
                className="mt-4 md:mt-0 text-xs uppercase tracking-widest text-duskk-900 hover:text-duskk-gold font-semibold flex items-center space-x-1"
              >
                <span>View All New Additions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* 4. PROMOTIONAL BANNER */}
        <section className="py-16 bg-duskk-900 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <span className="text-xs uppercase font-mono tracking-[0.3em] text-duskk-gold block mb-2">
              LIMITED TIME OFFER
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light mb-4">
              Unlock 10% Off Your First Order
            </h2>
            <p className="text-xs sm:text-sm text-duskk-300 max-w-lg mx-auto mb-6">
              Apply code <strong className="text-duskk-gold font-mono font-bold bg-white/10 px-2 py-0.5 rounded">DUSKK10</strong> at guest checkout. Complimentary insured express shipping on all orders.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-8 py-3.5 bg-duskk-gold hover:bg-duskk-goldHover text-duskk-900 text-xs font-semibold uppercase tracking-widest transition shadow-lg"
            >
              <span>Shop With Code</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </section>

        {/* 5. BEST SELLERS */}
        <section className="py-20 bg-duskk-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
                  MOST-LOVED DESIGNS
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-medium">
                  Best Sellers
                </h2>
              </div>
              <Link
                href="/shop?sort=popular"
                className="mt-4 md:mt-0 text-xs uppercase tracking-widest text-duskk-900 hover:text-duskk-gold font-semibold flex items-center space-x-1"
              >
                <span>View All Best Sellers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* 6. BRAND STORY SECTION */}
        <section className="py-20 bg-white border-y border-duskk-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative aspect-4/3 overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80"
                  alt="DUSKK Craftsmanship"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-6">
                <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block">
                  THE DUSKK STORY
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-light leading-snug">
                  Crafted For The Modern Muse
                </h2>
                <div className="space-y-4 text-xs sm:text-sm text-duskk-600 leading-relaxed">
                  <p>
                    DUSKK was founded in New Delhi with a clear conviction: creating refined demi-fine jewellery for everyday wear without unnecessary luxury markups. We handcraft pieces using hypoallergenic 925 sterling silver and medical-grade stainless steel finished in radiant gold plating.
                  </p>
                  <p>
                    From organic baroque pearls selected by hand to brilliant-cut zircons, each design is made in limited artisan batches to maintain uncompromising quality and everyday durability.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/about"
                    className="inline-flex items-center text-xs uppercase font-mono tracking-widest text-duskk-900 border-b border-duskk-900 pb-1 hover:text-duskk-gold hover:border-duskk-gold transition-colors"
                  >
                    Read Our Story &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. WHY DUSKK PILLARS */}
        <section className="py-20 bg-duskk-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-14">
              <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
                UNCOMPROMISING QUALITY
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-medium">
                The DUSKK Standard
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-white p-6 border border-duskk-200/80 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 bg-duskk-cream text-duskk-gold rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-duskk-900">Demi-Fine Gold</h3>
                <p className="text-xs text-duskk-600 leading-relaxed">
                  Substantially thicker gold plating that outlasts ordinary costume jewellery and retains its warm golden sheen.
                </p>
              </div>

              <div className="bg-white p-6 border border-duskk-200/80 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 bg-duskk-cream text-duskk-gold rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-duskk-900">Hypoallergenic</h3>
                <p className="text-xs text-duskk-600 leading-relaxed">
                  100% Nickel-free, Lead-free, and Cadmium-free. Safe for sensitive ears and delicate skin.
                </p>
              </div>

              <div className="bg-white p-6 border border-duskk-200/80 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 bg-duskk-cream text-duskk-gold rounded-full flex items-center justify-center mx-auto">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-duskk-900">Insured Delivery</h3>
                <p className="text-xs text-duskk-600 leading-relaxed">
                  Fast delivery across 26,000+ Indian pincodes in our signature tamper-proof velvet unboxing.
                </p>
              </div>

              <div className="bg-white p-6 border border-duskk-200/80 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 bg-duskk-cream text-duskk-gold rounded-full flex items-center justify-center mx-auto">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-duskk-900">7-Day Easy Returns</h3>
                <p className="text-xs text-duskk-600 leading-relaxed">
                  Shop with complete peace of mind. Instant return scheduling with doorstep pickup.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. TESTIMONIALS */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
              CUSTOMER EXPERIENCES
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-medium mb-12">
              Loved By Modern Muses
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="p-6 bg-duskk-50 border border-duskk-200 rounded space-y-3">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-duskk-700 italic leading-relaxed">
                  &ldquo;The baroque pearls have the most dreamy, subtle lustre. Checkout was lightning fast without making me create passwords or wait for SMS codes!&rdquo;
                </p>
                <div className="pt-2 border-t border-duskk-200">
                  <h4 className="text-xs font-bold text-duskk-900">Natasha Kulkarni</h4>
                  <span className="text-[11px] text-duskk-500">Mumbai &bull; Verified Buyer</span>
                </div>
              </div>

              <div className="p-6 bg-duskk-50 border border-duskk-200 rounded space-y-3">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-duskk-700 italic leading-relaxed">
                  &ldquo;Ordered the Celeste layered necklace and it arrived in Delhi in 2 days. The velvet jewelry box made me feel like I purchased fine diamonds.&rdquo;
                </p>
                <div className="pt-2 border-t border-duskk-200">
                  <h4 className="text-xs font-bold text-duskk-900">Rhea Sen</h4>
                  <span className="text-[11px] text-duskk-500">New Delhi &bull; Verified Buyer</span>
                </div>
              </div>

              <div className="p-6 bg-duskk-50 border border-duskk-200 rounded space-y-3">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-duskk-700 italic leading-relaxed">
                  &ldquo;Finally a luxury Indian brand that respects user experience! Added to cart, entered my address, paid via UPI in 30 seconds. 10/10 quality.&rdquo;
                </p>
                <div className="pt-2 border-t border-duskk-200">
                  <h4 className="text-xs font-bold text-duskk-900">Tanvi Agarwal</h4>
                  <span className="text-[11px] text-duskk-500">Bengaluru &bull; Verified Buyer</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
