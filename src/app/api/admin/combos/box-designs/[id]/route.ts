import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBoxDesignById } from "@/services/combo.service";
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const design = await getBoxDesignById(params.id);
    if (!design) {
      return NextResponse.json({ success: false, message: "Box design not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: design });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load box design" },
      { status: 500 }
    );
  }
}

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

    const existing = await getBoxDesignById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, message: "Box design not found" }, { status: 404 });
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json({ success: false, message: "Box design name cannot be empty" }, { status: 400 });
      }
      updatePayload.name = body.name.trim();
    }

    if (body.slug !== undefined) {
      const formattedSlug = slugify(body.slug);
      if (formattedSlug) {
        const { data: conflict } = await supabaseAdmin
          .from("combo_box_designs")
          .select("id")
          .eq("slug", formattedSlug)
          .neq("id", params.id)
          .maybeSingle();

        if (conflict) {
          return NextResponse.json({ success: false, message: "A box design with this slug already exists" }, { status: 400 });
        }
        updatePayload.slug = formattedSlug;
      }
    }

    if (body.description !== undefined) {
      updatePayload.description = body.description?.trim() || null;
    }

    if (body.imageUrl !== undefined) {
      updatePayload.image_url = body.imageUrl?.trim() || null;
    }

    if (body.supportedProductCount !== undefined) {
      const rawCount = body.supportedProductCount;
      if (typeof rawCount !== "number" && typeof rawCount !== "string") {
        return NextResponse.json(
          { success: false, message: "Supported product count must be an integer >= 1" },
          { status: 400 }
        );
      }

      const countTrimmed = typeof rawCount === "string" ? rawCount.trim() : rawCount;
      if (countTrimmed === "") {
        return NextResponse.json(
          { success: false, message: "Supported product count must be an integer >= 1" },
          { status: 400 }
        );
      }

      const count = Number(countTrimmed);
      if (!Number.isInteger(count) || count < 1) {
        return NextResponse.json(
          { success: false, message: "Supported product count must be an integer >= 1" },
          { status: 400 }
        );
      }
      updatePayload.supported_product_count = count;
    }

    if (body.additionalPrice !== undefined) {
      const price = Number(body.additionalPrice);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { success: false, message: "Additional price must be a valid non-negative number" },
          { status: 400 }
        );
      }
      updatePayload.additional_price = price;
    }

    if (body.isActive !== undefined) {
      updatePayload.is_active = Boolean(body.isActive);
    }

    if (body.displayOrder !== undefined) {
      updatePayload.display_order = parseInt(body.displayOrder, 10) || 0;
    }

    const { data, error } = await supabaseAdmin
      .from("combo_box_designs")
      .update(updatePayload)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Update box design error:", error);
      return NextResponse.json({ success: false, message: error.message || "Failed to update box design" }, { status: 400 });
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
    console.error("PUT /api/admin/combos/box-designs/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update box design" },
      { status: 500 }
    );
  }
}

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
      .from("combo_box_designs")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Delete box design error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to delete box design" },
        { status: 400 }
      );
    }

    try {
      revalidatePath("/build-your-combo", "page");
      revalidatePath("/admin/combos", "page");
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Box design deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/admin/combos/box-designs/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete box design" },
      { status: 500 }
    );
  }
}
