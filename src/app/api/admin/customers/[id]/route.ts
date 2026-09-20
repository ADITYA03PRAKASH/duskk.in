import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data: customer, error } = await supabaseAdmin
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
      .eq("id", params.id)
      .single();

    if (error || !customer) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
