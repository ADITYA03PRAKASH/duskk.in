import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const displayOrder = body.displayOrder !== undefined ? Number(body.displayOrder) : (body.sortOrder !== undefined ? Number(body.sortOrder) : undefined);
    const isFeatured = body.isFeatured !== undefined ? body.isFeatured : (body.featured !== undefined ? !!body.featured : undefined);
    const isActive = body.isActive !== undefined ? body.isActive : (body.active !== undefined ? body.active : undefined);

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name) updates.name = name;
    if (slug) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.image_url = imageUrl;
    if (parentId !== undefined) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parentId);
      updates.parent_id = isUUID ? parentId : null;
    }
    if (displayOrder !== undefined) updates.display_order = displayOrder;
    if (isFeatured !== undefined) updates.is_featured = isFeatured;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data: updated, error } = await supabaseAdmin
      .from("categories")
      .update(updates)
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!updated) {
      return NextResponse.json({ success: false, message: "Category not found in database" }, { status: 404 });
    }

    try {
      revalidatePath("/", "page");
      revalidatePath("/shop", "page");
      revalidatePath("/category/[slug]", "page");
      if (updated.slug) {
        revalidatePath(`/category/${updated.slug}`, "page");
      }
    } catch (revErr) {
      console.warn("Revalidation warning:", revErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        image: updated.image_url,
        sortOrder: updated.display_order,
        active: updated.is_active,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export { PUT as PATCH };

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data: cat, error } = await supabaseAdmin
      .from("categories")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select("slug")
      .maybeSingle();

    if (error) throw new Error(error.message);

    try {
      revalidatePath("/", "page");
      revalidatePath("/shop", "page");
      revalidatePath("/category/[slug]", "page");
      if (cat?.slug) {
        revalidatePath(`/category/${cat.slug}`, "page");
      }
    } catch (revErr) {
      console.warn("Revalidation warning on category delete:", revErr);
    }

    return NextResponse.json({ success: true, message: "Category deactivated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
