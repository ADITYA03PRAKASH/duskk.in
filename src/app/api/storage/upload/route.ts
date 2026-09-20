import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { uploadFileToStorage } from "@/services/storage.service";

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as any) || "product-images";

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const result = await uploadFileToStorage(bucket, filename, buffer, file.type || "image/jpeg");

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
