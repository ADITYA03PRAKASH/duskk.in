import { supabaseAdmin } from "../src/lib/supabase/admin";
import {
  getShippingSettings,
  updateShippingSettings,
  calculateShipping,
  DEFAULT_SHIPPING_SETTINGS,
  createShippingSnapshot,
} from "../src/services/shipping.service";
import { validateAndCalculateCart } from "../src/services/pricing.service";
import { ShippingSettings } from "../src/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✅ Passed: ${message}`);
}

async function runShippingTests() {
  console.log("============================================================");
  console.log("🧪 DUSKK SHIPPING & PROMOTION COMPREHENSIVE VERIFICATION");
  console.log("============================================================\n");

  // Save initial settings to restore after testing
  const originalSettings = await getShippingSettings();
  console.log("📌 Initial settings loaded from Supabase:");
  console.log(`   Method: ${originalSettings.methodName} | Default: ₹${originalSettings.defaultCharge}`);
  console.log(`   Threshold: ₹${originalSettings.minOrderThreshold.minSubtotal} (Enabled: ${originalSettings.minOrderThreshold.isEnabled})\n`);

  try {
    // --------------------------------------------------------------------------
    // Test 1: Default shipping fee of ₹99
    // --------------------------------------------------------------------------
    console.log("▶️ Test 1: Baseline Default Shipping Fee");
    const baselineCalc = calculateShipping({
      subtotal: 500,
      items: [{ productId: "p_test_1", quantity: 1 }],
      settings: {
        ...DEFAULT_SHIPPING_SETTINGS,
        minOrderThreshold: { isEnabled: true, minSubtotal: 999 },
      },
    });
    assert(baselineCalc.finalShippingCharge === 99, "Final shipping fee is ₹99 for subtotal below threshold (₹500 < ₹999)");
    assert(baselineCalc.shippingDiscount === 0, "No shipping discount applied for baseline order");
    assert(baselineCalc.appliedRule === "DEFAULT_RATE", "Applied rule is DEFAULT_RATE");
    assert(!baselineCalc.isFreeShipping, "isFreeShipping is false");

    // --------------------------------------------------------------------------
    // Test 2: Orders above configured threshold
    // --------------------------------------------------------------------------
    console.log("\n▶️ Test 2: Orders Above Configured Threshold");
    const aboveThresholdCalc = calculateShipping({
      subtotal: 1200,
      items: [{ productId: "p_test_1", quantity: 1 }],
      settings: {
        ...DEFAULT_SHIPPING_SETTINGS,
        minOrderThreshold: { isEnabled: true, minSubtotal: 999 },
      },
    });
    assert(aboveThresholdCalc.finalShippingCharge === 0, "Final shipping fee is ₹0 when subtotal >= ₹999");
    assert(aboveThresholdCalc.isFreeShipping === true, "isFreeShipping is true");
    assert(aboveThresholdCalc.shippingDiscount === 99, "Shipping discount equals standard fee (₹99)");
    assert(aboveThresholdCalc.appliedRule === "MIN_ORDER_THRESHOLD", "Applied rule is MIN_ORDER_THRESHOLD");

    // --------------------------------------------------------------------------
    // Test 3: Changing default fee through settings
    // --------------------------------------------------------------------------
    console.log("\n▶️ Test 3: Changing Default Shipping Fee (e.g. to ₹149)");
    const customFeeSettings: ShippingSettings = {
      ...DEFAULT_SHIPPING_SETTINGS,
      defaultCharge: 149,
      minOrderThreshold: { isEnabled: true, minSubtotal: 999 },
    };
    const customFeeCalc = calculateShipping({
      subtotal: 700,
      items: [{ productId: "p_test_1", quantity: 1 }],
      settings: customFeeSettings,
    });
    assert(customFeeCalc.finalShippingCharge === 149, "Shipping fee adjusts to updated configured fee (₹149)");
    assert(customFeeCalc.defaultShippingFee === 149, "Default fee reflects ₹149");

    // --------------------------------------------------------------------------
    // Test 4: Global Free Shipping Event (Festival Override)
    // --------------------------------------------------------------------------
    console.log("\n▶️ Test 4: Global Free Shipping Event");
    const globalPromoSettings: ShippingSettings = {
      ...DEFAULT_SHIPPING_SETTINGS,
      globalFreeShipping: {
        isEnabled: true,
        label: "Diwali Special: Complimentary Express Delivery",
      },
      minOrderThreshold: { isEnabled: true, minSubtotal: 999 },
    };
    const globalPromoCalc = calculateShipping({
      subtotal: 399, // Below threshold
      items: [{ productId: "p_test_1", quantity: 1 }],
      settings: globalPromoSettings,
    });
    assert(globalPromoCalc.finalShippingCharge === 0, "Orders below threshold get ₹0 shipping when global promo is active");
    assert(globalPromoCalc.appliedRule === "GLOBAL_FREE_SHIPPING", "Applied rule is GLOBAL_FREE_SHIPPING");
    assert(globalPromoCalc.isFreeShipping === true, "isFreeShipping is true");

    // --------------------------------------------------------------------------
    // Test 5: Scheduled Promotional Free Shipping (Active, Future, Expired)
    // --------------------------------------------------------------------------
    console.log("\n▶️ Test 5: Scheduled Promotional Free Shipping Date Windows");
    const now = new Date();
    const pastStart = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
    const futureEnd = new Date(now.getTime() + 2 * 3600 * 1000).toISOString();
    const pastEnd = new Date(now.getTime() - 1 * 3600 * 1000).toISOString();
    const futureStart = new Date(now.getTime() + 1 * 3600 * 1000).toISOString();

    // 5A: Currently active
    const activeScheduledSettings: ShippingSettings = {
      ...DEFAULT_SHIPPING_SETTINGS,
      minOrderThreshold: { isEnabled: true, minSubtotal: 999 },
      scheduledPromotion: {
        isEnabled: true,
        promotionName: "Flash Weekend Free Shipping",
        startsAt: pastStart,
        endsAt: futureEnd,
      },
    };
    const activeSchedCalc = calculateShipping({
      subtotal: 450,
      items: [{ productId: "p_test_1", quantity: 1 }],
      settings: activeScheduledSettings,
      now,
    });
    assert(activeSchedCalc.finalShippingCharge === 0, "Active scheduled promotion applies ₹0 shipping");
    assert(activeSchedCalc.appliedRule === "SCHEDULED_PROMOTION", "Applied rule is SCHEDULED_PROMOTION");

    // 5B: Expired promotion
    const expiredScheduledSettings: ShippingSettings = {
      ...DEFAULT_SHIPPING_SETTINGS,
      minOrderThreshold: { isEnabled: true, minSubtotal: 999 },
      scheduledPromotion: {
        isEnabled: true,
        promotionName: "Old Festive Promo",
        startsAt: pastStart,
        endsAt: pastEnd,
      },
    };
    const expiredSchedCalc = calculateShipping({
      subtotal: 450,
      items: [{ productId: "p_test_1", quantity: 1 }],
      settings: expiredScheduledSettings,
      now,
    });
    assert(expiredSchedCalc.finalShippingCharge === 99, "Expired scheduled promotion falls back to standard rate (₹99)");
    assert(expiredSchedCalc.appliedRule === "DEFAULT_RATE", "Applied rule is DEFAULT_RATE after expiry");

    // 5C: Future promotion (not yet active)
    const futureScheduledSettings: ShippingSettings = {
      ...DEFAULT_SHIPPING_SETTINGS,
      minOrderThreshold: { isEnabled: true, minSubtotal: 999 },
      scheduledPromotion: {
        isEnabled: true,
        promotionName: "Next Month Festival",
        startsAt: futureStart,
        endsAt: futureEnd,
      },
    };
    const futureSchedCalc = calculateShipping({
      subtotal: 450,
      items: [{ productId: "p_test_1", quantity: 1 }],
      settings: futureScheduledSettings,
      now,
    });
    assert(futureSchedCalc.finalShippingCharge === 99, "Future promotion does not activate ahead of start date (₹99)");

    // --------------------------------------------------------------------------
    // Test 6: Product-Specific Free Shipping
    // --------------------------------------------------------------------------
    console.log("\n▶️ Test 6: Product-Specific Free Shipping");
    const productPromoSettings: ShippingSettings = {
      ...DEFAULT_SHIPPING_SETTINGS,
      minOrderThreshold: { isEnabled: true, minSubtotal: 999 },
      productSpecificRules: {
        isEnabled: true,
        eligibleProductIds: ["prod_featured_necklace"],
        entireOrderFree: true,
      },
    };

    // 6A: Qualifying product in cart
    const prodQualCalc = calculateShipping({
      subtotal: 400,
      items: [{ productId: "prod_featured_necklace", quantity: 1 }],
      settings: productPromoSettings,
    });
    assert(prodQualCalc.finalShippingCharge === 0, "Cart with qualifying product receives free shipping");
    assert(prodQualCalc.appliedRule === "PRODUCT_SPECIFIC", "Applied rule is PRODUCT_SPECIFIC");

    // 6B: Non-qualifying product in cart
    const nonQualCalc = calculateShipping({
      subtotal: 400,
      items: [{ productId: "prod_regular_ring", quantity: 1 }],
      settings: productPromoSettings,
    });
    assert(nonQualCalc.finalShippingCharge === 99, "Cart with non-qualifying product is charged standard shipping");

    // --------------------------------------------------------------------------
    // Test 7: Category-Specific Free Shipping
    // --------------------------------------------------------------------------
    console.log("\n▶️ Test 7: Category-Specific Free Shipping");
    const categoryPromoSettings: ShippingSettings = {
      ...DEFAULT_SHIPPING_SETTINGS,
      minOrderThreshold: { isEnabled: true, minSubtotal: 999 },
      categorySpecificRules: {
        isEnabled: true,
        eligibleCategoryIds: ["cat_wedding_collection"],
        entireOrderFree: true,
      },
    };

    const catQualCalc = calculateShipping({
      subtotal: 550,
      items: [{ productId: "p_1", categoryId: "cat_wedding_collection", quantity: 1 }],
      settings: categoryPromoSettings,
    });
    assert(catQualCalc.finalShippingCharge === 0, "Cart with eligible category item gets free shipping");
    assert(catQualCalc.appliedRule === "CATEGORY_SPECIFIC", "Applied rule is CATEGORY_SPECIFIC");

    // --------------------------------------------------------------------------
    // Test 8: Precedence Order (Multiple Qualifying Rules)
    // --------------------------------------------------------------------------
    console.log("\n▶️ Test 8: Precedence Policy (Multi-Rule Collision)");
    // When scheduled promo, global event, and threshold are all active:
    // Scheduled promo takes precedence over global event and threshold
    const multiRuleSettings: ShippingSettings = {
      ...DEFAULT_SHIPPING_SETTINGS,
      scheduledPromotion: {
        isEnabled: true,
        promotionName: "Super Event",
        startsAt: pastStart,
        endsAt: futureEnd,
      },
      globalFreeShipping: { isEnabled: true, label: "Global Promo" },
      minOrderThreshold: { isEnabled: true, minSubtotal: 500 },
    };
    const multiRuleCalc = calculateShipping({
      subtotal: 1000,
      items: [{ productId: "p_1", quantity: 1 }],
      settings: multiRuleSettings,
      now,
    });
    assert(multiRuleCalc.appliedRule === "SCHEDULED_PROMOTION", "Scheduled promo takes top precedence when active");
    assert(multiRuleCalc.finalShippingCharge === 0, "Final shipping charge is ₹0");
    assert(multiRuleCalc.shippingDiscount === 99, "Shipping discount does not stack beyond default fee (₹99, no negative amounts)");

    // --------------------------------------------------------------------------
    // Test 9: Disabling Shipping Method
    // --------------------------------------------------------------------------
    console.log("\n▶️ Test 9: Disabling Shipping Method");
    const disabledSettings: ShippingSettings = {
      ...DEFAULT_SHIPPING_SETTINGS,
      isEnabled: false,
    };
    const disabledCalc = calculateShipping({
      subtotal: 500,
      items: [{ productId: "p_1", quantity: 1 }],
      settings: disabledSettings,
    });
    assert(disabledCalc.appliedRule === "SHIPPING_DISABLED", "Applied rule indicates SHIPPING_DISABLED");
    assert(disabledCalc.validationErrors && disabledCalc.validationErrors.length > 0, "Validation errors indicate shipping disabled");

    // --------------------------------------------------------------------------
    // Test 10: Server Authoritative Pricing with Real Supabase Catalog
    // --------------------------------------------------------------------------
    console.log("\n▶️ Test 10: Server Authoritative validateAndCalculateCart Integration");
    const { data: dbProducts } = await supabaseAdmin
      .from("products")
      .select("id, title, base_price, sale_price")
      .eq("status", "active")
      .limit(1);

    if (dbProducts && dbProducts.length > 0) {
      const prod = dbProducts[0];
      const prodPrice = Number(prod.sale_price || prod.base_price);
      console.log(`   Testing with catalog item: "${prod.title}" (Price: ₹${prodPrice})`);

      // 10A: 1 item (subtotal below ₹999 threshold)
      const cartBelow = await validateAndCalculateCart([
        { productId: prod.id, quantity: 1 },
      ]);
      console.log(`   1 item subtotal: ₹${cartBelow.subtotal} | Shipping: ₹${cartBelow.shippingCharge}`);
      assert(cartBelow.shippingDetails !== undefined, "shippingDetails object returned by validateAndCalculateCart");
      if (cartBelow.subtotal < 999) {
        assert(cartBelow.shippingCharge === 99, "Authoritative shipping is ₹99 when subtotal < ₹999");
      }

      // 10B: Multiple items (subtotal above ₹999 threshold)
      const qtyAbove = Math.ceil(1000 / prodPrice) + 1;
      const cartAbove = await validateAndCalculateCart([
        { productId: prod.id, quantity: qtyAbove },
      ]);
      console.log(`   ${qtyAbove} items subtotal: ₹${cartAbove.subtotal} | Shipping: ₹${cartAbove.shippingCharge}`);
      assert(cartAbove.shippingCharge === 0, "Authoritative shipping is ₹0 when subtotal >= ₹999");
      assert(cartAbove.shippingDetails?.isFreeShipping === true, "shippingDetails.isFreeShipping is true");
    }

    // --------------------------------------------------------------------------
    // Test 11: Shipping Snapshot Generation
    // --------------------------------------------------------------------------
    console.log("\n▶️ Test 11: Immutable Order Shipping Snapshot Generation");
    const snapshot = createShippingSnapshot(baselineCalc, "INR");
    assert(snapshot.defaultShippingFee === 99, "Snapshot records defaultShippingFee of 99");
    assert(snapshot.finalShippingCharge === 99, "Snapshot records finalShippingCharge of 99");
    assert(snapshot.shippingMethodName === "Insured Express Shipping", "Snapshot records shippingMethodName");
    assert(snapshot.currency === "INR", "Snapshot records currency");
    assert(Boolean(snapshot.calculatedAt), "Snapshot includes ISO timestamp");

    // --------------------------------------------------------------------------
    // Test 12: Supabase site_settings Persistence Roundtrip
    // --------------------------------------------------------------------------
    console.log("\n▶️ Test 12: Supabase site_settings Persistence Roundtrip");
    const testUpdated = await updateShippingSettings({
      defaultCharge: 99,
      methodName: "Insured Express Shipping",
      minOrderThreshold: {
        isEnabled: true,
        minSubtotal: 999,
        label: "Free Insured Express Shipping on orders above ₹999",
      },
      globalFreeShipping: {
        isEnabled: false,
        label: "Festival Special: Free Insured Express Shipping on all orders",
      },
    });
    assert(testUpdated.defaultCharge === 99, "Updated settings persisted with ₹99 default charge");
    assert(testUpdated.minOrderThreshold.minSubtotal === 999, "Threshold persisted with ₹999");

    const reloaded = await getShippingSettings();
    assert(reloaded.defaultCharge === 99, "Reloaded from site_settings matches ₹99");
    assert(reloaded.methodName === "Insured Express Shipping", "Reloaded method name matches");

    console.log("\n============================================================");
    console.log("🎉 ALL SHIPPING & PROMOTIONS UNIT & INTEGRATION TESTS PASSED!");
    console.log("============================================================\n");
  } finally {
    // Restore original settings
    await updateShippingSettings(originalSettings);
    console.log("🧹 Cleaned up and restored original shipping settings in database.");
  }
}

runShippingTests().catch((err) => {
  console.error("\n❌ Test Suite Failed with Error:", err);
  process.exit(1);
});
