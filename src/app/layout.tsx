import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

export const metadata: Metadata = {
  title: "DUSKK | Modern Demi-Fine Luxury Jewellery & Accessories",
  description:
    "Discover handcrafted demi-fine gold earrings, layered necklaces, solitaire rings, and accessories. Fast, zero-friction shopping with insured delivery across India.",
  metadataBase: new URL("https://duskk.in"),
  keywords: [
    "DUSKK",
    "duskk.in",
    "luxury jewellery India",
    "demi fine gold",
    "pearl drop earrings",
    "anti tarnish jewellery",
    "demi-fine jewellery",
    "solitaire rings",
  ],
  openGraph: {
    title: "DUSKK | Demi-Fine Luxury Jewellery",
    description: "Handcrafted demi-fine gold jewellery for the modern muse.",
    url: "https://duskk.in",
    siteName: "DUSKK",
    images: [
      {
        url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "DUSKK Luxury Jewellery Collection",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
