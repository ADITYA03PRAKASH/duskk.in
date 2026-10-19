import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { PageBannerConfig, CategoryPageBannersMap, BannerObjectPosition } from "@/types";

export const SITE_SETTINGS_KEY_PAGE_BANNERS = "category_page_banners";

export const ALLOWED_PAGE_KEYS = [
  "build-your-combo",
  "combos",
  "earrings",
  "necklaces",
  "rings",
  "payals",
  "bracelets",
] as const;

export type SupportedPageKey = typeof ALLOWED_PAGE_KEYS[number];

/**
 * Normalizes page keys, e.g. "payal" -> "payals", removes leading slashes, etc.
 */
export function normalizePageKey(rawKey: string): string {
  if (!rawKey) return "";
  let key = rawKey.toLowerCase().trim().replace(/^\/category\//, "").replace(/^\//, "");
  if (key === "payal") return "payals";
  if (key === "bracelet") return "bracelets";
  if (key === "ring") return "rings";
  if (key === "necklace") return "necklaces";
  if (key === "earring") return "earrings";
  if (key === "combo") return "combos";
  return key;
}

/**
 * Baseline authoritative default configurations for the 7 pages.
 */
export function getDefaultPageBanners(): CategoryPageBannersMap {
  return {
    "build-your-combo": {
      pageKey: "build-your-combo",
      pageName: "Build Your Own Combo",
      pagePath: "/build-your-combo",
      isEnabled: true,
      imageUrl: "",
      title: "Build Your Own Jewelry Set",
      label: "INTERACTIVE CUSTOM ATELIER",
      description: "Select matching pieces and enjoy bundle pricing.",
      objectPosition: "center",
      overlayOpacity: 45,
      updatedAt: new Date().toISOString(),
    },
    combos: {
      pageKey: "combos",
      pageName: "Gift Sets & Combos",
      pagePath: "/combos",
      isEnabled: true,
      imageUrl: "",
      title: "Perfect Pairings, Exceptional Value",
      label: "CURATED GIFT SETS & COMBOS",
      description:
        "Handcrafted luxury jewelry pieces designed to dazzle together. Each gift set arrives packaged in our signature velvet-lined box with certificate of authenticity.",
      objectPosition: "center",
      overlayOpacity: 45,
      updatedAt: new Date().toISOString(),
    },
    earrings: {
      pageKey: "earrings",
      pageName: "Earrings",
      pagePath: "/category/earrings",
      isEnabled: true,
      imageUrl: "https://i.pinimg.com/736x/96/37/a9/9637a90f52d298dc66a305d6aa19d37a.jpg",
      title: "Earrings",
      label: "COLLECTION",
      description: "Handcrafted studs, drops, and hoops with 18k gold vermeil & freshwater pearls.",
      objectPosition: "center",
      overlayOpacity: 40,
      updatedAt: new Date().toISOString(),
    },
    necklaces: {
      pageKey: "necklaces",
      pageName: "Necklaces",
      pagePath: "/category/necklaces",
      isEnabled: true,
      imageUrl:
        "https://res.cloudinary.com/ysrfjekc/image/upload/f_auto,q_auto/Blue_Sapphire_Leaf_Necklace_Gold_Botanical_Pendant_Marquise_Gemstone_Floral_Necklace",
      title: "Necklaces",
      label: "COLLECTION",
      description: "Delicate chains, statement collars, and layered gemstone necklaces.",
      objectPosition: "center",
      overlayOpacity: 40,
      updatedAt: new Date().toISOString(),
    },
    rings: {
      pageKey: "rings",
      pageName: "Rings",
      pagePath: "/category/rings",
      isEnabled: true,
      imageUrl: "https://res.cloudinary.com/ysrfjekc/image/upload/f_auto,q_auto/Elegant_Floral_Adjustable_Ring",
      title: "Rings",
      label: "COLLECTION",
      description: "Stackable bands, cocktail rings, and zircon studded eternity rings.",
      objectPosition: "center",
      overlayOpacity: 40,
      updatedAt: new Date().toISOString(),
    },
    payals: {
      pageKey: "payals",
      pageName: "Payals",
      pagePath: "/category/payals",
      isEnabled: true,
      imageUrl: "https://res.cloudinary.com/ysrfjekc/image/upload/f_auto,q_auto/them_and_a_festive_season",
      title: "Payals",
      label: "COLLECTION",
      description:
        "Featuring beautiful traditional designs with a modern touch, DUSKK anklets add charm and grace to every step.",
      objectPosition: "center",
      overlayOpacity: 40,
      updatedAt: new Date().toISOString(),
    },
    bracelets: {
      pageKey: "bracelets",
      pageName: "Bracelets",
      pagePath: "/category/bracelets",
      isEnabled: true,
      imageUrl: "https://i.pinimg.com/736x/66/d0/dd/66d0dde36efaba9dc1f3229cab3aa566.jpg",
      title: "Bracelets",
      label: "COLLECTION",
      description:
        "Discover our stylish bracelet collection, featuring elegant designs that add a touch of sophistication to every look.",
      objectPosition: "center",
      overlayOpacity: 40,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Retrieves all 7 category & combo page banners from site_settings.
 * Gracefully merges with defaults to ensure all fields are complete.
 */
export async function getPageBanners(): Promise<CategoryPageBannersMap> {
  const defaults = getDefaultPageBanners();

  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", SITE_SETTINGS_KEY_PAGE_BANNERS)
      .maybeSingle();

    if (error || !data || !data.value) {
      return defaults;
    }

    const savedMap = (typeof data.value === "object" ? data.value : {}) as Record<string, any>;
    const mergedMap: CategoryPageBannersMap = { ...defaults };

    for (const key of ALLOWED_PAGE_KEYS) {
      if (savedMap[key]) {
        mergedMap[key] = {
          ...defaults[key],
          ...savedMap[key],
          key: key,
          pageKey: key,
          pageName: defaults[key].pageName,
          pagePath: defaults[key].pagePath,
        };
      } else {
        mergedMap[key] = {
          ...defaults[key],
          key: key,
          pageKey: key,
        };
      }
    }

    return mergedMap;
  } catch (err) {
    console.warn("[BannerService.getPageBanners] Failed to fetch banners, falling back to defaults:", err);
    return defaults;
  }
}

/**
 * Retrieves banner configuration for a single page by key or slug.
 */
export async function getPageBanner(rawKey: string): Promise<PageBannerConfig | null> {
  const key = normalizePageKey(rawKey);
  const banners = await getPageBanners();
  return banners[key] || null;
}

/**
 * Updates banner configuration for a specific page.
 */
export async function updatePageBanner(
  rawKey: string,
  updates: Partial<PageBannerConfig>
): Promise<PageBannerConfig> {
  const key = normalizePageKey(rawKey);

  if (!ALLOWED_PAGE_KEYS.includes(key as SupportedPageKey)) {
    throw new Error(`Unsupported page key "${rawKey}". Must be one of: ${ALLOWED_PAGE_KEYS.join(", ")}`);
  }

  const currentMap = await getPageBanners();
  const currentBanner = currentMap[key] || getDefaultPageBanners()[key];

  // Validate objectPosition
  const validPositions: BannerObjectPosition[] = ["center", "top", "bottom", "left", "right"];
  let finalObjectPosition = currentBanner.objectPosition || "center";
  if (updates.objectPosition !== undefined) {
    if (!validPositions.includes(updates.objectPosition)) {
      throw new Error(`Invalid objectPosition "${updates.objectPosition}". Must be one of: ${validPositions.join(", ")}`);
    }
    finalObjectPosition = updates.objectPosition;
  }

  // Validate overlayOpacity
  let finalOverlayOpacity = currentBanner.overlayOpacity ?? 40;
  if (updates.overlayOpacity !== undefined) {
    const num = Number(updates.overlayOpacity);
    if (isNaN(num) || num < 0 || num > 100) {
      throw new Error(`Invalid overlayOpacity "${updates.overlayOpacity}". Must be an integer between 0 and 100`);
    }
    finalOverlayOpacity = Math.round(num);
  }

  // Handle imageUrl
  let finalImageUrl: string | null = currentBanner.imageUrl || null;
  if (updates.imageUrl === null || updates.imageUrl === "") {
    finalImageUrl = null;
  } else if (updates.imageUrl !== undefined) {
    finalImageUrl = String(updates.imageUrl).trim();
  }

  const updatedBanner: PageBannerConfig = {
    ...currentBanner,
    key: key,
    pageKey: key,
    isEnabled: updates.isEnabled !== undefined ? Boolean(updates.isEnabled) : (currentBanner.isEnabled !== false),
    imageUrl: finalImageUrl,
    title: updates.title !== undefined ? String(updates.title).trim() : currentBanner.title,
    label: updates.label !== undefined ? (updates.label ? String(updates.label).trim() : null) : (currentBanner.label ?? null),
    description: updates.description !== undefined ? (updates.description ? String(updates.description).trim() : null) : (currentBanner.description ?? null),
    objectPosition: finalObjectPosition,
    overlayOpacity: finalOverlayOpacity,
    updatedAt: new Date().toISOString(),
  };

  const newMap: CategoryPageBannersMap = {
    ...currentMap,
    [key]: updatedBanner,
  };

  const { error } = await supabaseAdmin.from("site_settings").upsert(
    {
      key: SITE_SETTINGS_KEY_PAGE_BANNERS,
      value: newMap,
      description: "Authoritative banner images and headings for Category and Combo pages",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    throw new Error(`Database error saving banner: ${error.message}`);
  }

  // If this is a category page and imageUrl is updated, also sync categories.image_url for consistency
  if (["earrings", "necklaces", "rings", "payals", "bracelets"].includes(key) && updates.imageUrl !== undefined) {
    try {
      await supabaseAdmin
        .from("categories")
        .update({
          image_url: updatedBanner.imageUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", key);
    } catch (catSyncErr) {
      console.warn(`[BannerService] Optional category image_url sync failed for ${key}:`, catSyncErr);
    }
  }

  // Revalidate relevant storefront caches
  try {
    revalidatePath("/", "page");
    revalidatePath("/shop", "page");
    revalidatePath("/build-your-combo", "page");
    revalidatePath("/combos", "page");
    revalidatePath("/category/[slug]", "page");
    revalidatePath(`/category/${key}`, "page");
    if (key === "payals") {
      revalidatePath("/category/payal", "page");
    }
  } catch {
    // Quiet catch for standalone CLI execution outside Next.js request context
  }

  return updatedBanner;
}
