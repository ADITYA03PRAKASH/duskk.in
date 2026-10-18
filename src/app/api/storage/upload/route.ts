import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { uploadFileToStorage } from "@/services/storage.service";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

const ALLOWED_BUCKETS = new Set([
  "product-images",
  "banners",
  "review-images",
  "category-images",
]);

function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG signature: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) return true;

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  if (isPng) return true;

  // WebP signature: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  const isRiff = buffer.toString("ascii", 0, 4) === "RIFF";
  const isWebp = buffer.toString("ascii", 8, 12) === "WEBP";
  if (isRiff && isWebp) return true;

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const rawBucket = (formData.get("bucket") as string) || "product-images";
    const bucket = ALLOWED_BUCKETS.has(rawBucket) ? rawBucket : "product-images";

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const rawExt = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType = (file.type || "").toLowerCase();

    if (!ALLOWED_MIME_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(rawExt)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPEG, PNG, and WebP images are permitted." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!isValidImageBuffer(buffer)) {
      return NextResponse.json(
        { success: false, message: "Corrupted or invalid image file signature." },
        { status: 400 }
      );
    }

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${rawExt}`;
    const result = await uploadFileToStorage(bucket as any, filename, buffer, mimeType);

    return NextResponse.json({
      success: true,
      data: {
        path: result.path,
        url: result.publicUrl,
      },
    });
  } catch (error: any) {
    console.error("POST /api/storage/upload error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
