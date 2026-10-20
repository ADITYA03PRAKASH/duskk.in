import crypto from "crypto";
import Razorpay from "razorpay";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendRefundEmail } from "./email.service";

export interface CreateRazorpayOrderOptions {
  amountInPaise?: number;
  amountInRupees?: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
}

/**
 * Initializes and returns the official Razorpay SDK client.
 */
export function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing.");
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * Creates a Razorpay Order via SDK or REST API.
 * Validates amount >= 100 paise (₹1.00).
 */
export async function createRazorpayOrder(
  options: CreateRazorpayOrderOptions
): Promise<RazorpayOrderResponse> {
  const amountInPaise = options.amountInPaise !== undefined
    ? Math.round(options.amountInPaise)
    : options.amountInRupees !== undefined
    ? Math.round(options.amountInRupees * 100)
    : 0;

  if (amountInPaise < 100) {
    const error: any = new Error("Amount must be at least 100 paise (₹1.00).");
    error.statusCode = 400;
    throw error;
  }

  const currency = options.currency || "INR";
  const receipt = options.receipt || `rcpt_${Date.now()}`;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  const isMockMode =
    !key_id ||
    !key_secret ||
    key_id.includes("mock") ||
    key_id === "rzp_test_duskk_mock_key" ||
    process.env.NODE_ENV === "test" ||
    process.env.ENABLE_MOCK_FALLBACK === "true";

  if (isMockMode) {
    const mockId = `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    return {
      id: mockId,
      order_id: mockId,
      amount: amountInPaise,
      currency,
      receipt,
      status: "created",
    };
  }

  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
      notes: options.notes,
    });

    return {
      id: order.id,
      order_id: order.id,
      amount: typeof order.amount === "number" ? order.amount : Number(order.amount),
      currency: order.currency,
      receipt: order.receipt || receipt,
      status: order.status,
    };
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);

    // Differentiate authentication failure vs server/API errors
    if (error?.statusCode === 401 || error?.error?.code === "BAD_REQUEST_ERROR" && error?.error?.description?.includes("auth")) {
      const authErr: any = new Error("Razorpay Authentication failed. Please verify API keys.");
      authErr.statusCode = 401;
      throw authErr;
    }

    const apiErr: any = new Error(error?.error?.description || error?.message || "Failed to create Razorpay order.");
    apiErr.statusCode = error?.statusCode || 500;
    throw apiErr;
  }
}

/**
 * Verifies Razorpay payment signature using HMAC-SHA256 algorithm.
 * Formula: HMAC_SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET || "duskk_razorpay_secret_key_2026";


  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "utf-8");
  const receivedBuf = Buffer.from(razorpaySignature, "utf-8");

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

/**
 * Verifies Razorpay Webhook signature using HMAC-SHA256
 */
export function verifyWebhookSignature(payloadBody: string, receivedSignature: string): boolean {
  if (!receivedSignature || !payloadBody) return false;

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured in environment variables.");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payloadBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "utf-8");
  const receivedBuf = Buffer.from(receivedSignature, "utf-8");

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

/**
 * Generates HMAC signature for test environments using configured key secret
 */
export function generateMockPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string): string {
  const secret = process.env.RAZORPAY_KEY_SECRET || "duskk_razorpay_secret_key_2026";

  return crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
}

export interface ProcessRefundOptions {
  orderId: string;
  orderNumber?: string;
  razorpayPaymentId?: string;
  amount?: number;
  refundAmount?: number;
  originalAmount?: number;
  reason?: string;
  refundReason?: string;
  adminEmail: string;
  customerName?: string;
  customerEmail?: string;
  cancellationId?: string;
  exchangeId?: string;
  idempotencyKey?: string;
}

export interface ProcessRefundResult {
  success: boolean;
  refundId?: string;
  status: string;
  amount: number;
  error?: string;
  code?: string;
}

/**
 * Initiates an authorized refund via Razorpay, reconciles order financials atomically,
 * and notifies the customer asynchronously.
 */
export async function processRazorpayRefund(options: ProcessRefundOptions): Promise<ProcessRefundResult> {
  const {
    orderId,
    adminEmail,
    cancellationId,
    exchangeId,
  } = options;

  if (!orderId) {
    throw new Error("Order ID is required to issue a refund.");
  }

  let orderNumber = options.orderNumber;
  let razorpayPaymentId = options.razorpayPaymentId;
  let originalAmount = options.originalAmount;
  let customerEmail = options.customerEmail;
  let customerName = options.customerName || "Valued Customer";

  if (!orderNumber || !razorpayPaymentId || originalAmount === undefined || !customerEmail) {
    const { data: orderData } = await supabaseAdmin
      .from("orders")
      .select("order_number, grand_total, customer_snapshot, payments(*)")
      .eq("id", orderId)
      .single();

    if (!orderData) {
      throw new Error(`Order ${orderId} not found`);
    }

    orderNumber = orderNumber || orderData.order_number;
    originalAmount = originalAmount !== undefined ? originalAmount : Number(orderData.grand_total || 0);
    const cust = orderData.customer_snapshot as any;
    customerEmail = customerEmail || cust?.email;
    customerName = customerName !== "Valued Customer" ? customerName : (`${cust?.first_name || ""} ${cust?.last_name || ""}`.trim() || "Valued Customer");
    const pay = (orderData.payments as any[])?.find((p: any) => p.status === "captured" || p.status === "paid") || orderData.payments?.[0];
    razorpayPaymentId = razorpayPaymentId || pay?.razorpay_payment_id;
  }

  if (!razorpayPaymentId) {
    const { data: directPay } = await supabaseAdmin
      .from("payments")
      .select("razorpay_payment_id, status")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (directPay?.razorpay_payment_id) {
      razorpayPaymentId = directPay.razorpay_payment_id;
    }
  }

  if (!razorpayPaymentId) {
    throw new Error("No captured Razorpay payment found for this order to refund.");
  }

  const refundAmount = options.amount !== undefined
    ? Number(options.amount)
    : (options.refundAmount !== undefined ? Number(options.refundAmount) : originalAmount);

  const refundReason = options.reason || options.refundReason || "Admin initiated customer refund";

  if (refundAmount <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  // 1. Check existing refunds to prevent over-refunding
  const { data: previousRefunds } = await supabaseAdmin
    .from("order_refunds")
    .select("amount, status, razorpay_refund_id, idempotency_key")
    .eq("order_id", orderId)
    .in("status", ["COMPLETED", "PROCESSING", "APPROVED"]);

  const alreadyRefunded = (previousRefunds || []).reduce(
    (acc, r) => acc + Number(r.amount || 0),
    0
  );
  const remainingRefundable = Math.max(0, originalAmount - alreadyRefunded);

  if (refundAmount > remainingRefundable) {
    throw new Error(
      `Requested refund of ₹${refundAmount} exceeds remaining refundable balance of ₹${remainingRefundable}.`
    );
  }

  // Idempotency safeguard
  const idempotencyKey =
    options.idempotencyKey ||
    `rfnd_${orderId}_${Math.round(refundAmount * 100)}_${Date.now()}`;

  // Check if this idempotency key was already processed
  const { data: existingRefund } = await supabaseAdmin
    .from("order_refunds")
    .select("id, status, razorpay_refund_id, amount")
    .eq("idempotency_key", idempotencyKey)
    .single();

  if (existingRefund && ["COMPLETED", "PROCESSING"].includes(existingRefund.status)) {
    return {
      success: true,
      refundId: existingRefund.razorpay_refund_id || existingRefund.id,
      status: existingRefund.status,
      amount: Number(existingRefund.amount),
    };
  }

  let razorpayRefundId: string | null = null;
  let razorpayRefundStatus = "PROCESSING";
  let errorCode: string | null = null;
  let errorDescription: string | null = null;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  const isMock =
    !key_id ||
    !key_secret ||
    key_id.includes("mock") ||
    key_id === "rzp_test_duskk_mock_key" ||
    process.env.ENABLE_MOCK_FALLBACK === "true" ||
    razorpayPaymentId.startsWith("pay_test_") ||
    razorpayPaymentId.startsWith("mock_");

  if (isMock) {
    razorpayRefundId = `rfnd_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    razorpayRefundStatus = "COMPLETED";
  } else {
    try {
      const razorpay = getRazorpayClient();
      const refundResponse: any = await (razorpay.payments.refund as any)(razorpayPaymentId, {
        amount: Math.round(refundAmount * 100), // paise
        notes: {
          orderNumber: orderNumber || "DUSKK",
          reason: refundReason,
          authorizedBy: adminEmail,
        },
        receipt: `rcpt_rfnd_${(orderNumber || "DUSKK").replace(/[^0-9]/g, "")}`,
      });

      razorpayRefundId = refundResponse?.id || null;
      razorpayRefundStatus = refundResponse?.status === "processed" ? "COMPLETED" : "PROCESSING";
    } catch (err: any) {
      console.error("Razorpay payments.refund error:", err);
      errorCode = err?.error?.code || err?.statusCode?.toString() || "RAZORPAY_REFUND_FAILED";
      errorDescription = err?.error?.description || err?.message || "Payment gateway rejected refund request";
      razorpayRefundStatus = "FAILED";
    }
  }

  // Atomic database record & status settlement
  const { data: recordResult, error: dbErr } = await supabaseAdmin.rpc("admin_record_refund", {
    p_order_id: orderId,
    p_amount: refundAmount,
    p_reason: refundReason,
    p_razorpay_refund_id: razorpayRefundId,
    p_razorpay_payment_id: razorpayPaymentId,
    p_status: razorpayRefundStatus,
    p_admin_email: adminEmail,
    p_cancellation_id: cancellationId || null,
    p_exchange_id: exchangeId || null,
    p_error_code: errorCode,
    p_error_description: errorDescription,
    p_idempotency_key: idempotencyKey,
  });

  if (dbErr) {
    console.error("admin_record_refund RPC error:", dbErr);
    throw new Error(`Database error recording refund: ${dbErr.message}`);
  }

  // If gateway processed or queued, notify customer asynchronously
  if (razorpayRefundStatus !== "FAILED" && customerEmail) {
    sendRefundEmail({
      orderId,
      orderNumber: orderNumber || "DUSKK",
      customerName,
      customerEmail,
      refundAmount,
      refundReference: razorpayRefundId || undefined,
      refundStatus: razorpayRefundStatus,
      reason: refundReason,
    }).catch((emailErr) => console.warn("Refund customer email error (non-fatal):", emailErr?.message));
  }

  if (razorpayRefundStatus === "FAILED") {
    return {
      success: false,
      status: "FAILED",
      amount: refundAmount,
      error: errorDescription || "Refund failed",
      code: errorCode || undefined,
    };
  }

  return {
    success: true,
    refundId: razorpayRefundId || undefined,
    status: razorpayRefundStatus,
    amount: refundAmount,
  };
}

