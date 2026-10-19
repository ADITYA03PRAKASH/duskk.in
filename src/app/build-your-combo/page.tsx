import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getCustomComboSettings, getEligibleBuilderProducts } from "@/services/combo.service";
import { getCategories } from "@/services/catalog.service";
import { getPromotionalCoupon } from "@/services/pricing.service";
import { BuildYourComboClient } from "./BuildYourComboClient";

export const metadata: Metadata = {
  title: "Build Your Own Combo | Bespoke Luxury Jewelry Sets | DUSKK",
  description:
    "Handpick your favorite demi-fine jewelry pieces and create a customized gift set. Enjoy exclusive bundled savings and complimentary luxury gift packaging.",
};

export const revalidate = 60; // ISR cache 60 seconds

export default async function BuildYourComboPage() {
  const [settings, categories, promoCoupon] = await Promise.all([
    getCustomComboSettings(),
    getCategories(),
    getPromotionalCoupon(),
  ]);

  const products = settings.isEnabled ? await getEligibleBuilderProducts(settings) : [];

  return (
    <>
      <Navbar initialPromoCoupon={promoCoupon} />
      <main className="min-h-screen bg-duskk-50">
        <BuildYourComboClient
          initialSettings={settings}
          initialCategories={categories}
          initialProducts={products}
        />
      </main>
      <Footer />
    </>
  );
}
