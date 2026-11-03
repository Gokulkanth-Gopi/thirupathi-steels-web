-- ============================================================================
-- Migration: 004_diameter_image_schema.sql
-- Description: Add image support to rebar diameters table
-- Authoritative Database: PostgreSQL 18
-- ============================================================================

-- 1. Add image column to diameters table
ALTER TABLE diameters ADD COLUMN IF NOT EXISTS image VARCHAR(500);

-- 2. Populate default image for existing diameters if null
UPDATE diameters SET image = '/images/products/rebar-bundle.jpg' WHERE image IS NULL OR image = '';

-- 3. Record migration
INSERT INTO schema_migrations (version, applied_at)
VALUES ('004_diameter_image_schema.sql', CURRENT_TIMESTAMP)
ON CONFLICT (version) DO NOTHING;

