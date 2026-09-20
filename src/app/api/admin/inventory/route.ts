import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
      const { data: variants, error } = await supabaseAdmin
        .from("product_variants")
        .select(`
          id,
          sku,
          title,
          stock_quantity,
          reserved_quantity,
          is_active,
          products (
            id,
            title,
            slug
          )
        `)
        .order("stock_quantity", { ascending: true });

      if (!error && variants) {
        const formatted = variants.map((v: any) => ({
          id: v.id,
          sku: v.sku,
          variantTitle: v.title,
          productId: v.products?.id,
          productName: v.products?.title,
          productSlug: v.products?.slug,
          stockQuantity: v.stock_quantity,
          reservedQuantity: v.reserved_quantity,
          availableQuantity: Math.max(0, v.stock_quantity - v.reserved_quantity),
        }));

        return NextResponse.json({ success: true, data: formatted });
      }
    } catch (dbErr) {
      console.warn("Supabase fetch inventory fallback:", dbErr);
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
    const { variantId, quantityChange, notes } = body;

    if (!variantId || quantityChange === undefined) {
      return NextResponse.json(
        { success: false, message: "Variant ID and quantity change are required" },
        { status: 400 }
      );
    }

    // Fetch current variant
    const { data: variant, error: fetchErr } = await supabaseAdmin
      .from("product_variants")
      .select("stock_quantity, reserved_quantity")
      .eq("id", variantId)
      .single();

    if (fetchErr || !variant) {
      throw new Error("Variant not found");
    }

    const newStock = Math.max(0, variant.stock_quantity + parseInt(quantityChange, 10));

    // Update variant stock
    await supabaseAdmin
      .from("product_variants")
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq("id", variantId);

    // Record inventory log
    await supabaseAdmin.from("inventory_logs").insert({
      variant_id: variantId,
      change_type: "manual_adjustment",
      quantity_change: parseInt(quantityChange, 10),
      stock_after: newStock,
      reserved_after: variant.reserved_quantity,
      reference_id: `admin:${admin.id}`,
      notes: notes || "Manual stock adjustment by admin",
    });

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully",
      newStock,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
