export interface CartItemInput {
  productId: string;
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

export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  shippingCharge: number;
  tax: number;
  totalAmount: number;
  couponApplied?: {
    code: string;
    discountValue: number;
    discountType: string;
  };
  validatedItems: {
    productId: string;
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
  }[];
}

export interface OrderTrackResult {
  orderNumber: string;
  orderStatus: string;
  paymentStatus?: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
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
    status: string;
    timestamp: string;
    note?: string | null;
  }[];
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
