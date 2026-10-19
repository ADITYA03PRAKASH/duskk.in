import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { getPageBanners, ALLOWED_PAGE_KEYS } from "@/services/banner.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const banners = await getPageBanners();

    return NextResponse.json({
      success: true,
      data: banners,
      allowedKeys: ALLOWED_PAGE_KEYS,
    });
  } catch (error: any) {
    console.error("GET /api/admin/banners/pages error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
