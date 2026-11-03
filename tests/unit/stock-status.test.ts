import { calculateStockStatus } from '../../lib/db/stock';
import {
  createStockLotSchema,
  adjustStockLotSchema,
  APPROVED_BRAND_IDS,
  SUPPORTED_DIAMETERS,
} from '../../lib/validations/stock';

/**
 * Unit Test Suite for Stock Status Thresholds & Validation Logic
 */
async function runUnitTests() {
  console.log('====================================================');
  console.log('🧪 UNIT TESTS: STOCK STATUS THRESHOLDS & VALIDATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
    }
  }

  // 1. Boundary Tests for calculateStockStatus (Kilograms)
  console.log('--- 1. STOCK STATUS BOUNDARY TESTS (KG) ---');
  // OUT OF STOCK (<= 0)
  assert('Negative quantity (-500 kg) is out_of_stock', calculateStockStatus(-500) === 'out_of_stock');
  assert('Small negative (-0.001 kg) is out_of_stock', calculateStockStatus(-0.001) === 'out_of_stock');
  assert('Exact zero (0 kg) is out_of_stock', calculateStockStatus(0) === 'out_of_stock');
  assert('NaN input is out_of_stock', calculateStockStatus(NaN) === 'out_of_stock');

  // LOW STOCK (0 < qty <= 1500 kg)
  assert('Tiny positive (0.001 kg) is low_stock', calculateStockStatus(0.001) === 'low_stock');
  assert('1 kg is low_stock', calculateStockStatus(1) === 'low_stock');
  assert('500 kg is low_stock', calculateStockStatus(500) === 'low_stock');
  assert('1499.999 kg is low_stock', calculateStockStatus(1499.999) === 'low_stock');
  assert('Boundary 1500 kg exactly is low_stock', calculateStockStatus(1500) === 'low_stock');

  // IN STOCK (> 1500 kg)
  assert('Boundary 1500.001 kg is in_stock', calculateStockStatus(1500.001) === 'in_stock');
  assert('1501 kg is in_stock', calculateStockStatus(1501) === 'in_stock');
  assert('5000 kg is in_stock', calculateStockStatus(5000) === 'in_stock');
  assert('Large commercial load 48,500 kg is in_stock', calculateStockStatus(48500) === 'in_stock');

  // 2. Validation Schema Tests
  console.log('\n--- 2. ZOD VALIDATION SCHEMA TESTS ---');
  // Valid stock lot creation
  const validLot = createStockLotSchema.safeParse({
    brandId: 'tata-tiscon',
    diameterMm: 12,
    grade: 'Fe 550D',
    quantityKg: 2500.5,
    location: 'Salem Main Yard',
    reason: 'New inward trailer arrival',
  });
  assert('Valid lot input parses successfully', validLot.success);

  // Negative quantity rejected
  const negativeLot = createStockLotSchema.safeParse({
    brandId: 'tata-tiscon',
    diameterMm: 12,
    quantityKg: -10,
    reason: 'Invalid entry',
  });
  assert('Negative quantity rejected', !negativeLot.success);

  // Decimal precision beyond 3 places rejected
  const excessPrecisionLot = createStockLotSchema.safeParse({
    brandId: 'tata-tiscon',
    diameterMm: 12,
    quantityKg: 100.1234, // 4 decimal places
    reason: 'Too many decimals',
  });
  assert('Precision > 3 decimal places rejected', !excessPrecisionLot.success);

  // Unapproved diameter rejected
  const invalidDiameter = createStockLotSchema.safeParse({
    brandId: 'tata-tiscon',
    diameterMm: 14, // 14mm is not in 8, 10, 12, 16, 20, 25
    quantityKg: 1000,
    reason: 'Non-standard rebar size',
  });
  assert('Unapproved diameter (14mm) rejected', !invalidDiameter.success);

  // Approved diameters verification
  assert('Approved brand IDs contains exactly 5 brands', APPROVED_BRAND_IDS.length === 5);
  assert('Supported diameters contains exactly 6 sizes', SUPPORTED_DIAMETERS.length === 6);

  // Stock adjustment schema
  const validAdjustment = adjustStockLotSchema.safeParse({
    adjustmentType: 'add',
    quantityKg: 1200,
    reason: 'Partial consignment unloading',
  });
  assert('Valid stock adjustment parses successfully', validAdjustment.success);

  const invalidAdjustment = adjustStockLotSchema.safeParse({
    adjustmentType: 'multiply', // Invalid enum
    quantityKg: 1200,
    reason: 'Invalid',
  });
  assert('Invalid adjustment type rejected', !invalidAdjustment.success);

  console.log('\n====================================================');
  console.log(`📊 UNIT TEST SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runUnitTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
