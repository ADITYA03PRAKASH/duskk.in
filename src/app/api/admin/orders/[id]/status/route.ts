import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { updateOrderStatus } from "@/services/order.service";

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
    const { status, note, courierName, trackingNumber, trackingUrl, estimatedDelivery } = body;

    if (!status) {
      return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 });
    }

    await updateOrderStatus(params.id, status, `admin:${admin.email}`, note, {
      courierName,
      trackingNumber,
      trackingUrl,
      estimatedDelivery,
    });

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export { PUT as PATCH };
