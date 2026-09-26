import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/services/payment.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.razorpay_order_id || body.order_id;
    const paymentId = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
        },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature(orderId, paymentId, signature);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment signature. Verification failed.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      data: {
        order_id: orderId,
        payment_id: paymentId,
        verified: true,
      },
    });
  } catch (error: any) {
    console.error("POST /api/verify-payment error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}
