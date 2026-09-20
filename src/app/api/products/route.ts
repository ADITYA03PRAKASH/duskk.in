import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/services/catalog.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured") === "true";
    const bestSeller = searchParams.get("bestSeller") === "true";
    const newArrival = searchParams.get("newArrival") === "true";
    const sort = searchParams.get("sort") || "recommended";
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const limit = parseInt(searchParams.get("limit") || "40", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const result = await getProducts({
      category,
      subcategory,
      search,
      featured,
      bestSeller,
      newArrival,
      minPrice,
      maxPrice,
      sort,
      limit,
      page,
    });

    return NextResponse.json({
      success: true,
      data: result.products,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
