-- Migration: Add headline_color column to banners
-- Approved Option B: Dedicated headline colour field

ALTER TABLE public.banners
ADD COLUMN IF NOT EXISTS headline_color TEXT;

-- Populate existing records
UPDATE public.banners
SET headline_color = 'light'
WHERE headline_color IS NULL;

-- Set default value
ALTER TABLE public.banners
ALTER COLUMN headline_color SET DEFAULT 'light';

-- Enforce NOT NULL
ALTER TABLE public.banners
ALTER COLUMN headline_color SET NOT NULL;

-- Restrict values to light and dark
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'banners_headline_color_check'
          AND conrelid = 'public.banners'::regclass
    ) THEN
        ALTER TABLE public.banners
        ADD CONSTRAINT banners_headline_color_check
        CHECK (headline_color IN ('light', 'dark'));
    END IF;
END $$;
