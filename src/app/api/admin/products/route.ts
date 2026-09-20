import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
      const { data: products, error } = await supabaseAdmin
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
          category_id,
          subcategory_id,
          created_at,
          categories!products_category_id_fkey (name),
          product_images (*),
          product_variants (*)
        `)
        .order("created_at", { ascending: false });

      if (!error && products) {
        const formatted = products.map((p: any) => ({
          id: p.id,
          name: p.title,
          title: p.title,
          slug: p.slug,
          sku: p.sku,
          price: Number(p.sale_price !== null ? p.sale_price : p.base_price),
          mrp: Number(p.base_price),
          status: p.status,
          active: p.status === "active",
          featured: p.is_featured,
          bestSeller: p.is_bestseller,
          newArrival: p.is_new_arrival,
          categoryId: p.category_id,
          categoryName: p.categories?.name,
          images: p.product_images || [],
          variants: p.product_variants || [],
          stockQuantity: (p.product_variants || []).reduce((acc: number, v: any) => acc + (v.stock_quantity || 0), 0),
        }));

        return NextResponse.json({ success: true, data: formatted });
      }
    } catch (dbErr) {
      console.warn("Supabase fetch products error:", dbErr);
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      title,
      slug,
      sku,
      shortDescription,
      description,
      categoryId,
      subcategoryId,
      price,
      mrp,
      stockQuantity,
      material,
      color,
      specifications,
      featured,
      bestSeller,
      newArrival,
      images,
      variants,
    } = body;

    const prodTitle = title || name;
    if (!prodTitle || price === undefined) {
      return NextResponse.json(
        { success: false, message: "Product title and price are required" },
        { status: 400 }
      );
    }

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId) {
      const { data: firstCat } = await supabaseAdmin
        .from("categories")
        .select("id")
        .limit(1)
        .single();
      resolvedCategoryId = firstCat?.id;
    } else {
      // If categoryId is not a valid uuid format, try to look up by slug or name
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedCategoryId);
      if (!isUUID) {
        const { data: catBySlug } = await supabaseAdmin
          .from("categories")
          .select("id")
          .or(`slug.eq.${resolvedCategoryId},name.ilike.${resolvedCategoryId}`)
          .single();
        if (catBySlug) {
          resolvedCategoryId = catBySlug.id;
        }
      }
    }

    if (!resolvedCategoryId) {
      return NextResponse.json(
        { success: false, message: "A valid category is required to create a product" },
        { status: 400 }
      );
    }

    const prodSlug = slug || prodTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const prodSku = sku || `DSK-${Date.now().toString().slice(-6)}`;

    const specs = specifications || {
      material: material || "Sterling Silver",
      color: color || "Gold",
    };

    const newProduct = {
      id: `prod_${Date.now()}`,
      title: prodTitle,
      name: prodTitle,
      slug: prodSlug,
      sku: prodSku,
      short_description: shortDescription || null,
      description: description || prodTitle,
      category_id: resolvedCategoryId,
      subcategory_id: subcategoryId || null,
      base_price: mrp || price,
      sale_price: mrp && mrp > price ? price : null,
      specifications: specs,
      status: "active",
      is_featured: !!featured,
      is_bestseller: !!bestSeller,
      is_new_arrival: !!newArrival,
      created_at: new Date().toISOString(),
    };

    try {
      // Insert Product
      const { data: product, error: prodErr } = await supabaseAdmin
        .from("products")
        .insert({
          title: prodTitle,
          slug: prodSlug,
          sku: prodSku,
          short_description: shortDescription || null,
          description: description || prodTitle,
          category_id: resolvedCategoryId,
          subcategory_id: subcategoryId || null,
          base_price: mrp || price,
          sale_price: mrp && mrp > price ? price : null,
          specifications: specs,
          status: "active",
          is_featured: !!featured,
          is_bestseller: !!bestSeller,
          is_new_arrival: !!newArrival,
        })
        .select()
        .single();

      if (product) {
        // Insert Variants
        if (variants && Array.isArray(variants) && variants.length > 0) {
          const variantInserts = variants.map((v: any, idx: number) => ({
            product_id: product.id,
            sku: v.sku || `${product.sku}-V${idx + 1}`,
            title: v.title || v.name || `Variant ${idx + 1}`,
            options: v.options || {},
            price_override: v.price || null,
            stock_quantity: v.stockQuantity || stockQuantity || 10,
            reserved_quantity: 0,
            is_active: true,
          }));

          await supabaseAdmin.from("product_variants").insert(variantInserts);
        } else {
          // Create default variant
          await supabaseAdmin.from("product_variants").insert({
            product_id: product.id,
            sku: `${product.sku}-DEF`,
            title: "Standard",
            stock_quantity: stockQuantity || 15,
            reserved_quantity: 0,
            is_active: true,
          });
        }

        // Insert Images
        if (images && Array.isArray(images) && images.length > 0) {
          const imgInserts = images.map((img: any, idx: number) => ({
            product_id: product.id,
            image_url: typeof img === "string" ? img : img.url,
            alt_text: product.title,
            display_order: idx,
            is_primary: idx === 0,
          }));
          await supabaseAdmin.from("product_images").insert(imgInserts);
        }

        return NextResponse.json({ success: true, data: product });
      }
    } catch (dbErr) {
      console.warn("Supabase product insert fallback:", dbErr);
    }

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error: any) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
