import { NextResponse } from "next/server";
import { getActiveBoxDesigns } from "@/services/combo.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const boxDesigns = await getActiveBoxDesigns();
    return NextResponse.json({
      success: true,
      data: boxDesigns,
    });
  } catch (error: any) {
    console.error("GET /api/combos/box-designs error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load box packaging designs" },
      { status: 500 }
    );
  }
}
