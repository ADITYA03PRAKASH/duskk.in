import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select(`
        id,
        title,
        slug,
        sku,
        base_price,
        sale_price,
        status,
        categories!products_category_id_fkey (
          id,
          name,
          slug
        ),
        product_images (
          image_url,
          is_primary,
          display_order
        ),
        product_variants (
          id,
          sku,
          title,
          stock_quantity,
          reserved_quantity,
          is_active
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching inventory from Supabase:", error);
      throw new Error(error.message);
    }

    const formattedProducts = (products || []).map((p: any) => {
      const primaryImg =
        (p.product_images || []).find((img: any) => img.is_primary)?.image_url ||
        p.product_images?.[0]?.image_url ||
        "/placeholder.jpg";

      const totalStock = (p.product_variants || []).reduce(
        (acc: number, v: any) => acc + (v.stock_quantity || 0),
        0
      );

      const price = p.sale_price !== null ? Number(p.sale_price) : Number(p.base_price);

      return {
        id: p.id,
        name: p.title,
        title: p.title,
        sku: p.sku,
        slug: p.slug,
        category: p.categories,
        price,
        mrp: Number(p.base_price),
        stockQuantity: totalStock,
        image: primaryImg,
        variants: p.product_variants || [],
        status: p.status,
      };
    });

    const totalItems = formattedProducts.length;
    const lowStock = formattedProducts.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 10).length;
    const outOfStock = formattedProducts.filter((p) => p.stockQuantity <= 0).length;

    let filtered = formattedProducts;
    if (filter === "low") {
      filtered = formattedProducts.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 10);
    } else if (filter === "out") {
      filtered = formattedProducts.filter((p) => p.stockQuantity <= 0);
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalItems,
          lowStock,
          outOfStock,
        },
        products: filtered,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/inventory error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, variantId, stockQuantity } = body;

    if ((!productId && !variantId) || stockQuantity === undefined) {
      return NextResponse.json(
        { success: false, message: "Product/Variant ID and stock quantity are required" },
        { status: 400 }
      );
    }

    const targetStock = Math.max(0, parseInt(stockQuantity.toString(), 10) || 0);

    if (variantId) {
      const { data: variant, error: varErr } = await supabaseAdmin
        .from("product_variants")
        .select("id, stock_quantity, reserved_quantity, product_id")
        .eq("id", variantId)
        .maybeSingle();

      if (varErr || !variant) throw new Error("Variant not found");

      const diff = targetStock - variant.stock_quantity;

      await supabaseAdmin
        .from("product_variants")
        .update({ stock_quantity: targetStock, updated_at: new Date().toISOString() })
        .eq("id", variantId);

      await supabaseAdmin.from("inventory_logs").insert({
        variant_id: variantId,
        change_type: "manual_adjustment",
        quantity_change: diff,
        stock_after: targetStock,
        reserved_after: variant.reserved_quantity,
        reference_id: `admin:${admin.id}`,
        notes: "Inline stock adjustment from admin inventory panel",
      });
    } else if (productId) {
      const { data: variants, error: varErr } = await supabaseAdmin
        .from("product_variants")
        .select("id, stock_quantity, reserved_quantity, sku")
        .eq("product_id", productId);

      if (varErr) throw new Error(varErr.message);

      if (variants && variants.length > 0) {
        const primaryVariant = variants[0];
        const diff = targetStock - primaryVariant.stock_quantity;

        await supabaseAdmin
          .from("product_variants")
          .update({ stock_quantity: targetStock, updated_at: new Date().toISOString() })
          .eq("id", primaryVariant.id);

        await supabaseAdmin.from("inventory_logs").insert({
          variant_id: primaryVariant.id,
          change_type: "manual_adjustment",
          quantity_change: diff,
          stock_after: targetStock,
          reserved_after: primaryVariant.reserved_quantity,
          reference_id: `admin:${admin.id}`,
          notes: "Inline stock adjustment from admin inventory panel",
        });
      } else {
        const { data: prod } = await supabaseAdmin
          .from("products")
          .select("sku")
          .eq("id", productId)
          .single();

        const { data: createdVar } = await supabaseAdmin
          .from("product_variants")
          .insert({
            product_id: productId,
            title: "Standard",
            sku: prod?.sku || `DSK-${Date.now().toString().slice(-6)}`,
            stock_quantity: targetStock,
            reserved_quantity: 0,
            is_active: true,
          })
          .select()
          .single();

        if (createdVar) {
          await supabaseAdmin.from("inventory_logs").insert({
            variant_id: createdVar.id,
            change_type: "manual_adjustment",
            quantity_change: targetStock,
            stock_after: targetStock,
            reserved_after: 0,
            reference_id: `admin:${admin.id}`,
            notes: "Initial inventory setup",
          });
        }
      }
    }

    try {
      revalidatePath("/", "page");
      revalidatePath("/shop", "page");
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully",
      newStock: targetStock,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/inventory error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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

    const { data: variant, error: fetchErr } = await supabaseAdmin
      .from("product_variants")
      .select("stock_quantity, reserved_quantity")
      .eq("id", variantId)
      .maybeSingle();

    if (fetchErr || !variant) {
      throw new Error("Variant not found");
    }

    const newStock = Math.max(0, variant.stock_quantity + parseInt(quantityChange, 10));

    await supabaseAdmin
      .from("product_variants")
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq("id", variantId);

    await supabaseAdmin.from("inventory_logs").insert({
      variant_id: variantId,
      change_type: "manual_adjustment",
      quantity_change: parseInt(quantityChange, 10),
      stock_after: newStock,
      reserved_after: variant.reserved_quantity,
      reference_id: `admin:${admin.id}`,
      notes: notes || "Manual stock adjustment by admin",
    });

    try {
      revalidatePath("/", "page");
      revalidatePath("/shop", "page");
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully",
      newStock,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
