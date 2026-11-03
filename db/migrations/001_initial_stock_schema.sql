-- ============================================================================
-- Migration: 001_initial_stock_schema.sql
-- Description: Core PostgreSQL normalized schema for Thirupathi Steels
-- Units: Kilograms (kg) with precision NUMERIC(14, 3)
-- Authoritative status thresholds:
--   out_of_stock: quantity_kg <= 0
--   low_stock:    0 < quantity_kg <= 1500
--   in_stock:     quantity_kg > 1500
-- ============================================================================

-- 0. Schema Migration History
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1. Approved Brands Table (Strictly 5 approved brands)
CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Primary Steel' | 'Secondary Steel'
    tagline VARCHAR(255),
    logo VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands(is_active);

-- 2. Supported Diameters Table (Strictly 6 standard diameters)
CREATE TABLE IF NOT EXISTS diameters (
    id VARCHAR(20) PRIMARY KEY,
    diameter_mm INTEGER NOT NULL UNIQUE,
    weight_kg_per_meter NUMERIC(6, 3) NOT NULL,
    primary_use VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diameters_mm ON diameters(diameter_mm);

-- 3. Stock Lots (Physical yard inventory stored strictly in Kilograms)
CREATE TABLE IF NOT EXISTS stock_lots (
    id TEXT PRIMARY KEY,
    lot_number VARCHAR(100) UNIQUE NOT NULL,
    brand_id VARCHAR(50) NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
    diameter_id VARCHAR(20) NOT NULL REFERENCES diameters(id) ON DELETE RESTRICT,
    grade VARCHAR(50) NOT NULL DEFAULT 'Fe 550D',
    quantity_kg NUMERIC(14, 3) NOT NULL CHECK (quantity_kg >= 0),
    location VARCHAR(150) NOT NULL DEFAULT 'Salem Main Yard',
    bay_number VARCHAR(50),
    mfg_batch_no VARCHAR(100),
    stock_status VARCHAR(20) NOT NULL, -- 'in_stock', 'low_stock', 'out_of_stock'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_lots_brand ON stock_lots(brand_id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_diameter ON stock_lots(diameter_id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_status ON stock_lots(stock_status);
CREATE INDEX IF NOT EXISTS idx_stock_lots_active ON stock_lots(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_lots_updated ON stock_lots(updated_at);

-- 4. Stock Movements (Immutable audit log with transactional consistency)
CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    lot_id TEXT NOT NULL REFERENCES stock_lots(id) ON DELETE RESTRICT,
    movement_type VARCHAR(50) NOT NULL, -- 'initial_entry', 'inward_receipt', 'dispatch_sale', 'yard_adjustment', 'audit_reconciliation'
    quantity_delta_kg NUMERIC(14, 3) NOT NULL,
    previous_quantity_kg NUMERIC(14, 3) NOT NULL,
    new_quantity_kg NUMERIC(14, 3) NOT NULL CHECK (new_quantity_kg >= 0),
    reason TEXT NOT NULL,
    reference_no VARCHAR(100), -- Weighbridge ticket ref or internal consignment no
    idempotency_key VARCHAR(120) UNIQUE,
    performed_by VARCHAR(100) NOT NULL,
    performed_by_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movements_lot_id ON stock_movements(lot_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_created ON stock_movements(created_at);

-- 5. Admin Users (Authorized yard personnel for stock entry/adjustments)
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'yard_manager', -- 'admin', 'yard_manager'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- 6. Legacy compatibility table (for legacy /api/products and /api/bills references if needed)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'Kg',
    description TEXT,
    image VARCHAR(500),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    bill_number VARCHAR(100) NOT NULL UNIQUE,
    bill_date DATE NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    notes TEXT,
    total_amount NUMERIC(14, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
