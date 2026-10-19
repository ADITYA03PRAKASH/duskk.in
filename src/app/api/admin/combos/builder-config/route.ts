import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { getCustomComboSettings, updateCustomComboSettings } from "@/services/combo.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCategories } from "@/services/catalog.service";
import { CustomComboSettings } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const [settings, categories, { data: products }] = await Promise.all([
      getCustomComboSettings(),
      getCategories(),
      supabaseAdmin
        .from("products")
        .select(`
          id,
          title,
          sku,
          base_price,
          sale_price,
          category_id,
          status,
          product_images (
            image_url,
            is_primary
          )
        `)
        .eq("status", "active")
        .order("title", { ascending: true }),
    ]);

    const formattedProducts = (products || []).map((p: any) => {
      const primaryImg =
        p.product_images?.find((img: any) => img.is_primary)?.image_url ||
        p.product_images?.[0]?.image_url ||
        null;
      return {
        id: p.id,
        title: p.title,
        sku: p.sku,
        basePrice: Number(p.base_price || 0),
        salePrice: p.sale_price !== null ? Number(p.sale_price) : null,
        categoryId: p.category_id,
        image: primaryImg,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        settings,
        categories: (categories || []).filter((c: any) => c.is_active !== false),
        products: formattedProducts,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/combos/builder-config error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load builder settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

async function handleUpdate(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const minItems = parseInt(body.minItems, 10);
    const maxItems = parseInt(body.maxItems, 10);
    const minQty = parseInt(body.minQuantityPerProduct, 10);
    const maxQty = parseInt(body.maxQuantityPerProduct, 10);

    if (isNaN(minItems) || minItems < 1) {
      return NextResponse.json(
        { success: false, message: "Minimum items must be at least 1." },
        { status: 400 }
      );
    }

    if (isNaN(maxItems) || maxItems < minItems) {
      return NextResponse.json(
        { success: false, message: "Maximum items must be greater than or equal to minimum items." },
        { status: 400 }
      );
    }

    if (isNaN(minQty) || minQty < 1) {
      return NextResponse.json(
        { success: false, message: "Minimum quantity per product must be at least 1." },
        { status: 400 }
      );
    }

    if (isNaN(maxQty) || maxQty < minQty) {
      return NextResponse.json(
        { success: false, message: "Maximum quantity per product must be greater than or equal to minimum quantity." },
        { status: 400 }
      );
    }

    const discountType = body.discountType;
    if (!["none", "percentage", "fixed_amount"].includes(discountType)) {
      return NextResponse.json(
        { success: false, message: "Invalid discount model selected." },
        { status: 400 }
      );
    }

    const discountValue = Number(body.discountValue || 0);
    if (isNaN(discountValue) || discountValue < 0) {
      return NextResponse.json(
        { success: false, message: "Discount value cannot be negative." },
        { status: 400 }
      );
    }

    if (discountType === "percentage" && discountValue > 90) {
      return NextResponse.json(
        { success: false, message: "Percentage discount cannot exceed 90%." },
        { status: 400 }
      );
    }

    let maxDiscountAmount: number | null = null;
    if (body.maxDiscountAmount !== null && body.maxDiscountAmount !== undefined && body.maxDiscountAmount !== "") {
      const numMaxDisc = Number(body.maxDiscountAmount);
      if (isNaN(numMaxDisc) || numMaxDisc < 0) {
        return NextResponse.json(
          { success: false, message: "Maximum discount cap must be a positive number or empty." },
          { status: 400 }
        );
      }
      maxDiscountAmount = numMaxDisc;
    }

    if (body.startsAt && body.endsAt) {
      const startDate = new Date(body.startsAt);
      const endDate = new Date(body.endsAt);
      if (startDate > endDate) {
        return NextResponse.json(
          { success: false, message: "Promotion start date cannot be after end date." },
          { status: 400 }
        );
      }
    }

    const updatePayload: Partial<CustomComboSettings> = {
      isEnabled: Boolean(body.isEnabled),
      title: body.title?.trim() || "Build Your Own Combo",
      subtitle: body.subtitle?.trim() || "",
      eligibleCategoryIds: Array.isArray(body.eligibleCategoryIds) ? body.eligibleCategoryIds : [],
      eligibleProductIds: Array.isArray(body.eligibleProductIds) ? body.eligibleProductIds : [],
      minItems,
      maxItems,
      minQuantityPerProduct: minQty,
      maxQuantityPerProduct: maxQty,
      discountType,
      discountValue,
      maxDiscountAmount,
      allowCouponsWithCombo: Boolean(body.allowCouponsWithCombo),
      startsAt: body.startsAt || null,
      endsAt: body.endsAt || null,
      showOnHomepage: Boolean(body.showOnHomepage),
      homepageDisplayOrder: Number(body.homepageDisplayOrder || 1),
    };

    const saved = await updateCustomComboSettings(updatePayload);

    return NextResponse.json({
      success: true,
      data: saved,
      message: "Build Your Own Combo settings updated successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/admin/combos/builder-config error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update builder settings" },
      { status: 500 }
    );
  }
}
