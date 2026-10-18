import { NextRequest, NextResponse } from "next/server";
import { getComboBySlug } from "@/services/combo.service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params?.slug;
    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Combo slug is required" },
        { status: 400 }
      );
    }

    const combo = await getComboBySlug(slug);
    if (!combo) {
      return NextResponse.json(
        { success: false, message: "Combo not found or inactive" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: combo,
    });
  } catch (error: any) {
    console.error(`GET /api/combos/${params?.slug} error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch combo" },
      { status: 500 }
    );
  }
}
