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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const [
      { data: orders },
      { count: totalProducts },
      { count: totalCustomers },
      { data: allVariants },
      { data: recentOrders },
    ] = await Promise.all([
      supabaseAdmin.from("orders").select("grand_total, status, created_at"),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("customers").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("product_variants")
        .select("id, sku, title, stock_quantity, reserved_quantity, product_id, products(title, base_price, sale_price)")
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

    const totalRevenue = paidOrders.reduce((acc, o) => acc + Number(o.grand_total || 0), 0);
    const todayOrdersList = allOrders.filter((o) => o.created_at >= todayIso);
    const todayRevenue = todayOrdersList
      .filter((o) => ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(o.status))
      .reduce((acc, o) => acc + Number(o.grand_total || 0), 0);

    const totalOrdersCount = allOrders.length;
    const todayOrdersCount = todayOrdersList.length;
    const pendingOrdersCount = allOrders.filter((o) => o.status === "PENDING_PAYMENT").length;
    const processingOrdersCount = allOrders.filter((o) =>
      ["PAID", "CONFIRMED", "PROCESSING"].includes(o.status)
    ).length;

    const variants = allVariants || [];
    const lowStockVariants = variants.filter((v: any) => v.stock_quantity > 0 && v.stock_quantity <= 10);
    const outOfStockVariants = variants.filter((v: any) => v.stock_quantity <= 0);

    const formattedLowStockItems = variants
      .filter((v: any) => v.stock_quantity <= 10)
      .slice(0, 5)
      .map((v: any) => {
        const prod = v.products as any;
        const price = prod?.sale_price !== null && prod?.sale_price !== undefined ? Number(prod.sale_price) : Number(prod?.base_price || 0);
        return {
          id: v.id,
          name: prod?.title ? `${prod.title} (${v.title})` : v.title,
          price,
          stockQuantity: v.stock_quantity,
        };
      });

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
          todayRevenue,
          totalOrders: totalOrdersCount,
          todayOrders: todayOrdersCount,
          totalProducts: totalProducts || 0,
          totalCustomers: totalCustomers || 0,
          pendingOrders: pendingOrdersCount,
          processingOrders: processingOrdersCount,
          lowStockCount: lowStockVariants.length,
          outOfStockCount: outOfStockVariants.length,
        },
        lowStockItems: formattedLowStockItems,
        recentOrders: formattedRecentOrders,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
