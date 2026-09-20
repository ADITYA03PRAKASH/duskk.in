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

    let query = supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_number,
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

    try {
      const { data: orders, error } = await query;
      if (!error && orders) {
        const formatted = orders.map((o: any) => {
          const cust = o.customer_snapshot as any;
          const addr = o.shipping_address_snapshot as any;
          return {
            id: o.id,
            orderNumber: o.order_number,
            orderStatus: o.status,
            paymentStatus: o.payments?.[0]?.status || (o.status === "PENDING_PAYMENT" ? "PENDING" : "PAID"),
            totalAmount: Number(o.grand_total),
            subtotal: Number(o.subtotal_amount),
            discount: Number(o.discount_amount),
            shippingCharge: Number(o.shipping_amount),
            tax: Number(o.tax_amount),
            couponCode: o.coupon_code,
            customerName: `${cust?.first_name || ""} ${cust?.last_name || ""}`.trim() || "Customer",
            customerEmail: cust?.email,
            customerPhone: cust?.phone,
            shippingAddress: addr,
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
            timeline: (o.order_status_history || []).map((h: any) => ({
              status: h.to_status,
              timestamp: h.created_at,
              note: h.comment,
              changedBy: h.changed_by,
            })),
            createdAt: o.created_at,
          };
        });

        return NextResponse.json({ success: true, data: formatted });
      }
    } catch (dbErr) {
      console.warn("Supabase fetch orders fallback:", dbErr);
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}
