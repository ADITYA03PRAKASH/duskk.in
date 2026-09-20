import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

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

    if (error) throw new Error(error.message);

    const formatted = (customers || []).map((c: any) => {
      const orders = c.orders || [];
      const totalSpent = orders
        .filter((o: any) => ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status))
        .reduce((acc: number, o: any) => acc + Number(o.grand_total), 0);

      return {
        id: c.id,
        name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Customer",
        email: c.email,
        phone: c.phone,
        type: c.customer_type,
        isActive: c.is_active,
        orderCount: orders.length,
        totalSpent,
        addresses: c.customer_addresses || [],
        createdAt: c.created_at,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
