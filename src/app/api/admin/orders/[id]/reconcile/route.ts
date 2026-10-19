import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { confirmOrderPayment } from "@/services/order.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders/[id]/reconcile
 * Inspects the order and returns a dry-run / audit preview of what reconciliation would do.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        grand_total,
        admin_notes,
        created_at,
        customer_snapshot,
        shipping_address_snapshot,
        order_items (*),
        payments (*)
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const payment = order.payments?.[0];
    const items = order.order_items || [];

    // Check inventory variant stock for each item
    const variantStockChecks = [];
    for (const item of items) {
      if (item.variant_id) {
        const { data: variant } = await supabaseAdmin
          .from("product_variants")
          .select("id, sku, stock_quantity, reserved_quantity")
          .eq("id", item.variant_id)
          .single();

        variantStockChecks.push({
          itemId: item.id,
          variantId: item.variant_id,
          productTitle: item.product_title,
          sku: item.sku,
          orderedQuantity: item.quantity,
          currentStock: variant?.stock_quantity ?? null,
          currentReserved: variant?.reserved_quantity ?? null,
          postReconcileStock: variant ? Math.max(0, variant.stock_quantity - item.quantity) : null,
          postReconcileReserved: variant ? Math.max(0, variant.reserved_quantity - item.quantity) : null,
        });
      }
    }

    const isAlreadyPaid = ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status);
    const emailAlreadySent = !!order.admin_notes?.includes("[CONFIRMATION_EMAIL_SENT]");

    return NextResponse.json({
      success: true,
      dryRun: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        currentStatus: order.status,
        isAlreadyPaid,
        emailAlreadySent,
        grandTotal: order.grand_total,
        customer: order.customer_snapshot,
        paymentRecord: payment || null,
        variantStockChecks,
        recommendedAction: isAlreadyPaid
          ? "None needed - order is already confirmed"
          : payment?.razorpay_order_id
          ? "Ready for reconciliation via confirm_order_payment"
          : "Cannot reconcile - no razorpay_order_id found",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/orders/[id]/reconcile
 * Executes single-order reconciliation for a verified payment.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;
    const body = await req.json().catch(() => ({}));
    const { razorpayPaymentId, reason = "Admin verified payment reconciliation", dryRun = false } = body;

    // Fetch authoritative order
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        grand_total,
        admin_notes,
        created_at,
        customer_snapshot,
        payments (*)
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const payment = order.payments?.[0];
    if (!payment?.razorpay_order_id) {
      return NextResponse.json({
        success: false,
        message: "No associated payment record or Razorpay order ID found for this order",
      }, { status: 400 });
    }

    const effectivePaymentId = razorpayPaymentId || payment.razorpay_payment_id || `pay_reconciled_${Date.now()}`;

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: "Dry-run preview: order can be safely reconciled",
        targetOrderId: order.id,
        targetOrderNumber: order.order_number,
        razorpayOrderId: payment.razorpay_order_id,
        effectivePaymentId,
      });
    }

    // Call confirmOrderPayment which runs atomic confirm_order_payment procedure and idempotent email
    const signature = `admin_reconciled:${admin.email}:${Date.now()}`;
    const confirmedOrder = await confirmOrderPayment(
      payment.razorpay_order_id,
      effectivePaymentId,
      signature,
      payment.method || "razorpay"
    );

    // Append admin audit trail
    const auditNote = `[RECONCILED: by admin ${admin.email} on ${new Date().toISOString()} | reason: ${reason}]`;
    const updatedNotes = confirmedOrder.admin_notes
      ? `${confirmedOrder.admin_notes}\n${auditNote}`
      : auditNote;

    await supabaseAdmin
      .from("orders")
      .update({ admin_notes: updatedNotes })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      message: `Order ${order.order_number} successfully reconciled and confirmed.`,
      order: {
        id: confirmedOrder.id,
        orderNumber: confirmedOrder.order_number,
        status: confirmedOrder.status,
      },
    });
  } catch (err: any) {
    console.error("Reconciliation error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
