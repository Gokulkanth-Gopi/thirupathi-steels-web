import {
  getAllYardBaysRaw,
  getYardBayById,
  createYardBay,
  updateYardBay,
  deleteYardBay,
  getYardBaysData,
} from '@/lib/db/stock';

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

async function runYardBaysIntegrationTests() {
  console.log('====================================================');
  console.log('🏗️ INTEGRATION TESTS: YARD BAYS EDITABLE ARCHITECTURE');
  console.log('====================================================\n');

  try {
    // 1. Fetch initial bays
    console.log('--- 1. RETRIEVE YARD BAYS ---');
    const initialBays = await getAllYardBaysRaw();
    assert(initialBays.length >= 8, `Initial yard bays count >= 8 (found ${initialBays.length})`);

    const bayA1 = await getYardBayById('bay-a1');
    assert(bayA1 !== null, 'Bay A-1 found by ID');
    assert(bayA1?.bay_code === 'Bay A-1', 'Bay A-1 has correct bay_code');

    // 2. Create new dynamic bay
    console.log('\n--- 2. CREATE NEW YARD BAY ---');
    const testBayCode = `TEST-BAY-${Date.now().toString(36).toUpperCase()}`;
    const newBay = await createYardBay({
      bayCode: testBayCode,
      name: 'Automated Test Staging Bay',
      section: 'Section F (Testing Berth)',
      primaryDiameters: [12, 16, 20],
      maxCapacityMt: 55.5,
      displayOrder: 99,
      isActive: true,
      notes: 'Temporary integration test bay berth',
    });

    assert(newBay.bay_code === testBayCode, 'New bay created with matching bay_code');
    assert(Number(newBay.max_capacity_mt) === 55.5, 'New bay stored correct capacity in MT');
    assert(newBay.primary_diameters === '12,16,20', 'New bay stored primary diameters');

    // 3. Update dynamic bay
    console.log('\n--- 3. UPDATE YARD BAY CAPACITIES & METADATA ---');
    const updated = await updateYardBay(newBay.id, {
      name: 'Updated Staging Bay Berth',
      maxCapacityMt: 70.0,
      primaryDiameters: [8, 10, 12, 16],
      notes: 'Upgraded to 70 MT capacity with gantry crane berth',
    });

    assert(updated.name === 'Updated Staging Bay Berth', 'Bay name updated successfully');
    assert(Number(updated.max_capacity_mt) === 70.0, 'Bay capacity updated to 70 MT');
    assert(updated.primary_diameters === '8,10,12,16', 'Bay primary diameters updated to 8,10,12,16');

    // 4. Verify yard capacity recalculation in getYardBaysData
    console.log('\n--- 4. DYNAMIC YARD MAP & OVERALL CAPACITY CALCULATION ---');
    const yardData = await getYardBaysData();
    const foundInYard = yardData.bays.find((b) => b.bay_id === newBay.id);
    assert(foundInYard !== undefined, 'New bay is included in getYardBaysData');
    assert(foundInYard?.max_capacity_mt === 70.0, 'Max capacity reflected dynamically in yard data');
    assert(
      Array.isArray(foundInYard?.primary_diameters) && foundInYard?.primary_diameters.includes(8),
      'Parsed diameters array contains 8mm'
    );
    assert(yardData.totalCapacityMt >= 70, 'Overall yard total capacity dynamically includes new bay');

    // 5. Delete test bay
    console.log('\n--- 5. SAFE DELETION OF YARD BAY ---');
    const deleteResult = await deleteYardBay(newBay.id);
    assert(deleteResult.success === true, 'Test bay deleted successfully');

    const verifyDeleted = await getYardBayById(newBay.id);
    assert(verifyDeleted === null, 'Deleted bay is no longer returned by query');

    console.log('\n====================================================');
    console.log(`📊 YARD BAYS INTEGRATION: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Unhandled error in yard bays integration tests:', err);
    process.exitCode = 1;
  }
}

runYardBaysIntegrationTests();

