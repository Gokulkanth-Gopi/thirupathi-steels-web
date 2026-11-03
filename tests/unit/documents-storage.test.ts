import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
  validateMagicBytes,
  generateSafeStorageFilename,
  calculateSha256,
  processAndStoreDocument,
  removeStoredFile,
  PRIVATE_STORAGE_DIR,
  MAX_FILE_SIZE_BYTES,
} from '../../lib/documents/storage';
import { calculateFinancials } from '../../lib/db/bills';

async function runStorageUnitTests() {
  console.log('====================================================');
  console.log('🧪 UNIT TESTS: SECURE DOCUMENT STORAGE & SHARP');
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

  // 1. Magic Bytes Validation
  console.log('--- 1. MAGIC BYTES & SIGNATURE VALIDATION ---');
  // JPEG: FF D8 FF
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
  const jpegCheck = validateMagicBytes(jpegHeader);
  assert('JPEG signature correctly identified', jpegCheck.isValid && jpegCheck.detectedMimeType === 'image/jpeg');

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const pngCheck = validateMagicBytes(pngHeader);
  assert('PNG signature correctly identified', pngCheck.isValid && pngCheck.detectedMimeType === 'image/png');

  // WebP: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
  const webpHeader = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]);
  const webpCheck = validateMagicBytes(webpHeader);
  assert('WebP signature correctly identified', webpCheck.isValid && webpCheck.detectedMimeType === 'image/webp');

  // PDF: %PDF- (25 50 44 46 2D)
  const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
  const pdfCheck = validateMagicBytes(pdfHeader);
  assert('PDF signature correctly identified', pdfCheck.isValid && pdfCheck.detectedMimeType === 'application/pdf');

  // Fake disguised executable (.exe disguised as .jpg)
  const fakeHeader = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ dos executable
  const fakeCheck = validateMagicBytes(fakeHeader);
  assert('Disguised executable is rejected by signature check', !fakeCheck.isValid);

  // Buffer too small
  const tinyBuffer = Buffer.from([0x01, 0x02]);
  assert('Tiny buffer (<8 bytes) is rejected', !validateMagicBytes(tinyBuffer).isValid);

  // 2. Safe Filename Generation & Path Traversal Prevention
  console.log('\n--- 2. SAFE FILENAME GENERATION & PATH TRAVERSAL ---');
  const safeName1 = generateSafeStorageFilename('.jpg');
  const safeName2 = generateSafeStorageFilename('pdf');
  assert('Generated filename starts with doc_', safeName1.startsWith('doc_') && safeName2.startsWith('doc_'));
  assert('Generated filename preserves extension', safeName1.endsWith('.jpg') && safeName2.endsWith('.pdf'));
  assert('Two generated names are unique', safeName1 !== safeName2);

  // Ensure path stays inside PRIVATE_STORAGE_DIR
  const testPath = path.join(PRIVATE_STORAGE_DIR, safeName1);
  assert('Storage path resolves inside private uploads directory', testPath.startsWith(path.resolve(PRIVATE_STORAGE_DIR)));

  // 3. Financial Calculation Exactness
  console.log('\n--- 3. FINANCIAL CALCULATIONS & EXACTNESS ---');
  // Scenario A: 10,000 kg @ Rs 50.00/kg, 18% GST
  const calc1 = calculateFinancials(10000, 50.0, 18.0);
  assert('Subtotal is exact 500,000.00', calc1.subtotalAmount === 500000);
  assert('Tax is exact 90,000.00', calc1.taxAmount === 90000);
  assert('Total is exact 590,000.00', calc1.totalAmount === 590000);

  // Scenario B: Fractional amounts (e.g. 1,234.567 kg @ 58.75/kg)
  const calc2 = calculateFinancials(1234.567, 58.75, 18.0);
  // 1234.567 * 58.75 = 72,530.81125 -> 72,530.81
  assert('Subtotal rounds correctly to 2 decimal places', calc2.subtotalAmount === 72530.81);
  // 72530.81 * 0.18 = 13055.5458 -> 13,055.55
  assert('Tax amount rounds correctly to 2 decimal places', calc2.taxAmount === 13055.55);
  // Total = 72,530.81 + 13,055.55 = 85,586.36
  assert('Total equals sum of rounded subtotal and tax', calc2.totalAmount === 85586.36);

  // 4. Sharp Image Processing & PDF Bypass
  console.log('\n--- 4. SHARP IMAGE PROCESSING & PDF BYPASS ---');
  // Create a synthetic 100x100 JPEG image using sharp
  const testImgBuffer = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 15, g: 30, b: 60 },
    },
  })
    .jpeg()
    .toBuffer();

  const processedImg = await processAndStoreDocument(testImgBuffer, 'invoice_scan.jpg');
  assert('Image processed and saved to private storage', fs.existsSync(processedImg.storagePath));
  assert('Processed image has mimeType image/jpeg', processedImg.mimeType === 'image/jpeg');
  assert('Processed image SHA256 is 64 hex characters', processedImg.fileHashSha256.length === 64);

  // Clean up test image
  const imgDeleted = removeStoredFile(processedImg.storagePath);
  assert('Processed test image cleaned up from disk', imgDeleted && !fs.existsSync(processedImg.storagePath));

  // Test Synthetic PDF
  const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF');
  const processedPdf = await processAndStoreDocument(testPdfContent, 'tax_invoice_tata.pdf');
  assert('PDF saved to private storage', fs.existsSync(processedPdf.storagePath));
  assert('PDF retains mimeType application/pdf', processedPdf.mimeType === 'application/pdf');

  // Clean up test PDF
  const pdfDeleted = removeStoredFile(processedPdf.storagePath);
  assert('Processed test PDF cleaned up from disk', pdfDeleted && !fs.existsSync(processedPdf.storagePath));

  // 5. Oversized File Rejection
  console.log('\n--- 5. OVERSIZED FILE REJECTION ---');
  const hugeBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024, 0xff); // >10MB
  let oversizedRejected = false;
  try {
    await processAndStoreDocument(hugeBuffer, 'huge.jpg');
  } catch (err: any) {
    oversizedRejected = err.message.includes('exceeds maximum allowed limit');
  }
  assert('File exceeding 10MB limit is rejected', oversizedRejected);

  console.log('\n====================================================');
  console.log(`📊 STORAGE UNIT TESTS: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) process.exit(1);
}

runStorageUnitTests().catch((err) => {
  console.error('Storage unit test failed:', err);
  process.exit(1);
});
