import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { processRazorpayRefund } from "@/services/payment.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { amount, reason } = body;

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return NextResponse.json(
        { success: false, message: "Refund amount must be a positive number." },
        { status: 400 }
      );
    }

    const refundResult = await processRazorpayRefund({
      orderId: params.id,
      amount: amount !== undefined ? Number(amount) : undefined,
      reason: reason?.trim() || "Admin initiated refund",
      adminEmail: admin.email,
    });

    return NextResponse.json({
      success: true,
      message: `Refund of ₹${refundResult.amount} processed successfully via Razorpay (ID: ${refundResult.refundId}).`,
      data: refundResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process refund." },
      { status: 400 }
    );
  }
}
