import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import {
  getAdminComboById,
  updateCombo,
  deleteCombo,
  toggleComboStatus,
} from "@/services/combo.service";
import { ComboInput } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const combo = await getAdminComboById(params.id);
    if (!combo) {
      return NextResponse.json({ success: false, message: "Combo not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: combo });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch combo" },
      { status: 500 }
    );
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

    const body = await req.json();

    // Support quick toggle if only isActive is passed
    if (body.isActive !== undefined && Object.keys(body).length === 1) {
      const updated = await toggleComboStatus(params.id, Boolean(body.isActive));
      return NextResponse.json({ success: true, data: updated });
    }

    const updateInput: Partial<ComboInput> = {};
    if (body.title !== undefined) updateInput.title = body.title.trim();
    if (body.slug !== undefined) updateInput.slug = body.slug.trim();
    if (body.shortDescription !== undefined) updateInput.shortDescription = body.shortDescription;
    if (body.description !== undefined) updateInput.description = body.description;
    if (body.price !== undefined) updateInput.price = Number(body.price);
    if (body.mrp !== undefined) updateInput.mrp = Number(body.mrp);
    if (body.imageUrl !== undefined) updateInput.imageUrl = body.imageUrl;
    if (body.galleryImages !== undefined) updateInput.galleryImages = body.galleryImages;
    if (body.isActive !== undefined) updateInput.isActive = Boolean(body.isActive);
    if (body.isFeatured !== undefined) updateInput.isFeatured = Boolean(body.isFeatured);
    if (body.displayOrder !== undefined) updateInput.displayOrder = Number(body.displayOrder);

    if (body.items !== undefined && Array.isArray(body.items)) {
      updateInput.items = body.items.map((i: any, idx: number) => ({
        productId: i.productId,
        variantId: i.variantId || null,
        quantity: Math.max(1, parseInt(i.quantity || 1, 10)),
        sortOrder: i.sortOrder !== undefined ? Number(i.sortOrder) : idx,
      }));
    }

    const updated = await updateCombo(params.id, updateInput);
    return NextResponse.json({ success: true, data: updated, message: "Combo updated successfully" });
  } catch (error: any) {
    console.error(`PATCH /api/admin/combos/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update combo" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return PATCH(req, { params });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await deleteCombo(params.id);
    return NextResponse.json({ success: true, message: "Combo deleted successfully" });
  } catch (error: any) {
    console.error(`DELETE /api/admin/combos/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete combo" },
      { status: 500 }
    );
  }
}
