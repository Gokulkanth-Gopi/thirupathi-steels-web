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
    // 0. Ensure baseline 8 standard bays exist
    const standardBays = [
      { id: 'bay-a1', bay_code: 'Bay A-1', name: 'Primary Column & Footing Stacking', section: 'Section A (Heavy Rebars)', primary_diameters: '12,16', max_capacity_mt: 60, display_order: 1, is_active: true, notes: 'Gantry 1 Heavy Overhead Crane Access' },
      { id: 'bay-a2', bay_code: 'Bay A-2', name: 'High-Rise Beam & Transfer Girder Stacking', section: 'Section A (Heavy Rebars)', primary_diameters: '16,20', max_capacity_mt: 50, display_order: 2, is_active: true, notes: 'Direct Trailer Loading Bay' },
      { id: 'bay-b1', bay_code: 'Bay B-1', name: 'Residential Slab & Staircase Stacking', section: 'Section B (Medium Rebars)', primary_diameters: '10', max_capacity_mt: 40, display_order: 3, is_active: true, notes: 'High Turnover Residential Fast Track' },
      { id: 'bay-b2', bay_code: 'Bay B-2', name: 'Raft Foundation & Pier Stacking', section: 'Section B (Medium Rebars)', primary_diameters: '20', max_capacity_mt: 40, display_order: 4, is_active: true, notes: 'Heavy Infrastructure Ground Berth' },
      { id: 'bay-c1', bay_code: 'Bay C-1', name: 'Lateral Ties & Beam Stirrup Bundles', section: 'Section C (Stirrup & Coils)', primary_diameters: '8', max_capacity_mt: 30, display_order: 5, is_active: true, notes: 'Adjacent to Cut & Bend Workshop' },
      { id: 'bay-c2', bay_code: 'Bay C-2', name: 'Specialized 20mm & Secondary Coils', section: 'Section C (Stirrup & Coils)', primary_diameters: '8,20', max_capacity_mt: 30, display_order: 6, is_active: true, notes: 'Dual Diameter Secondary Staging' },
      { id: 'bay-d1', bay_code: 'Bay D-1', name: 'Civil Infrastructure & Bridge Cores', section: 'Section D (Infrastructure)', primary_diameters: '25', max_capacity_mt: 35, display_order: 7, is_active: true, notes: 'Certified Infrastructure Lot Berth' },
      { id: 'bay-e1', bay_code: 'Bay E-1', name: 'Secondary & Commercial Fe 550D Rebars', section: 'Section E (Commercial Lots)', primary_diameters: '10,12,16', max_capacity_mt: 45, display_order: 8, is_active: true, notes: 'Secondary Commercial Inward Depot' },
    ];
    for (const b of standardBays) {
      const existing = (await getYardBayById(b.id)) || (await getYardBayById(b.bay_code));
      if (!existing) {
        await createYardBay({
          bayCode: b.bay_code,
          name: b.name,
          section: b.section,
          primaryDiameters: b.primary_diameters.split(',').map(Number),
          maxCapacityMt: b.max_capacity_mt,
          displayOrder: b.display_order,
          isActive: b.is_active,
          notes: b.notes,
        });
      }
    }

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

