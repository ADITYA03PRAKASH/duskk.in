import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAllBoxDesignsAdmin } from "@/services/combo.service";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const designs = await getAllBoxDesignsAdmin();
    return NextResponse.json({ success: true, data: designs });
  } catch (error: any) {
    console.error("GET /api/admin/combos/box-designs error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load box designs" },
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

    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: "Box design name is required" }, { status: 400 });
    }

    const rawCount = body.supportedProductCount;
    if (typeof rawCount !== "number" && typeof rawCount !== "string") {
      return NextResponse.json(
        { success: false, message: "Supported product count must be an integer greater than or equal to 1" },
        { status: 400 }
      );
    }

    const countTrimmed = typeof rawCount === "string" ? rawCount.trim() : rawCount;
    if (countTrimmed === "") {
      return NextResponse.json(
        { success: false, message: "Supported product count must be an integer greater than or equal to 1" },
        { status: 400 }
      );
    }

    const supportedCount = Number(countTrimmed);
    if (!Number.isInteger(supportedCount) || supportedCount < 1) {
      return NextResponse.json(
        { success: false, message: "Supported product count must be an integer greater than or equal to 1" },
        { status: 400 }
      );
    }

    const price = Number(body.additionalPrice || 0);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { success: false, message: "Additional price must be a valid non-negative number" },
        { status: 400 }
      );
    }

    let slug = body.slug ? slugify(body.slug) : slugify(body.name);
    if (!slug) slug = `box-${Date.now()}`;

    // Verify slug uniqueness
    const { data: existingSlug } = await supabaseAdmin
      .from("combo_box_designs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const insertPayload = {
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || null,
      image_url: body.imageUrl?.trim() || null,
      supported_product_count: supportedCount,
      additional_price: price,
      is_active: body.isActive !== undefined ? Boolean(body.isActive) : true,
      display_order: parseInt(body.displayOrder, 10) || 0,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("combo_box_designs")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Insert box design error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to create box design" },
        { status: 400 }
      );
    }

    try {
      revalidatePath("/build-your-combo", "page");
      revalidatePath("/admin/combos", "page");
    } catch (e) {}

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.image_url,
        supportedProductCount: Number(data.supported_product_count),
        additionalPrice: Number(data.additional_price),
        isActive: Boolean(data.is_active),
        displayOrder: Number(data.display_order),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error: any) {
    console.error("POST /api/admin/combos/box-designs error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create box design" },
      { status: 500 }
    );
  }
}
