import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  SessionPayload,
  isLoginLocked,
  getLoginLockRemainingSeconds,
  recordFailedLogin,
  resetLoginAttempts,
} from '../../lib/auth';

async function runAuthTests() {
  console.log('====================================================');
  console.log('🧪 UNIT TESTS: AUTHENTICATION & SESSION SECURITY');
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

  // 1. Password Hashing (PBKDF2)
  console.log('--- 1. PBKDF2 PASSWORD HASHING ---');
  const password = 'SalemYard@2026!';
  const hash1 = hashPassword(password);
  const hash2 = hashPassword(password);

  assert('Hash format contains iterations:salt:key', hash1.split(':').length === 3);
  assert('Hashes generated with different salts are unique', hash1 !== hash2);
  assert('Correct password verifies successfully', verifyPassword(password, hash1));
  assert('Incorrect password is rejected', !verifyPassword('WrongPassword', hash1));
  assert('Empty password is rejected', !verifyPassword('', hash1));

  // 2. Session Tokens (HMAC-SHA256)
  console.log('\n--- 2. HMAC-SHA256 SESSION TOKENS ---');
  const validPayload: SessionPayload = {
    id: 'usr_001',
    username: 'admin',
    fullName: 'Salem Yard Admin',
    role: 'admin',
    exp: Date.now() + 3600 * 1000, // 1 hour in future
  };

  const token = signSessionToken(validPayload);
  assert('Token consists of data and signature parts', token.split('.').length === 2);

  const verified = verifySessionToken(token);
  assert('Valid token is verified and returns payload', verified !== null && verified.username === 'admin');

  // Tampering detection
  const tamperedToken = token.slice(0, -4) + 'abcd';
  assert('Tampered token is rejected', verifySessionToken(tamperedToken) === null);

  // Expired token detection
  const expiredPayload: SessionPayload = {
    ...validPayload,
    exp: Date.now() - 1000, // 1 second in past
  };
  const expiredToken = signSessionToken(expiredPayload);
  assert('Expired token is rejected', verifySessionToken(expiredToken) === null);

  // 3. Login Abuse Protection & Rate Limiting
  console.log('\n--- 3. LOGIN ABUSE PROTECTION & RATE LIMITING ---');
  const testIpKey = '192.168.1.100:testadmin';
  resetLoginAttempts(testIpKey);

  assert('Initially identifier is not locked', !isLoginLocked(testIpKey));

  // Record 4 failed attempts
  for (let i = 1; i <= 4; i++) {
    const status = recordFailedLogin(testIpKey);
    assert(`Attempt ${i} increments count and remains unlocked`, status.attempts === i && !status.locked);
  }
  assert('After 4 attempts, account is still unlocked', !isLoginLocked(testIpKey));

  // 5th attempt triggers lockout
  const fifthAttempt = recordFailedLogin(testIpKey);
  assert('5th failed attempt triggers lockout', fifthAttempt.locked && fifthAttempt.attempts === 5);
  assert('Identifier is marked as locked', isLoginLocked(testIpKey));
  assert('Lockout remaining seconds > 0', getLoginLockRemainingSeconds(testIpKey) > 0);

  // Reset clears lockout
  resetLoginAttempts(testIpKey);
  assert('Reset clears lockout state immediately', !isLoginLocked(testIpKey));
  assert('Lockout remaining seconds returns 0 after reset', getLoginLockRemainingSeconds(testIpKey) === 0);

  console.log('\n====================================================');
  console.log(`📊 AUTH TEST SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) process.exit(1);
}

runAuthTests().catch((err) => {
  console.error('Auth test failed:', err);
  process.exit(1);
});
