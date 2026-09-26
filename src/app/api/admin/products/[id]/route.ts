import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select(`
        *,
        product_images (*),
        product_variants (*)
      `)
      .eq("id", params.id)
      .single();

    if (error || !product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      name,
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
      status,
      featured,
      bestSeller,
      newArrival,
      images,
      variants,
    } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const prodTitle = title || name;
    if (prodTitle) {
      updates.title = prodTitle;
      updates.name = prodTitle;
    }
    if (shortDescription !== undefined) updates.short_description = shortDescription;
    if (description !== undefined) updates.description = description;

    // Validate/resolve category UUID if provided
    if (categoryId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
      if (isUUID) {
        updates.category_id = categoryId;
      } else {
        const { data: cat } = await supabaseAdmin
          .from("categories")
          .select("id")
          .or(`slug.eq.${categoryId},name.ilike.${categoryId}`)
          .maybeSingle();
        if (cat) updates.category_id = cat.id;
      }
    }

    if (subcategoryId !== undefined) updates.subcategory_id = subcategoryId || null;

    const numMrp = mrp !== undefined && mrp !== "" ? Number(mrp) : undefined;
    const numPrice = price !== undefined && price !== "" ? Number(price) : undefined;

    if (numMrp !== undefined) updates.base_price = numMrp;
    if (numPrice !== undefined) updates.sale_price = numPrice;
    if (status) updates.status = status;
    if (featured !== undefined) updates.is_featured = featured;
    if (bestSeller !== undefined) updates.is_bestseller = bestSeller;
    if (newArrival !== undefined) updates.is_new_arrival = newArrival;

    if (specifications) {
      updates.specifications = specifications;
    } else if (material || color) {
      updates.specifications = {
        material: material || "Demi-Fine Gold on 925 Sterling Silver",
        color: color || "Gold",
      };
    }

    const { data: updated, error } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Product record not found in database to update." },
        { status: 404 }
      );
    }

    // Update stock quantity on primary variant if provided
    if (stockQuantity !== undefined && stockQuantity !== "") {
      const numStock = parseInt(stockQuantity.toString(), 10) || 0;
      const { data: existingVariants } = await supabaseAdmin
        .from("product_variants")
        .select("id")
        .eq("product_id", params.id);

      if (existingVariants && existingVariants.length > 0) {
        await supabaseAdmin
          .from("product_variants")
          .update({ stock_quantity: numStock, updated_at: new Date().toISOString() })
          .eq("product_id", params.id);
      } else {
        await supabaseAdmin.from("product_variants").insert({
          product_id: params.id,
          title: "Standard",
          sku: updated.sku || `DSK-${Date.now().toString().slice(-6)}`,
          stock_quantity: numStock,
          reserved_quantity: 0,
          is_active: true,
        });
      }
    }

    // Update primary image if provided
    if (images && Array.isArray(images) && images.length > 0 && images[0]?.url) {
      const imgUrl = images[0].url;
      const { data: existingImgs } = await supabaseAdmin
        .from("product_images")
        .select("id")
        .eq("product_id", params.id);

      if (existingImgs && existingImgs.length > 0) {
        await supabaseAdmin
          .from("product_images")
          .update({ image_url: imgUrl, updated_at: new Date().toISOString() })
          .eq("id", existingImgs[0].id);
      } else {
        await supabaseAdmin.from("product_images").insert({
          product_id: params.id,
          image_url: imgUrl,
          alt_text: updated.title || "",
          display_order: 0,
          is_primary: true,
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/admin/products/[id] error:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to update product" }, { status: 500 });
  }
}

export { PUT as PATCH };

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Soft-delete by setting status = 'archived'
    const { error } = await supabaseAdmin
      .from("products")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", params.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, message: "Product archived successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
