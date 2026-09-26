import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/services/payment.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", receipt, notes } = body;

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, message: "Missing required parameter: amount" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount must be at least 100 paise (1 INR).",
        },
        { status: 400 }
      );
    }

    const order = await createRazorpayOrder({
      amountInPaise: numAmount,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    });
  } catch (error: any) {
    console.error("POST /api/create-order error:", error);
    const status = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create order.",
      },
      { status }
    );
  }
}
