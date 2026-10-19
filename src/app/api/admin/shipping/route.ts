import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { getShippingSettings, updateShippingSettings } from "@/services/shipping.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCategories } from "@/services/catalog.service";
import { ShippingSettings } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const [settings, categories, { data: products }] = await Promise.all([
      getShippingSettings(),
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
    console.error("GET /api/admin/shipping error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load shipping settings" },
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

    // Validation
    const defaultCharge = Number(body.defaultCharge);
    if (isNaN(defaultCharge) || defaultCharge < 0) {
      return NextResponse.json(
        { success: false, message: "Default shipping charge must be a non-negative number." },
        { status: 400 }
      );
    }

    const methodName = (body.methodName || "").trim();
    if (!methodName) {
      return NextResponse.json(
        { success: false, message: "Shipping method name cannot be empty." },
        { status: 400 }
      );
    }

    if (body.minOrderThreshold?.isEnabled) {
      const minSubtotal = Number(body.minOrderThreshold.minSubtotal);
      if (isNaN(minSubtotal) || minSubtotal < 0) {
        return NextResponse.json(
          { success: false, message: "Free shipping minimum order subtotal must be a positive number." },
          { status: 400 }
        );
      }
    }

    if (body.scheduledPromotion?.isEnabled) {
      const startsAt = body.scheduledPromotion.startsAt ? new Date(body.scheduledPromotion.startsAt) : null;
      const endsAt = body.scheduledPromotion.endsAt ? new Date(body.scheduledPromotion.endsAt) : null;

      if (startsAt && isNaN(startsAt.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid scheduled promotion start date." },
          { status: 400 }
        );
      }

      if (endsAt && isNaN(endsAt.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid scheduled promotion end date." },
          { status: 400 }
        );
      }

      if (startsAt && endsAt && startsAt > endsAt) {
        return NextResponse.json(
          { success: false, message: "Promotion start date cannot be after end date." },
          { status: 400 }
        );
      }
    }

    const payload: Partial<ShippingSettings> = {
      isEnabled: body.isEnabled !== undefined ? Boolean(body.isEnabled) : true,
      methodName,
      defaultCharge,
      currency: body.currency?.trim() || "INR",
      estimatedDeliveryText: body.estimatedDeliveryText !== undefined ? body.estimatedDeliveryText.trim() : "",

      globalFreeShipping: {
        isEnabled: Boolean(body.globalFreeShipping?.isEnabled),
        label: body.globalFreeShipping?.label?.trim() || "Storewide Free Express Shipping Event",
      },

      minOrderThreshold: {
        isEnabled: Boolean(body.minOrderThreshold?.isEnabled),
        minSubtotal: body.minOrderThreshold?.minSubtotal !== undefined
          ? Math.max(0, Number(body.minOrderThreshold.minSubtotal))
          : 999,
        label: body.minOrderThreshold?.label?.trim() || "Free Shipping Above Minimum Order",
      },

      scheduledPromotion: {
        isEnabled: Boolean(body.scheduledPromotion?.isEnabled),
        promotionName: body.scheduledPromotion?.promotionName?.trim() || "Festive Free Shipping",
        startsAt: body.scheduledPromotion?.startsAt || null,
        endsAt: body.scheduledPromotion?.endsAt || null,
      },

      productSpecificRules: {
        isEnabled: Boolean(body.productSpecificRules?.isEnabled),
        eligibleProductIds: Array.isArray(body.productSpecificRules?.eligibleProductIds)
          ? body.productSpecificRules.eligibleProductIds
          : [],
        entireOrderFree: body.productSpecificRules?.entireOrderFree !== undefined
          ? Boolean(body.productSpecificRules.entireOrderFree)
          : true,
      },

      categorySpecificRules: {
        isEnabled: Boolean(body.categorySpecificRules?.isEnabled),
        eligibleCategoryIds: Array.isArray(body.categorySpecificRules?.eligibleCategoryIds)
          ? body.categorySpecificRules.eligibleCategoryIds
          : [],
        entireOrderFree: body.categorySpecificRules?.entireOrderFree !== undefined
          ? Boolean(body.categorySpecificRules.entireOrderFree)
          : true,
      },
    };

    const updated = await updateShippingSettings(payload);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Shipping & delivery configuration saved successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/admin/shipping error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update shipping settings" },
      { status: 500 }
    );
  }
}
