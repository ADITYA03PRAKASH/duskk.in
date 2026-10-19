-- ==============================================================================
-- DUSKK Database Migration: Category & Combo Page Banners
-- Migration: 20261020000002_category_page_banners.sql
-- Description:
--   Seeds default site_settings entry for category_page_banners covering all 7 pages:
--   1. Build Your Own Combo (/build-your-combo)
--   2. Gift Sets & Combos (/combos)
--   3. Earrings (/category/earrings)
--   4. Necklaces (/category/necklaces)
--   5. Rings (/category/rings)
--   6. Payals (/category/payals)
--   7. Bracelets (/category/bracelets)
-- ==============================================================================

INSERT INTO public.site_settings (key, description, value, updated_at)
VALUES (
  'category_page_banners',
  'Authoritative banner images and headings for Category and Combo pages',
  '{
    "build-your-combo": {
      "pageKey": "build-your-combo",
      "pageName": "Build Your Own Combo",
      "pagePath": "/build-your-combo",
      "isEnabled": true,
      "imageUrl": "",
      "title": "Build Your Own Jewelry Set",
      "label": "INTERACTIVE CUSTOM ATELIER",
      "description": "Select matching pieces and enjoy bundle pricing.",
      "objectPosition": "center",
      "overlayOpacity": 45,
      "updatedAt": "2026-10-20T00:00:00Z"
    },
    "combos": {
      "pageKey": "combos",
      "pageName": "Gift Sets & Combos",
      "pagePath": "/combos",
      "isEnabled": true,
      "imageUrl": "",
      "title": "Perfect Pairings, Exceptional Value",
      "label": "CURATED GIFT SETS & COMBOS",
      "description": "Handcrafted luxury jewelry pieces designed to dazzle together. Each gift set arrives packaged in our signature velvet-lined box with certificate of authenticity.",
      "objectPosition": "center",
      "overlayOpacity": 45,
      "updatedAt": "2026-10-20T00:00:00Z"
    },
    "earrings": {
      "pageKey": "earrings",
      "pageName": "Earrings",
      "pagePath": "/category/earrings",
      "isEnabled": true,
      "imageUrl": "https://i.pinimg.com/736x/96/37/a9/9637a90f52d298dc66a305d6aa19d37a.jpg",
      "title": "Earrings",
      "label": "COLLECTION",
      "description": "Handcrafted studs, drops, and hoops with 18k gold vermeil & freshwater pearls.",
      "objectPosition": "center",
      "overlayOpacity": 40,
      "updatedAt": "2026-10-20T00:00:00Z"
    },
    "necklaces": {
      "pageKey": "necklaces",
      "pageName": "Necklaces",
      "pagePath": "/category/necklaces",
      "isEnabled": true,
      "imageUrl": "https://res.cloudinary.com/ysrfjekc/image/upload/f_auto,q_auto/Blue_Sapphire_Leaf_Necklace_Gold_Botanical_Pendant_Marquise_Gemstone_Floral_Necklace",
      "title": "Necklaces",
      "label": "COLLECTION",
      "description": "Delicate chains, statement collars, and layered gemstone necklaces.",
      "objectPosition": "center",
      "overlayOpacity": 40,
      "updatedAt": "2026-10-20T00:00:00Z"
    },
    "rings": {
      "pageKey": "rings",
      "pageName": "Rings",
      "pagePath": "/category/rings",
      "isEnabled": true,
      "imageUrl": "https://res.cloudinary.com/ysrfjekc/image/upload/f_auto,q_auto/Elegant_Floral_Adjustable_Ring",
      "title": "Rings",
      "label": "COLLECTION",
      "description": "Stackable bands, cocktail rings, and zircon studded eternity rings.",
      "objectPosition": "center",
      "overlayOpacity": 40,
      "updatedAt": "2026-10-20T00:00:00Z"
    },
    "payals": {
      "pageKey": "payals",
      "pageName": "Payals",
      "pagePath": "/category/payals",
      "isEnabled": true,
      "imageUrl": "https://res.cloudinary.com/ysrfjekc/image/upload/f_auto,q_auto/them_and_a_festive_season",
      "title": "Payals",
      "label": "COLLECTION",
      "description": "Featuring beautiful traditional designs with a modern touch, DUSKK anklets add charm and grace to every step.",
      "objectPosition": "center",
      "overlayOpacity": 40,
      "updatedAt": "2026-10-20T00:00:00Z"
    },
    "bracelets": {
      "pageKey": "bracelets",
      "pageName": "Bracelets",
      "pagePath": "/category/bracelets",
      "isEnabled": true,
      "imageUrl": "https://i.pinimg.com/736x/66/d0/dd/66d0dde36efaba9dc1f3229cab3aa566.jpg",
      "title": "Bracelets",
      "label": "COLLECTION",
      "description": "Discover our stylish bracelet collection, featuring elegant designs that add a touch of sophistication to every look.",
      "objectPosition": "center",
      "overlayOpacity": 40,
      "updatedAt": "2026-10-20T00:00:00Z"
    }
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;
