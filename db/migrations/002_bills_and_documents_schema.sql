-- ============================================================================
-- Migration: 002_bills_and_documents_schema.sql
-- Description: Bill and Document Management System Schema for Thirupathi Steels
-- Associates bills with physical stock lots, movements, financial amounts,
-- and private document metadata.
-- ============================================================================

-- 1. Extend existing bills table with stock linkage & financial breakdown
ALTER TABLE bills ADD COLUMN IF NOT EXISTS stock_lot_id TEXT REFERENCES stock_lots(id) ON DELETE SET NULL;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS stock_movement_id TEXT REFERENCES stock_movements(id) ON DELETE SET NULL;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS vehicle_no VARCHAR(100);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS quantity_kg NUMERIC(14, 3) NOT NULL DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS rate_per_kg NUMERIC(12, 2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(14, 2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS tax_rate_percent NUMERIC(5, 2) DEFAULT 18.00;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(14, 2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'paid';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100) DEFAULT 'Salem Yard Admin';

-- Make image_url nullable for backward compatibility since documents are stored in bill_documents
ALTER TABLE bills ALTER COLUMN image_url DROP NOT NULL;

-- Indexes for bills
CREATE INDEX IF NOT EXISTS idx_bills_stock_lot ON bills(stock_lot_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_supplier ON bills(supplier);
CREATE INDEX IF NOT EXISTS idx_bills_archived ON bills(is_archived);

-- 2. Bill Documents Table (Private document uploads metadata)
CREATE TABLE IF NOT EXISTS bill_documents (
    id TEXT PRIMARY KEY,
    bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'supplier_invoice', 'weighment_slip', 'delivery_challan', 'mill_test_certificate', 'internal_note_doc'
    original_filename VARCHAR(255) NOT NULL,
    storage_filename VARCHAR(255) NOT NULL UNIQUE,
    storage_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_hash_sha256 VARCHAR(64) NOT NULL,
    uploaded_by_id TEXT,
    uploaded_by_name VARCHAR(100) NOT NULL DEFAULT 'Salem Yard Admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bill_docs_bill_id ON bill_documents(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_docs_type ON bill_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_bill_docs_active ON bill_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_bill_docs_created ON bill_documents(created_at);
