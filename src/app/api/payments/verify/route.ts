import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/services/payment.service";
import { confirmOrderPayment } from "@/services/order.service";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
        { success: false, message: "Missing Razorpay verification parameters (order_id, payment_id, or signature)" },
        { status: 400 }
      );
    }

    // 1. Authoritative check: Validate that Razorpay order was initiated by DUSKK
    const { data: existingPayment, error: payLookupError } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        order_id,
        amount,
        currency,
        status,
        orders (
          id,
          order_number,
          status,
          grand_total,
          customer_snapshot
        )
      `)
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (payLookupError || !existingPayment) {
      return NextResponse.json(
        { success: false, message: "Order payment record not found for the provided Razorpay order ID." },
        { status: 404 }
      );
    }

    const orderRow = existingPayment.orders as any;

    // Idempotency: If already confirmed or paid, return success immediately
    if (orderRow && ["CONFIRMED", "PAID", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderRow.status)) {
      const custSnap = orderRow.customer_snapshot as any;
      return NextResponse.json({
        success: true,
        message: "Payment already verified and order confirmed.",
        data: {
          orderNumber: orderRow.order_number,
          customerName: `${custSnap?.first_name || ""} ${custSnap?.last_name || ""}`.trim(),
          customerEmail: custSnap?.email,
          totalAmount: orderRow.grand_total,
          orderStatus: orderRow.status,
        },
      });
    }

    // 2. Cryptographic HMAC-SHA256 Signature Verification
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.warn(`Tampered or invalid payment signature attempt for Razorpay order: ${razorpay_order_id}`);
      return NextResponse.json(
        { success: false, message: "Invalid payment signature verification failed." },
        { status: 400 }
      );
    }

    // 3. Concurrency-safe atomic payment confirmation RPC & inventory settlement
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
