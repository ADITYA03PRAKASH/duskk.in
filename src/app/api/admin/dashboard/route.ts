import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const [
      { data: orders },
      { count: totalProducts },
      { count: totalCustomers },
      { data: lowStockVariants },
      { data: recentOrders },
    ] = await Promise.all([
      supabaseAdmin.from("orders").select("grand_total, status, created_at"),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("customers").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("product_variants")
        .select("id, sku, title, stock_quantity, reserved_quantity, product_id, products(title)")
        .lte("stock_quantity", 5)
        .eq("is_active", true),
      supabaseAdmin
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          grand_total,
          created_at,
          customer_snapshot
        `)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const allOrders = orders || [];
    const paidOrders = allOrders.filter((o) =>
      ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(o.status)
    );

    const totalRevenue = paidOrders.reduce((acc, o) => acc + Number(o.grand_total), 0);
    const totalOrdersCount = allOrders.length;
    const pendingOrdersCount = allOrders.filter((o) => o.status === "PENDING_PAYMENT").length;
    const processingOrdersCount = allOrders.filter((o) =>
      ["PAID", "CONFIRMED", "PROCESSING"].includes(o.status)
    ).length;

    const formattedRecentOrders = (recentOrders || []).map((o: any) => {
      const snap = o.customer_snapshot as any;
      return {
        id: o.id,
        orderNumber: o.order_number,
        customerName: `${snap?.first_name || ""} ${snap?.last_name || ""}`.trim() || "Customer",
        customerEmail: snap?.email,
        totalAmount: Number(o.grand_total),
        orderStatus: o.status,
        createdAt: o.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalRevenue,
          totalOrders: totalOrdersCount,
          totalProducts: totalProducts || 0,
          totalCustomers: totalCustomers || 0,
          pendingOrders: pendingOrdersCount,
          processingOrders: processingOrdersCount,
        },
        lowStockItems: lowStockVariants || [],
        recentOrders: formattedRecentOrders,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
