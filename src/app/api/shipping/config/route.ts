import { NextResponse } from "next/server";
import { getShippingSettings, getPublicShippingConfig } from "@/services/shipping.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getShippingSettings();
    const publicConfig = getPublicShippingConfig(settings);

    return NextResponse.json(
      {
        success: true,
        data: publicConfig,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/shipping/config error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch shipping configuration" },
      { status: 500 }
    );
  }
}
