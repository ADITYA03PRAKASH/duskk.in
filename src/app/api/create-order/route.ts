import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "This endpoint has been deprecated. Use /api/payments/create for server-validated checkout orders.",
    },
    { status: 410 }
  );
}
