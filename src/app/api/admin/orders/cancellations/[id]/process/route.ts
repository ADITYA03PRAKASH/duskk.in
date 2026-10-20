import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { processOrderCancellation } from "@/services/order.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { decision, notes } = body;

    if (!decision || !["APPROVE", "REJECT"].includes(decision)) {
      return NextResponse.json(
        { success: false, message: "Valid decision (APPROVE or REJECT) is required." },
        { status: 400 }
      );
    }

    const data = await processOrderCancellation(
      params.id,
      decision,
      admin.email,
      notes
    );

    return NextResponse.json({
      success: true,
      message: `Cancellation request ${decision === "APPROVE" ? "approved" : "rejected"} successfully.`,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process cancellation." },
      { status: 400 }
    );
  }
}
