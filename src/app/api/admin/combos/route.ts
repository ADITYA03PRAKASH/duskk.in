import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { getAllAdminCombos, createCombo } from "@/services/combo.service";
import { ComboInput } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const combos = await getAllAdminCombos();
    return NextResponse.json({
      success: true,
      data: combos,
    });
  } catch (error: any) {
    console.error("GET /api/admin/combos error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch combos" },
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
    const {
      title,
      slug,
      shortDescription,
      description,
      price,
      mrp,
      imageUrl,
      galleryImages,
      isActive,
      isFeatured,
      displayOrder,
      items,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Combo title is required." },
        { status: 400 }
      );
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Combo price must be a valid non-negative number." },
        { status: 400 }
      );
    }

    const numMrp = mrp !== undefined && mrp !== null && mrp !== "" ? Number(mrp) : undefined;
    if (numMrp !== undefined && (isNaN(numMrp) || numMrp < numPrice)) {
      return NextResponse.json(
        { success: false, message: "MRP must be greater than or equal to combo price." },
        { status: 400 }
      );
    }

    const comboInput: ComboInput = {
      title: title.trim(),
      slug: slug?.trim() || undefined,
      shortDescription: shortDescription?.trim() || undefined,
      description: description?.trim() || undefined,
      price: numPrice,
      mrp: numMrp,
      imageUrl: imageUrl?.trim() || undefined,
      galleryImages: Array.isArray(galleryImages) ? galleryImages : undefined,
      isActive: isActive !== false,
      isFeatured: Boolean(isFeatured),
      displayOrder: Number(displayOrder || 0),
      items: Array.isArray(items)
        ? items.map((i: any, idx: number) => ({
            productId: i.productId,
            variantId: i.variantId || null,
            quantity: Math.max(1, parseInt(i.quantity || 1, 10)),
            sortOrder: i.sortOrder !== undefined ? Number(i.sortOrder) : idx,
          }))
        : [],
    };

    const newCombo = await createCombo(comboInput);

    return NextResponse.json({
      success: true,
      data: newCombo,
      message: "Combo created successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/admin/combos error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create combo" },
      { status: 500 }
    );
  }
}
