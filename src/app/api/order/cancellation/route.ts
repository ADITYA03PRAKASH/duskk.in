import { NextRequest, NextResponse } from "next/server";
import { requestOrderCancellation } from "@/services/order.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, email, reason, details } = body;

    if (!orderNumber || !email || !reason) {
      return NextResponse.json(
        {
          success: false,
          message: "Order number, email, and cancellation reason are required.",
        },
        { status: 400 }
      );
    }

    const data = await requestOrderCancellation(
      orderNumber,
      email,
      reason,
      details
    );

    return NextResponse.json({
      success: true,
      message: "Cancellation request submitted successfully.",
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to submit cancellation request.",
      },
      { status: 400 }
    );
  }
}
