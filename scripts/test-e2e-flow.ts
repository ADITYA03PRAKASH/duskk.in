import { supabaseAdmin } from "../src/lib/supabase/admin";
import { validateAndCalculateCart } from "../src/services/pricing.service";
import { initiateCheckoutOrder, confirmOrderPayment, updateOrderStatus, trackCustomerOrder } from "../src/services/order.service";
import { verifyRazorpaySignature, generateMockPaymentSignature } from "../src/services/payment.service";

async function runEndToEndVerification() {
  console.log("============================================================");
  console.log("🧪 STARTING DUSKK COMPLETE END-TO-END VERIFICATION TEST (SUPABASE)");
  console.log("============================================================\n");

  // Step 1: Browse products from Supabase
  console.log("1️⃣ Step 1: Browsing DUSKK Catalog on Supabase...");
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select(`
      id,
      title,
      slug,
      sku,
      base_price,
      sale_price,
      product_variants (*)
    `)
    .eq("status", "active")
    .limit(2);

  if (error || !products || products.length === 0) {
    throw new Error(`No active products found in Supabase: ${error?.message}`);
  }

  const testProduct = products[0];
  const testVariant = (testProduct.product_variants as any[])?.[0];
  const initialStock = testVariant ? testVariant.stock_quantity : 20;

  console.log(`   Selected Product: "${testProduct.title}" (SKU: ${testProduct.sku})`);
  console.log(`   Price: ₹${testProduct.sale_price || testProduct.base_price} | Initial Variant Stock: ${initialStock}\n`);

  // Step 2: Validate Cart calculation
  console.log("2️⃣ Step 2: Revalidating Cart & Authoritative Server Pricing...");
  const cartItems = [
    {
      productId: testProduct.id,
      variantId: testVariant?.id || null,
      quantity: 2,
    },
  ];
  const pricing = await validateAndCalculateCart(cartItems, "WELCOME10");
  console.log(`   Subtotal (2 items): ₹${pricing.subtotal}`);
  console.log(`   Discount (WELCOME10): -₹${pricing.discount}`);
  console.log(`   Shipping Charge: ₹${pricing.shippingCharge} (${pricing.shippingCharge === 0 ? "FREE" : "Standard"})`);
  console.log(`   Tax (3% GST): ₹${pricing.tax}`);
  console.log(`   Total Authoritative Payable: ₹${pricing.totalAmount}\n`);

  // Step 3: Guest Checkout
  console.log("3️⃣ Step 3: Initiating Fast Guest Checkout...");
  const guestPayload = {
    customer: {
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      phone: "9876543210",
    },
    shippingAddress: {
      addressLine1: "Flat 402, Sunset Heights, Linking Road",
      addressLine2: "Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      landmark: "Near St. Andrews Church",
    },
    items: cartItems,
    couponCode: "WELCOME10",
    notes: "Please deliver between 2-6 PM",
  };

  const checkoutResult = await initiateCheckoutOrder(guestPayload);
  const createdOrder = checkoutResult.order;
  console.log(`   ✅ Order initialized: #${createdOrder.order_number}`);
  console.log(`   Customer ID: ${createdOrder.customer_id}`);
  console.log(`   Order Status: ${createdOrder.status}`);
  console.log(`   Razorpay Order ID: ${checkoutResult.razorpayOrder.id}\n`);

  // Step 4: Razorpay Payment Confirmation & Inventory Decrement
  console.log("4️⃣ Step 4: Verifying Razorpay Payment & Executing Concurrency-Safe Inventory Deduction...");
  const testPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`;
  const signature = generateMockPaymentSignature(checkoutResult.razorpayOrder.id, testPaymentId);

  const isSigValid = verifyRazorpaySignature(checkoutResult.razorpayOrder.id, testPaymentId, signature);
  if (!isSigValid) throw new Error("HMAC Signature verification failed!");
  console.log("   ✅ Razorpay HMAC SHA-256 Signature Verified");

  const confirmedOrder = await confirmOrderPayment(
    checkoutResult.razorpayOrder.id,
    testPaymentId,
    signature,
    "upi"
  );
  console.log(`   ✅ Order #${confirmedOrder.order_number} Status: ${confirmedOrder.status}\n`);

  // Step 5: Order Tracking (Protected with Order Number + Email)
  console.log("5️⃣ Step 5: Testing Customer Order Tracking Portal via get_guest_order RPC...");
  const trackingData = await trackCustomerOrder(createdOrder.order_number, "rahul.sharma@example.com");
  console.log(`   ✅ Order Tracking Success for #${trackingData.orderNumber}`);
  console.log(`   Current Status: ${trackingData.orderStatus}`);
  console.log(`   Items in Tracking: ${trackingData.items.length}`);
  console.log(`   Timeline Events: ${trackingData.timeline.length} logged\n`);

  // Test unauthorized tracking attempt with wrong email
  console.log("6️⃣ Step 6: Testing Unauthorized Order Tracking Protection...");
  let accessBlocked = false;
  try {
    await trackCustomerOrder(createdOrder.order_number, "wrong.email@example.com");
  } catch (e: any) {
    accessBlocked = true;
    console.log(`   ✅ Security Guard Confirmed: Access blocked for mismatching email (${e.message})\n`);
  }
  if (!accessBlocked) throw new Error("Security vulnerability: unauthorized tracking succeeded!");

  // Step 7: Admin Status Update to SHIPPED
  console.log("7️⃣ Step 7: Admin Updating Order Status to SHIPPED...");
  await updateOrderStatus(
    confirmedOrder.id,
    "SHIPPED",
    "admin@duskk.in",
    "Dispatched via Blue Dart Express AWB #BLU-882194"
  );
  console.log(`   ✅ Order #${confirmedOrder.order_number} transitioned to: SHIPPED\n`);

  // Re-verify tracking reflects SHIPPED
  const updatedTracking = await trackCustomerOrder(createdOrder.order_number, "rahul.sharma@example.com");
  if (updatedTracking.orderStatus !== "SHIPPED") {
    throw new Error("Order tracking did not reflect SHIPPED status!");
  }
  console.log(`   ✅ Customer Tracking Verified: Live status is now "${updatedTracking.orderStatus}"\n`);

  console.log("============================================================");
  console.log("🎉 ALL E2E WORKFLOW TEST STEPS COMPLETED WITH 100% SUCCESS!");
  console.log("============================================================\n");
}

runEndToEndVerification().catch((err) => {
  console.error("❌ E2E Test Failed:", err);
  process.exit(1);
});
