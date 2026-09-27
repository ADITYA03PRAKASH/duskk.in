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
    const search = searchParams.get("search")?.trim().toLowerCase();

    const { data: customers, error } = await supabaseAdmin
      .from("customers")
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        customer_type,
        is_active,
        created_at,
        orders (
          id,
          order_number,
          status,
          grand_total,
          created_at
        ),
        customer_addresses (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase customers query error:", error);
      throw new Error(error.message);
    }

    let formatted = (customers || []).map((c: any) => {
      const orders = c.orders || [];
      const totalSpent = orders
        .filter((o: any) => ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(o.status))
        .reduce((acc: number, o: any) => acc + Number(o.grand_total || 0), 0);

      const fullName = `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Customer";

      return {
        id: c.id,
        name: fullName,
        email: c.email,
        phone: c.phone || null,
        type: c.customer_type,
        registrationType: c.customer_type === "registered" ? "Registered" : "Guest",
        isActive: c.is_active,
        totalOrders: orders.length,
        orderCount: orders.length,
        totalSpent,
        addresses: c.customer_addresses || [],
        createdAt: c.created_at,
      };
    });

    if (search) {
      formatted = formatted.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          (c.phone && c.phone.includes(search))
      );
    }

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
