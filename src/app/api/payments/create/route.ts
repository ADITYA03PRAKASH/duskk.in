import { NextRequest, NextResponse } from "next/server";
import { initiateCheckoutOrder } from "@/services/order.service";
import { CheckoutPayload } from "@/types";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutPayload = await req.json();
    const { customer, shippingAddress, items } = body;

    // Strict payload validation
    if (!customer?.name?.trim() || !customer?.email?.trim() || !customer?.phone?.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide complete customer name, email, and mobile number." },
        { status: 400 }
      );
    }

    if (
      !shippingAddress?.addressLine1?.trim() ||
      !shippingAddress?.city?.trim() ||
      !shippingAddress?.state?.trim() ||
      !shippingAddress?.pincode?.trim()
    ) {
      return NextResponse.json(
        { success: false, message: "Please provide a complete shipping address (Address, City, State, Pincode)." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart cannot be empty." },
        { status: 400 }
      );
    }

    // Check optional authenticated user session
    const session = await getSessionUser();
    const userId = session?.id || null;

    const result = await initiateCheckoutOrder(body, userId);

    return NextResponse.json({
      success: true,
      data: {
        orderId: result.order.id,
        orderNumber: result.order.order_number,
        razorpayOrderId: result.razorpayOrder.id,
        amount: result.calculation.totalAmount,
        currency: "INR",
        customer: {
          name: `${customer.name}`.trim(),
          email: customer.email.trim(),
          phone: customer.phone.trim(),
        },
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
      },
    });
  } catch (error: any) {
    console.error("POST /api/payments/create error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to initialize payment." },
      { status: 400 }
    );
  }
}
