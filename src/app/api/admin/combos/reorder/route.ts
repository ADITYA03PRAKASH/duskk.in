import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { reorderCombos } from "@/services/combo.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orders } = body as { orders: { id: string; displayOrder: number }[] };

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { success: false, message: "Valid orders array is required" },
        { status: 400 }
      );
    }

    await reorderCombos(orders);

    return NextResponse.json({ success: true, message: "Combos reordered successfully" });
  } catch (error: any) {
    console.error("POST /api/admin/combos/reorder error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to reorder combos" },
      { status: 500 }
    );
  }
}
