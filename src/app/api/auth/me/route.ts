import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, user: null });
    }

    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        customer_addresses (*),
        orders (
          id,
          order_number,
          status,
          grand_total,
          created_at,
          order_items (*)
        )
      `)
      .eq("id", session.id)
      .single();

    if (!customer) {
      return NextResponse.json({ success: false, user: null });
    }

    const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();

    return NextResponse.json({
      success: true,
      user: {
        id: customer.id,
        email: customer.email,
        name: fullName,
        phone: customer.phone,
        addresses: customer.customer_addresses || [],
        orders: customer.orders || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, user: null, message: err.message }, { status: 500 });
  }
}
