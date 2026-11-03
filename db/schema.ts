/**
 * Thirupathi Steels - Authoritative Database Schema Definitions
 * Storage unit: Kilograms (kg) with precision NUMERIC(14, 3)
 * Status thresholds:
 *   - out_of_stock: quantity_kg <= 0
 *   - low_stock:    0 < quantity_kg <= 1500
 *   - in_stock:     quantity_kg > 1500
 */

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'incoming';

export type StockMovementType =
  | 'initial_entry'
  | 'inward_receipt'
  | 'dispatch_sale'
  | 'yard_adjustment'
  | 'audit_reconciliation';

export interface Product {
  id: string;
  name: string;
  category: string;
  grade: string;
  brand: string;
  unit: string;
  description: string | null;
  image: string | null;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface NewProduct {
  id?: string;
  name: string;
  category: string;
  grade: string;
  brand: string;
  unit?: string;
  description?: string | null;
  image?: string | null;
  is_active?: number | boolean;
}

export type DocumentType =
  | 'supplier_invoice'
  | 'weighment_slip'
  | 'delivery_challan'
  | 'mill_test_certificate'
  | 'internal_note_doc';

export interface BillDocument {
  id: string;
  bill_id: string;
  document_type: DocumentType;
  original_filename: string;
  storage_filename: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  file_hash_sha256: string;
  uploaded_by_id?: string | null;
  uploaded_by_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  bill_date: string;
  supplier: string;
  vehicle_no?: string | null;
  quantity_kg: number;
  rate_per_kg?: number | null;
  subtotal_amount?: number | null;
  tax_rate_percent?: number | null;
  tax_amount?: number | null;
  total_amount?: number | null;
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  stock_lot_id?: string | null;
  stock_movement_id?: string | null;
  image_url?: string | null;
  notes?: string | null;
  is_archived: boolean;
  created_by_id?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillWithDetails extends Bill {
  brand_name?: string;
  diameter_mm?: number;
  grade?: string;
  lot_number?: string;
  documents?: BillDocument[];
}

export interface NewBill {
  id?: string;
  bill_number: string;
  bill_date: string;
  supplier: string;
  vehicle_no?: string | null;
  quantity_kg: number;
  rate_per_kg?: number | null;
  subtotal_amount?: number | null;
  tax_rate_percent?: number | null;
  tax_amount?: number | null;
  total_amount?: number | null;
  payment_status?: 'unpaid' | 'partially_paid' | 'paid';
  stock_lot_id?: string | null;
  stock_movement_id?: string | null;
  image_url?: string | null;
  notes?: string | null;
}

// 1. Approved Brand Model
export interface Brand {
  id: string; // 'tata-tiscon' | 'suryadev' | 'agni' | 'ssi' | 'chakraa'
  name: string;
  category: 'Primary Steel' | 'Secondary Steel';
  tagline?: string | null;
  description?: string | null;
  features?: string | string[] | null;
  logo?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface NewBrand {
  id?: string;
  name: string;
  category: 'Primary Steel' | 'Secondary Steel';
  tagline?: string | null;
  description?: string | null;
  features?: string | string[] | null;
  logo?: string | null;
  is_active?: boolean;
  display_order?: number;
}

// 2. Supported Diameter Model
export interface Diameter {
  id: string; // 'd-8mm' | 'd-10mm' | 'd-12mm' | 'd-16mm' | 'd-20mm' | 'd-25mm'
  diameter_mm: number; // 8, 10, 12, 16, 20, 25
  weight_kg_per_meter: number;
  primary_use?: string | null;
  description?: string | null;
  image?: string | null;
  standard_grades?: string | null;
  key_applications?: string | string[] | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

export interface NewDiameter {
  id?: string;
  diameter_mm: number;
  weight_kg_per_meter: number;
  primary_use?: string | null;
  description?: string | null;
  image?: string | null;
  standard_grades?: string | null;
  key_applications?: string | string[] | null;
  is_active?: boolean;
  display_order?: number;
}

// 2.5 Gallery Image Model
export interface GalleryImage {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewGalleryImage {
  id?: string;
  title: string;
  category?: string;
  image_url: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
}

// 3. Stock Lot Model (Stored strictly in Kilograms)
export interface StockLot {
  id: string;
  lot_number: string;
  brand_id: string;
  diameter_id: string;
  grade: string; // e.g. 'Fe 550D'
  quantity_kg: number;
  location: string;
  bay_number?: string | null;
  mfg_batch_no?: string | null;
  stock_status: StockStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 4. Stock Movement Audit Model
export interface StockMovement {
  id: string;
  lot_id: string;
  movement_type: StockMovementType;
  quantity_delta_kg: number;
  previous_quantity_kg: number;
  new_quantity_kg: number;
  reason: string;
  reference_no?: string | null;
  idempotency_key?: string | null;
  performed_by: string;
  performed_by_id?: string | null;
  created_at: string;
}

// 5. Admin User Model
export interface AdminUser {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'yard_manager';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 6. Public Customer-Facing Stock Lot View (STRICTLY PRIVACY-SAFE)
// Excludes supplier, purchase price, raw invoices, internal tickets
export interface PublicStockLot {
  id: string;
  lot_number: string;
  brand_id: string;
  brand_name: string;
  brand_category: string;
  diameter_id: string;
  diameter_mm: number;
  grade: string;
  quantity_kg: number;
  quantity_mt: number; // Convenient formatted metric tonnage (kg / 1000)
  location: string;
  bay_number?: string | null;
  stock_status: StockStatus;
  last_updated: string;
}

// 7. Backward compatibility types for existing components
export type StockChangeType = StockMovementType;

export interface LiveStockItem {
  id: string;
  product_id: string;
  quantity: number;
  unit: string;
  location: string;
  stock_status: StockStatus;
  last_bill_id: string | null;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface LiveStockWithDetails extends LiveStockItem {
  product_name: string;
  category: string;
  grade: string;
  brand: string;
  product_image: string | null;
  bill_number: string | null;
  bill_supplier: string | null;
  bill_image_url: string | null;
  bill_date: string | null;
  diameter_mm?: number;
  quantity_kg?: number;
  bay_number?: string | null;
}

export interface StockHistoryEntry {
  id: string;
  stock_id: string;
  product_id: string;
  bill_id: string | null;
  change_type: StockChangeType;
  quantity_delta: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  recorded_by: string;
  created_at: string;
}
