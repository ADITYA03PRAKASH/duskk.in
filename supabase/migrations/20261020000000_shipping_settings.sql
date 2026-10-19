-- ==============================================================================
-- DUSKK Database Migration: Dynamic Shipping Charges & CMS Free Shipping Promotions
-- Migration: 20261020000000_shipping_settings.sql
-- Description:
--   1. Adds shipping_snapshot column to public.orders for preserving immutable shipping snapshots
--   2. Seeds default shipping configuration in site_settings
-- ==============================================================================

-- 1. Add optional shipping_snapshot column to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_snapshot JSONB DEFAULT NULL;

-- 2. Seed default configuration in site_settings if not present
INSERT INTO public.site_settings (key, value, description, updated_at)
VALUES (
  'shipping_settings',
  '{
    "isEnabled": true,
    "methodName": "Insured Express Shipping",
    "defaultCharge": 99,
    "currency": "INR",
    "estimatedDeliveryText": "Delivered within 3-5 business days across India",
    "globalFreeShipping": {
      "isEnabled": false,
      "label": "Festival Special: Free Insured Express Shipping on all orders"
    },
    "minOrderThreshold": {
      "isEnabled": true,
      "minSubtotal": 999,
      "label": "Free Insured Express Shipping on orders above ₹999"
    },
    "scheduledPromotion": {
      "isEnabled": false,
      "promotionName": "Festive Free Shipping",
      "startsAt": null,
      "endsAt": null
    },
    "productSpecificRules": {
      "isEnabled": false,
      "eligibleProductIds": [],
      "entireOrderFree": true
    },
    "categorySpecificRules": {
      "isEnabled": false,
      "eligibleCategoryIds": [],
      "entireOrderFree": true
    }
  }'::jsonb,
  'Authoritative shipping configuration and promotional free shipping rules',
  NOW()
)
ON CONFLICT (key) DO NOTHING;
