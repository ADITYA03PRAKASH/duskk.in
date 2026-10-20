import { NextRequest, NextResponse } from "next/server";
import { requestOrderExchange } from "@/services/order.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, email, orderItemId, reason, details, evidenceUrls } = body;

    if (!orderNumber || !email || !orderItemId || !reason) {
      return NextResponse.json(
        {
          success: false,
          message: "Order number, email, item, and exchange reason are required.",
        },
        { status: 400 }
      );
    }

    const data = await requestOrderExchange(
      orderNumber,
      email,
      orderItemId,
      reason,
      details,
      Array.isArray(evidenceUrls) ? evidenceUrls : []
    );

    return NextResponse.json({
      success: true,
      message: "Exchange request submitted successfully.",
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to submit exchange request.",
      },
      { status: 400 }
    );
  }
}
