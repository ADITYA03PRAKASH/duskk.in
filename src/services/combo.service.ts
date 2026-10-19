import { supabaseAdmin } from "@/lib/supabase/admin";
import { Combo, ComboInput, ComboItemDetail, CustomComboSettings } from "@/types";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function revalidateComboCaches(slug?: string) {
  try {
    revalidatePath("/", "page");
    revalidatePath("/combos", "page");
    if (slug) {
      revalidatePath(`/combos/${slug}`, "page");
    }
    revalidatePath("/build-your-combo", "page");
    revalidatePath("/admin/combos", "page");
  } catch (err) {
    console.warn("[ComboService] Revalidation notice:", err);
  }
}

function mapComboFromDb(dbCombo: any): Combo {
  const items: ComboItemDetail[] = (dbCombo.combo_items || []).map((ci: any) => {
    const prod = ci.products || {};
    const primaryImg =
      (prod.product_images as any[])?.find((img) => img.is_primary)?.image_url ||
      (prod.product_images as any[])?.[0]?.image_url ||
      null;

    const variant = ci.product_variants
      ? {
          id: ci.product_variants.id,
          title: ci.product_variants.title,
          sku: ci.product_variants.sku,
          price:
            ci.product_variants.sale_price_override !== null
              ? Number(ci.product_variants.sale_price_override)
              : ci.product_variants.price_override !== null
              ? Number(ci.product_variants.price_override)
              : undefined,
          image: ci.product_variants.image_url || null,
          stockQuantity: ci.product_variants.stock_quantity || 0,
          reservedQuantity: ci.product_variants.reserved_quantity || 0,
          isActive: ci.product_variants.is_active,
        }
      : null;

    return {
      id: ci.id,
      comboId: ci.combo_id,
      productId: ci.product_id,
      variantId: ci.variant_id,
      quantity: ci.quantity,
      sortOrder: ci.sort_order,
      product: {
        id: prod.id || ci.product_id,
        title: prod.title || "Product",
        slug: prod.slug || "",
        sku: prod.sku || "",
        basePrice: Number(prod.base_price || 0),
        salePrice: prod.sale_price ? Number(prod.sale_price) : null,
        image: primaryImg,
        status: prod.status || "active",
      },
      variant,
    };
  });

  const price = Number(dbCombo.price || 0);
  let mrp = Number(dbCombo.mrp || 0);

  // If MRP is not set or smaller than price, compute combined MRP from component base prices
  if (!mrp || mrp < price) {
    const computedMrp = items.reduce(
      (sum, item) => sum + item.product.basePrice * item.quantity,
      0
    );
    if (computedMrp > price) {
      mrp = computedMrp;
    } else {
      mrp = Math.round(price * 1.35); // fallback realistic markup if individual prices missing
    }
  }

  const savingsAmount = Math.max(0, mrp - price);
  const savingsPercent = mrp > 0 ? Math.round((savingsAmount / mrp) * 100) : 0;

  let galleryImages: string[] = [];
  if (Array.isArray(dbCombo.gallery_images)) {
    galleryImages = dbCombo.gallery_images;
  } else if (typeof dbCombo.gallery_images === "string") {
    try {
      galleryImages = JSON.parse(dbCombo.gallery_images);
    } catch {
      galleryImages = [];
    }
  }

  return {
    id: dbCombo.id,
    slug: dbCombo.slug,
    title: dbCombo.title,
    shortDescription: dbCombo.short_description || null,
    description: dbCombo.description || null,
    price,
    mrp,
    imageUrl: dbCombo.image_url || galleryImages[0] || null,
    galleryImages,
    isActive: Boolean(dbCombo.is_active),
    isFeatured: Boolean(dbCombo.is_featured),
    displayOrder: dbCombo.display_order || 0,
    createdAt: dbCombo.created_at,
    updatedAt: dbCombo.updated_at,
    itemsCount: items.length,
    items,
    savingsAmount,
    savingsPercent,
  };
}

const COMBO_SELECT_QUERY = `
  id,
  slug,
  title,
  short_description,
  description,
  price,
  mrp,
  image_url,
  gallery_images,
  is_active,
  is_featured,
  display_order,
  created_at,
  updated_at,
  combo_items (
    id,
    combo_id,
    product_id,
    variant_id,
    quantity,
    sort_order,
    products (
      id,
      title,
      slug,
      sku,
      base_price,
      sale_price,
      status,
      product_images (
        image_url,
        is_primary,
        display_order
      )
    ),
    product_variants (
      id,
      title,
      sku,
      price_override,
      sale_price_override,
      stock_quantity,
      reserved_quantity,
      is_active,
      image_url
    )
  )
`;

export async function getPublishedCombos(): Promise<Combo[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("combos")
      .select(COMBO_SELECT_QUERY)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ComboService] Error fetching published combos:", error);
      return [];
    }

    return (data || []).map(mapComboFromDb);
  } catch (err) {
    console.error("[ComboService] getPublishedCombos exception:", err);
    return [];
  }
}

export async function getComboBySlug(slug: string): Promise<Combo | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("combos")
      .select(COMBO_SELECT_QUERY)
      .eq("slug", slug.trim().toLowerCase())
      .eq("is_active", true);

    if (error || !data || data.length === 0) {
      return null;
    }

    return mapComboFromDb(data[0]);
  } catch (err) {
    console.error("[ComboService] getComboBySlug exception:", err);
    return null;
  }
}

export async function getAllAdminCombos(): Promise<Combo[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("combos")
      .select(COMBO_SELECT_QUERY)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ComboService] Error fetching admin combos:", error);
      throw new Error(error.message);
    }

    return (data || []).map(mapComboFromDb);
  } catch (err: any) {
    console.error("[ComboService] getAllAdminCombos exception:", err);
    throw err;
  }
}

export async function getAdminComboById(id: string): Promise<Combo | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("combos")
      .select(COMBO_SELECT_QUERY)
      .eq("id", id);

    if (error || !data || data.length === 0) {
      return null;
    }

    return mapComboFromDb(data[0]);
  } catch (err) {
    console.error("[ComboService] getAdminComboById exception:", err);
    return null;
  }
}

export async function createCombo(input: ComboInput): Promise<Combo> {
  let baseSlug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);
  if (!baseSlug) {
    baseSlug = `combo-${Date.now()}`;
  }

  // Ensure unique slug
  let uniqueSlug = baseSlug;
  let counter = 1;
  while (true) {
    const { data: existing } = await supabaseAdmin
      .from("combos")
      .select("id")
      .eq("slug", uniqueSlug);

    if (!existing || existing.length === 0) break;
    uniqueSlug = `${baseSlug}-${counter++}`;
  }

  const { data: createdList, error: insertError } = await supabaseAdmin
    .from("combos")
    .insert({
      title: input.title.trim(),
      slug: uniqueSlug,
      short_description: input.shortDescription?.trim() || null,
      description: input.description?.trim() || null,
      price: input.price,
      mrp: input.mrp && input.mrp >= input.price ? input.mrp : input.price,
      image_url: input.imageUrl?.trim() || null,
      gallery_images: input.galleryImages || (input.imageUrl ? [input.imageUrl] : []),
      is_active: input.isActive ?? true,
      is_featured: input.isFeatured ?? false,
      display_order: input.displayOrder ?? 0,
    })
    .select();

  if (insertError || !createdList || createdList.length === 0) {
    console.error("[ComboService] Insert combo error:", insertError);
    throw new Error(insertError?.message || "Failed to create combo");
  }

  const newCombo = createdList[0];

  // Insert items if provided
  if (input.items && input.items.length > 0) {
    const itemsData = input.items.map((item, index) => ({
      combo_id: newCombo.id,
      product_id: item.productId,
      variant_id: item.variantId || null,
      quantity: Math.max(1, item.quantity || 1),
      sort_order: item.sortOrder ?? index,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("combo_items")
      .insert(itemsData);

    if (itemsError) {
      console.error("[ComboService] Insert combo_items error:", itemsError);
    }
  }

  revalidateComboCaches(uniqueSlug);

  const fullCombo = await getAdminComboById(newCombo.id);
  if (!fullCombo) {
    throw new Error("Combo created but failed to retrieve record.");
  }
  return fullCombo;
}

export async function updateCombo(id: string, input: Partial<ComboInput>): Promise<Combo> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.slug !== undefined && input.slug.trim()) updateData.slug = slugify(input.slug);
  if (input.shortDescription !== undefined) updateData.short_description = input.shortDescription?.trim() || null;
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.price !== undefined) updateData.price = Number(input.price);
  if (input.mrp !== undefined) updateData.mrp = Number(input.mrp);
  if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl?.trim() || null;
  if (input.galleryImages !== undefined) updateData.gallery_images = input.galleryImages;
  if (input.isActive !== undefined) updateData.is_active = Boolean(input.isActive);
  if (input.isFeatured !== undefined) updateData.is_featured = Boolean(input.isFeatured);
  if (input.displayOrder !== undefined) updateData.display_order = Number(input.displayOrder);

  const { data: updatedList, error: updateError } = await supabaseAdmin
    .from("combos")
    .update(updateData)
    .eq("id", id)
    .select();

  if (updateError || !updatedList || updatedList.length === 0) {
    console.error("[ComboService] Update combo error:", updateError);
    throw new Error(updateError?.message || "Failed to update combo");
  }

  const updated = updatedList[0];

  // Update combo_items if provided
  if (input.items !== undefined) {
    // Delete existing
    await supabaseAdmin.from("combo_items").delete().eq("combo_id", id);

    if (input.items.length > 0) {
      const itemsData = input.items.map((item, index) => ({
        combo_id: id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity: Math.max(1, item.quantity || 1),
        sort_order: item.sortOrder ?? index,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("combo_items")
        .insert(itemsData);

      if (itemsError) {
        console.error("[ComboService] Replace combo_items error:", itemsError);
      }
    }
  }

  revalidateComboCaches(updated.slug);

  const fullCombo = await getAdminComboById(id);
  if (!fullCombo) {
    throw new Error("Combo updated but failed to retrieve record.");
  }
  return fullCombo;
}

export async function toggleComboStatus(id: string, isActive: boolean): Promise<Combo> {
  const { data, error } = await supabaseAdmin
    .from("combos")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("slug");

  if (error || !data || data.length === 0) {
    throw new Error(error?.message || "Failed to update combo status");
  }

  const slug = data[0]?.slug;
  revalidateComboCaches(slug);

  const fullCombo = await getAdminComboById(id);
  if (!fullCombo) {
    throw new Error("Combo status updated but failed to retrieve record.");
  }
  return fullCombo;
}

export async function deleteCombo(id: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("combos")
    .select("slug")
    .eq("id", id);

  const slug = data?.[0]?.slug;

  const { error } = await supabaseAdmin.from("combos").delete().eq("id", id);
  if (error) {
    console.error("[ComboService] Delete combo error:", error);
    throw new Error(error.message);
  }

  revalidateComboCaches(slug);
  return true;
}

export async function reorderCombos(orders: { id: string; displayOrder: number }[]): Promise<boolean> {
  for (const item of orders) {
    await supabaseAdmin
      .from("combos")
      .update({ display_order: item.displayOrder, updated_at: new Date().toISOString() })
      .eq("id", item.id);
  }

  revalidateComboCaches();
  return true;
}

export const DEFAULT_CUSTOM_COMBO_SETTINGS: CustomComboSettings = {
  isEnabled: true,
  title: "Build Your Own Combo",
  subtitle: "Create your bespoke luxury jewelry pairing. Select your favorite pieces and unlock an exclusive bundled gift discount.",
  eligibleCategoryIds: [],
  eligibleProductIds: [],
  minItems: 2,
  maxItems: 5,
  minQuantityPerProduct: 1,
  maxQuantityPerProduct: 3,
  discountType: "percentage",
  discountValue: 15,
  maxDiscountAmount: 1500,
  allowCouponsWithCombo: false,
  startsAt: null,
  endsAt: null,
  showOnHomepage: true,
  homepageDisplayOrder: 1,
};

export async function getCustomComboSettings(): Promise<CustomComboSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "custom_combo_settings")
      .single();

    if (error || !data?.value) {
      return DEFAULT_CUSTOM_COMBO_SETTINGS;
    }

    return {
      ...DEFAULT_CUSTOM_COMBO_SETTINGS,
      ...data.value,
    };
  } catch (err) {
    console.warn("[ComboService] Error reading custom_combo_settings:", err);
    return DEFAULT_CUSTOM_COMBO_SETTINGS;
  }
}

export async function updateCustomComboSettings(
  input: Partial<CustomComboSettings>
): Promise<CustomComboSettings> {
  const current = await getCustomComboSettings();
  const merged: CustomComboSettings = {
    ...current,
    ...input,
    minItems: Math.max(1, input.minItems !== undefined ? Number(input.minItems) : current.minItems),
    maxItems: Math.max(
      input.minItems !== undefined ? Number(input.minItems) : current.minItems,
      input.maxItems !== undefined ? Number(input.maxItems) : current.maxItems
    ),
    minQuantityPerProduct: Math.max(1, input.minQuantityPerProduct !== undefined ? Number(input.minQuantityPerProduct) : current.minQuantityPerProduct),
    maxQuantityPerProduct: Math.max(
      input.minQuantityPerProduct !== undefined ? Number(input.minQuantityPerProduct) : current.minQuantityPerProduct,
      input.maxQuantityPerProduct !== undefined ? Number(input.maxQuantityPerProduct) : current.maxQuantityPerProduct
    ),
    discountValue: Math.max(0, input.discountValue !== undefined ? Number(input.discountValue) : current.discountValue),
    maxDiscountAmount: input.maxDiscountAmount ? Math.max(0, Number(input.maxDiscountAmount)) : null,
  };

  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({
      key: "custom_combo_settings",
      value: merged,
      description: "Configuration and discount rules for Build Your Own Combo",
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("[ComboService] Update custom_combo_settings error:", error);
    throw new Error(error.message || "Failed to update custom combo settings");
  }

  revalidateComboCaches();
  return merged;
}

export async function getEligibleBuilderProducts(settings?: CustomComboSettings) {
  const config = settings || (await getCustomComboSettings());

  let query = supabaseAdmin
    .from("products")
    .select(`
      id,
      title,
      slug,
      sku,
      base_price,
      sale_price,
      category_id,
      status,
      categories!products_category_id_fkey (
        id,
        name,
        slug
      ),
      product_images (
        image_url,
        is_primary,
        display_order
      ),
      product_variants (
        id,
        sku,
        title,
        price_override,
        sale_price_override,
        stock_quantity,
        reserved_quantity,
        is_active,
        image_url
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (config.eligibleProductIds && config.eligibleProductIds.length > 0) {
    query = query.in("id", config.eligibleProductIds);
  } else if (config.eligibleCategoryIds && config.eligibleCategoryIds.length > 0) {
    query = query.in("category_id", config.eligibleCategoryIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[ComboService] Error fetching eligible products:", error);
    return [];
  }

  return (data || []).map((p: any) => {
    const images = (p.product_images || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    );
    const primaryImg = images.find((i: any) => i.is_primary)?.image_url || images[0]?.image_url || "/placeholder.jpg";
    const activeVariants = (p.product_variants || []).filter((v: any) => v.is_active);

    const price = p.sale_price !== null ? Number(p.sale_price) : Number(p.base_price);
    const mrp = Number(p.base_price);
    const totalAvailableStock = activeVariants.reduce(
      (acc: number, v: any) => acc + Math.max(0, (v.stock_quantity || 0) - (v.reserved_quantity || 0)),
      0
    );

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      sku: p.sku,
      price,
      mrp,
      image: primaryImg,
      categoryId: p.category_id,
      categoryName: p.categories?.name || "Jewellery",
      categorySlug: p.categories?.slug || "all",
      availableStock: totalAvailableStock,
      inStock: totalAvailableStock > 0,
      variants: activeVariants.map((v: any) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        price: v.sale_price_override !== null
          ? Number(v.sale_price_override)
          : v.price_override !== null
          ? Number(v.price_override)
          : price,
        stockQuantity: Math.max(0, (v.stock_quantity || 0) - (v.reserved_quantity || 0)),
        image: v.image_url || primaryImg,
      })),
    };
  });
}

export async function saveCustomComboOrderSnapshot(
  orderId: string,
  customerId: string | null,
  customCombo: {
    title: string;
    components: any[];
    subtotal: number;
    discount: number;
    finalPrice: number;
  }
) {
  try {
    const { error } = await supabaseAdmin.from("custom_combos").insert({
      order_id: orderId,
      customer_id: customerId || null,
      combo_title: customCombo.title,
      components: customCombo.components,
      subtotal_amount: customCombo.subtotal,
      discount_amount: customCombo.discount,
      final_price: customCombo.finalPrice,
    });

    if (error) {
      console.error("[ComboService] saveCustomComboOrderSnapshot error:", error);
    }
  } catch (err) {
    console.error("[ComboService] saveCustomComboOrderSnapshot exception:", err);
  }
}

