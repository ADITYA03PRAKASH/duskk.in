import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { getProducts, getCategories } from "@/services/catalog.service";
import Link from "next/link";
import { Filter, SlidersHorizontal } from "lucide-react";

interface ShopPageProps {
  searchParams: {
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    color?: string;
  };
}

export const revalidate = 30;

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category, search, sort, minPrice, maxPrice, color } = searchParams;

  const [productsResult, categories] = await Promise.all([
    getProducts({
      category: category || null,
      search: search || null,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sort: sort || "recommended",
      limit: 60,
    }),
    getCategories(),
  ]);

  const products = productsResult.products;

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#FAF8F5] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
              DUSKK CATALOGUE
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal">
              {search ? `Search results for "${search}"` : category ? `${category.toUpperCase()}` : "All Jewels & Accessories"}
            </h1>
            <p className="text-xs sm:text-sm text-duskk-500 mt-2">
              Showing {products.length} handcrafted demi-fine designs
            </p>
          </div>

          {/* Filter / Sort bar */}
          <div className="bg-white p-4 border border-duskk-200/80 mb-8 flex flex-wrap items-center justify-between gap-4">
            {/* Category Quick Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
              <Link
                href="/shop"
                className={`px-3 py-1.5 text-xs tracking-wider uppercase rounded-full transition ${
                  !category
                    ? "bg-duskk-900 text-white font-medium"
                    : "bg-duskk-100 text-duskk-700 hover:bg-duskk-200"
                }`}
              >
                All
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}${search ? `&search=${search}` : ""}`}
                  className={`px-3 py-1.5 text-xs tracking-wider uppercase rounded-full whitespace-nowrap transition ${
                    category === cat.slug
                      ? "bg-duskk-900 text-white font-medium"
                      : "bg-duskk-100 text-duskk-700 hover:bg-duskk-200"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-duskk-500 font-medium">Sort By:</span>
              <div className="flex space-x-1">
                <Link
                  href={`/shop?${new URLSearchParams({ ...searchParams, sort: "newest" }).toString()}`}
                  className={`px-2.5 py-1 rounded text-xs ${sort === "newest" || !sort ? "bg-duskk-900 text-white" : "text-duskk-600 hover:bg-duskk-100"}`}
                >
                  Newest
                </Link>
                <Link
                  href={`/shop?${new URLSearchParams({ ...searchParams, sort: "popular" }).toString()}`}
                  className={`px-2.5 py-1 rounded text-xs ${sort === "popular" ? "bg-duskk-900 text-white" : "text-duskk-600 hover:bg-duskk-100"}`}
                >
                  Popular
                </Link>
                <Link
                  href={`/shop?${new URLSearchParams({ ...searchParams, sort: "price_asc" }).toString()}`}
                  className={`px-2.5 py-1 rounded text-xs ${sort === "price_asc" ? "bg-duskk-900 text-white" : "text-duskk-600 hover:bg-duskk-100"}`}
                >
                  Price: Low &rarr; High
                </Link>
                <Link
                  href={`/shop?${new URLSearchParams({ ...searchParams, sort: "price_desc" }).toString()}`}
                  className={`px-2.5 py-1 rounded text-xs ${sort === "price_desc" ? "bg-duskk-900 text-white" : "text-duskk-600 hover:bg-duskk-100"}`}
                >
                  Price: High &rarr; Low
                </Link>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="bg-white p-12 text-center border border-duskk-200 max-w-md mx-auto my-8 space-y-4">
              <h3 className="font-serif text-2xl text-duskk-900">No products found</h3>
              <p className="text-xs text-duskk-500">
                We could not find any items matching your selected criteria. Try adjusting your search query or filters.
              </p>
              <Link
                href="/shop"
                className="inline-block px-6 py-2.5 bg-duskk-900 text-white text-xs uppercase tracking-widest font-medium"
              >
                Clear All Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
