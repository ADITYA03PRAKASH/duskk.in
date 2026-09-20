import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select(`
        id,
        rating,
        title,
        review_text,
        is_verified_purchase,
        status,
        created_at,
        products (
          id,
          title,
          slug
        ),
        customers (
          first_name,
          last_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const formatted = (reviews || []).map((r: any) => ({
      id: r.id,
      productName: r.products?.title,
      productSlug: r.products?.slug,
      customerName: `${r.customers?.first_name || ""} ${r.customers?.last_name || ""}`.trim() || "Customer",
      customerEmail: r.customers?.email,
      rating: r.rating,
      title: r.title,
      comment: r.review_text,
      isVerifiedPurchase: r.is_verified_purchase,
      status: r.status,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "Review ID and status are required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("reviews")
      .update({ status: status.toLowerCase(), updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, message: `Review status updated to ${status}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
