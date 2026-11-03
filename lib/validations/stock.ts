import { z } from 'zod';

export const APPROVED_BRAND_IDS = [
  'tata-tiscon',
  'suryadev',
  'agni',
  'ssi',
  'chakraa',
] as const;

export const APPROVED_BRAND_NAMES = [
  'TATA TISCON',
  'SURYADEV',
  'AGNI',
  'SSI TMT',
  'JPR',
  'CHAKRAA TMT',
] as const;

export const SUPPORTED_DIAMETERS = [8, 10, 12, 16, 20, 25] as const;

export const STOCK_STATUSES = ['in_stock', 'low_stock', 'out_of_stock'] as const;

export const MOVEMENT_TYPES = [
  'initial_entry',
  'inward_receipt',
  'dispatch_sale',
  'yard_adjustment',
  'audit_reconciliation',
] as const;

/**
 * Validates maximum 3 decimal places for precision kilograms
 */
const kgQuantitySchema = z
  .number()
  .refine((val) => Number.isFinite(val), 'Quantity must be a finite number')
  .refine(
    (val) => {
      // Check precision up to 3 decimals
      const str = val.toString();
      if (!str.includes('.')) return true;
      const decimals = str.split('.')[1].length;
      return decimals <= 3;
    },
    { message: 'Quantity in kg cannot exceed 3 decimal places' }
  );

/**
 * Schema for creating a new Stock Lot (Admin)
 */
export const createStockLotSchema = z.object({
  brandId: z.string().min(1, 'Brand is required'),
  diameterMm: z
    .number()
    .int('Diameter must be an integer')
    .refine((val) => (SUPPORTED_DIAMETERS as readonly number[]).includes(val), {
      message: 'Diameter must be one of: 8, 10, 12, 16, 20, 25 mm',
    }),
  grade: z.string().min(2, 'Grade is required').default('Fe 550D'),
  quantityKg: kgQuantitySchema.min(0, 'Quantity cannot be negative'),
  location: z.string().min(2, 'Yard location is required').default('Salem Main Yard'),
  bayNumber: z.string().optional().nullable(),
  mfgBatchNo: z.string().optional().nullable(),
  reason: z.string().min(3, 'Audit reason is required for inventory entry'),
  referenceNo: z.string().optional().nullable(),
  idempotencyKey: z.string().max(120).optional().nullable(),
});

export type CreateStockLotInput = z.infer<typeof createStockLotSchema>;

/**
 * Schema for adjusting stock quantity on an existing lot (Admin)
 */
export const adjustStockLotSchema = z.object({
  adjustmentType: z.enum(['set', 'add', 'subtract']),
  quantityKg: kgQuantitySchema.min(0, 'Adjustment quantity must be non-negative'),
  reason: z.string().min(3, 'Audit reason is required for inventory adjustment'),
  movementType: z.enum(MOVEMENT_TYPES).default('yard_adjustment'),
  referenceNo: z.string().optional().nullable(),
  idempotencyKey: z.string().max(120).optional().nullable(),
});

export type AdjustStockLotInput = z.infer<typeof adjustStockLotSchema>;

/**
 * Schema for public stock query parameters
 */
export const publicStockQuerySchema = z.object({
  brand: z.string().optional(),
  diameter: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (SUPPORTED_DIAMETERS as readonly number[]).includes(val), {
      message: 'Invalid diameter filter',
    }),
  status: z
    .string()
    .optional()
    .refine((val) => val === undefined || val === 'all' || (STOCK_STATUSES as readonly string[]).includes(val), {
      message: 'Invalid status filter',
    }),
  search: z.string().max(100).optional(),
});

export type PublicStockQueryParams = z.infer<typeof publicStockQuerySchema>;
