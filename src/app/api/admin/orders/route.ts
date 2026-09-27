import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim().toLowerCase();

    let query = supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_number,
        customer_id,
        status,
        subtotal_amount,
        discount_amount,
        shipping_amount,
        tax_amount,
        grand_total,
        coupon_code,
        customer_snapshot,
        shipping_address_snapshot,
        created_at,
        order_items (*),
        order_status_history (*),
        payments (*)
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: orders, error } = await query;
    if (error) {
      console.error("Supabase orders query error:", error);
      throw new Error(error.message);
    }

    let formatted = (orders || []).map((o: any) => {
      const cust = o.customer_snapshot as any;
      const addr = o.shipping_address_snapshot as any;
      const pay = o.payments?.[0] as any;

      let courierName: string | null = null;
      let trackingNumber: string | null = null;
      let trackingUrl: string | null = null;
      let estimatedDelivery: string | null = null;

      const history = o.order_status_history || [];
      for (const h of history) {
        if (h.comment && h.comment.includes("[TRACKING]")) {
          const trackSection = h.comment.split("[TRACKING]")[1] || "";
          const matchCourier = trackSection.match(/Courier:\s*([^|]+)/i);
          const matchAwb = trackSection.match(/AWB:\s*([^|]+)/i);
          const matchUrl = trackSection.match(/URL:\s*([^|]+)/i);
          const matchEst = trackSection.match(/Est\. Delivery:\s*([^|]+)/i);

          if (matchCourier) courierName = matchCourier[1].trim();
          if (matchAwb) trackingNumber = matchAwb[1].trim();
          if (matchUrl) trackingUrl = matchUrl[1].trim();
          if (matchEst) estimatedDelivery = matchEst[1].trim();
        }
      }

      return {
        id: o.id,
        orderNumber: o.order_number,
        orderStatus: o.status,
        customerId: o.customer_id,
        paymentStatus: pay?.status ? pay.status.toUpperCase() : (o.status === "PENDING_PAYMENT" ? "PENDING" : "PAID"),
        razorpayOrderId: pay?.razorpay_order_id || null,
        razorpayPaymentId: pay?.razorpay_payment_id || null,
        totalAmount: Number(o.grand_total),
        subtotal: Number(o.subtotal_amount),
        discount: Number(o.discount_amount),
        shippingCharge: Number(o.shipping_amount),
        tax: Number(o.tax_amount),
        couponCode: o.coupon_code,
        customerName: `${cust?.first_name || ""} ${cust?.last_name || ""}`.trim() || addr?.full_name || "Customer",
        customerEmail: cust?.email || "N/A",
        customerPhone: cust?.phone || addr?.phone || "N/A",
        shippingAddress: addr,
        shippingAddressLine1: addr?.address_line1 || "",
        shippingAddressLine2: addr?.address_line2 || null,
        shippingCity: addr?.city || "",
        shippingState: addr?.state || "",
        shippingPincode: addr?.postal_code || "",
        shippingLandmark: addr?.landmark || null,
        courierName: courierName || "Blue Dart Express",
        trackingNumber: trackingNumber || "",
        trackingUrl: trackingUrl || "",
        estimatedDelivery: estimatedDelivery || "",
        items: (o.order_items || []).map((i: any) => ({
          id: i.id,
          productName: i.product_title,
          variantTitle: i.variant_title,
          productSku: i.sku,
          productImage: i.image_url,
          price: Number(i.unit_sale_price || i.unit_price),
          quantity: i.quantity,
          subtotal: Number(i.total_price),
        })),
        timeline: history.map((h: any) => ({
          status: h.to_status,
          timestamp: h.created_at,
          note: h.comment,
          changedBy: h.changed_by,
        })),
        createdAt: o.created_at,
      };
    });

    if (search) {
      formatted = formatted.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search) ||
          o.customerName.toLowerCase().includes(search) ||
          o.customerEmail.toLowerCase().includes(search) ||
          o.customerPhone.includes(search)
      );
    }

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
