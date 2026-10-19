import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `DUSK-${year}-${randomDigits}`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string; step: number }> = {
  PENDING_PAYMENT: { label: "Payment Pending", color: "bg-amber-100 text-amber-800", step: 0 },
  PAID: { label: "Payment Verified", color: "bg-emerald-100 text-emerald-800", step: 1 },
  CONFIRMED: { label: "Order Confirmed", color: "bg-blue-100 text-blue-800", step: 1 },
  PROCESSING: { label: "Processing & Packaging", color: "bg-indigo-100 text-indigo-800", step: 2 },
  SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-800", step: 3 },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-orange-100 text-orange-800", step: 4 },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-800", step: 5 },
  CANCELLED: { label: "Cancelled", color: "bg-rose-100 text-rose-800", step: -1 },
  REFUND_PENDING: { label: "Refund Pending", color: "bg-yellow-100 text-yellow-800", step: -1 },
  REFUNDED: { label: "Refunded", color: "bg-gray-100 text-gray-800", step: -1 },
};

export const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  CREATED: { label: "Payment Initiated", color: "bg-amber-100 text-amber-800" },
  PENDING: { label: "Payment Pending", color: "bg-amber-100 text-amber-800" },
  AUTHORIZED: { label: "Authorized", color: "bg-blue-100 text-blue-800" },
  CAPTURED: { label: "Captured", color: "bg-emerald-100 text-emerald-800" },
  PAID: { label: "Paid", color: "bg-emerald-100 text-emerald-800" },
  FAILED: { label: "Payment Failed", color: "bg-rose-100 text-rose-800" },
  REFUNDED: { label: "Refunded", color: "bg-purple-100 text-purple-800" },
};

export function getPaymentStatusBadge(status?: string | null): { label: string; color: string } {
  const norm = (status || "PENDING").toUpperCase();
  return PAYMENT_STATUS_LABELS[norm] || { label: norm, color: "bg-gray-100 text-gray-800" };
}

/**
 * Normalizes any product or media image reference into a reliably accessible URL.
 * Converts direct Supabase Storage URLs (which are blocked by Indian ISP DNS sinkholes)
 * into origin-proxied URLs (/api/storage/file/...) so they render flawlessly across all
 * browsers and networks.
 */
export function normalizeImageUrl(raw: any, fallback: string = "/placeholder.svg"): string {
  if (!raw) return fallback;

  let url = "";
  if (typeof raw === "string") {
    url = raw.trim();
  } else if (typeof raw === "object") {
    url = (raw.image_url || raw.url || raw.imageUrl || raw.src || "").trim();
  }

  if (!url) return fallback;

  // Direct Supabase public storage URL: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const supabaseStorageMatch = url.match(
    /^https?:\/\/[a-z0-9_-]+\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i
  );
  if (supabaseStorageMatch) {
    const bucket = supabaseStorageMatch[1];
    const path = supabaseStorageMatch[2];
    return `/api/storage/file/${bucket}/${path}`;
  }

  // Supabase signed storage URL
  const supabaseSignedMatch = url.match(
    /^https?:\/\/[a-z0-9_-]+\.supabase\.co\/storage\/v1\/object\/sign\/([^/]+)\/([^?]+)/i
  );
  if (supabaseSignedMatch) {
    const bucket = supabaseSignedMatch[1];
    const path = supabaseSignedMatch[2];
    return `/api/storage/file/${bucket}/${path}`;
  }

  return url;
}

/**
 * Extracts and normalizes the primary display image from any product object.
 * Checks primaryImage, images array (objects with image_url or url), and legacy formats.
 */
export function getProductPrimaryImage(product: any, fallback: string = "/placeholder.svg"): string {
  if (!product) return fallback;

  // 1. Direct primaryImage string/object
  if (product.primaryImage) {
    const norm = normalizeImageUrl(product.primaryImage, "");
    if (norm && norm !== "/placeholder.jpg") return norm;
  }

  // 2. images or product_images array
  const imgList = product.images || product.product_images;
  if (Array.isArray(imgList) && imgList.length > 0) {
    // Check for marked primary image
    const primary = imgList.find((i: any) => i?.is_primary || i?.isPrimary);
    if (primary) {
      const norm = normalizeImageUrl(primary, "");
      if (norm && norm !== "/placeholder.jpg") return norm;
    }
    // Fall back to first image
    const first = normalizeImageUrl(imgList[0], "");
    if (first && first !== "/placeholder.jpg") return first;
  }

  // 3. Direct image or image_url property on product
  if (product.image_url || product.imageUrl || product.image) {
    const norm = normalizeImageUrl(product.image_url || product.imageUrl || product.image, "");
    if (norm && norm !== "/placeholder.jpg") return norm;
  }

  return fallback;
}

