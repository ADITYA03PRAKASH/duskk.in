import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/services/payment.service";
import { confirmOrderPayment, updateOrderStatus } from "@/services/order.service";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured.");
      return NextResponse.json({ error: "Webhook service unavailable" }, { status: 503 });
    }

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid or missing webhook signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;
    const eventId = req.headers.get("x-razorpay-event-id") || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 1. Check idempotency
    const { data: existingWebhook } = await supabaseAdmin
      .from("payment_webhooks")
      .select("id, processed")
      .eq("event_id", eventId)
      .single();

    if (existingWebhook && existingWebhook.processed) {
      return NextResponse.json({ status: "already_processed" });
    }

    if (!existingWebhook) {
      await supabaseAdmin.from("payment_webhooks").insert({
        event_id: eventId,
        event_type: eventType,
        payload: event,
        processed: false,
      });
    }

    // 2. Process event
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const orderEntity = payload.order?.entity;
      const paymentEntity = payload.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id || (orderEntity?.id ? `pay_${orderEntity.id}` : "webhook_captured");

      if (razorpayOrderId) {
        await confirmOrderPayment(
          razorpayOrderId,
          razorpayPaymentId,
          signature || "webhook_verified",
          paymentEntity?.method || "webhook"
        ).catch((err) => console.log("Webhook confirmation note:", err.message));
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = payload.payment?.entity;
      if (paymentEntity?.order_id) {
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("order_id")
          .eq("razorpay_order_id", paymentEntity.order_id)
          .single();

        if (payment) {
          await supabaseAdmin
            .from("payments")
            .update({ status: "failed", error_code: paymentEntity.error_code, error_description: paymentEntity.error_description })
            .eq("razorpay_order_id", paymentEntity.order_id);
        }
      }
    } else if (eventType === "refund.processed") {
      const refundEntity = payload.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      const refundId = refundEntity?.id;

      if (refundId) {
        await supabaseAdmin
          .from("order_refunds")
          .update({
            status: "COMPLETED",
            processed_at: new Date().toISOString(),
          })
          .eq("razorpay_refund_id", refundId);
      }

      if (paymentId) {
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("order_id")
          .eq("razorpay_payment_id", paymentId)
          .single();

        if (payment) {
          await supabaseAdmin
            .from("payments")
            .update({ status: "refunded" })
            .eq("razorpay_payment_id", paymentId);

          await updateOrderStatus(payment.order_id, "REFUNDED", "razorpay_webhook", "Refund confirmed via Razorpay webhook");
        }
      }
    } else if (eventType === "refund.failed") {
      const refundEntity = payload.refund?.entity;
      const refundId = refundEntity?.id;

      if (refundId) {
        await supabaseAdmin
          .from("order_refunds")
          .update({
            status: "FAILED",
            reason: `Webhook reported refund failure: ${refundEntity?.error_description || "Unknown failure"}`,
          })
          .eq("razorpay_refund_id", refundId);
      }
    }

    // 3. Mark webhook as processed
    await supabaseAdmin
      .from("payment_webhooks")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("event_id", eventId);

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
