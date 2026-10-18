import { NextResponse } from "next/server";
import { getPromotionalCoupon } from "@/services/pricing.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const coupon = await getPromotionalCoupon();
    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error: any) {
    console.error("GET /api/promotions/coupon error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch promotional coupon" },
      { status: 500 }
    );
  }
}
