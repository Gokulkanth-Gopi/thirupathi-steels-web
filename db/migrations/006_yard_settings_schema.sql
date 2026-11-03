-- ============================================================================
-- Migration: 006_yard_settings_schema.sql
-- Description: Dynamic Yard Settings configuration schema
-- Allows yard administrators to dynamically edit operational parameters,
-- low stock alert thresholds, weighbridge status, and yard contact details.
-- ============================================================================

CREATE TABLE IF NOT EXISTS yard_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    label VARCHAR(200),
    category VARCHAR(50) DEFAULT 'operational',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default settings if not already present
INSERT INTO yard_settings (key, value, label, category) VALUES
('yard_name', 'Thirupathi Steels', 'Yard Facility Name', 'general'),
('yard_location', 'T.S. No: 153/3-A, Chennai Bye Pass Road, Seelanaickenpatti, Salem – 636 201, Tamil Nadu', 'Physical Address & Route', 'general'),
('phone_primary', '+91 90034 61089', 'Primary Dispatch Desk Phone', 'contact'),
('phone_secondary', '+91 95973 90271', 'Weighbridge & Sales Inquiries', 'contact'),
('whatsapp_number', '919003461089', 'WhatsApp Instant Quote Desk', 'contact'),
('gstin', '33AAHFT1872C1ZF', 'Authoritative GSTIN Registration', 'compliance'),
('operating_hours', 'Monday – Saturday: 8:30 AM – 7:30 PM (Sunday: On-Call)', 'Standard Yard Operating Hours', 'operational'),
('low_stock_threshold_kg', '1500', 'Low Stock Alert Threshold (kg)', 'operational'),
('unit_of_storage', 'Kilograms (kg)', 'Primary Authoritative Storage Unit', 'operational'),
('weighbridge_gate', 'Gate 1 (Electronic Computerized Weighbridge)', 'Primary Weighbridge Name', 'weighbridge'),
('weighbridge_status', 'Calibrated & Operational', 'Weighbridge Operational Status', 'weighbridge'),
('dispatch_notes', 'Direct arterial highway access along Chennai Bye Pass for trailer flatbeds with instant computerized tare/gross printouts.', 'Dispatch & Freight Instructions', 'operational')
ON CONFLICT (key) DO NOTHING;
