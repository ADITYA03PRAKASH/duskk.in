import React from "react";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetailClient } from "./ProductDetailClient";
import { getProductBySlug, getProducts } from "@/services/catalog.service";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);

  if (!product) return { title: "Product Not Found | DUSKK" };

  return {
    title: `${product.metaTitle || product.name} | DUSKK`,
    description: product.metaDescription || product.shortDescription || product.description,
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description,
      images: [{ url: product.primaryImage || product.images?.[0]?.image_url || "/placeholder.jpg" }],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Related products from same category
  const categorySlug = Array.isArray(product.category)
    ? product.category[0]?.slug
    : (product.category as any)?.slug || null;

  const relatedResult = await getProducts({
    category: categorySlug,
    limit: 5,
  });

  const relatedProducts = relatedResult.products.filter((p) => p.id !== product.id).slice(0, 4);


  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#FAF8F5] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductDetailClient product={product} />

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-20 pt-12 border-t border-duskk-200">
              <div className="text-center max-w-md mx-auto mb-10">
                <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-1">
                  COMPLETE YOUR ENSEMBLE
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-duskk-900 font-normal">
                  You May Also Admire
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
