import { NextRequest, NextResponse } from "next/server";
import { trackCustomerOrder } from "@/services/order.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, email } = body;

    if (!orderNumber || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide both Order Number and Email Address.",
        },
        { status: 400 }
      );
    }

    const orderData = await trackCustomerOrder(orderNumber, email);

    return NextResponse.json({
      success: true,
      data: orderData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to locate order" },
      { status: 404 }
    );
  }
}
