import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, customerName, customerEmail, rating, title, comment, orderNumber } = body;

    if (!productId || !customerEmail || !rating || !comment) {
      return NextResponse.json(
        { success: false, message: "Please provide product ID, email, rating, and review text." },
        { status: 400 }
      );
    }

    // Find customer ID
    const normalizedEmail = customerEmail.trim().toLowerCase();
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    let customerId = customer?.id;
    if (!customerId) {
      const { data: newCust } = await supabaseAdmin
        .from("customers")
        .insert({
          first_name: customerName || "Customer",
          email: normalizedEmail,
          customer_type: "guest",
        })
        .select("id")
        .single();
      customerId = newCust?.id;
    }

    // Check if verified purchase
    let orderId: string | null = null;
    let isVerifiedPurchase = false;

    if (orderNumber) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, status")
        .eq("order_number", orderNumber.trim().toUpperCase())
        .eq("customer_id", customerId)
        .single();

      if (order && ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status)) {
        orderId = order.id;
        isVerifiedPurchase = true;
      }
    }

    const { error } = await supabaseAdmin.from("reviews").insert({
      product_id: productId,
      customer_id: customerId,
      order_id: orderId,
      rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
      title: title?.trim() || null,
      review_text: comment.trim(),
      is_verified_purchase: isVerifiedPurchase,
      status: "pending",
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for sharing your experience! Your review has been submitted for moderation.",
    });
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit review." },
      { status: 500 }
    );
  }
}
