import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/services/payment.service";
import { confirmOrderPayment } from "@/services/order.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_method,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing Razorpay verification parameters" },
        { status: 400 }
      );
    }

    // 1. Verify HMAC Signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature verification failed." },
        { status: 400 }
      );
    }

    // 2. Concurrency-safe payment confirmation RPC
    const confirmedOrder = await confirmOrderPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_method || "razorpay_card_upi"
    );

    const customerSnapshot = confirmedOrder.customer_snapshot as any;

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and order confirmed.",
      data: {
        orderNumber: confirmedOrder.order_number,
        customerName: `${customerSnapshot?.first_name || ""} ${customerSnapshot?.last_name || ""}`.trim(),
        customerEmail: customerSnapshot?.email,
        totalAmount: confirmedOrder.grand_total,
        orderStatus: confirmedOrder.status,
      },
    });
  } catch (error: any) {
    console.error("POST /api/payments/verify error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Payment verification failed." },
      { status: 500 }
    );
  }
}
