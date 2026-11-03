import { getYardSettings, updateYardSettings, DEFAULT_YARD_SETTINGS } from '@/lib/db/settings';
import { createYardBay, getYardBayById, deleteYardBay, getAllYardBaysRaw } from '@/lib/db/stock';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function runYardSettingsIntegrationTests() {
  console.log('====================================================');
  console.log('⚙️ INTEGRATION TESTS: YARD SETTINGS & BAY TABLE DATA');
  console.log('====================================================\n');

  try {
    // 1. Fetch initial yard settings
    console.log('--- 1. RETRIEVE YARD OPERATIONAL SETTINGS ---');
    const initialSettings = await getYardSettings();
    assert(initialSettings !== null, 'Yard settings retrieved from PostgreSQL');
    assert(typeof initialSettings.yard_name === 'string' && initialSettings.yard_name.length > 0, 'Yard name exists');
    assert(typeof initialSettings.low_stock_threshold_kg === 'number', 'Low stock threshold is numeric');
    assert(initialSettings.low_stock_threshold_kg > 0, 'Low stock threshold is positive');

    // 2. Update yard operational settings
    console.log('\n--- 2. UPDATE YARD OPERATIONAL SETTINGS IN POSTGRESQL ---');
    const updated = await updateYardSettings({
      yard_name: 'Thirupathi Steels Salem Hub',
      low_stock_threshold_kg: 2000,
      weighbridge_status: 'Routine Sensor Calibration Pending',
    });

    assert(updated.yard_name === 'Thirupathi Steels Salem Hub', 'Yard name updated successfully');
    assert(updated.low_stock_threshold_kg === 2000, 'Low stock threshold updated to 2000 kg');
    assert(updated.weighbridge_status === 'Routine Sensor Calibration Pending', 'Weighbridge status updated');

    // Verify persistence
    const reFetched = await getYardSettings();
    assert(reFetched.yard_name === 'Thirupathi Steels Salem Hub', 'Updated yard name persisted in PostgreSQL');
    assert(reFetched.low_stock_threshold_kg === 2000, 'Updated threshold persisted in PostgreSQL');

    // Restore to default
    await updateYardSettings({
      yard_name: DEFAULT_YARD_SETTINGS.yard_name,
      low_stock_threshold_kg: DEFAULT_YARD_SETTINGS.low_stock_threshold_kg,
      weighbridge_status: DEFAULT_YARD_SETTINGS.weighbridge_status,
    });
    console.log('  ℹ️  Restored original yard operational parameters');

    // 3. Yard Bay Table Data Creation & Deletion
    console.log('\n--- 3. YARD BAY TABLE CREATION & DELETION INTEGRITY ---');
    const testCode = `TBL-${Date.now().toString(36).toUpperCase()}`;
    const newBay = await createYardBay({
      bayCode: testCode,
      name: 'Table Data Berth Test',
      section: 'Section T (Table)',
      primaryDiameters: [12, 16],
      maxCapacityMt: 40,
      displayOrder: 99,
      isActive: true,
      notes: 'Testing table deletion',
    });

    assert(newBay.bay_code === testCode, 'New bay created for table data test');

    const allBays = await getAllYardBaysRaw();
    const foundInTable = allBays.find((b) => b.id === newBay.id);
    assert(foundInTable !== undefined, 'New bay exists in database table query');

    // Delete bay from table data
    const deleteRes = await deleteYardBay(newBay.id);
    assert(deleteRes.success === true, 'Bay deleted from database table');

    const verifyDeleted = await getYardBayById(newBay.id);
    assert(verifyDeleted === null, 'Bay record completely removed from yard_bays');

    console.log('\n====================================================');
    console.log(`📊 YARD SETTINGS INTEGRATION: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Unhandled error in yard settings tests:', err);
    process.exitCode = 1;
  }
}

runYardSettingsIntegrationTests();
