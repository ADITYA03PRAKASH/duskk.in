import { createRazorpayOrder, verifyRazorpaySignature } from "../src/services/payment.service";
import crypto from "crypto";

async function runTests() {
  console.log("=== STARTING RAZORPAY INTEGRATION TESTS ===\n");

  // TEST 1: Create Order with minimum amount validation (< 100 paise)
  console.log("1. Testing Minimum Amount Validation (< 100 paise)...");
  try {
    await createRazorpayOrder({ amountInPaise: 50 });
    console.error("❌ FAILED: Should have rejected amount < 100 paise");
    process.exit(1);
  } catch (err: any) {
    if (err.statusCode === 400) {
      console.log("✅ PASSED: Correctly rejected amount < 100 paise with status 400.");
    } else {
      console.log("⚠️ Received error:", err.message);
    }
  }

  // TEST 2: Create Order with Valid Amount (e.g. ₹500 = 50000 paise)
  console.log("\n2. Testing Real Razorpay Order Creation via SDK / API...");
  try {
    const order = await createRazorpayOrder({
      amountInPaise: 50000,
      currency: "INR",
      receipt: `test_rcpt_${Date.now()}`,
      notes: { test: "integration_check" },
    });

    console.log("✅ PASSED: Order created successfully!");
    console.log("   Order ID:", order.order_id);
    console.log("   Amount (paise):", order.amount);
    console.log("   Currency:", order.currency);
    console.log("   Receipt:", order.receipt);

    // TEST 3: Signature Verification
    console.log("\n3. Testing HMAC-SHA256 Signature Verification...");
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("RAZORPAY_KEY_SECRET is required to run signature test.");
    }

    // Valid signature generated with key secret
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${order.order_id}|${dummyPaymentId}`)
      .digest("hex");

    const isValid = verifyRazorpaySignature(order.order_id, dummyPaymentId, validSignature);
    if (isValid) {
      console.log("✅ PASSED: Valid HMAC-SHA256 signature verified as TRUE.");
    } else {
      console.error("❌ FAILED: Valid signature failed verification.");
      process.exit(1);
    }

    // Invalid signature test
    console.log("\n4. Testing Invalid Signature Rejection...");
    const isInvalid = verifyRazorpaySignature(order.order_id, dummyPaymentId, "invalid_tampered_signature");
    if (!isInvalid) {
      console.log("✅ PASSED: Tampered signature correctly rejected as FALSE.");
    } else {
      console.error("❌ FAILED: Tampered signature was incorrectly marked valid.");
      process.exit(1);
    }

    // Missing fields test
    console.log("\n5. Testing Missing Fields Validation...");
    const isMissing = verifyRazorpaySignature("", dummyPaymentId, validSignature);
    if (!isMissing) {
      console.log("✅ PASSED: Missing parameters correctly returned FALSE.");
    } else {
      console.error("❌ FAILED: Missing parameters did not return false.");
      process.exit(1);
    }

    console.log("\n==========================================");
    console.log("🎉 ALL RAZORPAY INTEGRATION TESTS PASSED!");
    console.log("==========================================");
  } catch (err: any) {
    console.error("❌ Order Creation Error:", err);
    process.exit(1);
  }
}

runTests();
