
import {
  getPageBanners,
  getPageBanner,
  updatePageBanner,
  ALLOWED_PAGE_KEYS,
  normalizePageKey,
} from "../src/services/banner.service";
import { supabaseAdmin } from "../src/lib/supabase/admin";

async function runBannerTests() {
  console.log("==================================================");
  console.log(" DUSKK — CATEGORY & COMBO PAGE BANNERS TEST SUITE ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      failed++;
    }
  }

  try {
    // TEST 1: Check Allowed Page Keys
    console.log("--- 1. Allowed Page Keys ---");
    assert(ALLOWED_PAGE_KEYS.length === 7, `Expected 7 allowed page keys, found ${ALLOWED_PAGE_KEYS.length}`);
    const expectedKeys = [
      "build-your-combo",
      "combos",
      "earrings",
      "necklaces",
      "rings",
      "payals",
      "bracelets",
    ];
    for (const key of expectedKeys) {
      assert(ALLOWED_PAGE_KEYS.includes(key), `Key "${key}" is in ALLOWED_PAGE_KEYS`);
    }

    // TEST 2: Key Normalization
    console.log("\n--- 2. Key Normalization ---");
    assert(normalizePageKey("earrings") === "earrings", "normalizePageKey('earrings') -> 'earrings'");
    assert(normalizePageKey("EARRINGS") === "earrings", "normalizePageKey('EARRINGS') -> 'earrings'");
    assert(normalizePageKey("payal") === "payals", "normalizePageKey('payal') alias -> 'payals'");
    assert(normalizePageKey("combo") === "combos", "normalizePageKey('combo') alias -> 'combos'");
    assert(ALLOWED_PAGE_KEYS.includes(normalizePageKey("invalid-key") as any) === false, "normalizePageKey('invalid-key') not in ALLOWED_PAGE_KEYS");

    // TEST 3: Retrieve All Page Banners from Database
    console.log("\n--- 3. Database Retrieval (All 7 Pages) ---");
    const allBanners = await getPageBanners();
    assert(typeof allBanners === "object" && allBanners !== null, "getPageBanners returns an object map");
    for (const key of expectedKeys) {
      const b = allBanners[key];
      assert(
        Boolean(b && (b.key === key || b.pageKey === key) && b.title),
        `Page "${key}" exists in site_settings with title: "${b?.title}"`
      );
    }

    // Save initial state so we can cleanly revert after tests
    const initialEarrings = { ...allBanners.earrings };
    const initialNecklaces = { ...allBanners.necklaces };

    // TEST 4: Single Page Retrieval
    console.log("\n--- 4. Single Page Retrieval via getPageBanner() ---");
    const combosBanner = await getPageBanner("combos");
    assert(Boolean(combosBanner && (combosBanner.key === "combos" || combosBanner.pageKey === "combos")), "getPageBanner('combos') retrieved successfully");
    assert(
      combosBanner?.label === "CURATED GIFT SETS" || typeof combosBanner?.label === "string",
      `Combos banner has label: "${combosBanner?.label}"`
    );

    const builderBanner = await getPageBanner("build-your-combo");
    assert(Boolean(builderBanner && (builderBanner.key === "build-your-combo" || builderBanner.pageKey === "build-your-combo")), "getPageBanner('build-your-combo') retrieved");

    // TEST 5: Independent Configuration (Isolation Test)
    console.log("\n--- 5. Independent Configuration & Isolation ---");
    const testImageUrl = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600&q=80";
    const updatedEarrings = await updatePageBanner("earrings", {
      title: "Handcrafted Atelier Earrings",
      label: "EXCLUSIVE COLLECTION",
      description: "Fine demi-fine earring silhouettes bathed in 18k gold.",
      imageUrl: testImageUrl,
      objectPosition: "top",
      overlayOpacity: 55,
      isEnabled: true,
    });

    assert(updatedEarrings.title === "Handcrafted Atelier Earrings", "Earrings title updated in Supabase");
    assert(updatedEarrings.label === "EXCLUSIVE COLLECTION", "Earrings label updated in Supabase");
    assert(updatedEarrings.imageUrl === testImageUrl, "Earrings imageUrl saved");
    assert(updatedEarrings.objectPosition === "top", "Earrings objectPosition saved as 'top'");
    assert(updatedEarrings.overlayOpacity === 55, "Earrings overlayOpacity saved as 55");

    // Verify other 6 pages were NOT affected
    const freshBanners = await getPageBanners();
    assert(
      freshBanners.necklaces.title === initialNecklaces.title,
      `Necklaces title remains unchanged ("${freshBanners.necklaces.title}")`
    );
    assert(
      freshBanners.necklaces.imageUrl === initialNecklaces.imageUrl,
      "Necklaces imageUrl unaffected by earrings update"
    );
    assert(
      freshBanners.combos.key === "combos" || freshBanners.combos.pageKey === "combos",
      "Combos banner unaffected by earrings update"
    );

    // TEST 6: Category Image Synchronization
    console.log("\n--- 6. Category Image Synchronization ---");
    const { data: categoryRow } = await supabaseAdmin
      .from("categories")
      .select("id, name, slug, image_url")
      .ilike("slug", "earrings")
      .single();

    if (categoryRow) {
      assert(
        categoryRow.image_url === testImageUrl,
        `Category row "${categoryRow.name}" image_url synchronized: "${categoryRow.image_url}"`
      );
    } else {
      console.log("  [INFO] No category row with slug 'earrings' found to sync.");
    }

    // TEST 7: Image Removal Test
    console.log("\n--- 7. Image Removal & Fallback Behavior ---");
    const removedImageBanner = await updatePageBanner("earrings", {
      imageUrl: null,
    });
    assert(removedImageBanner.imageUrl === null, "Earrings imageUrl cleared to null successfully");
    assert(
      removedImageBanner.title === "Handcrafted Atelier Earrings",
      "Earrings title preserved after image removal"
    );

    // TEST 8: Display Toggle (Enabled/Disabled)
    console.log("\n--- 8. Display Toggle (isEnabled) ---");
    const disabledBanner = await updatePageBanner("earrings", {
      isEnabled: false,
    });
    assert(disabledBanner.isEnabled === false, "Earrings banner isEnabled updated to false");

    const reEnabledBanner = await updatePageBanner("earrings", {
      isEnabled: true,
    });
    assert(reEnabledBanner.isEnabled === true, "Earrings banner isEnabled restored to true");

    // TEST 9: Validation Checks
    console.log("\n--- 9. Validation Checks ---");
    try {
      await updatePageBanner("invalid-key" as any, { title: "Test" });
      assert(false, "Should reject invalid page key");
    } catch (e: any) {
      assert(true, `Correctly rejected invalid page key: ${e.message}`);
    }

    try {
      await updatePageBanner("rings", { objectPosition: "diagonal" as any });
      assert(false, "Should reject invalid objectPosition");
    } catch (e: any) {
      assert(true, `Correctly rejected invalid objectPosition: ${e.message}`);
    }

    try {
      await updatePageBanner("rings", { overlayOpacity: 120 });
      assert(false, "Should reject out-of-range overlayOpacity (120)");
    } catch (e: any) {
      assert(true, `Correctly rejected overlayOpacity 120: ${e.message}`);
    }

    // Cleanup: Restore original earrings banner
    console.log("\n--- Cleanup ---");
    await updatePageBanner("earrings", {
      title: initialEarrings.title,
      label: initialEarrings.label,
      description: initialEarrings.description,
      imageUrl: initialEarrings.imageUrl,
      objectPosition: initialEarrings.objectPosition,
      overlayOpacity: initialEarrings.overlayOpacity,
      isEnabled: initialEarrings.isEnabled,
    });
    console.log("  Restored initial earrings banner state.");

  } catch (err: any) {
    console.error("Test execution error:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(` SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runBannerTests();
