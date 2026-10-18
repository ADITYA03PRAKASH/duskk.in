import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data: coupons, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch coupons error:", error);
      throw new Error(error.message);
    }

    const formatted = (coupons || []).map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discount_type === "percentage" ? "PERCENT" : "FIXED",
      discountValue: Number(c.discount_value),
      minOrderValue: Number(c.min_order_value || 0),
      maxDiscount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
      usageLimit: c.usage_limit_total,
      usageLimitPerCustomer: c.usage_limit_per_customer,
      usageCount: c.times_used || 0,
      active: c.is_active,
      startsAt: c.starts_at,
      expiresAt: c.ends_at,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("GET /api/admin/coupons error:", error);
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
    const { code, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, expiresAt, active } = body;

    if (!code || discountValue === undefined || discountValue === "") {
      return NextResponse.json({ success: false, message: "Coupon code and discount value are required" }, { status: 400 });
    }

    const numDiscountValue = parseFloat(discountValue.toString());
    if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
      return NextResponse.json({ success: false, message: "Discount value must be a positive number" }, { status: 400 });
    }

    const dType = discountType === "PERCENT" || discountType === "percentage" ? "percentage" : "fixed_amount";

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .insert({
        code: code.trim().toUpperCase(),
        discount_type: dType,
        discount_value: numDiscountValue,
        min_order_value: minOrderValue ? Math.max(0, parseFloat(minOrderValue.toString()) || 0) : 0,
        max_discount_amount: maxDiscount ? Math.max(0, parseFloat(maxDiscount.toString()) || 0) : null,
        usage_limit_total: usageLimit ? Math.max(1, parseInt(usageLimit.toString(), 10) || 1) : null,
        starts_at: new Date().toISOString(),
        ends_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: active !== false,
      })
      .select()
      .single();

    if (error || !coupon) {
      console.error("Supabase coupon insert error:", error);
      throw new Error(error?.message || "Failed to create coupon in database");
    }

    try {
      revalidatePath("/", "page");
    } catch (revErr) {
      console.warn("[CouponsRoute] Revalidation warning:", revErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type === "percentage" ? "PERCENT" : "FIXED",
        discountValue: Number(coupon.discount_value),
        minOrderValue: Number(coupon.min_order_value || 0),
        maxDiscount: coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null,
        usageLimit: coupon.usage_limit_total,
        usageCount: coupon.times_used || 0,
        active: coupon.is_active,
        createdAt: coupon.created_at,
      },
    });
  } catch (error: any) {
    console.error("POST /api/admin/coupons error:", error);
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
    const { id, code, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, expiresAt, active } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Coupon ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (active !== undefined) updates.is_active = !!active;
    if (discountType !== undefined) {
      updates.discount_type = (discountType === "PERCENT" || discountType === "percentage") ? "percentage" : "fixed_amount";
    }
    if (discountValue !== undefined) {
      const val = parseFloat(discountValue.toString());
      if (!isNaN(val) && val > 0) updates.discount_value = val;
    }
    if (minOrderValue !== undefined) {
      updates.min_order_value = Math.max(0, parseFloat(minOrderValue.toString()) || 0);
    }
    if (maxDiscount !== undefined) {
      updates.max_discount_amount = maxDiscount ? Math.max(0, parseFloat(maxDiscount.toString()) || 0) : null;
    }
    if (usageLimit !== undefined) {
      updates.usage_limit_total = usageLimit ? Math.max(1, parseInt(usageLimit.toString(), 10) || 1) : null;
    }
    if (expiresAt !== undefined) {
      updates.ends_at = expiresAt ? new Date(expiresAt).toISOString() : null;
    }

    const { data: updated, error } = await supabaseAdmin
      .from("coupons")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      console.error("Supabase coupon update error:", error);
      throw new Error(error?.message || "Failed to update coupon");
    }

    try {
      revalidatePath("/", "page");
    } catch (revErr) {
      console.warn("[CouponsRoute] Revalidation warning:", revErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        code: updated.code,
        discountType: updated.discount_type === "percentage" ? "PERCENT" : "FIXED",
        discountValue: Number(updated.discount_value),
        minOrderValue: Number(updated.min_order_value || 0),
        maxDiscount: updated.max_discount_amount ? Number(updated.max_discount_amount) : null,
        usageLimit: updated.usage_limit_total,
        usageCount: updated.times_used || 0,
        active: updated.is_active,
        createdAt: updated.created_at,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/coupons error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const idFromQuery = url.searchParams.get("id");
    let couponId = idFromQuery;

    if (!couponId) {
      try {
        const body = await req.json();
        couponId = body.id;
      } catch {
        // no body
      }
    }

    if (!couponId) {
      return NextResponse.json({ success: false, message: "Coupon ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("coupons")
      .delete()
      .eq("id", couponId);

    if (error) {
      console.error("Supabase coupon delete error:", error);
      throw new Error(error.message);
    }

    try {
      revalidatePath("/", "page");
    } catch (revErr) {
      console.warn("[CouponsRoute] Revalidation warning:", revErr);
    }

    return NextResponse.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/admin/coupons error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
