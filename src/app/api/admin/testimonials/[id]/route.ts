import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isValidHttpUrl(urlStr?: string | null): boolean {
  if (!urlStr || !urlStr.trim()) return true;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data: testimonial, error } = await supabaseAdmin
      .from("testimonials")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !testimonial) {
      return NextResponse.json(
        { success: false, message: "Testimonial not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: testimonial });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      rating,
      location,
      is_verified_buyer,
      source_type,
      source_url,
      avatar_url,
      is_active,
      display_order,
    } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (customer_name !== undefined) {
      if (typeof customer_name !== "string" || !customer_name.trim()) {
        return NextResponse.json({ success: false, message: "Customer name cannot be empty." }, { status: 400 });
      }
      updates.customer_name = customer_name.trim();
    }

    if (review_text !== undefined) {
      if (typeof review_text !== "string" || !review_text.trim()) {
        return NextResponse.json({ success: false, message: "Review text cannot be empty." }, { status: 400 });
      }
      updates.review_text = review_text.trim();
    }

    if (rating !== undefined) {
      const numRating = parseInt(rating.toString(), 10);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return NextResponse.json({ success: false, message: "Rating must be between 1 and 5." }, { status: 400 });
      }
      updates.rating = numRating;
    }

    if (location !== undefined) {
      updates.location = location && typeof location === "string" ? location.trim() : null;
    }

    if (is_verified_buyer !== undefined) {
      updates.is_verified_buyer = Boolean(is_verified_buyer);
    }

    if (source_type !== undefined) {
      updates.source_type = typeof source_type === "string" && source_type.trim() ? source_type.trim() : "Customer Submission";
    }

    if (source_url !== undefined) {
      if (source_url && !isValidHttpUrl(source_url)) {
        return NextResponse.json(
          { success: false, message: "Source URL must be a valid http or https web address." },
          { status: 400 }
        );
      }
      updates.source_url = source_url && typeof source_url === "string" && source_url.trim() ? source_url.trim() : null;
    }

    if (avatar_url !== undefined) {
      if (avatar_url && !isValidHttpUrl(avatar_url)) {
        return NextResponse.json(
          { success: false, message: "Avatar URL must be a valid http or https web address." },
          { status: 400 }
        );
      }
      updates.avatar_url = avatar_url && typeof avatar_url === "string" && avatar_url.trim() ? avatar_url.trim() : null;
    }

    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
    }

    if (display_order !== undefined) {
      updates.display_order = parseInt(display_order.toString(), 10) || 0;
    }

    const { data: updated, error } = await supabaseAdmin
      .from("testimonials")
      .update(updates)
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error || !updated) {
      return NextResponse.json(
        { success: false, message: error?.message || "Failed to update testimonial" },
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
      message: "Testimonial updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/testimonials/[id] error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export { PATCH as PUT };

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("testimonials")
      .delete()
      .eq("id", params.id);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message || "Failed to delete testimonial" },
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
      message: "Testimonial deleted successfully.",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/testimonials/[id] error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
