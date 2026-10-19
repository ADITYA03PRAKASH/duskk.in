import { NextRequest, NextResponse } from "next/server";
import { getPageBanner, normalizePageKey } from "@/services/banner.service";

export const revalidate = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = normalizePageKey(params.key);
    const banner = await getPageBanner(key);

    if (!banner) {
      return NextResponse.json({ success: false, message: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: banner });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
