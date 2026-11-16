/**
 * RFC 6238 표준 테스트 벡터 검증 스크립트
 * RFC 6238 Appendix B. Test Vectors:
 * Secret: "12345678901234567890" (ASCII, 20 bytes)
 * Base32: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
 * 
 * SHA-1, 8 Digits (또는 6 Digits)
 * Time: 59s -> TOTP: 287082 (6자리인 경우) / 94287082 (8자리)
 * Time: 1111111109s -> TOTP: 081804 (6자리) / 07081804 (8자리)
 * Time: 1111111111s -> TOTP: 050471 (6자리) / 14050471 (8자리)
 * Time: 1234567890s -> TOTP: 005924 (6자리) / 89005924 (8자리)
 * Time: 2000000000s -> TOTP: 279037 (6자리) / 69279037 (8자리)
 */

import { base32ToBytes, bytesToBase32 } from './src/utils/base32.js';
import { generateTotp, verifyTotp } from './src/utils/totp.js';

// Node 환경에서 window.crypto shim
if (typeof window === 'undefined') {
  globalThis.window = {
    crypto: globalThis.crypto,
  };
}

async function runTests() {
  console.log('--- RFC 6238 표준 테스트 벡터 검증 시작 ---');

  const secretAscii = '12345678901234567890';
  const secretBytes = new TextEncoder().encode(secretAscii);
  const secretBase32 = bytesToBase32(secretBytes);
  console.log('Secret (Base32):', secretBase32);

  if (secretBase32 !== 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ') {
    throw new Error(`Base32 인코딩 불일치: 기대값 GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ, 실제값 ${secretBase32}`);
  }
  console.log('✅ Base32 인코딩 테스트 통과');

  const decodedBytes = base32ToBytes(secretBase32);
  const decodedAscii = new TextDecoder().decode(decodedBytes);
  if (decodedAscii !== secretAscii) {
    throw new Error(`Base32 디코딩 불일치: 기대값 ${secretAscii}, 실제값 ${decodedAscii}`);
  }
  console.log('✅ Base32 디코딩 테스트 통과');

  const testVectors = [
    { timeSec: 59, expected6: '287082', expected8: '94287082' },
    { timeSec: 1111111109, expected6: '081804', expected8: '07081804' },
    { timeSec: 1111111111, expected6: '050471', expected8: '14050471' },
    { timeSec: 1234567890, expected6: '005924', expected8: '89005924' },
    { timeSec: 2000000000, expected6: '279037', expected8: '69279037' },
  ];

  for (const { timeSec, expected6, expected8 } of testVectors) {
    const otp6 = await generateTotp(secretBase32, {
      timestamp: timeSec * 1000,
      step: 30,
      digits: 6,
    });
    const otp8 = await generateTotp(secretBase32, {
      timestamp: timeSec * 1000,
      step: 30,
      digits: 8,
    });

    console.log(`Time: ${timeSec}s -> 6자리: ${otp6} (기대: ${expected6}), 8자리: ${otp8} (기대: ${expected8})`);

    if (otp6 !== expected6 || otp8 !== expected8) {
      throw new Error(`TOTP 테스트 벡터 불일치! Time: ${timeSec}s`);
    }
  }
  console.log('✅ RFC 6238 모든 테스트 벡터 통과!');

  // 검증 함수(verifyTotp) 테스트
  const testTime = 1234567890 * 1000;
  const currentOtp = await generateTotp(secretBase32, { timestamp: testTime });
  const checkCurrent = await verifyTotp(currentOtp, secretBase32, { timestamp: testTime, window: 0 });
  if (!checkCurrent.isValid || checkCurrent.delta !== 0) {
    throw new Error('verifyTotp 현재 시간 검증 실패');
  }

  // 이전 스텝 검증 (window = 1)
  const prevOtp = await generateTotp(secretBase32, { timestamp: testTime - 30000 });
  const checkPrev = await verifyTotp(prevOtp, secretBase32, { timestamp: testTime, window: 1 });
  if (!checkPrev.isValid || checkPrev.delta !== -1) {
    throw new Error('verifyTotp -1 델타 검증 실패');
  }
  console.log('✅ verifyTotp 오차 범위 검증 통과!');

  console.log('모든 유닛 테스트 성공 완료!');
}

runTests().catch((err) => {
  console.error('테스트 실패:', err);
  process.exit(1);
});
