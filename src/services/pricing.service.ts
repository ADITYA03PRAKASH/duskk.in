import { supabaseAdmin } from "@/lib/supabase/admin";
import { CartItemInput, PriceBreakdown } from "@/types";

const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_CHARGE = 99;

export async function validateAndCalculateCart(
  items: CartItemInput[],
  couponCode?: string
): Promise<PriceBreakdown> {
  if (!items || items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const productIds = Array.from(
    new Set(items.map((i) => i.productId).filter((id): id is string => Boolean(id)))
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

  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const validatedItems: PriceBreakdown["validatedItems"] = [];

  for (const item of items) {
    const itemQuantity = Math.max(1, item.quantity || 1);
    const prod = productMap.get(item.productId || "");
    const prodTitle = prod?.title || (item as any).name || (item as any).title || "DUSKK Jewellery Item";

    let itemPrice: number;
    let itemMrp: number;
    let itemSku: string;
    let variantTitle: string | null = null;
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
      variantId: item.variantId || null,
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
      const meetsMinOrder = subtotal >= Number(coupon.min_order_value || 0);
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
        let calculated = (subtotal * Number(coupon.discount_value)) / 100;
        if (coupon.max_discount_amount && calculated > Number(coupon.max_discount_amount)) {
          calculated = Number(coupon.max_discount_amount);
        }
        discount = Math.round(calculated);
      } else if (coupon.discount_type === "fixed_amount") {
        discount = Math.min(Number(coupon.discount_value), subtotal);
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

