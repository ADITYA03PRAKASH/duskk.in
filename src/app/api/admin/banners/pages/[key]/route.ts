import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import {
  getPageBanner,
  updatePageBanner,
  normalizePageKey,
  ALLOWED_PAGE_KEYS,
  SupportedPageKey,
} from "@/services/banner.service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const admin = await getSessionAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const key = normalizePageKey(params.key);
    if (!ALLOWED_PAGE_KEYS.includes(key as SupportedPageKey)) {
      return NextResponse.json(
        { success: false, message: `Unsupported page key "${params.key}". Allowed: ${ALLOWED_PAGE_KEYS.join(", ")}` },
        { status: 404 }
      );
    }

    const banner = await getPageBanner(key);
    if (!banner) {
      return NextResponse.json({ success: false, message: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: banner });
  } catch (error: any) {
    console.error(`GET /api/admin/banners/pages/[key] error:`, error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const admin = await getSessionAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const key = normalizePageKey(params.key);
    if (!ALLOWED_PAGE_KEYS.includes(key as SupportedPageKey)) {
      return NextResponse.json(
        { success: false, message: `Unsupported page key "${params.key}". Allowed keys: ${ALLOWED_PAGE_KEYS.join(", ")}` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      imageUrl,
      title,
      label,
      description,
      objectPosition,
      overlayOpacity,
      isEnabled,
    } = body;

    // Validation
    if (objectPosition !== undefined) {
      const validPositions = ["center", "top", "bottom", "left", "right"];
      if (!validPositions.includes(objectPosition)) {
        return NextResponse.json(
          { success: false, message: `Invalid object position. Must be one of: ${validPositions.join(", ")}` },
          { status: 400 }
        );
      }
    }

    if (overlayOpacity !== undefined && overlayOpacity !== null && overlayOpacity !== "") {
      const numOpacity = Number(overlayOpacity);
      if (isNaN(numOpacity) || numOpacity < 0 || numOpacity > 100) {
        return NextResponse.json(
          { success: false, message: "Overlay opacity must be a number between 0 and 100." },
          { status: 400 }
        );
      }
    }

    const updated = await updatePageBanner(key, {
      imageUrl: imageUrl !== undefined ? String(imageUrl).trim() : undefined,
      title: title !== undefined ? String(title).trim() : undefined,
      label: label !== undefined ? String(label).trim() : undefined,
      description: description !== undefined ? String(description).trim() : undefined,
      objectPosition,
      overlayOpacity: overlayOpacity !== undefined && overlayOpacity !== "" ? Number(overlayOpacity) : undefined,
      isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : undefined,
    });

    return NextResponse.json({ success: true, data: updated, message: `Banner for "${updated.pageName}" updated successfully!` });
  } catch (error: any) {
    console.error(`PUT /api/admin/banners/pages/[key] error:`, error);
    return NextResponse.json({ success: false, message: error.message || "Failed to update banner" }, { status: 500 });
  }
}

export { PUT as PATCH };
