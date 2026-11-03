-- ============================================================================
-- Migration: 005_yard_bays_schema.sql
-- Description: Dynamic Yard Bays & Slots configuration schema
-- Allows yard administrators to dynamically add, edit, reallocate, and configure
-- rebar storage bays and maximum capacity in Metric Tonnes (MT).
-- ============================================================================

CREATE TABLE IF NOT EXISTS yard_bays (
    id VARCHAR(50) PRIMARY KEY,
    bay_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    section VARCHAR(100) NOT NULL,
    primary_diameters VARCHAR(100) NOT NULL DEFAULT '',
    max_capacity_mt NUMERIC(10, 2) NOT NULL DEFAULT 45.00,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_yard_bays_code ON yard_bays(bay_code);
CREATE INDEX IF NOT EXISTS idx_yard_bays_is_active ON yard_bays(is_active);

-- Seed standard 8 Salem yard bays if not already present
INSERT INTO yard_bays (id, bay_code, name, section, primary_diameters, max_capacity_mt, display_order, is_active, notes) VALUES
('bay-a1', 'Bay A-1', 'Primary Column & Footing Stacking', 'Section A (Heavy Rebars)', '12,16', 60.00, 1, TRUE, 'Gantry 1 Heavy Overhead Crane Access'),
('bay-a2', 'Bay A-2', 'High-Rise Beam & Transfer Girder Stacking', 'Section A (Heavy Rebars)', '16,20', 50.00, 2, TRUE, 'Direct Trailer Loading Bay'),
('bay-b1', 'Bay B-1', 'Residential Slab & Staircase Stacking', 'Section B (Medium Rebars)', '10', 40.00, 3, TRUE, 'High Turnover Residential Fast Track'),
('bay-b2', 'Bay B-2', 'Raft Foundation & Pier Stacking', 'Section B (Medium Rebars)', '20', 40.00, 4, TRUE, 'Heavy Infrastructure Ground Berth'),
('bay-c1', 'Bay C-1', 'Lateral Ties & Beam Stirrup Bundles', 'Section C (Stirrup & Coils)', '8', 30.00, 5, TRUE, 'Adjacent to Cut & Bend Workshop'),
('bay-c2', 'Bay C-2', 'Specialized 20mm & Secondary Coils', 'Section C (Stirrup & Coils)', '8,20', 30.00, 6, TRUE, 'Dual Diameter Secondary Staging'),
('bay-d1', 'Bay D-1', 'Civil Infrastructure & Bridge Cores', 'Section D (Infrastructure)', '25', 35.00, 7, TRUE, 'Certified Infrastructure Lot Berth'),
('bay-e1', 'Bay E-1', 'Secondary & Commercial Fe 550D Rebars', 'Section E (Commercial Lots)', '10,12,16', 45.00, 8, TRUE, 'Secondary Commercial Inward Depot')
ON CONFLICT (id) DO NOTHING;

