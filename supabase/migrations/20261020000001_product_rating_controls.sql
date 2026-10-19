-- ==============================================================================
-- DUSKK Database Migration: CMS-Managed Product Ratings & Review Display
-- Migration: 20261020000001_product_rating_controls.sql
-- Description:
--   Adds columns to public.products for storing administrator-managed display ratings,
--   review counts, display toggles, and rating source flags.
-- ==============================================================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS display_rating BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS manual_rating NUMERIC(2,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS manual_review_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rating_source TEXT DEFAULT 'AUTO';
