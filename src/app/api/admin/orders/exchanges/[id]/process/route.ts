import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { processOrderExchange } from "@/services/order.service";

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
    const {
      decision,
      notes,
      replacementVariantId,
      pickupCourier,
      pickupAwb,
      replacementCourier,
      replacementAwb,
    } = body;

    const validDecisions = [
      "APPROVE",
      "REJECT",
      "PICKUP_SCHEDULED",
      "INSPECTION_PENDING",
      "REPLACEMENT_DISPATCHED",
      "COMPLETED",
    ];

    if (!decision || !validDecisions.includes(decision)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid decision. Allowed decisions: ${validDecisions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const data = await processOrderExchange(
      params.id,
      decision,
      admin.email,
      {
        notes,
        replacementVariantId,
        pickupCourier,
        pickupAwb,
        replacementCourier,
        replacementAwb,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Exchange status updated to ${decision}.`,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process exchange." },
      { status: 400 }
    );
  }
}
