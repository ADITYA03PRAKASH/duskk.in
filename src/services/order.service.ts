import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateOrderNumber } from "@/lib/utils";
import { CheckoutPayload, OrderStatus, OrderTrackResult } from "@/types";
import { validateAndCalculateCart } from "./pricing.service";
import { findOrCreateCustomer, saveCustomerAddress } from "./customer.service";
import { createRazorpayOrder } from "./payment.service";
import {
  sendOrderConfirmationEmail,
  sendOrderConfirmationEmailDetailed,
  sendOrderStatusUpdateEmail,
  sendRefundEmail,
  sendCancellationRequestReceivedEmail,
  sendCancellationDecisionEmail,
  sendExchangeRequestReceivedEmail,
  sendExchangeDecisionEmail,
} from "./email.service";
import { saveCustomComboOrderSnapshot } from "./combo.service";
import { createShippingSnapshot } from "./shipping.service";

export async function initiateCheckoutOrder(
  payload: CheckoutPayload,
  authUserId?: string | null
) {
  const { customer, shippingAddress, items, couponCode, notes } = payload;

  // 1. Authoritative server-side pricing validation
  const calculation = await validateAndCalculateCart(items, couponCode);

  // 2. Identify or create persistent Customer record
  let customerRecord = {
    id: `cust_${Date.now()}`,
    first_name: customer.name.split(" ")[0] || customer.name,
    last_name: customer.name.split(" ").slice(1).join(" ") || null,
    email: customer.email.trim().toLowerCase(),
    phone: customer.phone,
  };

  try {
    const dbCust = await findOrCreateCustomer(customer, authUserId);
    if (dbCust) customerRecord = dbCust;
  } catch (err) {
    console.warn("findOrCreateCustomer fallback:", err);
  }

  // 3. Save shipping address to customer profile
  try {
    await saveCustomerAddress(customerRecord.id, shippingAddress);
  } catch (err) {
    console.warn("saveCustomerAddress fallback:", err);
  }

  // 4. Generate unique business order number
  const orderNumber = generateOrderNumber();

  // 5. Create Razorpay order
  const razorpayOrder = await createRazorpayOrder({
    amountInRupees: calculation.totalAmount,
    receipt: orderNumber,
    notes: {
      orderNumber,
      customerEmail: customerRecord.email,
      customerId: customerRecord.id,
    },
  });

  // 6. Build snapshots
  const customerSnapshot = {
    first_name: customerRecord.first_name,
    last_name: customerRecord.last_name,
    email: customerRecord.email,
    phone: customerRecord.phone || customer.phone,
  };

  const shippingSnapshot = calculation.shippingDetails
    ? createShippingSnapshot(calculation.shippingDetails)
    : {
        shippingMethodName: "Insured Express Shipping",
        defaultShippingFee: 99,
        finalShippingCharge: calculation.shippingCharge,
        shippingDiscount: calculation.shippingCharge === 0 ? 99 : 0,
        isFreeShipping: calculation.shippingCharge === 0,
        appliedRule: (calculation.shippingCharge === 0 ? "MIN_ORDER_THRESHOLD" : "DEFAULT_RATE") as any,
        ruleName: calculation.shippingCharge === 0 ? "Free Shipping" : "Insured Express Shipping",
        explanation: calculation.shippingCharge === 0 ? "Complimentary delivery applied" : "Standard insured shipping rate",
        currency: "INR",
        calculatedAt: new Date().toISOString(),
      };

  const shippingAddressSnapshot = {
    full_name: customer.name,
    phone: customer.phone,
    address_line1: shippingAddress.addressLine1.trim(),
    address_line2: shippingAddress.addressLine2?.trim() || null,
    landmark: shippingAddress.landmark?.trim() || null,
    city: shippingAddress.city.trim(),
    state: shippingAddress.state.trim(),
    postal_code: shippingAddress.pincode.trim(),
    country: "India",
    shipping_rule_snapshot: shippingSnapshot,
  };

  let orderId: string;

  const orderInsertPayload: any = {
    order_number: orderNumber,
    customer_id: customerRecord.id,
    status: "PENDING_PAYMENT",
    subtotal_amount: calculation.subtotal,
    discount_amount: calculation.discount,
    shipping_amount: calculation.shippingCharge,
    tax_amount: calculation.tax,
    grand_total: calculation.totalAmount,
    coupon_code: calculation.couponApplied?.code || null,
    customer_snapshot: customerSnapshot,
    shipping_address_snapshot: shippingAddressSnapshot,
    customer_notes: notes || null,
  };

  // 7. Insert Order record into Supabase (with fallback if shipping_snapshot column not yet present)
  let { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      ...orderInsertPayload,
      shipping_snapshot: shippingSnapshot,
    })
    .select()
    .single();

  if (orderError && (orderError.message?.includes("shipping_snapshot") || orderError.code === "42703")) {
    const retryResult = await supabaseAdmin
      .from("orders")
      .insert(orderInsertPayload)
      .select()
      .single();
    order = retryResult.data;
    orderError = retryResult.error;
  }

  if (orderError || !order) {
    console.error("Order insertion error:", orderError);
    throw new Error(`Failed to create order record: ${orderError?.message || "Unknown error"}`);
  }

  orderId = order.id;

  // 8. Insert Order Items & Snapshots
  const orderItemsData: any[] = [];

  for (const item of calculation.validatedItems) {
    // Parent item row
    orderItemsData.push({
      order_id: orderId,
      product_id: item.productId || null,
      combo_id: item.comboId || null,
      variant_id: item.variantId || null,
      product_title: item.name,
      variant_title: item.variantTitle || null,
      sku: item.sku,
      image_url: item.image,
      unit_price: item.mrp || item.price,
      unit_sale_price: item.price,
      quantity: item.quantity,
      total_price: item.subtotal,
    });

    // If item is combo with components, insert component lines for inventory deduction & fulfillment tracking
    if (item.isCombo && item.comboComponents && item.comboComponents.length > 0) {
      for (const comp of item.comboComponents) {
        orderItemsData.push({
          order_id: orderId,
          product_id: comp.productId || null,
          combo_id: item.comboId || null,
          variant_id: comp.variantId || null,
          product_title: `↳ [Included in ${item.name}] ${comp.name}`,
          variant_title: comp.variantTitle || null,
          sku: comp.sku,
          image_url: comp.image || null,
          unit_price: comp.mrp || comp.price || 0,
          unit_sale_price: 0,
          quantity: comp.quantity * item.quantity,
          total_price: 0,
        });
      }

      // If it is custom combo, save immutable custom_combos record
      if (item.isCustomCombo) {
        await saveCustomComboOrderSnapshot(orderId, customerRecord.id, {
          title: item.name,
          components: item.comboComponents,
          subtotal: item.mrp,
          discount: Math.max(0, item.mrp - item.price),
          finalPrice: item.price * item.quantity,
        });
      }
    }
  }

  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItemsData);
  if (itemsError) {
    console.error("Order items insert error:", itemsError);
  }

  // 9. Concurrency-Safe Inventory Reservation RPC (Supports both individual items and combo components)
  const reservationMap = new Map<string, number>();

  for (const item of calculation.validatedItems) {
    if (item.isCombo && item.comboComponents) {
      for (const comp of item.comboComponents) {
        if (comp.variantId) {
          const qty = item.quantity * comp.quantity;
          reservationMap.set(comp.variantId, (reservationMap.get(comp.variantId) || 0) + qty);
        }
      }
    } else if (item.variantId) {
      reservationMap.set(item.variantId, (reservationMap.get(item.variantId) || 0) + item.quantity);
    }
  }

  const reservationPayload = Array.from(reservationMap.entries()).map(([variant_id, quantity]) => ({
    variant_id,
    quantity,
  }));

  if (reservationPayload.length > 0) {
    try {
      await supabaseAdmin.rpc("reserve_inventory_for_order", {
        p_order_id: orderId,
        p_items: reservationPayload,
      });
    } catch (rpcErr) {
      console.warn("Inventory reservation RPC fallback:", rpcErr);
    }
  }

  // 10. Record initial payment record
  const { error: payErr } = await supabaseAdmin.from("payments").insert({
    order_id: orderId,
    razorpay_order_id: razorpayOrder.id,
    amount: calculation.totalAmount,
    currency: "INR",
    status: "created",
  });

  if (payErr) {
    console.error("Payment record insert error:", payErr);
  }

  const resolvedOrder = {
    id: orderId,
    order_number: orderNumber,
    customer_id: customerRecord.id,
    status: "PENDING_PAYMENT",
    grand_total: calculation.totalAmount,
    subtotal_amount: calculation.subtotal,
    discount_amount: calculation.discount,
    shipping_amount: calculation.shippingCharge,
    customer_snapshot: customerSnapshot,
    shipping_address_snapshot: shippingAddressSnapshot,
  };

  return {
    order: resolvedOrder,
    razorpayOrder,
    calculation,
  };
}

export async function confirmOrderPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  paymentMethod: string = "razorpay"
) {
  // Call atomic PostgreSQL procedure
  const { data: orderId, error: rpcError } = await supabaseAdmin.rpc("confirm_order_payment", {
    p_razorpay_order_id: razorpayOrderId,
    p_razorpay_payment_id: razorpayPaymentId,
    p_razorpay_signature: razorpaySignature,
    p_method: paymentMethod,
  });

  if (rpcError) {
    throw new Error(`Failed to confirm payment: ${rpcError.message}`);
  }

  // Fetch updated order with items
  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      subtotal_amount,
      discount_amount,
      shipping_amount,
      tax_amount,
      grand_total,
      admin_notes,
      created_at,
      customer_snapshot,
      shipping_address_snapshot,
      order_items (*)
    `)
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    throw new Error("Order confirmed but could not retrieve details.");
  }

  const customerSnapshot = order.customer_snapshot as any;
  const shippingSnapshot = order.shipping_address_snapshot as any;
  const customerName = `${customerSnapshot?.first_name || ""} ${customerSnapshot?.last_name || ""}`.trim() || "Valued Customer";
  const customerEmail = customerSnapshot?.email;

  // Send confirmation email asynchronously and idempotently (do not block or fail valid order)
  if (customerEmail) {
    const alreadySent = order.admin_notes && order.admin_notes.includes("[CONFIRMATION_EMAIL_SENT]");
    if (!alreadySent) {
      sendOrderConfirmationEmailDetailed({
        orderNumber: order.order_number,
        customerName,
        customerEmail,
        orderDate: order.created_at,
        items: (order.order_items as any[]).map((i) => ({
          productName: i.product_title,
          productSku: i.sku,
          price: Number(i.unit_sale_price || i.unit_price),
          quantity: i.quantity,
          subtotal: Number(i.total_price),
        })),
        financials: {
          subtotal: Number(order.subtotal_amount),
          discount: Number(order.discount_amount),
          shippingCharge: Number(order.shipping_amount),
          tax: Number(order.tax_amount),
          totalAmount: Number(order.grand_total),
        },
        shippingAddress: {
          addressLine1: shippingSnapshot?.address_line1 || "",
          addressLine2: shippingSnapshot?.address_line2 || null,
          city: shippingSnapshot?.city || "",
          state: shippingSnapshot?.state || "",
          pincode: shippingSnapshot?.postal_code || "",
        },
      })
        .then(async (result) => {
          const timestamp = new Date().toISOString();
          if (result.success) {
            const auditTag = `[CONFIRMATION_EMAIL_SENT: ${timestamp} | messageId: ${result.messageId || "accepted"}]`;
            const updatedAdminNotes = order.admin_notes ? `${order.admin_notes}\n${auditTag}` : auditTag;
            await supabaseAdmin
              .from("orders")
              .update({ admin_notes: updatedAdminNotes })
              .eq("id", orderId);

            await supabaseAdmin
              .from("payments")
              .update({
                metadata: {
                  confirmation_email: {
                    sent: true,
                    sent_at: timestamp,
                    message_id: result.messageId,
                    recipient: customerEmail,
                    provider_response: result.response,
                  },
                },
              })
              .eq("order_id", orderId);
          } else {
            console.warn(`Order confirmation email delivery attempted but failed for order ${order.order_number}:`, result.error);
            const failTag = `[CONFIRMATION_EMAIL_FAILED: ${timestamp} | error: ${result.error || "transmission failure"}]`;
            const updatedAdminNotes = order.admin_notes ? `${order.admin_notes}\n${failTag}` : failTag;
            await supabaseAdmin
              .from("orders")
              .update({ admin_notes: updatedAdminNotes })
              .eq("id", orderId);
          }
        })
        .catch((err) => {
          console.error("Non-fatal email dispatch error:", err);
        });
    }
  }

  return order;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  changedBy: string = "admin",
  comment?: string,
  trackingInfo?: {
    courierName?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  }
) {
  // 1. Fetch current order snapshot for customer email and prior status
  const { data: currentOrder, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("id, status, order_number, grand_total, customer_snapshot, payments (id, razorpay_payment_id, status)")
    .eq("id", orderId)
    .single();

  if (fetchErr || !currentOrder) {
    throw new Error(`Order ${orderId} not found`);
  }

  const oldStatus = currentOrder.status;

  // 2. Call atomic PostgreSQL stored procedure (runs with SECURITY DEFINER)
  const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_status: newStatus,
    p_changed_by: changedBy,
    p_comment: comment || null,
    p_courier_name: trackingInfo?.courierName || null,
    p_tracking_number: trackingInfo?.trackingNumber || null,
    p_tracking_url: trackingInfo?.trackingUrl || null,
    p_estimated_delivery: trackingInfo?.estimatedDelivery || null,
  });

  if (rpcError) {
    console.error("admin_update_order_status RPC failed:", rpcError);
    throw new Error(`Failed to update order status: ${rpcError.message}`);
  }

  // 3. Queue asynchronous customer email notification (does not block database update)
  const customerSnapshot = currentOrder.customer_snapshot as any;
  const customerName = `${customerSnapshot?.first_name || ""} ${customerSnapshot?.last_name || ""}`.trim() || "Valued Customer";
  const customerEmail = customerSnapshot?.email;

  if (customerEmail && oldStatus !== newStatus) {
    if (newStatus === "REFUNDED") {
      const paymentsList = currentOrder.payments as any[];
      const refundRef = paymentsList?.[0]?.razorpay_payment_id || comment || undefined;
      sendRefundEmail({
        orderId: currentOrder.id,
        orderNumber: currentOrder.order_number,
        customerName,
        customerEmail,
        refundAmount: Number(currentOrder.grand_total || 0),
        refundReference: refundRef,
        refundStatus: "COMPLETED",
      }).catch((err) => console.warn("Refund email dispatch error (non-fatal):", err?.message));
    } else {
      sendOrderStatusUpdateEmail({
        orderId: currentOrder.id,
        orderNumber: currentOrder.order_number,
        customerName,
        customerEmail,
        status: newStatus,
        amount: Number(currentOrder.grand_total || 0),
        reason: comment,
        trackingInfo,
      }).catch((err) => console.warn("Status update email dispatch error (non-fatal):", err?.message));
    }
  }

  return { success: true, data: rpcResult };
}

export async function trackCustomerOrder(orderNumber: string, email: string): Promise<OrderTrackResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();

  // Call authoritative atomic procedure get_customer_order_details
  const { data: orderData, error } = await supabaseAdmin.rpc("get_customer_order_details", {
    p_order_number: normalizedOrderNumber,
    p_email: normalizedEmail,
  });

  if (error || !orderData || !orderData.id) {
    throw new Error("No order found matching this Order Number and Email Address. Please verify your details.");
  }

  // Parse courier tracking from timeline entries with [TRACKING] tags
  let courierName: string | null = null;
  let trackingNumber: string | null = null;
  let trackingUrl: string | null = null;
  let estimatedDelivery: string | null = null;

  const timelineEntries = orderData.timeline || [];
  for (const entry of timelineEntries) {
    if (entry.note && entry.note.includes("[TRACKING]")) {
      const trackSection = entry.note.split("[TRACKING]")[1] || "";
      const matchCourier = trackSection.match(/Courier:\s*([^|]+)/i);
      const matchAwb = trackSection.match(/AWB:\s*([^|]+)/i);
      const matchUrl = trackSection.match(/URL:\s*([^|]+)/i);
      const matchEst = trackSection.match(/Est\. Delivery:\s*([^|]+)/i);

      if (matchCourier) courierName = matchCourier[1].trim();
      if (matchAwb) trackingNumber = matchAwb[1].trim();
      if (matchUrl) trackingUrl = matchUrl[1].trim();
      if (matchEst) estimatedDelivery = matchEst[1].trim();
    }
  }

  const custSnap = orderData.customer_snapshot || {};
  const addrSnap = orderData.shipping_address_snapshot || {};

  return {
    id: orderData.id,
    orderNumber: orderData.order_number,
    orderStatus: orderData.status,
    createdAt: orderData.created_at,
    customerName: `${custSnap.first_name || ""} ${custSnap.last_name || ""}`.trim() || addrSnap.full_name || "Valued Customer",
    customerEmail: custSnap.email || normalizedEmail,
    customerPhone: custSnap.phone || addrSnap.phone || "",
    shippingAddress: {
      addressLine1: addrSnap.address_line1 || "",
      addressLine2: addrSnap.address_line2 || null,
      city: addrSnap.city || "",
      state: addrSnap.state || "",
      pincode: addrSnap.postal_code || "",
      landmark: addrSnap.landmark || null,
    },
    courierName: courierName || (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderData.status) ? "Blue Dart Express" : null),
    trackingNumber: trackingNumber || null,
    trackingUrl: trackingUrl || null,
    estimatedDelivery: estimatedDelivery || null,
    items: ((orderData.items as any[]) || []).map((i) => ({
      id: i.id,
      productId: i.product_id,
      variantId: i.variant_id,
      productName: i.product_title || "Jewellery Piece",
      variantTitle: i.variant_title,
      productSku: i.sku,
      productImage: i.image_url,
      price: Number(i.unit_sale_price || i.unit_price || 0),
      quantity: i.quantity || 1,
      totalPrice: Number(i.total_price || 0),
    })),
    financials: {
      subtotal: Number(orderData.subtotal_amount || 0),
      discount: Number(orderData.discount_amount || 0),
      shippingCharge: Number(orderData.shipping_amount || 0),
      tax: Number(orderData.tax_amount || 0),
      totalAmount: Number(orderData.grand_total || 0),
    },
    timeline: timelineEntries.length > 0 ? timelineEntries : [
      {
        status: orderData.status,
        timestamp: orderData.created_at,
        note: "Order confirmed in system",
      }
    ],
    cancellations: orderData.cancellations || [],
    exchanges: orderData.exchanges || [],
    refunds: orderData.refunds || [],
  };
}

/**
 * Customer submits an eligible cancellation request.
 */
export async function requestOrderCancellation(
  orderNumber: string,
  email: string,
  reason: string,
  details?: string
) {
  if (!orderNumber || !email || !reason) {
    throw new Error("Order number, email, and cancellation reason are required.");
  }

  const { data, error } = await supabaseAdmin.rpc("customer_request_order_cancellation", {
    p_order_number: orderNumber.trim().toUpperCase(),
    p_email: email.trim().toLowerCase(),
    p_reason: reason.trim(),
    p_details: details?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Failed to submit cancellation request");
  }

  // Queue acknowledgment email
  sendCancellationRequestReceivedEmail({
    orderId: data.order_id,
    orderNumber: data.order_number,
    customerName: "Valued Customer",
    customerEmail: email.trim().toLowerCase(),
    reason: reason.trim(),
    details: details?.trim() || null,
  }).catch((emailErr) => console.warn("Cancellation request email error:", emailErr?.message));

  return data;
}

/**
 * Admin reviews and approves or rejects a customer cancellation request.
 */
export async function processOrderCancellation(
  cancellationId: string,
  decision: "APPROVE" | "REJECT",
  adminEmail: string,
  notes?: string
) {
  if (!cancellationId || !decision) {
    throw new Error("Cancellation ID and decision are required.");
  }

  const { data, error } = await supabaseAdmin.rpc("admin_process_cancellation", {
    p_cancellation_id: cancellationId,
    p_decision: decision,
    p_admin_email: adminEmail,
    p_notes: notes?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Failed to process cancellation request");
  }

  // Fetch order customer details for email
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("order_number, grand_total, customer_snapshot")
    .eq("id", data.order_id)
    .single();

  if (order) {
    const cust = order.customer_snapshot as any;
    const customerEmail = cust?.email;
    const customerName = `${cust?.first_name || ""} ${cust?.last_name || ""}`.trim() || "Valued Customer";

    if (customerEmail) {
      sendCancellationDecisionEmail({
        orderId: data.order_id,
        orderNumber: order.order_number,
        customerName,
        customerEmail,
        reason: "Customer cancellation request",
        decision: decision === "APPROVE" ? "APPROVED" : "REJECTED",
        adminNotes: notes || null,
        refundAmount: Number(order.grand_total || 0),
      }).catch((emailErr) => console.warn("Cancellation decision email error:", emailErr?.message));
    }
  }

  return data;
}

/**
 * Customer submits an eligible product exchange request.
 */
export async function requestOrderExchange(
  orderNumber: string,
  email: string,
  orderItemId: string,
  reason: string,
  details?: string,
  evidenceUrls: string[] = []
) {
  if (!orderNumber || !email || !orderItemId || !reason) {
    throw new Error("Order number, email, item ID, and exchange reason are required.");
  }

  const { data, error } = await supabaseAdmin.rpc("customer_request_order_exchange", {
    p_order_number: orderNumber.trim().toUpperCase(),
    p_email: email.trim().toLowerCase(),
    p_order_item_id: orderItemId,
    p_reason: reason.trim(),
    p_details: details?.trim() || null,
    p_evidence_urls: evidenceUrls,
  });

  if (error) {
    throw new Error(error.message || "Failed to submit exchange request");
  }

  // Fetch item title for email
  const { data: item } = await supabaseAdmin
    .from("order_items")
    .select("product_title")
    .eq("id", orderItemId)
    .single();

  sendExchangeRequestReceivedEmail({
    orderId: data.order_id,
    orderNumber: orderNumber.trim().toUpperCase(),
    customerName: "Valued Customer",
    customerEmail: email.trim().toLowerCase(),
    productTitle: item?.product_title || "Jewellery Item",
    reason: reason.trim(),
    details: details?.trim() || null,
    status: "REQUESTED",
  }).catch((emailErr) => console.warn("Exchange request email error:", emailErr?.message));

  return data;
}

/**
 * Admin reviews and approves, updates, or rejects an exchange request.
 */
export async function processOrderExchange(
  exchangeId: string,
  decision: "APPROVE" | "REJECT" | "PICKUP_SCHEDULED" | "INSPECTION_PENDING" | "REPLACEMENT_DISPATCHED" | "COMPLETED",
  adminEmail: string,
  options?: {
    notes?: string;
    replacementVariantId?: string;
    pickupCourier?: string;
    pickupAwb?: string;
    replacementCourier?: string;
    replacementAwb?: string;
  }
) {
  if (!exchangeId || !decision) {
    throw new Error("Exchange ID and decision are required.");
  }

  const { data, error } = await supabaseAdmin.rpc("admin_process_exchange", {
    p_exchange_id: exchangeId,
    p_decision: decision,
    p_admin_email: adminEmail,
    p_notes: options?.notes?.trim() || null,
    p_replacement_variant_id: options?.replacementVariantId || null,
    p_pickup_courier: options?.pickupCourier?.trim() || null,
    p_pickup_awb: options?.pickupAwb?.trim() || null,
    p_replacement_courier: options?.replacementCourier?.trim() || null,
    p_replacement_awb: options?.replacementAwb?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Failed to process exchange request");
  }

  // Fetch exchange and order info for email notification
  const { data: exchange } = await supabaseAdmin
    .from("order_exchanges")
    .select(`
      id,
      order_id,
      reason,
      details,
      status,
      pickup_courier,
      pickup_tracking_number,
      replacement_courier,
      replacement_tracking_number,
      admin_notes,
      order_items (product_title),
      orders (order_number, customer_snapshot)
    `)
    .eq("id", exchangeId)
    .single();

  if (exchange) {
    const ord = exchange.orders as any;
    const cust = ord?.customer_snapshot as any;
    const customerEmail = cust?.email;
    const customerName = `${cust?.first_name || ""} ${cust?.last_name || ""}`.trim() || "Valued Customer";
    const itemTitle = (exchange.order_items as any)?.product_title || "Jewellery Piece";

    if (customerEmail) {
      sendExchangeDecisionEmail({
        orderId: exchange.order_id,
        orderNumber: ord?.order_number || "DUSKK",
        customerName,
        customerEmail,
        productTitle: itemTitle,
        reason: exchange.reason,
        details: exchange.details,
        status: (decision === "APPROVE" ? "APPROVED" : decision === "REJECT" ? "REJECTED" : decision) as any,
        pickupCourier: exchange.pickup_courier,
        pickupAwb: exchange.pickup_tracking_number,
        replacementCourier: exchange.replacement_courier,
        replacementAwb: exchange.replacement_tracking_number,
        adminNotes: options?.notes || exchange.admin_notes,
      }).catch((emailErr) => console.warn("Exchange decision email error:", emailErr?.message));
    }
  }

  return data;
}

/**
 * Fetches all requests (cancellations, exchanges, refunds) for an order.
 */
export async function fetchOrderRequests(orderId: string) {
  const [cancellationsRes, exchangesRes, refundsRes] = await Promise.all([
    supabaseAdmin
      .from("order_cancellations")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("order_exchanges")
      .select("*, order_items (product_title, sku, image_url)")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("order_refunds")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    cancellations: cancellationsRes.data || [],
    exchanges: exchangesRes.data || [],
    refunds: refundsRes.data || [],
  };
}
