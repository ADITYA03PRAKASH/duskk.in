import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const SEED_CATEGORIES = [
  { id: "3996bb4c-bf64-4a14-a584-9591aff2bf5d", name: "Earrings", slug: "earrings", display_order: 1, is_active: true },
  { id: "af98e474-2511-484b-ab49-79cfd4ccf6e9", name: "Necklaces", slug: "necklaces", display_order: 2, is_active: true },
  { id: "ca7967cf-6724-4586-afbf-d809e27ef4dd", name: "Pendants", slug: "pendants", display_order: 3, is_active: true },
  { id: "48f4e368-e06a-4b2f-9248-59c9d4c5363e", name: "Rings", slug: "rings", display_order: 4, is_active: true },
  { id: "13d01adf-deab-4c37-8fda-0b1be17da23a", name: "Bracelets", slug: "bracelets", display_order: 5, is_active: true },
  { id: "d1aeca62-716c-4f03-a0bf-e8c2596ba051", name: "Accessories", slug: "accessories", display_order: 6, is_active: true },
];

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
      const { data: categories, error } = await supabaseAdmin
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error || !categories || categories.length === 0) {
        return NextResponse.json({ success: true, data: SEED_CATEGORIES });
      }

      return NextResponse.json({
        success: true,
        data: categories.map((c) => ({
          ...c,
          image: c.image_url,
          sortOrder: c.display_order,
          active: c.is_active,
        })),
      });
    } catch {
      return NextResponse.json({ success: true, data: SEED_CATEGORIES });
    }
  } catch (error: any) {
    return NextResponse.json({ success: true, data: SEED_CATEGORIES });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = body.name;
    const slug = body.slug;
    const description = body.description;
    const imageUrl = body.imageUrl || body.image;
    const parentId = body.parentId || body.parent_id;
    const displayOrder = Number(body.displayOrder ?? body.sortOrder ?? 0);
    const isFeatured = body.isFeatured !== undefined ? body.isFeatured : !!body.featured;
    const isActive = body.isActive !== undefined ? body.isActive : (body.active !== undefined ? body.active : true);

    if (!name) {
      return NextResponse.json({ success: false, message: "Category name is required" }, { status: 400 });
    }

    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const insertPayload: Record<string, any> = {
      name,
      slug: catSlug,
      description: description || null,
      image_url: imageUrl || null,
      display_order: displayOrder,
      is_featured: !!isFeatured,
      is_active: isActive !== false,
    };

    if (parentId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parentId);
      if (isUUID) insertPayload.parent_id = parentId;
    }

    const { data: category, error } = await supabaseAdmin
      .from("categories")
      .insert(insertPayload)
      .select()
      .maybeSingle();

    if (error || !category) {
      console.error("Supabase category insert error:", error);
      return NextResponse.json(
        { success: false, message: error?.message || "Failed to create category in database" },
        { status: 500 }
      );
    }

    try {
      revalidatePath("/", "page");
      revalidatePath("/shop", "page");
      revalidatePath("/category/[slug]", "page");
      if (category.slug) {
        revalidatePath(`/category/${category.slug}`, "page");
      }
    } catch (revErr) {
      console.warn("Revalidation warning:", revErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        image: category.image_url,
        sortOrder: category.display_order,
        active: category.is_active,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
