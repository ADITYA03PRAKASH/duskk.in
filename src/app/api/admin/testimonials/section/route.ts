import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, message: "Invalid payload." }, { status: 400 });
    }

    const { eyebrow, heading, description } = body;

    const newSettings = {
      eyebrow: typeof eyebrow === "string" && eyebrow.trim() ? eyebrow.trim() : "CUSTOMER EXPERIENCES",
      heading: typeof heading === "string" && heading.trim() ? heading.trim() : "Loved By Modern Muses",
      description: typeof description === "string" ? description.trim() : "",
    };

    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .upsert(
        {
          key: "customer_experiences_section",
          value: newSettings,
          description: "Homepage Customer Experiences Section configuration",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message || "Failed to update section settings" },
        { status: 500 }
      );
    }

    try {
      revalidatePath("/", "page");
      revalidatePath("/admin/cms", "page");
    } catch (revErr) {
      console.warn("Revalidation warning:", revErr);
    }

    return NextResponse.json({
      success: true,
      message: "Customer Experiences section settings updated.",
      data: newSettings,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/testimonials/section error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export { PATCH as PUT, PATCH as POST };
