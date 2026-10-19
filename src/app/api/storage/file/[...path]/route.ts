import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
};

export async function GET(
  req: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  try {
    const rawPath = params.path;
    if (!rawPath || rawPath.length < 2) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const bucket = rawPath[0];
    const filePath = rawPath.slice(1).join("/");

    const allowedBuckets = new Set([
      "product-images",
      "banners",
      "review-images",
      "category-images",
    ]);

    if (!allowedBuckets.has(bucket)) {
      return NextResponse.json({ error: "Bucket not permitted" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .download(filePath);

    if (error || !data) {
      console.warn(`[StorageProxy] File not found: ${bucket}/${filePath}`, error?.message);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const contentType = data.type || MIME_BY_EXT[ext] || "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    console.error("[StorageProxy] Error streaming image:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
