import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uygvozrdqprokqgapgnx.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Z3ZvenJkcXByb2txZ2FwZ254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MDI3ODQsImV4cCI6MjEwNTI3ODc4NH0.47WcDVA4IMWIW2ZtOCHGLdbifCXPT4UGrYbdTgoF_fU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("🌸 Seeding Supabase project uygvozrdqprokqgapgnx for DUSKK.in...");

  // 1. Categories
  const categoriesData = [
    {
      name: "Earrings",
      slug: "earrings",
      description: "Handcrafted studs, drops, and hoops with 18k gold vermeil & freshwater pearls.",
      image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
      display_order: 1,
      is_featured: true,
      is_active: true,
    },
    {
      name: "Necklaces",
      slug: "necklaces",
      description: "Delicate chains, statement collars, and layered gemstone necklaces.",
      image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
      display_order: 2,
      is_featured: true,
      is_active: true,
    },
    {
      name: "Pendants",
      slug: "pendants",
      description: "Intricately designed solitaires, celestial emblems, and heritage motifs.",
      image_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
      display_order: 3,
      is_featured: true,
      is_active: true,
    },
    {
      name: "Rings",
      slug: "rings",
      description: "Stackable bands, cocktail rings, and zircon studded eternity rings.",
      image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
      display_order: 4,
      is_featured: true,
      is_active: true,
    },
    {
      name: "Bracelets",
      slug: "bracelets",
      description: "Minimalist cuffs, tennis bracelets, and charm accents.",
      image_url: "https://images.unsplash.com/photo-1611591475102-468ae3904e22?auto=format&fit=crop&w=800&q=80",
      display_order: 5,
      is_featured: true,
      is_active: true,
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Luxury hair accents, brooches, jewelry organizers, and silk pouches.",
      image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      display_order: 6,
      is_featured: false,
      is_active: true,
    },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(cat, { onConflict: "slug" })
      .select("id, slug")
      .single();

    if (error) {
      console.error(`Failed to seed category ${cat.name}:`, error.message);
    } else if (data) {
      categoryMap.set(data.slug, data.id);
    }
  }
  console.log("✅ Categories seeded:", Array.from(categoryMap.keys()));

  // 2. Sample Luxury Products
  const products = [
    {
      sku: "DSK-EAR-001",
      title: "Aura Baroque Pearl Drop Earrings",
      slug: "aura-baroque-pearl-drop-earrings",
      description: "Graceful teardrop earrings featuring luminescent authentic baroque pearls suspended from an 18K gold-plated vermeil base. Designed to capture and reflect light softly at every turn.",
      short_description: "18K Gold Vermeil & Natural Baroque Pearls",
      category_slug: "earrings",
      base_price: 3499,
      sale_price: 2499,
      specifications: {
        material: "18K Gold Plated 925 Sterling Silver, Cultured Freshwater Pearl",
        color: "Warm Gold & Pearl White",
        size: "One Size (4.2cm length)",
        weight_grams: 6.8,
      },
      is_featured: true,
      is_bestseller: true,
      is_new_arrival: false,
      images: [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { sku: "DSK-EAR-001-GOLD", title: "Yellow Gold Vermeil", stock: 30, options: { metal: "Yellow Gold" } },
        { sku: "DSK-EAR-001-ROSE", title: "Rose Gold Vermeil", stock: 15, options: { metal: "Rose Gold" } },
      ],
    },
    {
      sku: "DSK-NECK-002",
      title: "Celeste Solitaire Diamond Pendant Necklace",
      slug: "celeste-solitaire-diamond-pendant-necklace",
      description: "A brilliant cut Moissanite solitaire encased in a bezel setting of pure sterling silver dipped in 18K white rhodium. Features an adjustable delicate cable chain.",
      short_description: "Lab-Grown VVS Moissanite Solitaire & White Rhodium",
      category_slug: "necklaces",
      base_price: 4999,
      sale_price: 3899,
      specifications: {
        material: "925 Sterling Silver with White Rhodium finish, 1.0ct Moissanite",
        color: "Platinum White",
        chain_length: "16-18 inches adjustable",
        weight_grams: 4.2,
      },
      is_featured: true,
      is_bestseller: true,
      is_new_arrival: true,
      images: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { sku: "DSK-NECK-002-16IN", title: "16-18 Inch Adjustable Chain", stock: 25, options: { length: "16-18in" } },
      ],
    },
    {
      sku: "DSK-RNG-003",
      title: "Eternity Baguette Emerald Band Ring",
      slug: "eternity-baguette-emerald-band-ring",
      description: "Alternating baguette-cut Colombian green hydrothermal emeralds and cubic zirconias channel set into a tapered comfort-fit band.",
      short_description: "Hydrothermal Emeralds & 18K Yellow Gold Vermeil",
      category_slug: "rings",
      base_price: 2999,
      sale_price: 2199,
      specifications: {
        material: "18K Gold over 925 Silver, Hydrothermal Emerald, CZ",
        color: "Emerald Green & Polished Gold",
        band_width: "3mm",
        weight_grams: 3.5,
      },
      is_featured: true,
      is_bestseller: false,
      is_new_arrival: true,
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { sku: "DSK-RNG-003-US6", title: "Size 6 (Indian 12)", stock: 12, options: { size: "6" } },
        { sku: "DSK-RNG-003-US7", title: "Size 7 (Indian 14)", stock: 18, options: { size: "7" } },
        { sku: "DSK-RNG-003-US8", title: "Size 8 (Indian 16)", stock: 10, options: { size: "8" } },
      ],
    },
    {
      sku: "DSK-BRC-004",
      title: "Riviera Pavé Diamond Tennis Bracelet",
      slug: "riviera-pave-diamond-tennis-bracelet",
      description: "Continuous line of prong-set brilliant round stones with an open box clasp and double safety latches. Seamless sparkle designed for day-to-evening wear.",
      short_description: "Full Pavé Round Stones & Double Safety Clasp",
      category_slug: "bracelets",
      base_price: 5499,
      sale_price: 4299,
      specifications: {
        material: "Triple-plated Rhodium over Silver, 5A Grade Zirconia",
        color: "Silver White",
        length: "7 inches (17.8 cm)",
        weight_grams: 11.2,
      },
      is_featured: true,
      is_bestseller: true,
      is_new_arrival: false,
      images: [
        "https://images.unsplash.com/photo-1611591475102-468ae3904e22?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { sku: "DSK-BRC-004-7IN", title: "7-Inch Standard Length", stock: 20, options: { length: "7in" } },
      ],
    },
    {
      sku: "DSK-PND-005",
      title: "Lumina Crescent Moon & Star Medallion",
      slug: "lumina-crescent-moon-star-medallion",
      description: "Vintage celestial medallion embossed with a star cluster and crescent moon adorned with shimmering micro-pavé accents.",
      short_description: "Vintage Celestial Medallion with Satin Texture",
      category_slug: "pendants",
      base_price: 2799,
      sale_price: 1999,
      specifications: {
        material: "18K Antiqued Gold Vermeil, 925 Silver",
        color: "Antiqued Warm Gold",
        diameter: "22mm",
        weight_grams: 5.1,
      },
      is_featured: false,
      is_bestseller: true,
      is_new_arrival: true,
      images: [
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { sku: "DSK-PND-005-STD", title: "Pendant + 18-Inch Chain", stock: 35, options: { type: "Standard" } },
      ],
    },
  ];

  for (const prod of products) {
    const categoryId = categoryMap.get(prod.category_slug);
    if (!categoryId) continue;

    const { data: createdProduct, error: prodErr } = await supabase
      .from("products")
      .upsert(
        {
          sku: prod.sku,
          title: prod.title,
          slug: prod.slug,
          description: prod.description,
          short_description: prod.short_description,
          category_id: categoryId,
          base_price: prod.base_price,
          sale_price: prod.sale_price,
          specifications: prod.specifications,
          status: "active",
          is_featured: prod.is_featured,
          is_bestseller: prod.is_bestseller,
          is_new_arrival: prod.is_new_arrival,
        },
        { onConflict: "slug" }
      )
      .select("id, title")
      .single();

    if (prodErr || !createdProduct) {
      console.error(`Error seeding product ${prod.title}:`, prodErr?.message);
      continue;
    }

    // Product Images
    for (let i = 0; i < prod.images.length; i++) {
      await supabase.from("product_images").insert({
        product_id: createdProduct.id,
        image_url: prod.images[i],
        alt_text: prod.title,
        display_order: i,
        is_primary: i === 0,
      });
    }

    // Product Variants
    for (const variant of prod.variants) {
      await supabase.from("product_variants").upsert(
        {
          product_id: createdProduct.id,
          sku: variant.sku,
          title: variant.title,
          options: variant.options,
          stock_quantity: variant.stock,
          reserved_quantity: 0,
          is_active: true,
        },
        { onConflict: "sku" }
      );
    }
  }
  console.log("✅ Luxury products and variants seeded successfully");

  // 3. Seed Promotional Coupons
  const coupons: any[] = [
    {
      code: "WELCOME10",
      description: "10% off on your first luxury jewelry purchase",
      discount_type: "percentage",
      discount_value: 10,
      min_order_value: 999,
      max_discount_amount: 1000,
      starts_at: new Date().toISOString(),
      is_active: true,
    },
    {
      code: "DUSKK500",
      description: "Flat ₹500 discount on orders above ₹3,000",
      discount_type: "fixed_amount",
      discount_value: 500,
      min_order_value: 3000,
      max_discount_amount: null,
      starts_at: new Date().toISOString(),
      is_active: true,
    },
  ];

  for (const c of coupons) {
    await supabase.from("coupons").upsert(c, { onConflict: "code" });
  }
  console.log("✅ Coupons seeded");

  // 4. Seed Banners
  const banners = [
    {
      banner_type: "hero",
      title: "The Solstice Fine Jewelry Collection",
      subtitle: "Handcrafted 18K Gold Vermeil & Natural Gemstones",
      image_url_desktop: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=85",
      link_url: "/shop",
      display_order: 1,
      is_active: true,
    },
    {
      banner_type: "promo_strip",
      title: "Complimentary Luxury Gift Box & Certificate with Every Order",
      subtitle: "Free insured express shipping across India",
      image_url_desktop: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600&q=85",
      link_url: "/shop",
      display_order: 2,
      is_active: true,
    },
  ];

  for (const b of banners) {
    await supabase.from("banners").insert(b);
  }
  console.log("✅ Banners seeded");

  console.log("🎉 Seeding completed successfully for DUSKK.in on Supabase project uygvozrdqprokqgapgnx!");
}

seed().catch(console.error);
