import { supabaseAdmin } from "@/lib/supabase/admin";
import { CartItemInput, PriceBreakdown } from "@/types";
import { getCustomComboSettings } from "./combo.service";

const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_CHARGE = 99;

export async function validateAndCalculateCart(
  items: CartItemInput[],
  couponCode?: string
): Promise<PriceBreakdown> {
  if (!items || items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const customSettings = await getCustomComboSettings();

  const customComboProductIds = items
    .filter((i) => (i.isCustomCombo || (i.customComponents && i.customComponents.length > 0)) && Array.isArray(i.customComponents))
    .flatMap((i) => (i.customComponents || []).map((c) => c.productId))
    .filter(Boolean);

  const productIds = Array.from(
    new Set([
      ...items
        .filter((i) => !i.comboId && !i.isCustomCombo && (!i.customComponents || i.customComponents.length === 0) && Boolean(i.productId))
        .map((i) => i.productId as string),
      ...customComboProductIds,
    ])
  );

  const comboIds = Array.from(
    new Set(
      items
        .filter((i) => Boolean(i.comboId))
        .map((i) => i.comboId as string)
    )
  );

  let products: any[] = [];
  if (productIds.length > 0) {
    try {
      const { data: dbProducts, error: prodError } = await supabaseAdmin
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
        .in("id", productIds);

      if (!prodError && dbProducts && dbProducts.length > 0) {
        products = dbProducts;
      }
    } catch (err) {
      console.warn("Pricing cart validation DB lookup fallback:", err);
    }
  }

  let combos: any[] = [];
  if (comboIds.length > 0) {
    try {
      const { data: dbCombos, error: comboError } = await supabaseAdmin
        .from("combos")
        .select(`
          id,
          title,
          slug,
          price,
          mrp,
          image_url,
          gallery_images,
          is_active,
          combo_items (
            id,
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
              ),
              product_variants (
                id,
                sku,
                title,
                stock_quantity,
                reserved_quantity,
                is_active
              )
            ),
            product_variants (
              id,
              sku,
              title,
              stock_quantity,
              reserved_quantity,
              is_active
            )
          )
        `)
        .in("id", comboIds);

      if (!comboError && dbCombos) {
        combos = dbCombos;
      }
    } catch (err) {
      console.warn("Pricing cart validation combo lookup fallback:", err);
    }
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const comboMap = new Map(combos.map((c) => [c.id, c]));

  let subtotal = 0;
  const validatedItems: PriceBreakdown["validatedItems"] = [];

  for (const item of items) {
    const itemQuantity = Math.max(1, item.quantity || 1);

    // 1. Handle Combo Items
    if (item.comboId) {
      const combo = comboMap.get(item.comboId);
      if (!combo) {
        throw new Error("Selected combo is unavailable or does not exist.");
      }

      if (!combo.is_active) {
        throw new Error(`Combo "${combo.title}" is no longer active for purchase.`);
      }

      const comboItemsList: any[] = combo.combo_items || [];
      if (comboItemsList.length === 0) {
        throw new Error(`Combo "${combo.title}" does not contain any active items.`);
      }

      let maxCombosPossible = 999;
      let computedComponentMrp = 0;
      const comboComponents: {
        productId: string;
        variantId?: string | null;
        quantity: number;
        name: string;
        sku: string;
      }[] = [];

      for (const ci of comboItemsList) {
        const prod = ci.products;
        if (!prod || prod.status !== "active") {
          throw new Error(
            `Product "${prod?.title || ci.product_id}" in "${combo.title}" is currently unavailable.`
          );
        }

        const compQtyPerCombo = Math.max(1, ci.quantity || 1);
        const totalCompQtyNeeded = itemQuantity * compQtyPerCombo;

        let compVariant = ci.product_variants;
        if (!compVariant && Array.isArray(prod.product_variants)) {
          compVariant = prod.product_variants.find((v: any) => v.is_active) || prod.product_variants[0];
        }

        let compAvailableStock = 0;
        if (compVariant) {
          compAvailableStock = Math.max(0, (compVariant.stock_quantity || 0) - (compVariant.reserved_quantity || 0));
        } else {
          compAvailableStock = 50; // fallback if untracked
        }

        const combosSupported = Math.floor(compAvailableStock / compQtyPerCombo);
        if (combosSupported < maxCombosPossible) {
          maxCombosPossible = combosSupported;
        }

        if (compAvailableStock < totalCompQtyNeeded) {
          throw new Error(
            `Insufficient stock for "${prod.title}" inside "${combo.title}". Only ${combosSupported} combos can be fulfilled.`
          );
        }

        computedComponentMrp += Number(prod.base_price || prod.sale_price || 0) * compQtyPerCombo;

        comboComponents.push({
          productId: prod.id,
          variantId: compVariant?.id || null,
          quantity: compQtyPerCombo,
          name: prod.title,
          sku: compVariant?.sku || prod.sku,
        });
      }

      const comboPrice = Number(combo.price);
      let comboMrp = Number(combo.mrp || 0);
      if (!comboMrp || comboMrp < comboPrice) {
        comboMrp = computedComponentMrp > comboPrice ? computedComponentMrp : Math.round(comboPrice * 1.3);
      }

      const itemSubtotal = comboPrice * itemQuantity;
      subtotal += itemSubtotal;

      const comboImg =
        combo.image_url ||
        (Array.isArray(combo.gallery_images) ? combo.gallery_images[0] : null) ||
        (comboItemsList[0]?.products?.product_images as any[])?.[0]?.image_url ||
        "/placeholder.jpg";

      validatedItems.push({
        productId: null,
        comboId: combo.id,
        isCombo: true,
        variantId: null,
        name: `[Combo] ${combo.title}`,
        variantTitle: `${comboItemsList.length} items set`,
        sku: `COMBO-${combo.slug.toUpperCase()}`,
        image: comboImg,
        price: comboPrice,
        mrp: comboMrp,
        quantity: itemQuantity,
        subtotal: itemSubtotal,
        availableStock: maxCombosPossible,
        comboComponents,
      });

      continue;
    }

    // 2. Handle Custom Combo Items (Build Your Own Combo)
    if (item.isCustomCombo || (item.customComponents && item.customComponents.length > 0)) {
      if (!customSettings.isEnabled) {
        throw new Error("Build Your Own Combo is currently unavailable.");
      }

      const now = new Date();
      if (customSettings.startsAt && now < new Date(customSettings.startsAt)) {
        throw new Error("The Build Your Own Combo promotion is not yet active.");
      }
      if (customSettings.endsAt && now > new Date(customSettings.endsAt)) {
        throw new Error("The Build Your Own Combo promotion has ended.");
      }

      const componentsInput = item.customComponents || [];
      if (componentsInput.length < customSettings.minItems) {
        throw new Error(`Custom combo requires at least ${customSettings.minItems} distinct items.`);
      }
      if (componentsInput.length > customSettings.maxItems) {
        throw new Error(`Custom combo allows at most ${customSettings.maxItems} distinct items.`);
      }

      let combinedRawPrice = 0;
      let combinedMrp = 0;
      let maxCombosPossible = 999;
      const validatedComponents: {
        productId: string;
        variantId?: string | null;
        quantity: number;
        name: string;
        variantTitle?: string | null;
        sku: string;
        price: number;
        mrp: number;
        image: string | null;
      }[] = [];

      const seenProductIds = new Set<string>();

      for (const comp of componentsInput) {
        if (!comp.productId) {
          throw new Error("Invalid product in custom combo.");
        }
        if (seenProductIds.has(comp.productId)) {
          throw new Error("Custom combo cannot contain duplicate selections of the same product.");
        }
        seenProductIds.add(comp.productId);

        const compQty = Math.max(1, comp.quantity || 1);
        if (compQty < customSettings.minQuantityPerProduct) {
          throw new Error(`Minimum quantity per product is ${customSettings.minQuantityPerProduct}.`);
        }
        if (compQty > customSettings.maxQuantityPerProduct) {
          throw new Error(`Maximum quantity per product is ${customSettings.maxQuantityPerProduct}.`);
        }

        const prod = productMap.get(comp.productId);
        if (!prod || prod.status !== "active") {
          throw new Error(`Product "${prod?.title || comp.productId}" in custom combo is currently unavailable.`);
        }

        if (customSettings.eligibleProductIds && customSettings.eligibleProductIds.length > 0) {
          if (!customSettings.eligibleProductIds.includes(prod.id)) {
            throw new Error(`Product "${prod.title}" is not eligible for Build Your Own Combo.`);
          }
        } else if (customSettings.eligibleCategoryIds && customSettings.eligibleCategoryIds.length > 0) {
          if (!customSettings.eligibleCategoryIds.includes(prod.category_id)) {
            throw new Error(`Product "${prod.title}" is in a category not eligible for Build Your Own Combo.`);
          }
        }

        const activeVariants: any[] = (prod.product_variants || []).filter((v: any) => v.is_active);
        let selectedVariant: any = null;

        if (comp.variantId) {
          selectedVariant = activeVariants.find((v: any) => v.id === comp.variantId);
          if (!selectedVariant) {
            throw new Error(`Selected variant for "${prod.title}" is unavailable.`);
          }
        } else if (activeVariants.length > 0) {
          selectedVariant = activeVariants[0];
        }

        let compPrice = prod.sale_price !== null ? Number(prod.sale_price) : Number(prod.base_price);
        let compMrp = Number(prod.base_price);
        let compSku = prod.sku;
        let compVariantTitle: string | null = null;
        let compAvailableStock = 0;

        if (selectedVariant) {
          compVariantTitle = selectedVariant.title;
          compSku = selectedVariant.sku || prod.sku;
          if (selectedVariant.sale_price_override !== null && selectedVariant.sale_price_override !== undefined) {
            compPrice = Number(selectedVariant.sale_price_override);
          } else if (selectedVariant.price_override !== null && selectedVariant.price_override !== undefined) {
            compPrice = Number(selectedVariant.price_override);
          }
          compAvailableStock = Math.max(0, (selectedVariant.stock_quantity || 0) - (selectedVariant.reserved_quantity || 0));
        } else {
          compAvailableStock = 50;
        }

        const totalNeeded = compQty * itemQuantity;
        if (compAvailableStock < totalNeeded) {
          const supported = Math.floor(compAvailableStock / compQty);
          throw new Error(`Insufficient stock for "${prod.title}". Only ${supported} custom combo(s) can be fulfilled.`);
        }

        const compCombosSupported = Math.floor(compAvailableStock / compQty);
        if (compCombosSupported < maxCombosPossible) {
          maxCombosPossible = compCombosSupported;
        }

        const primaryImgObj =
          (prod.product_images as any[])?.find((img: any) => img.is_primary) ||
          (prod.product_images as any[])?.[0];
        const compImg = selectedVariant?.image_url || primaryImgObj?.image_url || "/placeholder.jpg";

        combinedRawPrice += compPrice * compQty;
        combinedMrp += compMrp * compQty;

        validatedComponents.push({
          productId: prod.id,
          variantId: selectedVariant?.id || null,
          quantity: compQty,
          name: prod.title,
          variantTitle: compVariantTitle,
          sku: compSku,
          price: compPrice,
          mrp: compMrp,
          image: compImg,
        });
      }

      let comboDiscount = 0;
      if (customSettings.discountType === "percentage" && customSettings.discountValue > 0) {
        let calc = (combinedRawPrice * customSettings.discountValue) / 100;
        if (customSettings.maxDiscountAmount && calc > customSettings.maxDiscountAmount) {
          calc = customSettings.maxDiscountAmount;
        }
        comboDiscount = Math.round(calc);
      } else if (customSettings.discountType === "fixed_amount" && customSettings.discountValue > 0) {
        comboDiscount = Math.min(customSettings.discountValue, combinedRawPrice);
        if (customSettings.maxDiscountAmount && comboDiscount > customSettings.maxDiscountAmount) {
          comboDiscount = customSettings.maxDiscountAmount;
        }
      }

      const finalComboUnitPrice = Math.max(0, combinedRawPrice - comboDiscount);
      const itemSubtotal = finalComboUnitPrice * itemQuantity;
      subtotal += itemSubtotal;

      const firstImg = validatedComponents[0]?.image || "/placeholder.jpg";
      const totalPiecesCount = validatedComponents.reduce((s, c) => s + c.quantity, 0);

      validatedItems.push({
        productId: null,
        comboId: null,
        isCombo: true,
        isCustomCombo: true,
        variantId: null,
        name: `Custom Combo (${totalPiecesCount} Pieces)`,
        variantTitle: validatedComponents.map((c) => `${c.name}${c.variantTitle ? ` (${c.variantTitle})` : ""} ×${c.quantity}`).join(", "),
        sku: `CUSTOM-COMBO-${Date.now().toString().slice(-6)}`,
        image: firstImg,
        price: finalComboUnitPrice,
        mrp: combinedMrp,
        quantity: itemQuantity,
        subtotal: itemSubtotal,
        availableStock: maxCombosPossible,
        comboComponents: validatedComponents,
      });

      continue;
    }

    // 3. Handle Standard Product Items
    const prod = productMap.get(item.productId || "");
    const prodTitle = prod?.title || (item as any).name || (item as any).title || "DUSKK Jewellery Item";

    let itemPrice: number;
    let itemMrp: number;
    let itemSku: string;
    let variantTitle: string | null = null;
    let selectedItemVariantId: string | null = item.variantId || null;
    let availableStock = 99;

    const primaryImgObj =
      (prod?.product_images as any[])?.find((img) => img.is_primary) ||
      (prod?.product_images as any[])?.[0];
    let itemImage = primaryImgObj?.image_url || (item as any).image || "/placeholder.jpg";

    if (prod) {
      if (prod.status !== "active") {
        throw new Error(`"${prod.title}" is no longer available for purchase.`);
      }
      itemPrice = prod.sale_price !== null ? Number(prod.sale_price) : Number(prod.base_price);
      itemMrp = Number(prod.base_price);
      itemSku = prod.sku;

      const activeVariants = (prod.product_variants as any[])?.filter((v: any) => v.is_active) || [];
      if (item.variantId) {
        const variant = activeVariants.find((v: any) => v.id === item.variantId);
        if (!variant) {
          throw new Error(`Requested variant for "${prodTitle}" is unavailable.`);
        }
        variantTitle = variant.title;
        itemSku = variant.sku || prod.sku;
        if (variant.image_url) itemImage = variant.image_url;
        if (variant.sale_price_override !== null && variant.sale_price_override !== undefined) {
          itemPrice = Number(variant.sale_price_override);
        } else if (variant.price_override !== null && variant.price_override !== undefined) {
          itemPrice = Number(variant.price_override);
        }
        availableStock = Math.max(0, variant.stock_quantity - (variant.reserved_quantity || 0));
      } else if (activeVariants.length > 0) {
        // Auto-select standard/single variant for inventory reservation tracking
        if (activeVariants.length === 1) {
          selectedItemVariantId = activeVariants[0].id;
          variantTitle = activeVariants[0].title !== "Standard" ? activeVariants[0].title : null;
          itemSku = activeVariants[0].sku || prod.sku;
        }
        availableStock = activeVariants.reduce(
          (acc: number, v: any) => acc + Math.max(0, v.stock_quantity - (v.reserved_quantity || 0)),
          0
        );
      }
    } else {
      const isMockAllowed =
        process.env.NODE_ENV === "development" && process.env.ENABLE_MOCK_FALLBACK === "true";
      if (!isMockAllowed) {
        throw new Error(
          `Product "${(item as any).name || (item as any).title || item.productId}" is not available in the active catalog.`
        );
      }
      itemPrice = Number((item as any).price || 2599);
      itemMrp = Number((item as any).mrp || itemPrice);
      itemSku = (item as any).sku || `DSK-${Date.now().toString().slice(-4)}`;
    }

    if (availableStock < itemQuantity) {
      throw new Error(`"${prodTitle}" is out of stock or requested quantity exceeds available stock (${availableStock} remaining).`);
    }

    const itemSubtotal = itemPrice * itemQuantity;
    subtotal += itemSubtotal;

    validatedItems.push({
      productId: item.productId || "",
      variantId: selectedItemVariantId,
      name: prodTitle,
      variantTitle,
      sku: itemSku,
      image: itemImage,
      price: itemPrice,
      mrp: itemMrp,
      quantity: itemQuantity,
      subtotal: itemSubtotal,
      availableStock,
    });
  }

  // Calculate discount
  let discount = 0;
  let couponApplied: PriceBreakdown["couponApplied"] | undefined;

  if (couponCode && couponCode.trim()) {
    const normalizedCode = couponCode.trim().toUpperCase();
    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .single();

    if (coupon) {
      const now = new Date();
      const startsAt = new Date(coupon.starts_at);
      const endsAt = coupon.ends_at ? new Date(coupon.ends_at) : null;
      const isValidDate = now >= startsAt && (!endsAt || now <= endsAt);

      // Stacking policy: check if coupon applies to custom combo items
      const hasCustomCombo = validatedItems.some((i) => i.isCustomCombo);
      let couponBaseSubtotal = subtotal;

      if (hasCustomCombo && customSettings.allowCouponsWithCombo === false) {
        const nonComboSubtotal = validatedItems
          .filter((i) => !i.isCustomCombo)
          .reduce((sum, i) => sum + i.subtotal, 0);

        if (nonComboSubtotal <= 0) {
          throw new Error("Coupon codes cannot be combined with Build Your Own Combo savings.");
        }
        couponBaseSubtotal = nonComboSubtotal;
      }

      const meetsMinOrder = couponBaseSubtotal >= Number(coupon.min_order_value || 0);
      const withinLimit =
        !coupon.usage_limit_total || coupon.times_used < coupon.usage_limit_total;

      if (!isValidDate) {
        throw new Error("This coupon has expired or is not yet active.");
      }
      if (!meetsMinOrder) {
        throw new Error(`Coupon ${coupon.code} requires a minimum order of ₹${Number(coupon.min_order_value).toLocaleString("en-IN")}.`);
      }
      if (!withinLimit) {
        throw new Error("This coupon code has reached its usage limit.");
      }

      if (coupon.discount_type === "percentage") {
        let calculated = (couponBaseSubtotal * Number(coupon.discount_value)) / 100;
        if (coupon.max_discount_amount && calculated > Number(coupon.max_discount_amount)) {
          calculated = Number(coupon.max_discount_amount);
        }
        discount = Math.round(calculated);
      } else if (coupon.discount_type === "fixed_amount") {
        discount = Math.min(Number(coupon.discount_value), couponBaseSubtotal);
      }

      couponApplied = {
        code: coupon.code,
        discountValue: discount,
        discountType: coupon.discount_type,
      };
    } else {
      throw new Error(`Coupon "${normalizedCode}" is invalid or inactive.`);
    }
  }

  const shippingCharge = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_CHARGE;
  const tax = Math.round((subtotal - discount) * 0.03); // 3% GST on jewelry
  const totalAmount = Math.max(0, subtotal - discount + shippingCharge);

  return {
    subtotal,
    discount,
    shippingCharge,
    tax,
    totalAmount,
    couponApplied,
    validatedItems,
  };
}

export interface PublicPromotionalCoupon {
  code: string;
  description?: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  offerText: string;
}

export async function getPromotionalCoupon(): Promise<PublicPromotionalCoupon | null> {
  try {
    const { data: coupons, error } = await supabaseAdmin
      .from("coupons")
      .select("id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit_total, times_used, starts_at, ends_at, is_active, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !coupons || coupons.length === 0) {
      return null;
    }

    const now = new Date();
    const validCoupons = coupons.filter((c) => {
      const startsAt = c.starts_at ? new Date(c.starts_at) : null;
      const endsAt = c.ends_at ? new Date(c.ends_at) : null;
      const isValidDate = (!startsAt || now >= startsAt) && (!endsAt || now <= endsAt);
      const withinLimit =
        !c.usage_limit_total || (c.times_used || 0) < c.usage_limit_total;
      const hasDiscount = Number(c.discount_value) > 0;
      return isValidDate && withinLimit && hasDiscount;
    });

    if (validCoupons.length === 0) {
      return null;
    }

    // Pick top promotional coupon following CMS creation order
    const coupon = validCoupons[0];
    const isPercent = coupon.discount_type === "percentage";
    const discountVal = Number(coupon.discount_value);
    const minOrder = Number(coupon.min_order_value || 0);
    const maxDiscount = coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null;

    let offerDiscountDesc = isPercent ? `${discountVal}% Off` : `₹${discountVal} Off`;
    if (minOrder > 0) {
      offerDiscountDesc += ` On Orders Above ₹${minOrder.toLocaleString("en-IN")}`;
    }
    if (isPercent && maxDiscount) {
      offerDiscountDesc += ` (Up To ₹${maxDiscount.toLocaleString("en-IN")})`;
    }

    return {
      code: coupon.code,
      description: coupon.description || null,
      discountType: isPercent ? "PERCENT" : "FIXED",
      discountValue: discountVal,
      minOrderValue: minOrder,
      maxDiscount,
      offerText: `Use Code: ${coupon.code} For ${offerDiscountDesc}`,
    };
  } catch (err: any) {
    console.error("getPromotionalCoupon error:", err?.message || err);
    return null;
  }
}

