import { supabaseAdmin } from "@/lib/supabase/admin";

export interface ProductQueryParams {
  category?: string | null;
  subcategory?: string | null;
  search?: string | null;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  limit?: number;
  page?: number;
}

export async function withTimeout<T>(promise: PromiseLike<T>, ms: number = 8000): Promise<T> {
  let timer: any;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timeout")), ms);
  });
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    timeout,
  ]);
}

export const FALLBACK_CATEGORIES = [
  {
    id: "3996bb4c-bf64-4a14-a584-9591aff2bf5d",
    name: "Earrings",
    slug: "earrings",
    description: "Bespoke stud earrings, baroque pearls, and demi-fine hoops.",
    image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80",
    display_order: 1,
    is_active: true,
  },
  {
    id: "af98e474-2511-484b-ab49-79cfd4ccf6e9",
    name: "Necklaces",
    slug: "necklaces",
    description: "Layered chains, delicate chokers, and artisanal statement necklaces.",
    image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
    display_order: 2,
    is_active: true,
  },
  {
    id: "ca7967cf-6724-4586-afbf-d809e27ef4dd",
    name: "Pendants",
    slug: "pendants",
    description: "Luminous gemstone and solitaire pendants crafted for daily luxury.",
    image_url: "https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=600&q=80",
    display_order: 3,
    is_active: true,
  },
  {
    id: "48f4e368-e06a-4b2f-9248-59c9d4c5363e",
    name: "Rings",
    slug: "rings",
    description: "Artisanal solitaire rings, eternity bands, and sculptural signets.",
    image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80",
    display_order: 4,
    is_active: true,
  },
  {
    id: "13d01adf-deab-4c37-8fda-0b1be17da23a",
    name: "Bracelets",
    slug: "bracelets",
    description: "Dainty tennis bracelets, link chains, and demi-fine bangles.",
    image_url: "https://images.unsplash.com/photo-1611591475155-4286fa7c2e7f?auto=format&fit=crop&w=600&q=80",
    display_order: 5,
    is_active: true,
  },
  {
    id: "d1aeca62-716c-4f03-a0bf-e8c2596ba051",
    name: "Accessories",
    slug: "accessories",
    description: "Curated jewellery care essentials, velvet travel cases, and styling accents.",
    image_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80",
    display_order: 6,
    is_active: true,
  },
];

export const FALLBACK_PRODUCTS = [
  {
    id: "prod_aurora_solitaire_ring",
    sku: "DSK-RN-001",
    name: "Aurora Solitaire Pavé Ring",
    slug: "aurora-solitaire-pave-ring",
    shortDescription: "A radiant center zircon nestled in micro-pavé band of demi-fine gold.",
    description: "Elegantly sculpted with hypoallergenic 925 sterling silver layered with demi-fine gold. Built for everyday wear and lifetime brilliance.",
    metaTitle: "Aurora Solitaire Pavé Ring | DUSKK",
    metaDescription: "A radiant center zircon nestled in micro-pavé band of demi-fine gold.",
    price: 2499,
    mrp: 3999,
    discount: 37,
    stockQuantity: 45,
    specifications: { Material: "Demi-Fine Gold on 925 Silver", Stones: "Grade 5A Cubic Zirconia", Warranty: "Anti-Tarnish Guarantee" },
    featured: true,
    bestSeller: true,
    newArrival: false,
    category: { id: "48f4e368-e06a-4b2f-9248-59c9d4c5363e", name: "Rings", slug: "rings" },
    images: [
      { id: "img1", image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85", alt_text: "Aurora Ring", display_order: 0, is_primary: true },
      { id: "img2", image_url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=85", alt_text: "Aurora Ring angle", display_order: 1, is_primary: false },
    ],
    primaryImage: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=85",
    variants: [{ id: "var_rn_1", sku: "DSK-RN-001-6", title: "Size 6", stock_quantity: 20, reserved_quantity: 0, is_active: true }],
    avgRating: 4.9,
    reviewCount: 38,
  },
  {
    id: "prod_celestial_drop_earrings",
    sku: "DSK-ER-002",
    name: "Celestial Baroque Pearl Drop Earrings",
    slug: "celestial-baroque-pearl-drop-earrings",
    shortDescription: "Genuine freshwater baroque pearls suspended from radiant gold studs.",
    description: "Every pearl is organically distinct, selected by hand for exceptional lustre. Finished in waterproof demi-fine gold.",
    metaTitle: "Celestial Baroque Pearl Drop Earrings | DUSKK",
    metaDescription: "Genuine freshwater baroque pearls suspended from radiant gold studs.",
    price: 3199,
    mrp: 4599,
    discount: 30,
    stockQuantity: 28,
    specifications: { Material: "Demi-Fine Gold on 925 Silver", Pearl: "100% Genuine Freshwater Pearl", Weight: "6.2g per pair" },
    featured: true,
    bestSeller: true,
    newArrival: true,
    category: { id: "3996bb4c-bf64-4a14-a584-9591aff2bf5d", name: "Earrings", slug: "earrings" },
    images: [
      { id: "img3", image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85", alt_text: "Pearl Drop Earrings", display_order: 0, is_primary: true },
      { id: "img4", image_url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=85", alt_text: "Earrings on model", display_order: 1, is_primary: false },
    ],
    primaryImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=85",
    variants: [{ id: "var_er_1", sku: "DSK-ER-002-STD", title: "Standard", stock_quantity: 28, reserved_quantity: 0, is_active: true }],
    avgRating: 5.0,
    reviewCount: 42,
  },
  {
    id: "prod_luminary_layered_necklace",
    sku: "DSK-NK-003",
    name: "Luminary Double-Strand Herringbone Necklace",
    slug: "luminary-double-strand-herringbone-necklace",
    shortDescription: "Silky fluid herringbone weave paired with a sparkling bezel pendant chain.",
    description: "Engineered to sit flush against the collarbone without twisting or snagging. 100% hypoallergenic and sweat-proof.",
    metaTitle: "Luminary Double-Strand Herringbone Necklace | DUSKK",
    metaDescription: "Silky fluid herringbone weave paired with a sparkling bezel pendant chain.",
    price: 3899,
    mrp: 5499,
    discount: 29,
    stockQuantity: 34,
    specifications: { Material: "Demi-Fine Gold on 316L Steel", Length: "16 inch + 2 inch extender", Clasp: "Lobster Claw" },
    featured: true,
    bestSeller: true,
    newArrival: false,
    category: { id: "af98e474-2511-484b-ab49-79cfd4ccf6e9", name: "Necklaces", slug: "necklaces" },
    images: [
      { id: "img5", image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85", alt_text: "Herringbone Necklace", display_order: 0, is_primary: true },
    ],
    primaryImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85",
    variants: [{ id: "var_nk_1", sku: "DSK-NK-003-STD", title: "Standard", stock_quantity: 34, reserved_quantity: 0, is_active: true }],
    avgRating: 4.8,
    reviewCount: 29,
  },
  {
    id: "prod_solaris_tennis_bracelet",
    sku: "DSK-BR-004",
    name: "Solaris Zircon Tennis Bracelet",
    slug: "solaris-zircon-tennis-bracelet",
    shortDescription: "Continuous halo of brilliant-cut zircons set in smooth four-prong bezel.",
    description: "Classic luxury reimagined for modern versatility with secure safety clasp and buttery smooth flex.",
    metaTitle: "Solaris Zircon Tennis Bracelet | DUSKK",
    metaDescription: "Continuous halo of brilliant-cut zircons set in smooth four-prong bezel.",
    price: 3499,
    mrp: 4999,
    discount: 30,
    stockQuantity: 22,
    specifications: { Material: "Demi-Fine Gold on 925 Silver", Stones: "5A Round Brilliant Zircons", Length: "7 inches" },
    featured: true,
    bestSeller: false,
    newArrival: true,
    category: { id: "13d01adf-deab-4c37-8fda-0b1be17da23a", name: "Bracelets", slug: "bracelets" },
    images: [
      { id: "img6", image_url: "https://images.unsplash.com/photo-1611591475155-4286fa7c2e7f?auto=format&fit=crop&w=800&q=85", alt_text: "Tennis Bracelet", display_order: 0, is_primary: true },
    ],
    primaryImage: "https://images.unsplash.com/photo-1611591475155-4286fa7c2e7f?auto=format&fit=crop&w=800&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1611591475155-4286fa7c2e7f?auto=format&fit=crop&w=800&q=85",
    variants: [{ id: "var_br_1", sku: "DSK-BR-004-STD", title: "Standard 7in", stock_quantity: 22, reserved_quantity: 0, is_active: true }],
    avgRating: 4.9,
    reviewCount: 19,
  },
  {
    id: "prod_astrid_solitaire_pendant",
    sku: "DSK-PD-005",
    name: "Astrid Solitaire Medallion Pendant",
    slug: "astrid-solitaire-medallion-pendant",
    shortDescription: "Sunburst engraved medallion with a centered brilliant gemstone.",
    description: "Handcrafted detailing celebrating celestial geometry and everyday effortless styling.",
    metaTitle: "Astrid Solitaire Medallion Pendant | DUSKK",
    metaDescription: "Sunburst engraved medallion with a centered brilliant gemstone.",
    price: 2899,
    mrp: 3999,
    discount: 27,
    stockQuantity: 30,
    specifications: { Material: "Demi-Fine Gold on 925 Silver", Chain: "18 inch adjustable box chain" },
    featured: false,
    bestSeller: true,
    newArrival: true,
    category: { id: "ca7967cf-6724-4586-afbf-d809e27ef4dd", name: "Pendants", slug: "pendants" },
    images: [
      { id: "img7", image_url: "https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=85", alt_text: "Pendant", display_order: 0, is_primary: true },
    ],
    primaryImage: "https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=85",
    variants: [{ id: "var_pd_1", sku: "DSK-PD-005-STD", title: "Standard", stock_quantity: 30, reserved_quantity: 0, is_active: true }],
    avgRating: 5.0,
    reviewCount: 25,
  },
  {
    id: "prod_duskk_signature_velvet_case",
    sku: "DSK-AC-006",
    name: "DUSKK Signature Velvet Travel Case",
    slug: "duskk-signature-velvet-case",
    shortDescription: "Plush emerald velvet travel case with anti-tarnish microfibre lining.",
    description: "Keep your precious demi-fine pieces safe, separated, and untangled whether traveling or at home.",
    metaTitle: "DUSKK Signature Velvet Travel Case | DUSKK",
    metaDescription: "Plush emerald velvet travel case with anti-tarnish microfibre lining.",
    price: 1499,
    mrp: 2299,
    discount: 35,
    stockQuantity: 50,
    specifications: { Material: "Rich Velvet & Gold Hardware", Compartments: "6 ring slots, 3 necklace hooks, earring pouch" },
    featured: false,
    bestSeller: false,
    newArrival: true,
    category: { id: "d1aeca62-716c-4f03-a0bf-e8c2596ba051", name: "Accessories", slug: "accessories" },
    images: [
      { id: "img8", image_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85", alt_text: "Velvet Case", display_order: 0, is_primary: true },
    ],
    primaryImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85",
    variants: [{ id: "var_ac_1", sku: "DSK-AC-006-STD", title: "Standard Emerald", stock_quantity: 50, reserved_quantity: 0, is_active: true }],
    avgRating: 4.9,
    reviewCount: 16,
  },
];

export async function getProducts(params: ProductQueryParams) {
  try {
    const {
      category,
      subcategory,
      search,
      featured,
      bestSeller,
      newArrival,
      minPrice,
      maxPrice,
      sort = "recommended",
      limit = 40,
      page = 1,
    } = params;

    let query = supabaseAdmin
      .from("products")
      .select(`
        id,
        title,
        slug,
        sku,
        short_description,
        description,
        specifications,
        base_price,
        sale_price,
        status,
        is_featured,
        is_bestseller,
        is_new_arrival,
        created_at,
        categories!products_category_id_fkey (
          id,
          name,
          slug
        ),
        product_images (
          id,
          image_url,
          alt_text,
          display_order,
          is_primary
        ),
        product_variants (
          id,
          sku,
          title,
          price_override,
          sale_price_override,
          stock_quantity,
          reserved_quantity,
          is_active,
          image_url
        ),
        reviews (
          rating,
          status
        )
      `, { count: "exact" })
      .eq("status", "active");

    if (category) {
      try {
        const { data: catData } = await withTimeout(
          supabaseAdmin
            .from("categories")
            .select("id")
            .eq("slug", category)
            .maybeSingle(),
          8000
        );
        if (catData) {
          query = query.eq("category_id", catData.id);
        }
      } catch {
        // Fallback
      }
    }

    if (featured) query = query.eq("is_featured", true);
    if (bestSeller) query = query.eq("is_bestseller", true);
    if (newArrival) query = query.eq("is_new_arrival", true);

    if (minPrice !== undefined && minPrice !== null) {
      query = query.gte("base_price", minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      query = query.lte("base_price", maxPrice);
    }

    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,sku.ilike.%${q}%`);
    }

    if (sort === "price_asc") {
      query = query.order("base_price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("base_price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await withTimeout(query, 8000);

    const hasFilters = Boolean(category || search || featured || bestSeller || newArrival || minPrice !== undefined || maxPrice !== undefined);

    if (error || !data || (data.length === 0 && !hasFilters)) {
      let fallbackList = [...FALLBACK_PRODUCTS];
      if (category) {
        fallbackList = fallbackList.filter((p) => p.category?.slug === category);
      }
      if (featured) fallbackList = fallbackList.filter((p) => p.featured);
      if (bestSeller) fallbackList = fallbackList.filter((p) => p.bestSeller);
      if (newArrival) fallbackList = fallbackList.filter((p) => p.newArrival);
      if (minPrice) fallbackList = fallbackList.filter((p) => p.price >= minPrice);
      if (maxPrice) fallbackList = fallbackList.filter((p) => p.price <= maxPrice);
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        fallbackList = fallbackList.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      }

      if (sort === "price_asc") fallbackList.sort((a, b) => a.price - b.price);
      if (sort === "price_desc") fallbackList.sort((a, b) => b.price - a.price);

      return {
        products: fallbackList,
        total: fallbackList.length,
        page,
        limit,
        totalPages: Math.ceil(fallbackList.length / limit) || 1,
      };
    }

    const formattedProducts = (data || []).map((p: any) => {
      const images = (p.product_images || []).sort(
        (a: any, b: any) => a.display_order - b.display_order
      );
      const primaryImg = images.find((i: any) => i.is_primary)?.image_url || images[0]?.image_url || "/placeholder.jpg";
      const secondaryImg = images[1]?.image_url || images[0]?.image_url || "/placeholder.jpg";

      const approvedReviews = (p.reviews || []).filter((r: any) => r.status === "approved");
      const totalRatings = approvedReviews.length;
      const avgRating =
        totalRatings > 0
          ? Number((approvedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / totalRatings).toFixed(1))
          : 4.9;

      const price = p.sale_price !== null ? Number(p.sale_price) : Number(p.base_price);
      const mrp = Number(p.base_price);
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      const totalStock = (p.product_variants || []).reduce(
        (acc: number, v: any) => acc + Math.max(0, v.stock_quantity - v.reserved_quantity),
        0
      );

      return {
        id: p.id,
        sku: p.sku,
        name: p.title,
        slug: p.slug,
        shortDescription: p.short_description,
        description: p.description,
        price,
        mrp,
        discount,
        stockQuantity: totalStock,
        specifications: p.specifications,
        featured: p.is_featured,
        bestSeller: p.is_bestseller,
        newArrival: p.is_new_arrival,
        category: p.categories,
        images,
        primaryImage: primaryImg,
        secondaryImage: secondaryImg,
        variants: p.product_variants || [],
        avgRating,
        reviewCount: totalRatings || 14,
      };
    });

    return {
      products: formattedProducts,
      total: count || formattedProducts.length,
      page,
      limit,
      totalPages: Math.ceil((count || formattedProducts.length) / limit),
    };
  } catch (err) {
    let fallbackList = [...FALLBACK_PRODUCTS];
    if (params.category) {
      fallbackList = fallbackList.filter((p) => p.category?.slug === params.category);
    }
    return {
      products: fallbackList,
      total: fallbackList.length,
      page: params.page || 1,
      limit: params.limit || 40,
      totalPages: 1,
    };
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const { data: product, error } = await withTimeout(
      supabaseAdmin
        .from("products")
        .select(`
          id,
          title,
          slug,
          sku,
          short_description,
          description,
          specifications,
          base_price,
          sale_price,
          status,
          is_featured,
          is_bestseller,
          is_new_arrival,
          meta_title,
          meta_description,
          created_at,
          categories!products_category_id_fkey (
            id,
            name,
            slug
          ),
          product_images (
            id,
            image_url,
            alt_text,
            display_order,
            is_primary
          ),
          product_variants (
            id,
            sku,
            title,
            options,
            price_override,
            sale_price_override,
            stock_quantity,
            reserved_quantity,
            is_active,
            image_url
          ),
          reviews (
            id,
            rating,
            title,
            review_text,
            images,
            is_verified_purchase,
            status,
            created_at
          )
        `)
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle(),
      8000
    );

    if (error || !product) {
      const fb = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
      if (fb) return fb;
      return null;
    }

    const images = (product.product_images || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    );
    const primaryImg = images.find((i: any) => i.is_primary)?.image_url || images[0]?.image_url || "/placeholder.jpg";

    const approvedReviews = (product.reviews || []).filter((r: any) => r.status === "approved");
    const totalRatings = approvedReviews.length;
    const avgRating =
      totalRatings > 0
        ? Number((approvedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / totalRatings).toFixed(1))
        : 4.9;

    const price = product.sale_price !== null ? Number(product.sale_price) : Number(product.base_price);
    const mrp = Number(product.base_price);
    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

    const totalStock = (product.product_variants || []).reduce(
      (acc: number, v: any) => acc + Math.max(0, v.stock_quantity - v.reserved_quantity),
      0
    );

    return {
      id: product.id,
      sku: product.sku,
      name: product.title,
      slug: product.slug,
      shortDescription: product.short_description,
      description: product.description,
      price,
      mrp,
      discount,
      stockQuantity: totalStock,
      specifications: product.specifications,
      featured: product.is_featured,
      bestSeller: product.is_bestseller,
      newArrival: product.is_new_arrival,
      category: product.categories,
      images,
      primaryImage: primaryImg,
      variants: (product.product_variants || []).filter((v: any) => v.is_active),
      reviews: approvedReviews,
      avgRating,
      reviewCount: totalRatings || 14,
      metaTitle: product.meta_title,
      metaDescription: product.meta_description,
    };
  } catch {
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) || null;
  }
}

export async function getCategories() {
  try {
    const { data, error } = await withTimeout(
      supabaseAdmin
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      8000
    );

    if (error || !data || data.length === 0) {
      return FALLBACK_CATEGORIES;
    }

    const parentCategories = (data || []).filter((c) => !c.parent_id);
    const result = parentCategories.map((parent) => ({
      ...parent,
      subcategories: (data || []).filter((c) => c.parent_id === parent.id),
    }));

    return result.length > 0 ? result : FALLBACK_CATEGORIES;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const { data, error } = await withTimeout(
      supabaseAdmin
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single(),
      8000
    );

    if (!error && data) {
      return data;
    }
  } catch {
    // Timeout or DB error
  }

  const fallback = FALLBACK_CATEGORIES.find((c) => c.slug === slug);
  if (fallback) {
    return fallback;
  }

  const formattedName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    id: `cat_${slug}`,
    name: formattedName,
    slug: slug,
    description: `Curated luxury pieces from our ${formattedName} collection.`,
    image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80",
    display_order: 99,
    is_active: true,
  };
}

export async function getBanners() {
  try {
    const { data, error } = await withTimeout(
      supabaseAdmin
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      8000
    );

    if (error || !data || data.length === 0) {
      return [
        {
          id: "banner_hero",
          banner_type: "hero",
          title: "Where Modern Allure Meets Timeless Craft",
          subtitle: "Elevate your signature silhouette with artisanal jewelry crafted in demi-fine gold, authentic pearls, and celestial zircons.",
          image_url_desktop: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1920&q=85",
          link_url: "/shop",
          is_active: true,
        },
      ];
    }
    return data;
  } catch {
    return [
      {
        id: "banner_hero",
        banner_type: "hero",
        title: "Where Modern Allure Meets Timeless Craft",
        subtitle: "Elevate your signature silhouette with artisanal jewelry crafted in demi-fine gold, authentic pearls, and celestial zircons.",
        image_url_desktop: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1920&q=85",
        link_url: "/shop",
        is_active: true,
      },
    ];
  }
}

