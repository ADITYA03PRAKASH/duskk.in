import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getComboBySlug, getPublishedCombos } from "@/services/combo.service";
import { getPromotionalCoupon } from "@/services/pricing.service";
import { ComboDetailClient } from "./ComboDetailClient";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const combo = await getComboBySlug(params.slug);
  if (!combo) {
    return {
      title: "Combo Not Found | DUSKK",
    };
  }

  return {
    title: `${combo.title} | Luxury Gift Set | DUSKK`,
    description:
      combo.shortDescription ||
      combo.description ||
      `Discover the ${combo.title} handcrafted gift set by DUSKK with exclusive bundle savings.`,
    openGraph: {
      title: `${combo.title} | DUSKK`,
      description: combo.shortDescription || combo.description || "",
      images: combo.imageUrl ? [{ url: combo.imageUrl }] : [],
    },
  };
}

export default async function ComboDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [combo, promoCoupon] = await Promise.all([
    getComboBySlug(params.slug),
    getPromotionalCoupon(),
  ]);

  if (!combo) {
    notFound();
  }

  return (
    <>
      <Navbar initialPromoCoupon={promoCoupon} />
      <main className="min-h-screen bg-duskk-50 py-10">
        <ComboDetailClient combo={combo} />
      </main>
      <Footer />
    </>
  );
}
