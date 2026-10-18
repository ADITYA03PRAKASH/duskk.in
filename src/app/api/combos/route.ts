import { NextResponse } from "next/server";
import { getPublishedCombos } from "@/services/combo.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const combos = await getPublishedCombos();
    return NextResponse.json({
      success: true,
      data: combos,
    });
  } catch (error: any) {
    console.error("GET /api/combos error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch combos" },
      { status: 500 }
    );
  }
}
