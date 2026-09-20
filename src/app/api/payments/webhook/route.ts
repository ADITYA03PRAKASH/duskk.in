import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/services/payment.service";
import { confirmOrderPayment, updateOrderStatus } from "@/services/order.service";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // Check webhook signature if secret configured
    if (process.env.RAZORPAY_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
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
      const paymentEntity = payload.payment?.entity || payload.order?.entity;
      const razorpayOrderId = paymentEntity.order_id || paymentEntity.id;
      const razorpayPaymentId = paymentEntity.id;

      if (razorpayOrderId) {
        await confirmOrderPayment(
          razorpayOrderId,
          razorpayPaymentId,
          signature || "webhook_verified",
          paymentEntity.method || "webhook"
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
      if (paymentId) {
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("order_id")
          .eq("razorpay_payment_id", paymentId)
          .single();

        if (payment) {
          await updateOrderStatus(payment.order_id, "REFUNDED", "razorpay_webhook", "Refund processed via Razorpay");
        }
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
