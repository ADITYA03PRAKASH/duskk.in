import { NextRequest, NextResponse } from "next/server";
import { validateAndCalculateCart } from "@/services/pricing.service";
import { CartItemInput } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, couponCode } = body as { items: CartItemInput[]; couponCode?: string };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty" },
        { status: 400 }
      );
    }

    const calculation = await validateAndCalculateCart(items, couponCode);

    return NextResponse.json({
      success: true,
      data: calculation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to validate cart" },
      { status: 400 }
    );
  }
}
