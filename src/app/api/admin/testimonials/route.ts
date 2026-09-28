import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTestimonialSectionSettings, DEFAULT_SECTION_SETTINGS } from "@/services/testimonials.service";

function isValidHttpUrl(urlStr?: string | null): boolean {
  if (!urlStr || !urlStr.trim()) return true;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const [testimonialsResult, sectionSettings] = await Promise.all([
      supabaseAdmin
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false }),
      getTestimonialSectionSettings(),
    ]);

    if (testimonialsResult.error) {
      console.error("Supabase fetch all testimonials error:", testimonialsResult.error.message);
      return NextResponse.json(
        { success: false, message: "Failed to fetch testimonials" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: testimonialsResult.data || [],
      section: sectionSettings || DEFAULT_SECTION_SETTINGS,
    });
  } catch (error: any) {
    console.error("GET /api/admin/testimonials error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, message: "Invalid payload." }, { status: 400 });
    }

    const {
      customer_name,
      review_text,
      rating = 5,
      location,
      is_verified_buyer = false,
      source_type = "Customer Submission",
      source_url,
      avatar_url,
      is_active = true,
      display_order = 0,
    } = body;

    if (!customer_name || typeof customer_name !== "string" || !customer_name.trim()) {
      return NextResponse.json(
        { success: false, message: "Customer name is required." },
        { status: 400 }
      );
    }

    if (!review_text || typeof review_text !== "string" || !review_text.trim()) {
      return NextResponse.json(
        { success: false, message: "Review text is required." },
        { status: 400 }
      );
    }

    const numRating = parseInt(rating.toString(), 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    if (source_url && !isValidHttpUrl(source_url)) {
      return NextResponse.json(
        { success: false, message: "Source URL must be a valid http or https web address." },
        { status: 400 }
      );
    }

    if (avatar_url && !isValidHttpUrl(avatar_url)) {
      return NextResponse.json(
        { success: false, message: "Avatar URL must be a valid http or https web address." },
        { status: 400 }
      );
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("testimonials")
      .insert({
        customer_name: customer_name.trim(),
        review_text: review_text.trim(),
        rating: numRating,
        location: location && typeof location === "string" ? location.trim() : null,
        is_verified_buyer: Boolean(is_verified_buyer),
        source_type: typeof source_type === "string" && source_type.trim() ? source_type.trim() : "Customer Submission",
        source_url: source_url && typeof source_url === "string" && source_url.trim() ? source_url.trim() : null,
        avatar_url: avatar_url && typeof avatar_url === "string" && avatar_url.trim() ? avatar_url.trim() : null,
        is_active: Boolean(is_active),
        display_order: parseInt((display_order || 0).toString(), 10) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !inserted) {
      console.error("Supabase testimonial insert error:", error);
      return NextResponse.json(
        { success: false, message: error?.message || "Failed to create testimonial" },
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
      message: "Testimonial created successfully.",
      data: inserted,
    });
  } catch (error: any) {
    console.error("POST /api/admin/testimonials error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
