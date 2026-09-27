import { NextRequest, NextResponse } from "next/server";
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
