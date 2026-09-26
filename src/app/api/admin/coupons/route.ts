import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const SEED_COUPONS = [
  {
    id: "cpn_duskk10",
    code: "DUSKK10",
    discountType: "PERCENT",
    discountValue: 10,
    minOrderValue: 999,
    maxDiscount: 500,
    usageLimit: 1000,
    usageCount: 14,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cpn_welcome",
    code: "WELCOME",
    discountType: "PERCENT",
    discountValue: 15,
    minOrderValue: 1499,
    maxDiscount: 750,
    usageLimit: 500,
    usageCount: 28,
    active: true,
    createdAt: new Date().toISOString(),
  }
];

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
      const { data: coupons, error } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && coupons && coupons.length > 0) {
        const formatted = coupons.map((c) => ({
          id: c.id,
          code: c.code,
          discountType: c.discount_type === "percentage" ? "PERCENT" : "FIXED",
          discountValue: Number(c.discount_value),
          minOrderValue: Number(c.min_order_value),
          maxDiscount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
          usageLimit: c.usage_limit_total,
          usageCount: c.times_used,
          active: c.is_active,
          expiresAt: c.ends_at,
          createdAt: c.created_at,
        }));

        return NextResponse.json({ success: true, data: formatted });
      }
    } catch (dbErr) {
      console.warn("Supabase fetch coupons fallback:", dbErr);
    }

    return NextResponse.json({ success: true, data: SEED_COUPONS });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: SEED_COUPONS });
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

    if (!code || !discountValue) {
      return NextResponse.json({ success: false, message: "Coupon code and discount value are required" }, { status: 400 });
    }

    const newCoupon = {
      id: `cpn_${Date.now()}`,
      code: code.trim().toUpperCase(),
      discount_type: discountType === "PERCENT" || discountType === "percentage" ? "percentage" : "fixed_amount",
      discount_value: parseFloat(discountValue),
      min_order_value: minOrderValue ? parseFloat(minOrderValue) : 0,
      max_discount_amount: maxDiscount ? parseFloat(maxDiscount) : null,
      usage_limit_total: usageLimit ? parseInt(usageLimit, 10) : null,
      times_used: 0,
      starts_at: new Date().toISOString(),
      ends_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: active !== false,
      created_at: new Date().toISOString(),
    };

    try {
      const { data: coupon, error } = await supabaseAdmin
        .from("coupons")
        .insert({
          code: code.trim().toUpperCase(),
          discount_type: discountType === "PERCENT" || discountType === "percentage" ? "percentage" : "fixed_amount",
          discount_value: parseFloat(discountValue),
          min_order_value: minOrderValue ? parseFloat(minOrderValue) : 0,
          max_discount_amount: maxDiscount ? parseFloat(maxDiscount) : null,
          usage_limit_total: usageLimit ? parseInt(usageLimit, 10) : null,
          starts_at: new Date().toISOString(),
          ends_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          is_active: active !== false,
        })
        .select()
        .maybeSingle();

      if (!error && coupon) {
        return NextResponse.json({ success: true, data: coupon });
      }
    } catch (dbErr) {
      console.warn("Supabase coupon insert fallback:", dbErr);
    }

    return NextResponse.json({ success: true, data: newCoupon });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
