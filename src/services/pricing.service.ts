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

  const productIds = Array.from(new Set(items.map((i) => i.productId)));
  const variantIds = Array.from(
    new Set(items.map((i) => i.variantId).filter(Boolean) as string[])
  );

  let products: any[] = [];
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

  const productMap = new Map(products.map((p) => [p.id, p]));
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const prod = productMap.get(item.productId);
    const prodTitle = prod?.title || (item as any).name || (item as any).title || "DUSKK Jewellery Item";
    const itemQuantity = Math.max(1, item.quantity || 1);

    let itemPrice = prod
      ? (prod.sale_price !== null ? Number(prod.sale_price) : Number(prod.base_price))
      : Number((item as any).price || 2599);
    let itemMrp = prod ? Number(prod.base_price) : Number((item as any).mrp || itemPrice);
    let itemSku = prod?.sku || (item as any).sku || `DSK-${Date.now().toString().slice(-4)}`;
    let variantTitle: string | null = null;
    let availableStock = 99;

    const primaryImgObj =
      (prod?.product_images as any[])?.find((img) => img.is_primary) ||
      (prod?.product_images as any[])?.[0];
    let itemImage = primaryImgObj?.image_url || (item as any).image || "/placeholder.jpg";

    if (item.variantId && prod) {
      const variant = (prod.product_variants as any[])?.find(
        (v) => v.id === item.variantId && v.is_active
      );
      if (variant) {
        variantTitle = variant.title;
        itemSku = variant.sku || prod.sku;
        if (variant.image_url) itemImage = variant.image_url;

        if (variant.sale_price_override !== null && variant.sale_price_override !== undefined) {
          itemPrice = Number(variant.sale_price_override);
        } else if (variant.price_override !== null && variant.price_override !== undefined) {
          itemPrice = Number(variant.price_override);
        }

        availableStock = Math.max(1, variant.stock_quantity - (variant.reserved_quantity || 0));
      }
    }

    const itemSubtotal = itemPrice * itemQuantity;
    subtotal += itemSubtotal;

    validatedItems.push({
      productId: item.productId,
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

      if (isValidDate && meetsMinOrder && withinLimit) {
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
      }
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
