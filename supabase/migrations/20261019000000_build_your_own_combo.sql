-- ==============================================================================
-- DUSKK Database Migration: Build Your Own Combo
-- Migration: 20261019000000_build_your_own_combo.sql
-- Description:
--   Creates custom_combos table for persisting immutable custom combo snapshots
--   and initializes site_settings for Build Your Own Combo configuration.
-- ==============================================================================

-- 1. Create custom_combos table
CREATE TABLE IF NOT EXISTS public.custom_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  combo_title TEXT NOT NULL,
  components JSONB NOT NULL,
  subtotal_amount NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  final_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_combos_order_id ON public.custom_combos(order_id);

-- Enable RLS
ALTER TABLE public.custom_combos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_combos' AND policyname = 'Allow public read access to custom combos'
  ) THEN
    CREATE POLICY "Allow public read access to custom combos"
      ON public.custom_combos FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_combos' AND policyname = 'Allow service role full access to custom combos'
  ) THEN
    CREATE POLICY "Allow service role full access to custom combos"
      ON public.custom_combos FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 2. Seed default configuration in site_settings if not present
INSERT INTO public.site_settings (key, value, description, updated_at)
VALUES (
  'custom_combo_settings',
  '{
    "isEnabled": true,
    "title": "Build Your Own Combo",
    "subtitle": "Create your bespoke luxury jewelry pairing. Select your favorite pieces and unlock an exclusive bundled gift discount.",
    "eligibleCategoryIds": [],
    "eligibleProductIds": [],
    "minItems": 2,
    "maxItems": 5,
    "minQuantityPerProduct": 1,
    "maxQuantityPerProduct": 3,
    "discountType": "percentage",
    "discountValue": 15,
    "maxDiscountAmount": 1500,
    "allowCouponsWithCombo": false,
    "startsAt": null,
    "endsAt": null,
    "showOnHomepage": true,
    "homepageDisplayOrder": 1
  }'::jsonb,
  'Configuration and discount rules for Build Your Own Combo',
  NOW()
)
ON CONFLICT (key) DO NOTHING;
