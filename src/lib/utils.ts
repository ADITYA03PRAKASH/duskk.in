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
