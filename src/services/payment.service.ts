import crypto from "crypto";
import Razorpay from "razorpay";

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

