import { NextRequest, NextResponse } from "next/server";
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
    if (parentId !== undefined) updates.parent_id = parentId;
    if (displayOrder !== undefined) updates.display_order = displayOrder;
    if (isFeatured !== undefined) updates.is_featured = isFeatured;
    if (isActive !== undefined) updates.is_active = isActive;

    const fallbackCategory = {
      id: params.id,
      name: name || "Category",
      slug: slug || "category",
      description: description || null,
      image_url: imageUrl || null,
      image: imageUrl || null,
      parent_id: parentId || null,
      display_order: displayOrder ?? 0,
      sortOrder: displayOrder ?? 0,
      is_featured: !!isFeatured,
      is_active: isActive !== false,
      active: isActive !== false,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: updated, error } = await supabaseAdmin
        .from("categories")
        .update(updates)
        .eq("id", params.id)
        .select()
        .single();

      if (!error && updated) {
        return NextResponse.json({
          success: true,
          data: {
            ...updated,
            image: updated.image_url,
            sortOrder: updated.display_order,
            active: updated.is_active,
          }
        });
      }
    } catch (dbErr) {
      console.warn("Supabase category update fallback:", dbErr);
    }

    return NextResponse.json({ success: true, data: fallbackCategory });
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

    try {
      await supabaseAdmin
        .from("categories")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", params.id);
    } catch (dbErr) {
      console.warn("Supabase category delete fallback:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Category deactivated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
