import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import Script from "next/script";

export const viewport: Viewport = {
  themeColor: "#C5A880",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "DUSKK | Gifts for a Brighter Tomorrow",
    template: "%s | DUSKK",
  },
  description:
    "Thoughtful Gifts. Meaningful Moments. Discover handcrafted demi-fine jewelry and thoughtfully selected gifts for birthdays, anniversaries, festivals, and milestones with express insured delivery across India.",
  metadataBase: new URL("https://duskk.in"),
  keywords: [
    "DUSKK",
    "duskk.in",
    "thoughtful gifts",
    "meaningful moments",
    "gifts for a brighter tomorrow",
    "luxury jewellery India",
    "demi fine gold",
    "pearl drop earrings",
    "anti tarnish jewellery",
    "demi-fine jewellery",
    "solitaire rings",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "DUSKK | Gifts for a Brighter Tomorrow",
    description: "Thoughtful Gifts. Meaningful Moments. Handcrafted demi-fine jewelry and memorable gifts.",
    url: "https://duskk.in",
    siteName: "DUSKK",
    images: [
      {
        url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "DUSKK Luxury Gifting & Jewellery Collection",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DUSKK",
    url: "https://www.duskk.in",
    telephone: "+917503462516",
    email: "duskk.india@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Plot No. 152-153, Sidhatri Enclave, Bhagwati Garden, Uttam Nagar",
      addressLocality: "New Delhi",
      postalCode: "110059",
      addressCountry: "IN",
    },
  };

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
