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
    if (slug) {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      
      // Check if another category is already using this slug
      const { data: conflictingCat, error: conflictErr } = await supabaseAdmin
        .from("categories")
        .select("id, name, slug, is_active")
        .eq("slug", cleanSlug)
        .neq("id", params.id)
        .maybeSingle();

      if (!conflictErr && conflictingCat) {
        return NextResponse.json(
          {
            success: false,
            code: "SLUG_ALREADY_EXISTS",
            message: `The slug "${cleanSlug}" is already in use by ${
              conflictingCat.is_active ? "active" : "inactive"
            } category "${conflictingCat.name}". Please choose a different slug.`,
          },
          { status: 409 }
        );
      }
      updates.slug = cleanSlug;
    }
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
      if (error?.code === "23505" || error?.message?.includes("categories_slug_key")) {
        return NextResponse.json(
          {
            success: false,
            code: "SLUG_ALREADY_EXISTS",
            message: `Another category is already using this slug. Please specify a unique slug.`,
          },
          { status: 409 }
        );
      }
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

    // 1. Fetch category to verify existence
    const { data: category, error: catFetchError } = await supabaseAdmin
      .from("categories")
      .select("id, name, slug")
      .eq("id", params.id)
      .maybeSingle();

    if (catFetchError) {
      throw new Error(`Database error: ${catFetchError.message}`);
    }

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found in database." },
        { status: 404 }
      );
    }

    // 2. Prevent deleting if active products are assigned to this category
    const { count: productCount, error: countErr } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", params.id)
      .neq("status", "archived");

    if (!countErr && productCount && productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete category "${category.name}" because ${productCount} active ${
            productCount === 1 ? "product is" : "products are"
          } assigned to it. Please reassign or archive those products first.`,
        },
        { status: 400 }
      );
    }

    // 3. Attempt hard delete from database; if foreign keys prevent hard delete, fall back to deactivating (is_active: false)
    const { error: deleteError } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      // If restricted by foreign keys or archived products, soft-delete instead
      const { error: softDeleteError } = await supabaseAdmin
        .from("categories")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", params.id);

      if (softDeleteError) {
        throw new Error(`Failed to remove category: ${deleteError.message || softDeleteError.message}`);
      }
    }

    // 4. Revalidate ISR paths
    try {
      revalidatePath("/", "page");
      revalidatePath("/shop", "page");
      revalidatePath("/category/[slug]", "page");
      revalidatePath("/admin/categories", "page");
      if (category.slug) {
        revalidatePath(`/category/${category.slug}`, "page");
      }
    } catch (revErr) {
      console.warn("Revalidation warning on category delete:", revErr);
    }

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

