import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/services/catalog.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Product slug is required" },
        { status: 400 }
      );
    }

    const product = await getProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product details" },
      { status: 500 }
    );
  }
}
