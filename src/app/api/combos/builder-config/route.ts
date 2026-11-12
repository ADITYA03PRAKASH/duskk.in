import { NextResponse } from "next/server";
import { getCustomComboSettings, getEligibleBuilderProducts, getActiveBoxDesigns } from "@/services/combo.service";
import { getCategories } from "@/services/catalog.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getCustomComboSettings();
    const [categories, products, boxDesigns] = await Promise.all([
      getCategories(),
      settings.isEnabled ? getEligibleBuilderProducts(settings) : Promise.resolve([]),
      getActiveBoxDesigns(),
    ]);

    // Check promotion date window
    const now = new Date();
    const isStarted = !settings.startsAt || now >= new Date(settings.startsAt);
    const isEnded = settings.endsAt && now > new Date(settings.endsAt);
    const isCurrentlyActive = settings.isEnabled && isStarted && !isEnded;

    return NextResponse.json({
      success: true,
      data: {
        settings: {
          ...settings,
          isCurrentlyActive,
        },
        categories: (categories || []).filter((c: any) => c.is_active !== false),
        products,
        boxDesigns,
      },
    });
  } catch (error: any) {
    console.error("GET /api/combos/builder-config error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load custom combo builder configuration" },
      { status: 500 }
    );
  }
}
