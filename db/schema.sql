-- ============================================================================
-- Thirupathi Steels - Core Database Schema
-- Location: Salem, Tamil Nadu
-- Entities: Products, Live Stock, Bills/Stock Documents, Stock Audit Log
-- ============================================================================

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'TMT Rebars', 'Structural Steel', 'MS Pipes', 'Binding Wire'
    grade VARCHAR(50) NOT NULL,      -- e.g., 'Fe 550D', 'Fe 500D'
    brand VARCHAR(100) NOT NULL,     -- Approved: 'TATA TISCON', 'SURYADEV', 'AGNI', 'SSI TMT', 'CHAKRAA TMT'
    unit VARCHAR(20) NOT NULL DEFAULT 'Tons', -- 'Tons', 'Bundles', 'Pieces', 'Kg'
    description TEXT,
    image VARCHAR(500),
    is_active INTEGER NOT NULL DEFAULT 1, -- 1 = active, 0 = inactive
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_grade ON products(grade);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- 2. Bills / Inward Stock Supporting Documents
CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    bill_number VARCHAR(100) NOT NULL UNIQUE,
    bill_date DATE NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    notes TEXT,
    total_amount NUMERIC(14, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_supplier ON bills(supplier);

-- 3. Live Stock Table (Real-time yard inventory)
CREATE TABLE IF NOT EXISTS live_stock (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000, -- Up to 3 decimal places for precision tonnage
    unit VARCHAR(20) NOT NULL DEFAULT 'Tons',
    location VARCHAR(150) NOT NULL DEFAULT 'Salem Main Yard', -- Yard / bay location
    stock_status VARCHAR(50) NOT NULL DEFAULT 'in_stock', -- 'in_stock', 'low_stock', 'out_of_stock', 'incoming'
    last_bill_id TEXT, -- Foreign key to most recent supporting inward bill
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (last_bill_id) REFERENCES bills(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_live_stock_product_id ON live_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_live_stock_status ON live_stock(stock_status);
CREATE INDEX IF NOT EXISTS idx_live_stock_location ON live_stock(location);
CREATE INDEX IF NOT EXISTS idx_live_stock_last_updated ON live_stock(last_updated);

-- 4. Stock History & Audit Log (Every stock change is logged)
CREATE TABLE IF NOT EXISTS stock_history (
    id TEXT PRIMARY KEY,
    stock_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    bill_id TEXT,
    change_type VARCHAR(50) NOT NULL, -- 'inward_entry', 'dispatch_sale', 'adjustment', 'audit_reconciliation'
    quantity_delta NUMERIC(12, 3) NOT NULL,
    previous_quantity NUMERIC(12, 3) NOT NULL,
    new_quantity NUMERIC(12, 3) NOT NULL,
    reason TEXT,
    recorded_by VARCHAR(100) NOT NULL DEFAULT 'Yard Admin',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES live_stock(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_history_stock_id ON stock_history(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_bill_id ON stock_history(bill_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at);
