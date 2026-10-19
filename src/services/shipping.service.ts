import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  ShippingSettings,
  ShippingCalculationResult,
  ShippingRuleApplied,
  ShippingSnapshot,
} from "@/types";
import { revalidatePath } from "next/cache";

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  isEnabled: true,
  methodName: "Insured Express Shipping",
  defaultCharge: 99,
  currency: "INR",
  estimatedDeliveryText: "Delivered within 3-5 business days across India",

  globalFreeShipping: {
    isEnabled: false,
    label: "Festival Special: Free Insured Express Shipping on all orders",
  },

  minOrderThreshold: {
    isEnabled: true,
    minSubtotal: 999,
    label: "Free Insured Express Shipping on orders above ₹999",
  },

  scheduledPromotion: {
    isEnabled: false,
    promotionName: "Festive Free Shipping",
    startsAt: null,
    endsAt: null,
  },

  productSpecificRules: {
    isEnabled: false,
    eligibleProductIds: [],
    entireOrderFree: true,
  },

  categorySpecificRules: {
    isEnabled: false,
    eligibleCategoryIds: [],
    entireOrderFree: true,
  },
};

export function revalidateShippingCaches() {
  try {
    revalidatePath("/", "page");
    revalidatePath("/cart", "page");
    revalidatePath("/checkout", "page");
    revalidatePath("/admin/shipping", "page");
  } catch (err) {
    console.warn("[ShippingService] Revalidation notice:", err);
  }
}

/**
 * Loads trusted shipping settings from Supabase site_settings table.
 * Falls back to DEFAULT_SHIPPING_SETTINGS gracefully if missing or unreachable.
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "shipping_settings")
      .single();

    if (error || !data?.value) {
      return DEFAULT_SHIPPING_SETTINGS;
    }

    const val = data.value;

    return {
      isEnabled: val.isEnabled !== undefined ? Boolean(val.isEnabled) : DEFAULT_SHIPPING_SETTINGS.isEnabled,
      methodName: val.methodName || DEFAULT_SHIPPING_SETTINGS.methodName,
      defaultCharge: typeof val.defaultCharge === "number" ? Math.max(0, val.defaultCharge) : DEFAULT_SHIPPING_SETTINGS.defaultCharge,
      currency: val.currency || DEFAULT_SHIPPING_SETTINGS.currency,
      estimatedDeliveryText: val.estimatedDeliveryText !== undefined ? val.estimatedDeliveryText : DEFAULT_SHIPPING_SETTINGS.estimatedDeliveryText,

      globalFreeShipping: {
        isEnabled: Boolean(val.globalFreeShipping?.isEnabled),
        label: val.globalFreeShipping?.label || DEFAULT_SHIPPING_SETTINGS.globalFreeShipping.label,
      },

      minOrderThreshold: {
        isEnabled: val.minOrderThreshold?.isEnabled !== undefined ? Boolean(val.minOrderThreshold.isEnabled) : DEFAULT_SHIPPING_SETTINGS.minOrderThreshold.isEnabled,
        minSubtotal: typeof val.minOrderThreshold?.minSubtotal === "number"
          ? Math.max(0, val.minOrderThreshold.minSubtotal)
          : DEFAULT_SHIPPING_SETTINGS.minOrderThreshold.minSubtotal,
        label: val.minOrderThreshold?.label || DEFAULT_SHIPPING_SETTINGS.minOrderThreshold.label,
      },

      scheduledPromotion: {
        isEnabled: Boolean(val.scheduledPromotion?.isEnabled),
        promotionName: val.scheduledPromotion?.promotionName || DEFAULT_SHIPPING_SETTINGS.scheduledPromotion.promotionName,
        startsAt: val.scheduledPromotion?.startsAt || null,
        endsAt: val.scheduledPromotion?.endsAt || null,
      },

      productSpecificRules: {
        isEnabled: Boolean(val.productSpecificRules?.isEnabled),
        eligibleProductIds: Array.isArray(val.productSpecificRules?.eligibleProductIds)
          ? val.productSpecificRules.eligibleProductIds
          : [],
        entireOrderFree: val.productSpecificRules?.entireOrderFree !== undefined
          ? Boolean(val.productSpecificRules.entireOrderFree)
          : true,
      },

      categorySpecificRules: {
        isEnabled: Boolean(val.categorySpecificRules?.isEnabled),
        eligibleCategoryIds: Array.isArray(val.categorySpecificRules?.eligibleCategoryIds)
          ? val.categorySpecificRules.eligibleCategoryIds
          : [],
        entireOrderFree: val.categorySpecificRules?.entireOrderFree !== undefined
          ? Boolean(val.categorySpecificRules.entireOrderFree)
          : true,
      },
    };
  } catch (err) {
    console.warn("[ShippingService] Error reading shipping_settings fallback:", err);
    return DEFAULT_SHIPPING_SETTINGS;
  }
}

/**
 * Updates shipping configuration in Supabase site_settings table.
 * Admin authenticated action only.
 */
export async function updateShippingSettings(
  input: Partial<ShippingSettings>
): Promise<ShippingSettings> {
  const current = await getShippingSettings();

  const merged: ShippingSettings = {
    isEnabled: input.isEnabled !== undefined ? Boolean(input.isEnabled) : current.isEnabled,
    methodName: (input.methodName || current.methodName || "Insured Express Shipping").trim(),
    defaultCharge: input.defaultCharge !== undefined ? Math.max(0, Number(input.defaultCharge)) : current.defaultCharge,
    currency: (input.currency || current.currency || "INR").trim(),
    estimatedDeliveryText: input.estimatedDeliveryText !== undefined ? input.estimatedDeliveryText.trim() : current.estimatedDeliveryText,

    globalFreeShipping: {
      isEnabled: input.globalFreeShipping?.isEnabled !== undefined
        ? Boolean(input.globalFreeShipping.isEnabled)
        : current.globalFreeShipping.isEnabled,
      label: input.globalFreeShipping?.label !== undefined
        ? input.globalFreeShipping.label
        : current.globalFreeShipping.label,
    },

    minOrderThreshold: {
      isEnabled: input.minOrderThreshold?.isEnabled !== undefined
        ? Boolean(input.minOrderThreshold.isEnabled)
        : current.minOrderThreshold.isEnabled,
      minSubtotal: input.minOrderThreshold?.minSubtotal !== undefined
        ? Math.max(0, Number(input.minOrderThreshold.minSubtotal))
        : current.minOrderThreshold.minSubtotal,
      label: input.minOrderThreshold?.label !== undefined
        ? input.minOrderThreshold.label
        : current.minOrderThreshold.label,
    },

    scheduledPromotion: {
      isEnabled: input.scheduledPromotion?.isEnabled !== undefined
        ? Boolean(input.scheduledPromotion.isEnabled)
        : current.scheduledPromotion.isEnabled,
      promotionName: (input.scheduledPromotion?.promotionName || current.scheduledPromotion.promotionName || "Festive Promotion").trim(),
      startsAt: input.scheduledPromotion?.startsAt ? new Date(input.scheduledPromotion.startsAt).toISOString() : null,
      endsAt: input.scheduledPromotion?.endsAt ? new Date(input.scheduledPromotion.endsAt).toISOString() : null,
    },

    productSpecificRules: {
      isEnabled: input.productSpecificRules?.isEnabled !== undefined
        ? Boolean(input.productSpecificRules.isEnabled)
        : current.productSpecificRules.isEnabled,
      eligibleProductIds: Array.isArray(input.productSpecificRules?.eligibleProductIds)
        ? input.productSpecificRules.eligibleProductIds
        : current.productSpecificRules.eligibleProductIds,
      entireOrderFree: input.productSpecificRules?.entireOrderFree !== undefined
        ? Boolean(input.productSpecificRules.entireOrderFree)
        : current.productSpecificRules.entireOrderFree,
    },

    categorySpecificRules: {
      isEnabled: input.categorySpecificRules?.isEnabled !== undefined
        ? Boolean(input.categorySpecificRules.isEnabled)
        : current.categorySpecificRules.isEnabled,
      eligibleCategoryIds: Array.isArray(input.categorySpecificRules?.eligibleCategoryIds)
        ? input.categorySpecificRules.eligibleCategoryIds
        : current.categorySpecificRules.eligibleCategoryIds,
      entireOrderFree: input.categorySpecificRules?.entireOrderFree !== undefined
        ? Boolean(input.categorySpecificRules.entireOrderFree)
        : current.categorySpecificRules.entireOrderFree,
    },
  };

  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({
      key: "shipping_settings",
      value: merged,
      description: "Authoritative shipping configuration and promotional free shipping rules",
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("[ShippingService] Failed to persist shipping_settings:", error);
    throw new Error(error.message || "Failed to update shipping settings");
  }

  revalidateShippingCaches();
  return merged;
}

export interface ShippingCalculationItem {
  productId?: string | null;
  categoryId?: string | null;
  quantity: number;
}

export interface ShippingCalculationContext {
  subtotal: number;
  items?: ShippingCalculationItem[];
  now?: Date;
  settings?: ShippingSettings;
}

/**
 * Authoritative Single Shipping Calculator.
 *
 * Precedence Policy (Phase 4):
 * 1. Validate shipping is available (method is enabled).
 * 2. Scheduled promotional free shipping (within valid active date window).
 * 3. Global free shipping event (all orders free).
 * 4. Minimum order value threshold (subtotal >= threshold).
 * 5. Product-specific free shipping (cart includes eligible product).
 * 6. Category-specific free shipping (cart includes eligible category).
 * 7. Default rate (standard shipping fee applied).
 *
 * Guarantees:
 * - Free shipping produces 0 charge and exact discount equal to default fee.
 * - Negative shipping charges are strictly prevented.
 * - Server-authoritative logic.
 */
export function calculateShipping(
  context: ShippingCalculationContext,
  providedSettings?: ShippingSettings
): ShippingCalculationResult {
  const settings = providedSettings || context.settings || DEFAULT_SHIPPING_SETTINGS;
  const subtotal = Math.max(0, context.subtotal || 0);
  const items = context.items || [];
  const now = context.now || new Date();
  const defaultFee = Math.max(0, settings.defaultCharge);
  const methodName = settings.methodName || "Insured Express Shipping";
  const estimatedDelivery = settings.estimatedDeliveryText || "Delivered within 3-5 business days across India";

  // 1. Method Availability Check
  if (!settings.isEnabled) {
    return {
      eligibleSubtotal: subtotal,
      shippingMethodName: methodName,
      defaultShippingFee: defaultFee,
      finalShippingCharge: 0,
      shippingDiscount: defaultFee,
      isFreeShipping: true,
      appliedRule: "SHIPPING_DISABLED",
      ruleName: "Delivery Unavailable / Suspended",
      explanation: "Shipping method is currently inactive in store configuration.",
      estimatedDelivery,
      validationErrors: ["Shipping method is currently disabled."],
    };
  }

  // 2. Scheduled Promotional Free Shipping Check
  if (settings.scheduledPromotion.isEnabled) {
    const startsAt = settings.scheduledPromotion.startsAt
      ? new Date(settings.scheduledPromotion.startsAt)
      : null;
    const endsAt = settings.scheduledPromotion.endsAt
      ? new Date(settings.scheduledPromotion.endsAt)
      : null;

    const isAfterStart = !startsAt || now >= startsAt;
    const isBeforeEnd = !endsAt || now <= endsAt;

    if (isAfterStart && isBeforeEnd) {
      const promoName = settings.scheduledPromotion.promotionName || "Festive Free Shipping";
      return {
        eligibleSubtotal: subtotal,
        shippingMethodName: methodName,
        defaultShippingFee: defaultFee,
        finalShippingCharge: 0,
        shippingDiscount: defaultFee,
        isFreeShipping: true,
        appliedRule: "SCHEDULED_PROMOTION",
        ruleName: promoName,
        explanation: `Complimentary delivery unlocked: ${promoName} is currently active.`,
        estimatedDelivery,
      };
    }
  }

  // 3. Global Free Shipping Check
  if (settings.globalFreeShipping.isEnabled) {
    const promoLabel = settings.globalFreeShipping.label || "Storewide Free Express Shipping Event";
    return {
      eligibleSubtotal: subtotal,
      shippingMethodName: methodName,
      defaultShippingFee: defaultFee,
      finalShippingCharge: 0,
      shippingDiscount: defaultFee,
      isFreeShipping: true,
      appliedRule: "GLOBAL_FREE_SHIPPING",
      ruleName: promoLabel,
      explanation: "Storewide complimentary insured shipping applies to all orders.",
      estimatedDelivery,
    };
  }

  // 4. Minimum Order Value Threshold Check
  if (settings.minOrderThreshold.isEnabled) {
    const threshold = Math.max(0, settings.minOrderThreshold.minSubtotal);
    if (subtotal >= threshold) {
      return {
        eligibleSubtotal: subtotal,
        shippingMethodName: methodName,
        defaultShippingFee: defaultFee,
        finalShippingCharge: 0,
        shippingDiscount: defaultFee,
        isFreeShipping: true,
        appliedRule: "MIN_ORDER_THRESHOLD",
        ruleName: settings.minOrderThreshold.label || `Free Shipping Above ₹${threshold.toLocaleString("en-IN")}`,
        explanation: `Order subtotal ₹${subtotal.toLocaleString("en-IN")} meets the ₹${threshold.toLocaleString("en-IN")} threshold for Free Insured Shipping.`,
        estimatedDelivery,
      };
    }
  }

  // 5. Product-Specific Free Shipping Check
  if (
    settings.productSpecificRules.isEnabled &&
    Array.isArray(settings.productSpecificRules.eligibleProductIds) &&
    settings.productSpecificRules.eligibleProductIds.length > 0
  ) {
    const eligibleSet = new Set(settings.productSpecificRules.eligibleProductIds);
    const hasQualifyingProduct = items.some((i) => i.productId && eligibleSet.has(i.productId));

    if (hasQualifyingProduct) {
      return {
        eligibleSubtotal: subtotal,
        shippingMethodName: methodName,
        defaultShippingFee: defaultFee,
        finalShippingCharge: 0,
        shippingDiscount: defaultFee,
        isFreeShipping: true,
        appliedRule: "PRODUCT_SPECIFIC",
        ruleName: "Product-Specific Free Shipping Offer",
        explanation: "Contains a selected promotional item with complimentary express shipping.",
        estimatedDelivery,
      };
    }
  }

  // 6. Category-Specific Free Shipping Check
  if (
    settings.categorySpecificRules.isEnabled &&
    Array.isArray(settings.categorySpecificRules.eligibleCategoryIds) &&
    settings.categorySpecificRules.eligibleCategoryIds.length > 0
  ) {
    const eligibleCatSet = new Set(settings.categorySpecificRules.eligibleCategoryIds);
    const hasQualifyingCategory = items.some((i) => i.categoryId && eligibleCatSet.has(i.categoryId));

    if (hasQualifyingCategory) {
      return {
        eligibleSubtotal: subtotal,
        shippingMethodName: methodName,
        defaultShippingFee: defaultFee,
        finalShippingCharge: 0,
        shippingDiscount: defaultFee,
        isFreeShipping: true,
        appliedRule: "CATEGORY_SPECIFIC",
        ruleName: "Category-Specific Free Shipping Offer",
        explanation: "Contains an item from a qualifying collection with complimentary express delivery.",
        estimatedDelivery,
      };
    }
  }

  // 7. Default Rate: Standard Insured Express Fee
  const remainingForFreeShipping =
    settings.minOrderThreshold.isEnabled && settings.minOrderThreshold.minSubtotal > subtotal
      ? settings.minOrderThreshold.minSubtotal - subtotal
      : null;

  const defaultExplanation = remainingForFreeShipping
    ? `Add ₹${remainingForFreeShipping.toLocaleString("en-IN")} more to unlock Free Insured Express Shipping!`
    : `Standard ${methodName} rate across India.`;

  return {
    eligibleSubtotal: subtotal,
    shippingMethodName: methodName,
    defaultShippingFee: defaultFee,
    finalShippingCharge: defaultFee,
    shippingDiscount: 0,
    isFreeShipping: false,
    appliedRule: "DEFAULT_RATE",
    ruleName: methodName,
    explanation: defaultExplanation,
    estimatedDelivery,
  };
}

/**
 * Creates an immutable snapshot record of the shipping decision for order persistence.
 */
export function createShippingSnapshot(
  calc: ShippingCalculationResult,
  currency: string = "INR"
): ShippingSnapshot {
  return {
    shippingMethodName: calc.shippingMethodName,
    defaultShippingFee: calc.defaultShippingFee,
    finalShippingCharge: calc.finalShippingCharge,
    shippingDiscount: calc.shippingDiscount,
    isFreeShipping: calc.isFreeShipping,
    appliedRule: calc.appliedRule,
    ruleName: calc.ruleName,
    explanation: calc.explanation,
    currency,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Returns safe public shipping configuration for storefront headers, announcements, and cart helper.
 */
export function getPublicShippingConfig(settings: ShippingSettings) {
  const now = new Date();

  // Check scheduled promo active status
  let isScheduledPromoActive = false;
  if (settings.scheduledPromotion.isEnabled) {
    const starts = settings.scheduledPromotion.startsAt ? new Date(settings.scheduledPromotion.startsAt) : null;
    const ends = settings.scheduledPromotion.endsAt ? new Date(settings.scheduledPromotion.endsAt) : null;
    isScheduledPromoActive = (!starts || now >= starts) && (!ends || now <= ends);
  }

  let announcementText = "";
  if (!settings.isEnabled) {
    announcementText = "Standard shipping is temporarily disabled.";
  } else if (isScheduledPromoActive) {
    announcementText = `Limited Time: ${settings.scheduledPromotion.promotionName} — Free Express Shipping on All Orders!`;
  } else if (settings.globalFreeShipping.isEnabled) {
    announcementText = settings.globalFreeShipping.label || "Complimentary Insured Express Shipping on all orders!";
  } else if (settings.minOrderThreshold.isEnabled) {
    announcementText = `Complimentary Insured Express Shipping Across India On Orders Above ₹${settings.minOrderThreshold.minSubtotal.toLocaleString("en-IN")}`;
  } else {
    announcementText = `${settings.methodName}: ₹${settings.defaultCharge} Across India`;
  }

  return {
    isEnabled: settings.isEnabled,
    methodName: settings.methodName,
    defaultCharge: settings.defaultCharge,
    currency: settings.currency,
    estimatedDeliveryText: settings.estimatedDeliveryText,
    minOrderThreshold: settings.minOrderThreshold.isEnabled ? settings.minOrderThreshold.minSubtotal : null,
    isGlobalFreeShippingActive: settings.globalFreeShipping.isEnabled,
    isScheduledPromoActive,
    activePromoName: isScheduledPromoActive ? settings.scheduledPromotion.promotionName : null,
    announcementText,
  };
}
