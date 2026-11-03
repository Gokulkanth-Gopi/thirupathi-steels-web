-- ============================================================================
-- Migration: 003_content_management_schema.sql
-- Description: Dynamic Content Management for Sizes, Brands, and Gallery
-- Authoritative Database: PostgreSQL 18
-- ============================================================================

-- 1. Create Gallery Images Table
CREATE TABLE IF NOT EXISTS gallery_images (
    id TEXT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Yard Infrastructure',
    image_url VARCHAR(500) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_active ON gallery_images(is_active);
CREATE INDEX IF NOT EXISTS idx_gallery_images_order ON gallery_images(display_order);

-- 2. Enhance Diameters Table for Public Product Catalog Customization
ALTER TABLE diameters ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE diameters ADD COLUMN IF NOT EXISTS standard_grades VARCHAR(100) DEFAULT 'Fe 550D, Fe 500D';
ALTER TABLE diameters ADD COLUMN IF NOT EXISTS key_applications TEXT;
ALTER TABLE diameters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 3. Enhance Brands Table for Public Brand Showcase Customization
ALTER TABLE brands ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS features TEXT;

-- 4. Populate default rich content for existing diameters if empty
UPDATE diameters SET 
    description = 'High-bendability 8 mm TMT steel bar designed specifically for column ties, beam stirrups, and residential slab reinforcement with superior anti-cracking flexibility.',
    key_applications = 'Column lateral ties, Beam shear stirrups, Roof & floor slabs, Parapet walls',
    standard_grades = 'Fe 550D, Fe 500D',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'd-8mm' AND (description IS NULL OR description = '');

UPDATE diameters SET 
    description = 'Versatile 10 mm TMT rebar offering the ideal balance between tensile strength and ductility. Primarily utilized for two-way slab meshes, staircases, and residential lintel beams.',
    key_applications = 'Two-way RCC slabs, Cantilever chajjas, Staircase reinforcement, Lintel beams',
    standard_grades = 'Fe 550D, Fe 500D',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'd-10mm' AND (description IS NULL OR description = '');

UPDATE diameters SET 
    description = 'The most widely specified structural rebar in construction. Engineered for primary longitudinal reinforcement in building columns, load-bearing frames, and plinth beams.',
    key_applications = 'Primary column bars, Plinth & tie beams, Foundation footings, Retaining walls',
    standard_grades = 'Fe 550D, Fe 500D',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'd-12mm' AND (description IS NULL OR description = '');

UPDATE diameters SET 
    description = 'Heavy-duty 16 mm TMT rebar designed for multi-storey residential and commercial load transfer. Features deep ribs for exceptional concrete anchorage and shear resistance.',
    key_applications = 'Multi-storey columns, Heavy transfer girders, Combined footings, Water tank walls',
    standard_grades = 'Fe 550D, Fe 500D',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'd-16mm' AND (description IS NULL OR description = '');

UPDATE diameters SET 
    description = 'High-mass 20 mm industrial rebar manufactured to withstand immense compressive and tensile stresses in basements, bridge culverts, and heavy commercial foundation rafts.',
    key_applications = 'Raft foundation mats, Bridge piers & culverts, High-load commercial columns, Industrial slabs',
    standard_grades = 'Fe 550D, Fe 500D',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'd-20mm' AND (description IS NULL OR description = '');

UPDATE diameters SET 
    description = 'Specialist 25 mm high-tensile rebar for mega-projects, civil infrastructure, pile caps, and heavy industrial plant foundations requiring certified seismic energy absorption.',
    key_applications = 'Heavy pile caps, High-rise core shear walls, Highway infrastructure, Heavy machine foundations',
    standard_grades = 'Fe 550D, Fe 500D',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'd-25mm' AND (description IS NULL OR description = '');

-- 5. Populate default rich content for existing brands if empty
UPDATE brands SET
    description = 'India’s benchmark primary steel rebar engineered from virgin iron ore. Delivers supreme ductility, superior seismic resistance, and consistent rib geometry for high-rise infrastructure.',
    features = 'Fe 550D Super Ductile, Virgin Iron Ore Base, BIS 1786 Certified',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'tata-tiscon' AND (description IS NULL OR description = '');

UPDATE brands SET
    description = 'Engineered with advanced quenching and self-tempering technology, Suryadev TMT bars deliver excellent yield strength, high bendability, and superior corrosion resistance for construction.',
    features = 'Fe 550D Grade, Thermex Quenching Tech, Optimal Rib Design',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'suryadev' AND (description IS NULL OR description = '');

UPDATE brands SET
    description = 'A widely preferred South Indian brand renowned for its consistent thermal resistance, robust weldability, and balanced mechanical strength for all types of residential and commercial structures.',
    features = 'Fe 550D High Tensile, Excellent Weldability, High Fire Resistance',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'agni' AND (description IS NULL OR description = '');

UPDATE brands SET
    description = 'Manufactured under strict process controls to ensure uniform tensile properties, superior concrete adhesion, and long-lasting structural integrity across various construction projects.',
    features = 'Fe 500D / 550D, Uniform Weight & Ribs, Cost-Effective Reliability',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'ssi' AND (description IS NULL OR description = '');

UPDATE brands SET
    description = 'High-grade reinforcement steel bars manufactured to meet Indian standard tolerances, offering optimal elongation, bendability, and dependable performance in civil foundations.',
    features = 'Fe 550D Standard, Enhanced Elongation, Strong Concrete Bonding',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'chakraa' AND (description IS NULL OR description = '');

-- 6. Seed initial verified gallery images
INSERT INTO gallery_images (id, title, category, image_url, description, display_order, is_active)
VALUES
    ('gal-yard-overview', 'Salem Main Stockyard & Rebar Storage Bays', 'Yard Infrastructure', '/images/home/steel-yard-hero.jpg', 'Expansive covered storage facility housing primary and secondary TMT rebars under weather protection to preserve surface finish and rib sharpness.', 1, TRUE),
    ('gal-rebar-bundles', 'Factory-Tagged TMT Rebar Bundles', 'Certified Products', '/images/products/rebar-bundle.jpg', 'Standard 12-meter bundles strapped with manufacturer inspection tags, heat identification numbers, and grade markings.', 2, TRUE),
    ('gal-fleet-logistics', 'Transit Fleet & Immediate Dispatch Logistics', 'Logistics Fleet', '/images/home/cta-banner.jpg', 'Heavy transport trailers and commercial flatbeds loaded directly via overhead gantry systems for prompt delivery across Tamil Nadu.', 3, TRUE),
    ('gal-rebar-inspection', 'Thermo-Mechanically Treated Rebar Rib Profile', 'Quality Inspection', '/images/home/hero-bg.jpg', 'Close-up examination of high-strength deformed rebar rib angles, guaranteeing superior adhesion with structural concrete.', 4, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. Record migration
INSERT INTO schema_migrations (version, applied_at)
VALUES ('003_content_management_schema.sql', CURRENT_TIMESTAMP)
ON CONFLICT (version) DO NOTHING;

