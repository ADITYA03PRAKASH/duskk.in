import React from "react";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { getCategoryBySlug, getProducts } from "@/services/catalog.service";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { sort?: string };
}

export const revalidate = 30;

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = params;
  const { sort } = searchParams;

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const productsResult = await getProducts({
    category: slug,
    sort: sort || "recommended",
    limit: 60,
  });

  const products = productsResult.products;


  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#FAF8F5] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/shop"
              className="inline-flex items-center text-xs tracking-wider uppercase text-duskk-600 hover:text-duskk-900 space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all collections</span>
            </Link>
          </div>

          {/* Category Banner / Header */}
          <div className="bg-duskk-900 text-white p-8 sm:p-12 mb-10 relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
                COLLECTION
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-white font-light mb-3">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-xs sm:text-sm text-duskk-200 leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>
            {category.image && (
              <div className="absolute right-0 inset-y-0 w-1/3 opacity-20 sm:opacity-30 overflow-hidden hidden sm:block">
                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Sorting Header */}
          <div className="flex justify-between items-center mb-8 border-b border-duskk-200 pb-4">
            <span className="text-xs text-duskk-600">
              Showing {products.length} {category.name} designs
            </span>
            <div className="flex space-x-2 text-xs">
              <Link
                href={`/category/${slug}`}
                className={`px-3 py-1 rounded ${!sort || sort === "newest" ? "bg-duskk-900 text-white font-medium" : "text-duskk-600 hover:bg-duskk-200"}`}
              >
                Newest
              </Link>
              <Link
                href={`/category/${slug}?sort=popular`}
                className={`px-3 py-1 rounded ${sort === "popular" ? "bg-duskk-900 text-white font-medium" : "text-duskk-600 hover:bg-duskk-200"}`}
              >
                Popular
              </Link>
              <Link
                href={`/category/${slug}?sort=price_asc`}
                className={`px-3 py-1 rounded ${sort === "price_asc" ? "bg-duskk-900 text-white font-medium" : "text-duskk-600 hover:bg-duskk-200"}`}
              >
                Price: Low &rarr; High
              </Link>
            </div>
          </div>

          {/* Grid */}
          {products.length === 0 ? (
            <div className="bg-white p-12 text-center border border-duskk-200 max-w-md mx-auto my-8">
              <p className="text-sm text-duskk-600">No products currently in this collection.</p>
              <Link href="/shop" className="mt-4 inline-block px-4 py-2 bg-duskk-900 text-white text-xs uppercase">
                Explore Other Jewels
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
