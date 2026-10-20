export interface CustomComboComponentInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CartItemInput {
  productId?: string;
  comboId?: string;
  isCustomCombo?: boolean;
  customComponents?: CustomComboComponentInput[];
  variantId?: string | null;
  quantity: number;
}

export interface CustomerCheckoutInput {
  name: string;
  email: string;
  phone: string;
}

export interface ShippingAddressInput {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface CheckoutPayload {
  customer: CustomerCheckoutInput;
  shippingAddress: ShippingAddressInput;
  items: CartItemInput[];
  couponCode?: string;
  notes?: string;
}

export interface CustomComboSettings {
  isEnabled: boolean;
  title: string;
  subtitle: string;
  eligibleCategoryIds: string[];
  eligibleProductIds: string[];
  minItems: number;
  maxItems: number;
  minQuantityPerProduct: number;
  maxQuantityPerProduct: number;
  discountType: "none" | "percentage" | "fixed_amount";
  discountValue: number;
  maxDiscountAmount: number | null;
  allowCouponsWithCombo?: boolean;
  startsAt: string | null;
  endsAt: string | null;
  showOnHomepage: boolean;
  homepageDisplayOrder: number;
}

export interface CustomComboRecord {
  id: string;
  orderId: string;
  customerId?: string | null;
  comboTitle: string;
  components: {
    productId: string;
    variantId?: string | null;
    name: string;
    variantTitle?: string | null;
    sku: string;
    price: number;
    mrp: number;
    quantity: number;
    subtotal: number;
    image?: string | null;
  }[];
  subtotalAmount: number;
  discountAmount: number;
  finalPrice: number;
  createdAt: string;
}

export interface ComboItemDetail {
  id: string;
  comboId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  sortOrder: number;
  product: {
    id: string;
    title: string;
    slug: string;
    sku: string;
    basePrice: number;
    salePrice?: number | null;
    image?: string | null;
    status?: string;
  };
  variant?: {
    id: string;
    title: string;
    sku: string;
    price?: number;
    image?: string | null;
    stockQuantity: number;
    reservedQuantity?: number;
    isActive?: boolean;
  } | null;
}

export interface Combo {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  price: number;
  mrp: number;
  imageUrl?: string | null;
  galleryImages: string[];
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  itemsCount?: number;
  items?: ComboItemDetail[];
  savingsPercent?: number;
  savingsAmount?: number;
}

export interface ComboInput {
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  price: number;
  mrp?: number;
  imageUrl?: string;
  galleryImages?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    sortOrder?: number;
  }[];
}

export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  shippingCharge: number;
  shippingDetails?: ShippingCalculationResult;
  tax: number;
  totalAmount: number;
  couponApplied?: {
    code: string;
    discountValue: number;
    discountType: string;
  };
  validatedItems: {
    productId?: string | null;
    comboId?: string | null;
    isCombo?: boolean;
    isCustomCombo?: boolean;
    variantId?: string | null;
    name: string;
    variantTitle?: string | null;
    sku: string;
    image: string | null;
    price: number;
    mrp: number;
    quantity: number;
    subtotal: number;
    availableStock: number;
    comboComponents?: {
      productId: string;
      variantId?: string | null;
      quantity: number;
      name: string;
      variantTitle?: string | null;
      sku: string;
      price?: number;
      mrp?: number;
      image?: string | null;
    }[];
  }[];
}

export interface OrderTrackResult {
  id?: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus?: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
    landmark?: string | null;
  };
  items: {
    id?: string;
    productId?: string | null;
    variantId?: string | null;
    productName: string;
    variantTitle?: string | null;
    productSku: string;
    productImage?: string | null;
    price: number;
    quantity: number;
    totalPrice: number;
  }[];
  financials: {
    subtotal: number;
    discount: number;
    shippingCharge: number;
    tax: number;
    totalAmount: number;
  };
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDelivery?: string | null;
  timeline: {
    from_status?: string | null;
    status: string;
    timestamp: string;
    note?: string | null;
    changed_by?: string | null;
  }[];
  cancellations?: OrderCancellation[];
  exchanges?: OrderExchange[];
  refunds?: OrderRefund[];
}

export type CancellationStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface OrderCancellation {
  id: string;
  orderId?: string;
  customerId?: string | null;
  reason: string;
  details?: string | null;
  status: CancellationStatus;
  adminNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export type ExchangeStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PICKUP_SCHEDULED"
  | "INSPECTION_PENDING"
  | "REPLACEMENT_DISPATCHED"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderExchange {
  id: string;
  orderId?: string;
  orderItemId?: string | null;
  customerId?: string | null;
  reason: string;
  details?: string | null;
  evidenceUrls?: string[];
  replacementProductId?: string | null;
  replacementVariantId?: string | null;
  status: ExchangeStatus;
  pickupCourier?: string | null;
  pickupTrackingNumber?: string | null;
  pickupScheduledDate?: string | null;
  replacementCourier?: string | null;
  replacementTrackingNumber?: string | null;
  adminNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export type RefundStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED";

export interface OrderRefund {
  id: string;
  orderId?: string;
  paymentId?: string | null;
  cancellationId?: string | null;
  exchangeId?: string | null;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  razorpayRefundId?: string | null;
  razorpayPaymentId?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
  adminNotes?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  processedAt?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED";

export type PaymentStatus = "created" | "authorized" | "captured" | "failed" | "refund_pending" | "refunded";

export interface ShippingSettings {
  isEnabled: boolean;
  methodName: string;
  defaultCharge: number;
  currency: string;
  estimatedDeliveryText?: string;

  // Free shipping rules
  globalFreeShipping: {
    isEnabled: boolean;
    label?: string;
  };

  minOrderThreshold: {
    isEnabled: boolean;
    minSubtotal: number;
    label?: string;
  };

  scheduledPromotion: {
    isEnabled: boolean;
    promotionName: string;
    startsAt: string | null;
    endsAt: string | null;
  };

  productSpecificRules: {
    isEnabled: boolean;
    eligibleProductIds: string[];
    entireOrderFree: boolean;
  };

  categorySpecificRules: {
    isEnabled: boolean;
    eligibleCategoryIds: string[];
    entireOrderFree: boolean;
  };
}

export type ShippingRuleApplied =
  | "GLOBAL_FREE_SHIPPING"
  | "SCHEDULED_PROMOTION"
  | "MIN_ORDER_THRESHOLD"
  | "PRODUCT_SPECIFIC"
  | "CATEGORY_SPECIFIC"
  | "DEFAULT_RATE"
  | "SHIPPING_DISABLED";

export interface ShippingCalculationResult {
  eligibleSubtotal: number;
  shippingMethodName: string;
  defaultShippingFee: number;
  finalShippingCharge: number;
  shippingDiscount: number;
  isFreeShipping: boolean;
  appliedRule: ShippingRuleApplied;
  ruleName: string;
  explanation: string;
  estimatedDelivery?: string;
  validationErrors?: string[];
}

export interface ShippingSnapshot {
  shippingMethodName: string;
  defaultShippingFee: number;
  finalShippingCharge: number;
  shippingDiscount: number;
  isFreeShipping: boolean;
  appliedRule: ShippingRuleApplied;
  ruleName: string;
  explanation: string;
  currency: string;
  calculatedAt: string;
}

export type ProductRatingSource = "AUTO" | "CUSTOM";

export interface ProductRatingSettings {
  displayRating: boolean;
  ratingSource: ProductRatingSource;
  manualRating: number | null;
  manualReviewCount: number | null;
}

export type BannerObjectPosition = "center" | "top" | "bottom" | "left" | "right";

export interface PageBannerConfig {
  key?: string;
  pageKey?: string;
  pageName?: string;
  pagePath?: string;
  isEnabled?: boolean;
  imageUrl?: string | null;
  title: string;
  label?: string | null;
  description?: string | null;
  objectPosition?: BannerObjectPosition;
  overlayOpacity?: number; // 0 to 100, default 40
  updatedAt?: string;
}

export type CategoryPageBannersMap = Record<string, PageBannerConfig>;


