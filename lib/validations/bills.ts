import { z } from 'zod';
import { APPROVED_BRANDS } from '@/lib/constants/brands';

const APPROVED_BRAND_IDS = [
  'tata-tiscon',
  'suryadev',
  'agni',
  'ssi',
  'chakraa',
] as const;

const SUPPORTED_DIAMETERS = [8, 10, 12, 16, 20, 25] as const;

export const DOCUMENT_TYPES = [
  'supplier_invoice',
  'weighment_slip',
  'delivery_challan',
  'mill_test_certificate',
  'internal_note_doc',
] as const;

export const PAYMENT_STATUSES = ['unpaid', 'partially_paid', 'paid'] as const;

/**
 * Zod schema for inward bill and associated stock lot creation
 */
export const createInwardBillSchema = z.object({
  billNumber: z
    .string()
    .trim()
    .min(2, 'Bill/Invoice number must be at least 2 characters')
    .max(100, 'Bill number exceeds 100 characters'),
  billDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Bill date must be in YYYY-MM-DD format'),
  supplier: z
    .string()
    .trim()
    .min(2, 'Supplier name must be at least 2 characters')
    .max(255, 'Supplier name exceeds 255 characters'),
  vehicleNo: z.string().trim().max(100).optional().nullable(),
  brandId: z.enum(APPROVED_BRAND_IDS, {
    message: 'Brand must be one of: TATA TISCON, SURYADEV, AGNI, SSI TMT, JPR',
  }),
  diameterMm: z.number().refine(
    (val) => (SUPPORTED_DIAMETERS as readonly number[]).includes(val),
    {
      message: 'Diameter must be one of: 8, 10, 12, 16, 20, 25 mm',
    }
  ),
  grade: z.string().trim().default('Fe 550D'),
  quantityKg: z
    .number()
    .positive('Quantity must be greater than zero')
    .refine((val) => {
      const parts = val.toString().split('.');
      return parts.length < 2 || parts[1].length <= 3;
    }, 'Quantity in kg cannot exceed 3 decimal places'),
  ratePerKg: z
    .number()
    .positive('Rate per kg must be greater than zero')
    .refine((val) => {
      const parts = val.toString().split('.');
      return parts.length < 2 || parts[1].length <= 2;
    }, 'Rate cannot exceed 2 decimal places'),
  taxRatePercent: z.number().min(0).max(100).default(18.0),
  paymentStatus: z.enum(PAYMENT_STATUSES).default('paid'),
  location: z.string().trim().default('Salem Main Yard'),
  bayNumber: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  idempotencyKey: z.string().trim().max(120).optional().nullable(),
});

export type CreateInwardBillInput = z.infer<typeof createInwardBillSchema>;

/**
 * Permitted metadata updates for existing bills (preserves historical stock audit)
 */
export const updateBillMetadataSchema = z.object({
  vehicleNo: z.string().trim().max(100).optional().nullable(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  isArchived: z.boolean().optional(),
});

export type UpdateBillMetadataInput = z.infer<typeof updateBillMetadataSchema>;

/**
 * Validation schema for document metadata
 */
export const documentUploadSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES, {
    message: 'Invalid document type',
  }),
  originalFilename: z.string().min(1).max(255),
  fileSizeBytes: z.number().positive().max(10 * 1024 * 1024, 'File size exceeds 10MB limit'),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
