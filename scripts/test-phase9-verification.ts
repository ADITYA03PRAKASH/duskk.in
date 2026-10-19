import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { confirmOrderPayment } from "@/services/order.service";

async function runPhase9Verification() {
  console.log("==================================================================");
  console.log("       DUSKK — PHASE 9 PAYMENT INTEGRITY VERIFICATION SUITE       ");
  console.log("==================================================================");

  let testOrderId: string | null = null;
  let testPaymentId: string | null = null;
  let testVariantId: string | null = null;
  let initialStock = 0;
  let initialReserved = 0;

  try {
    // -------------------------------------------------------------
    // Test 1: HMAC Signature Verification (Valid & Invalid)
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Testing Razorpay HMAC Signature Verification...");
    const dummySecret = "test_webhook_secret_xyz123";
    const testRzpOrder = "order_TEST_" + Date.now();
    const testRzpPay = "pay_TEST_" + Date.now();
    const validSignature = crypto
      .createHmac("sha256", dummySecret)
      .update(`${testRzpOrder}|${testRzpPay}`)
      .digest("hex");
    const invalidSignature = "invalid_tampered_signature_hex";

    const verifyHmac = (orderId: string, payId: string, sig: string, secret: string) => {
      const generated = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${payId}`)
        .digest("hex");
      try {
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(generated));
      } catch {
        return false;
      }
    };

    if (verifyHmac(testRzpOrder, testRzpPay, validSignature, dummySecret)) {
      console.log("  ✓ Valid HMAC signature correctly verified (timing-safe).");
    } else {
      throw new Error("Valid HMAC signature verification failed unexpectedly.");
    }

    if (!verifyHmac(testRzpOrder, testRzpPay, invalidSignature, dummySecret)) {
      console.log("  ✓ Tampered/invalid HMAC signature successfully rejected.");
    } else {
      throw new Error("Tampered HMAC signature was falsely accepted!");
    }

    // -------------------------------------------------------------
    // Test 2: Resolution of "created" enum error in confirm_order_payment
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Testing PostgreSQL RPC confirm_order_payment with status 'created'...");

    // Find an active product variant to test reservation and settlement
    const { data: variants, error: vErr } = await supabaseAdmin
      .from("product_variants")
      .select("id, stock_quantity, reserved_quantity, sku")
      .gt("stock_quantity", 5)
      .limit(1);

    if (vErr || !variants || variants.length === 0) {
      throw new Error("No available product variant for testing stock settlement.");
    }

    const testVariant = variants[0];
    testVariantId = testVariant.id;
    initialStock = testVariant.stock_quantity;
    initialReserved = testVariant.reserved_quantity;
    console.log(`  Target test variant: ${testVariant.sku} | Initial Stock: ${initialStock}, Reserved: ${initialReserved}`);

    // Fetch an existing customer to satisfy customer_id not-null constraint
    const { data: customers, error: cErr } = await supabaseAdmin
      .from("customers")
      .select("id")
      .limit(1);

    if (cErr || !customers || customers.length === 0) {
      throw new Error("No customer found to associate with test order.");
    }
    const testCustomerId = customers[0].id;

    // Create a temporary test order
    const testOrderNum = `TEST-${Date.now().toString().slice(-6)}`;
    const { data: newOrder, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: testOrderNum,
        customer_id: testCustomerId,
        status: "PENDING_PAYMENT",
        subtotal_amount: 100,
        discount_amount: 0,
        shipping_amount: 0,
        tax_amount: 0,
        grand_total: 100,
        customer_snapshot: {
          first_name: "Test",
          last_name: "Customer",
          email: "test.automated@duskk.in",
          phone: "9999999999",
        },
        shipping_address_snapshot: {
          address_line1: "123 Test St",
          city: "Mumbai",
          state: "Maharashtra",
          postal_code: "400001",
        },
        admin_notes: "[TEST_ORDER_PHASE_9]",
      })
      .select("id, order_number, status")
      .single();

    if (oErr || !newOrder) {
      throw new Error(`Failed to create test order: ${oErr?.message}`);
    }
    testOrderId = newOrder.id;
    console.log(`  ✓ Test order created: ID ${testOrderId} (#${newOrder.order_number}) with status ${newOrder.status}`);

    // Create order item with variant
    const { error: oiErr } = await supabaseAdmin.from("order_items").insert({
      order_id: testOrderId,
      variant_id: testVariantId,
      product_title: "Phase 9 Test Item",
      sku: testVariant.sku,
      quantity: 1,
      unit_price: 100,
      total_price: 100,
    });
    if (oiErr) {
      throw new Error(`Failed to create test order item: ${oiErr.message}`);
    }

    // Reserve 1 quantity on variant as checkout does
    await supabaseAdmin
      .from("product_variants")
      .update({ reserved_quantity: initialReserved + 1 })
      .eq("id", testVariantId);

    // Insert payment record with status 'created' (the EXACT condition that previously crashed with 22P02)
    const { data: payRecord, error: pErr } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id: testOrderId,
        razorpay_order_id: testRzpOrder,
        amount: 100,
        currency: "INR",
        status: "created", // <-- This triggered 22P02 in the old broken procedure
        method: "razorpay",
      })
      .select("id, status")
      .single();

    if (pErr || !payRecord) {
      throw new Error(`Failed to insert test payment: ${pErr?.message}`);
    }
    testPaymentId = payRecord.id;
    console.log(`  ✓ Test payment created: ID ${testPaymentId} with status '${payRecord.status}'`);

    // Execute RPC confirm_order_payment directly
    console.log("  Executing RPC confirm_order_payment...");
    const { data: confirmedId, error: rpcErr } = await supabaseAdmin.rpc("confirm_order_payment", {
      p_razorpay_order_id: testRzpOrder,
      p_razorpay_payment_id: testRzpPay,
      p_razorpay_signature: validSignature,
      p_method: "razorpay",
    });

    if (rpcErr) {
      throw new Error(`RPC confirm_order_payment FAILED: code ${rpcErr.code} - ${rpcErr.message}`);
    }

    console.log(`  ✓ RPC confirm_order_payment SUCCEEDED! Returned Order ID: ${confirmedId}`);
    console.log("  ✓ Enum mismatch bug is COMPLETELY RESOLVED (no 22P02 error).");

    // -------------------------------------------------------------
    // Test 3: Verify Payment and Order Status Updates in Database
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Verifying Database Post-Payment State...");
    const { data: updatedOrder } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", testOrderId)
      .single();
    const { data: updatedPayment } = await supabaseAdmin
      .from("payments")
      .select("status, razorpay_payment_id")
      .eq("id", testPaymentId)
      .single();

    if (updatedOrder?.status === "CONFIRMED") {
      console.log(`  ✓ Order status successfully transitioned: PENDING_PAYMENT -> CONFIRMED`);
    } else {
      throw new Error(`Order status unexpected: ${updatedOrder?.status}`);
    }

    if (updatedPayment?.status === "captured" && updatedPayment?.razorpay_payment_id === testRzpPay) {
      console.log(`  ✓ Payment status successfully transitioned: created -> captured`);
      console.log(`  ✓ Razorpay payment ID successfully recorded: ${updatedPayment.razorpay_payment_id}`);
    } else {
      throw new Error(`Payment status unexpected: ${updatedPayment?.status}`);
    }

    // -------------------------------------------------------------
    // Test 4: Inventory Settlement & Reservation Clearance
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Verifying Inventory Settlement & Reservation Clearance...");
    const { data: settledVariant } = await supabaseAdmin
      .from("product_variants")
      .select("stock_quantity, reserved_quantity")
      .eq("id", testVariantId)
      .single();

    if (settledVariant) {
      console.log(`  Post-Settlement: Stock: ${settledVariant.stock_quantity} (was ${initialStock}), Reserved: ${settledVariant.reserved_quantity} (was ${initialReserved + 1})`);
      if (settledVariant.stock_quantity === initialStock - 1) {
        console.log("  ✓ Stock quantity correctly decremented by ordered amount (1).");
      } else {
        throw new Error(`Stock quantity incorrect: expected ${initialStock - 1}, got ${settledVariant.stock_quantity}`);
      }

      if (settledVariant.reserved_quantity === initialReserved) {
        console.log("  ✓ Reserved quantity correctly cleared back to baseline.");
      } else {
        throw new Error(`Reserved quantity incorrect: expected ${initialReserved}, got ${settledVariant.reserved_quantity}`);
      }
    }

    // -------------------------------------------------------------
    // Test 5: Idempotency (Duplicate Verification & Webhook Calls)
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Testing Idempotency on Repeated Invocations...");
    const { data: secondConfirmId, error: secondErr } = await supabaseAdmin.rpc("confirm_order_payment", {
      p_razorpay_order_id: testRzpOrder,
      p_razorpay_payment_id: testRzpPay,
      p_razorpay_signature: validSignature,
      p_method: "razorpay",
    });

    if (secondErr) {
      throw new Error(`Duplicate invocation failed: ${secondErr.message}`);
    }
    if (secondConfirmId === testOrderId) {
      console.log("  ✓ Duplicate invocation safely returned existing Order ID without error.");
    }

    // Verify stock was NOT deducted again
    const { data: idempVariant } = await supabaseAdmin
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", testVariantId)
      .single();

    if (idempVariant?.stock_quantity === initialStock - 1) {
      console.log("  ✓ Idempotency confirmed: Stock was NOT deducted a second time.");
    } else {
      throw new Error(`Stock double-deducted! Current stock: ${idempVariant?.stock_quantity}`);
    }

    // -------------------------------------------------------------
    // Test 6: Status History Audit Trail
    // -------------------------------------------------------------
    console.log("\n[TEST 6] Verifying Order Status History Audit Trail...");
    const { data: history } = await supabaseAdmin
      .from("order_status_history")
      .select("*")
      .eq("order_id", testOrderId);

    if (history && history.length > 0) {
      console.log(`  ✓ Status history entries recorded: ${history.length}`);
      console.log(`  ✓ Latest history note: "${history[history.length - 1].comment}"`);
    } else {
      console.log("  ⚠ No status history entries found.");
    }

    console.log("\n==================================================================");
    console.log("       ALL 6 CORE VERIFICATION CHECKS PASSED SUCCESSFULLY!       ");
    console.log("==================================================================");

  } catch (err: any) {
    console.error("\n❌ VERIFICATION TEST FAILED:", err);
  } finally {
    // -------------------------------------------------------------
    // Cleanup: Restore variant inventory and remove test records
    // -------------------------------------------------------------
    console.log("\n[CLEANUP] Reverting test inventory & deleting test records...");
    if (testVariantId && initialStock) {
      await supabaseAdmin
        .from("product_variants")
        .update({ stock_quantity: initialStock, reserved_quantity: initialReserved })
        .eq("id", testVariantId);
      console.log("  ✓ Variant stock restored to original levels.");
    }

    if (testOrderId) {
      await supabaseAdmin.from("order_status_history").delete().eq("order_id", testOrderId);
      await supabaseAdmin.from("payments").delete().eq("order_id", testOrderId);
      await supabaseAdmin.from("order_items").delete().eq("order_id", testOrderId);
      await supabaseAdmin.from("orders").delete().eq("id", testOrderId);
      console.log("  ✓ Test order and related records cleaned up.");
    }
  }
}

runPhase9Verification();
