-- ==============================================================================
-- DUSKK Database Migration: Combo Box Packaging Designs
-- Migration: 20261112000000_combo_box_designs.sql
-- Description:
--   Creates dedicated combo_box_designs table for managing physical luxury
--   presentation boxes with exact supported product counts and individual charges.
--   Extends custom_combos with box_design_id and box_snapshot for immutable order snapshots.
-- ==============================================================================

-- 1. Create combo_box_designs table
CREATE TABLE IF NOT EXISTS public.combo_box_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  supported_product_count INTEGER NOT NULL CHECK (supported_product_count >= 1),
  additional_price NUMERIC NOT NULL DEFAULT 0 CHECK (additional_price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast customer queries (fetching active box designs ordered by display_order)
CREATE INDEX IF NOT EXISTS idx_combo_box_designs_active_count
  ON public.combo_box_designs (is_active, supported_product_count, display_order);

-- Enable RLS
ALTER TABLE public.combo_box_designs ENABLE ROW LEVEL SECURITY;

-- Defense-in-depth: Explicit table privilege hardening
-- 1. Revoke default write privileges from public roles
REVOKE ALL ON TABLE public.combo_box_designs FROM PUBLIC, anon, authenticated;

-- 2. Grant read-only access to anon and authenticated (filtered strictly by RLS)
GRANT SELECT ON TABLE public.combo_box_designs TO anon, authenticated;

-- 3. Grant full access to service_role for backend and admin CMS operations
GRANT ALL ON TABLE public.combo_box_designs TO service_role;

-- Handle policy replacement safely and idempotently without leaving permissive policies in place
DO $$
BEGIN
  -- 1. Public read policy: Expose strictly active box designs to anon and authenticated clients
  DROP POLICY IF EXISTS "Allow public read access to active box designs" ON public.combo_box_designs;
  CREATE POLICY "Allow public read access to active box designs"
    ON public.combo_box_designs
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

  -- 2. Service role policy: Explicitly scoped to service_role (which also bypasses RLS in Supabase)
  DROP POLICY IF EXISTS "Allow service role full access to combo box designs" ON public.combo_box_designs;
  CREATE POLICY "Allow service role full access to combo box designs"
    ON public.combo_box_designs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
END $$;

-- 2. Extend custom_combos table with box design foreign key and immutable snapshot
ALTER TABLE public.custom_combos
  ADD COLUMN IF NOT EXISTS box_design_id UUID REFERENCES public.combo_box_designs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS box_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_custom_combos_box_design_id
  ON public.custom_combos(box_design_id);
