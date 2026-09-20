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
      status,
      featured,
      bestSeller,
      newArrival,
      specifications,
    } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (title || name) updates.title = title || name;
    if (shortDescription !== undefined) updates.short_description = shortDescription;
    if (description !== undefined) updates.description = description;
    if (categoryId) updates.category_id = categoryId;
    if (subcategoryId !== undefined) updates.subcategory_id = subcategoryId || null;
    if (mrp !== undefined) updates.base_price = mrp;
    if (price !== undefined) updates.sale_price = price;
    if (status) updates.status = status;
    if (featured !== undefined) updates.is_featured = featured;
    if (bestSeller !== undefined) updates.is_bestseller = bestSeller;
    if (newArrival !== undefined) updates.is_new_arrival = newArrival;
    if (specifications) updates.specifications = specifications;

    const { data: updated, error } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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
