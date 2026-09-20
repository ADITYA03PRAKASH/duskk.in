import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌸 Seeding DUSKK database...");

  // 1. Seed Admin
  const adminPasswordHash = await bcrypt.hash("DuskkAdmin2026!", 10);
  const admin = await prisma.admin.upsert({
    where: { email: "admin@duskk.in" },
    update: {
      passwordHash: adminPasswordHash,
      name: "DUSKK Executive Admin",
    },
    create: {
      email: "admin@duskk.in",
      name: "DUSKK Executive Admin",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ Admin seeded:", admin.email);

  // 2. Seed Categories
  const categories = [
    {
      name: "Earrings",
      slug: "earrings",
      description: "Handcrafted studs, drops, and hoops with 18k gold vermeil & freshwater pearls.",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
      sortOrder: 1,
    },
    {
      name: "Necklaces",
      slug: "necklaces",
      description: "Delicate chains, statement collars, and layered gemstone necklaces.",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
      sortOrder: 2,
    },
    {
      name: "Pendants",
      slug: "pendants",
      description: "Intricately designed solitaires, celestial emblems, and heritage motifs.",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
      sortOrder: 3,
    },
    {
      name: "Rings",
      slug: "rings",
      description: "Stackable bands, cocktail rings, and zircon studded eternity rings.",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
      sortOrder: 4,
    },
    {
      name: "Bracelets",
      slug: "bracelets",
      description: "Minimalist cuffs, tennis bracelets, and charm accents.",
      image: "https://images.unsplash.com/photo-1611591475102-468ae3904e22?auto=format&fit=crop&w=800&q=80",
      sortOrder: 5,
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Luxury hair accents, brooches, jewelry organizers, and silk pouches.",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      sortOrder: 6,
    },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap.set(cat.slug, created.id);
  }
  console.log("✅ Categories seeded");

  // 3. Seed Luxury Products
  const products = [
    {
      sku: "DSK-EAR-001",
      name: "Aura Baroque Pearl Drop Earrings",
      slug: "aura-baroque-pearl-drop-earrings",
      description: "Graceful teardrop earrings featuring luminescent authentic baroque pearls suspended from an 18K gold-plated vermeil base. Designed to capture and reflect light softly at every turn.",
      shortDescription: "18K Gold Vermeil & Natural Baroque Pearls",
      categorySlug: "earrings",
      price: 2499,
      mrp: 3499,
      discount: 28,
      stockQuantity: 45,
      material: "18K Gold Plated 925 Sterling Silver, Cultured Freshwater Pearl",
      color: "Warm Gold & Pearl White",
      size: "One Size (4.2cm length)",
      weight: "6.8g pair",
      dimensions: "4.2cm x 1.4cm",
      tags: "pearl,gold,earrings,bestseller,wedding,evening",
      featured: true,
      bestSeller: true,
      newArrival: false,
      seoTitle: "Aura Baroque Pearl Drop Earrings | DUSKK",
      seoDescription: "Shop the Aura Baroque Pearl Drop Earrings crafted with 18k gold vermeil and natural baroque pearls.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80",
          altText: "Aura Baroque Pearl Drop Earrings front view",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80",
          altText: "Aura Baroque Pearl Drop Earrings detail shot",
          isPrimary: false,
        },
      ],
    },
    {
      sku: "DSK-NECK-002",
      name: "Celeste Layered Celestial Necklace",
      slug: "celeste-layered-celestial-necklace",
      description: "A dual-tier choker and chain pairing adorned with hand-set cubic zirconia constellations. Tarnish-resistant and hypoallergenic for effortless daily glamour.",
      shortDescription: "Dual-tier 18K gold finish with starry zircons",
      categorySlug: "necklaces",
      price: 3299,
      mrp: 4999,
      discount: 34,
      stockQuantity: 30,
      material: "Anti-tarnish Stainless Steel with 18K PVD Gold Coating, AAA Cubic Zirconia",
      color: "Champagne Gold",
      size: "Adjustable 38cm - 45cm",
      weight: "11.2g",
      dimensions: "Chain length: 42cm with 5cm extender",
      tags: "necklace,layered,celestial,zircon,gold,new",
      featured: true,
      bestSeller: true,
      newArrival: true,
      seoTitle: "Celeste Layered Celestial Necklace | DUSKK",
      seoDescription: "Exquisite layered necklace with constellation zirconia stones and 18K gold finish.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80",
          altText: "Celeste Layered Necklace worn look",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1611591475102-468ae3904e22?auto=format&fit=crop&w=1000&q=80",
          altText: "Celeste Layered Necklace flat lay",
          isPrimary: false,
        },
      ],
    },
    {
      sku: "DSK-PEND-003",
      name: "Nocturne Onyx & Gold Medallion Pendant",
      slug: "nocturne-onyx-gold-medallion-pendant",
      description: "Deep midnight black onyx stone framed by vintage sunburst embossing in brushed 18k yellow gold vermeil. An amulet of poise and refined confidence.",
      shortDescription: "Natural Black Onyx encased in sunburst gold",
      categorySlug: "pendants",
      price: 2899,
      mrp: 3999,
      discount: 27,
      stockQuantity: 22,
      material: "Natural Black Onyx, 18K Gold on 925 Sterling Silver",
      color: "Deep Onyx Black & Gold",
      size: "Pendant 2.2cm diameter, 50cm curb chain",
      weight: "9.4g",
      dimensions: "2.2cm diameter medallion",
      tags: "pendant,onyx,medallion,gold,unisex,statement",
      featured: true,
      bestSeller: false,
      newArrival: true,
      seoTitle: "Nocturne Onyx Medallion Pendant | DUSKK",
      seoDescription: "Natural black onyx medallion pendant with sunburst engraving and 18k gold vermeil.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80",
          altText: "Nocturne Onyx Pendant primary shot",
          isPrimary: true,
        },
      ],
    },
    {
      sku: "DSK-RING-004",
      name: "Solis Sculpted Wave Dome Ring",
      slug: "solis-sculpted-wave-dome-ring",
      description: "Organic molten curvature meets architectural minimalism. The Solis Dome Ring adds instant sculptural impact to any ring stack or stands proudly alone.",
      shortDescription: "Chunky high-polish dome statement ring",
      categorySlug: "rings",
      price: 1899,
      mrp: 2699,
      discount: 29,
      stockQuantity: 50,
      material: "Recycled 925 Silver, Heavy 18K Gold Vermeil",
      color: "High-Polish Yellow Gold",
      size: "Size 6, 7, 8 Available",
      weight: "7.5g",
      dimensions: "8mm tapering to 4mm band",
      tags: "ring,dome,chunky,gold,minimalist,bestseller",
      featured: false,
      bestSeller: true,
      newArrival: false,
      seoTitle: "Solis Sculpted Wave Dome Ring | DUSKK",
      seoDescription: "Sculpted molten gold dome ring designed for modern styling.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80",
          altText: "Solis Sculpted Dome Ring on hand",
          isPrimary: true,
        },
      ],
    },
    {
      sku: "DSK-BRAC-005",
      name: "Seraphina Bezel Tennis Bracelet",
      slug: "seraphina-bezel-tennis-bracelet",
      description: "A contemporary reinterpretation of the iconic tennis bracelet featuring flush-set round brilliant zircons secured in smooth geometric bezel settings.",
      shortDescription: "Ultra-flexible bezel-set zircon tennis bracelet",
      categorySlug: "bracelets",
      price: 3699,
      mrp: 5499,
      discount: 32,
      stockQuantity: 18,
      material: "Rhodium & 18K Gold Plated Brass, 3mm AAA Zirconia",
      color: "Dual Tone (White Gold & Yellow Gold)",
      size: "17cm length with 2cm removable extender",
      weight: "14.1g",
      dimensions: "17cm - 19cm adjustable",
      tags: "bracelet,tennis,zircon,luxury,sparkle,evening",
      featured: true,
      bestSeller: true,
      newArrival: false,
      seoTitle: "Seraphina Bezel Tennis Bracelet | DUSKK",
      seoDescription: "Modern bezel-set zircon tennis bracelet with luxury clasp.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1611591475102-468ae3904e22?auto=format&fit=crop&w=1000&q=80",
          altText: "Seraphina Tennis Bracelet close up",
          isPrimary: true,
        },
      ],
    },
    {
      sku: "DSK-ACC-006",
      name: "Elysian Velvet Jewelry Travel Case",
      slug: "elysian-velvet-jewelry-travel-case",
      description: "Plush emerald green velvet jewelry organizer tailored with dedicated compartments for rings, necklace hooks, and earring cards. Compact enough for jet-setting, lavish enough for your vanity.",
      shortDescription: "Jewelry travel organizer in rich velvet",
      categorySlug: "accessories",
      price: 1499,
      mrp: 2199,
      discount: 31,
      stockQuantity: 40,
      material: "Rich Italian Velvet, Brass Zipper, Suede interior lining",
      color: "Emerald Green & Gold hardware",
      size: "10cm x 10cm x 5cm",
      weight: "180g",
      dimensions: "10cm x 10cm x 5cm",
      tags: "accessories,organizer,travel,velvet,gift",
      featured: false,
      bestSeller: false,
      newArrival: true,
      seoTitle: "Elysian Velvet Jewelry Case | DUSKK",
      seoDescription: "Luxury velvet jewelry organizer for travel and vanity storage.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
          altText: "Elysian Velvet Travel Case",
          isPrimary: true,
        },
      ],
    },
    {
      sku: "DSK-EAR-007",
      name: "Lumière Baguette Huggie Hoops",
      slug: "lumiere-baguette-huggie-hoops",
      description: "Effortless everyday huggies channel-set with baguette cut crystals that catch the twilight glow. Secure click-latch closure designed for 24/7 comfort.",
      shortDescription: "Baguette crystal channel-set huggies",
      categorySlug: "earrings",
      price: 1699,
      mrp: 2399,
      discount: 29,
      stockQuantity: 60,
      material: "18K Gold Plated 925 Silver, Baguette Zirconia",
      color: "Warm Gold",
      size: "12mm outer diameter",
      weight: "3.4g pair",
      dimensions: "1.2cm diameter",
      tags: "earrings,huggies,hoops,crystal,dailywear",
      featured: false,
      bestSeller: true,
      newArrival: true,
      seoTitle: "Lumière Baguette Huggie Hoops | DUSKK",
      seoDescription: "Everyday gold huggie earrings with baguette zirconia crystals.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80",
          altText: "Lumiere Huggies",
          isPrimary: true,
        },
      ],
    },
    {
      sku: "DSK-RNG-008",
      name: "Eternia Emerald Cut Solitaire Ring",
      slug: "eternia-emerald-cut-solitaire-ring",
      description: "A commanding 3-carat equivalent emerald cut cubic zirconia resting in a clean four-prong cathedral setting on a slender band.",
      shortDescription: "3ct Emerald-cut statement solitaire",
      categorySlug: "rings",
      price: 2599,
      mrp: 3799,
      discount: 31,
      stockQuantity: 25,
      material: "Platinum dipped 925 Sterling Silver, Grade 5A CZ",
      color: "Silver Platinum",
      size: "Sizes 5, 6, 7, 8",
      weight: "4.8g",
      dimensions: "8mm x 10mm center stone",
      tags: "ring,solitaire,emerald-cut,silver,engagement,evening",
      featured: true,
      bestSeller: false,
      newArrival: true,
      seoTitle: "Eternia Emerald Cut Solitaire Ring | DUSKK",
      seoDescription: "Emerald-cut solitaire ring with high-grade AAA zirconia and silver band.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80",
          altText: "Eternia Emerald Solitaire Ring",
          isPrimary: true,
        },
      ],
    },
  ];

  for (const prod of products) {
    const categoryId = categoryMap.get(prod.categorySlug);
    if (!categoryId) continue;

    const { images, categorySlug, ...productData } = prod;

    const createdProd = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        ...productData,
        categoryId,
      },
      create: {
        ...productData,
        categoryId,
      },
    });

    // Delete existing images to avoid duplicates on re-seed
    await prisma.productImage.deleteMany({
      where: { productId: createdProd.id },
    });

    for (let i = 0; i < images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: createdProd.id,
          url: images[i].url,
          altText: images[i].altText,
          sortOrder: i,
          isPrimary: images[i].isPrimary,
        },
      });
    }

    // Seed realistic reviews
    await prisma.review.deleteMany({
      where: { productId: createdProd.id },
    });

    await prisma.review.createMany({
      data: [
        {
          productId: createdProd.id,
          customerName: "Ananya Iyer",
          customerEmail: "ananya.i@example.com",
          rating: 5,
          title: "Absolute perfection in finish!",
          comment: "The gold sheen is warm without looking brassy. Have worn it to multiple events and received compliments every single time. Packaging was gorgeous too.",
          isVerifiedPurchase: true,
          status: "APPROVED",
        },
        {
          productId: createdProd.id,
          customerName: "Pooja Malhotra",
          customerEmail: "pooja.m@example.com",
          rating: 5,
          title: "Superior quality & fast delivery",
          comment: "I checked out as guest without any login fuss and had my order delivered in 3 days. The quality is truly premium.",
          isVerifiedPurchase: true,
          status: "APPROVED",
        },
      ],
    });
  }
  console.log("✅ Products & Reviews seeded");

  // 4. Seed Coupons
  const coupons = [
    {
      code: "DUSKK10",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderValue: 999,
      maxDiscount: 500,
      active: true,
    },
    {
      code: "WELCOME500",
      discountType: "FIXED",
      discountValue: 500,
      minOrderValue: 2499,
      maxDiscount: 500,
      active: true,
    },
    {
      code: "GLAM20",
      discountType: "PERCENT",
      discountValue: 20,
      minOrderValue: 3999,
      maxDiscount: 1200,
      active: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  console.log("✅ Coupons seeded");

  // 5. Seed CMS Sections
  const cmsSections = [
    {
      key: "hero_banner",
      title: "Where Modern Allure Meets Timeless Craft",
      subtitle: "Elevate your signature silhouette with artisanal jewelry crafted in 18k gold vermeil, authentic pearls, and celestial zircons.",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600&q=80",
      link: "/shop",
      sortOrder: 1,
      active: true,
      contentJson: JSON.stringify({
        ctaPrimaryText: "Explore Collection",
        ctaPrimaryLink: "/shop",
        ctaSecondaryText: "New Arrivals",
        ctaSecondaryLink: "/category/necklaces",
        badge: "AUTUMN / WINTER 2026",
      }),
    },
    {
      key: "promo_banner",
      title: "Complimentary Express Shipping Across India",
      subtitle: "On all orders above ₹999. Hand-packed in signature velvet keepsake boxes.",
      link: "/shop",
      sortOrder: 2,
      active: true,
      contentJson: JSON.stringify({
        codeText: "Use code DUSKK10 for 10% off your order",
      }),
    },
    {
      key: "brand_story",
      title: "The DUSKK Philosophy",
      subtitle: "Conceived for the modern muse who commands presence without speaking a word.",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
      sortOrder: 3,
      active: true,
      contentJson: JSON.stringify({
        paragraphs: [
          "DUSKK was born out of a desire to bring demi-fine luxury jewelry into the daily wardrobe of contemporary women and men across India.",
          "Every jewel is forged with anti-tarnish stainless steel and 925 sterling silver, layered with generous microns of 18K gold vermeil. We reject fast-fashion transient pieces in favour of heirloom silhouettes that endure.",
        ],
        stats: [
          { label: "Handcrafted Designs", value: "150+" },
          { label: "Happy Customers", value: "25,000+" },
          { label: "Purity & Anti-Tarnish Guarantee", value: "100%" },
        ],
      }),
    },
    {
      key: "why_duskk",
      title: "The DUSKK Standard",
      subtitle: "Why over 25,000 discerning patrons choose our demi-fine creations.",
      sortOrder: 4,
      active: true,
      contentJson: JSON.stringify({
        features: [
          {
            title: "18K Gold Vermeil",
            desc: "Heavy gold layering over 925 silver & 316L medical-grade steel. Tarnish resistant for 365+ days.",
            icon: "Sparkles",
          },
          {
            title: "Hypoallergenic & Skin Safe",
            desc: "100% Nickel-free, Lead-free, and Cadmium-free. Gentle on the most sensitive skin.",
            icon: "ShieldCheck",
          },
          {
            title: "Zero-Friction Checkout",
            desc: "Order in under 60 seconds with no mandatory login, OTP hurdles, or password fatigue.",
            icon: "Zap",
          },
          {
            title: "Insured Express Delivery",
            desc: "Tamper-evident, velvet-lined luxury unboxing delivered securely across 26,000+ Indian pincodes.",
            icon: "Truck",
          },
        ],
      }),
    },
  ];

  for (const cms of cmsSections) {
    await prisma.cMSSection.upsert({
      where: { key: cms.key },
      update: cms,
      create: cms,
    });
  }
  console.log("✅ CMS Sections seeded");

  console.log("✨ DUSKK Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
