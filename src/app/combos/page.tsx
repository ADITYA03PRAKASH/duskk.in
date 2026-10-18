import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getPublishedCombos } from "@/services/combo.service";
import { getPromotionalCoupon } from "@/services/pricing.service";
import { CombosCatalogClient } from "./CombosCatalogClient";

export const metadata: Metadata = {
  title: "Luxury Gift Sets & Combo Offers | DUSKK",
  description:
    "Explore our curated pairings of handcrafted demi-fine jewelry. Perfect for gifting, each set includes our signature luxury gift packaging with exclusive bundle savings.",
};

export const revalidate = 60;

export default async function CombosPage() {
  const [combos, promoCoupon] = await Promise.all([
    getPublishedCombos(),
    getPromotionalCoupon(),
  ]);

  return (
    <>
      <Navbar initialPromoCoupon={promoCoupon} />
      <main className="min-h-screen bg-duskk-50">
        <CombosCatalogClient initialCombos={combos} />
      </main>
      <Footer />
    </>
  );
}
