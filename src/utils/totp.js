/**
 * RFC 6238 / RFC 4226 TOTP (Time-Based One-Time Password) 핵심 모듈
 * Web Crypto API (crypto.subtle)를 이용한 HMAC-SHA1 클라이언트 사이드 연산
 * Zero-Transmission 원칙 준수 (외부 서버 통신 일절 없음)
 */

import { base32ToBytes } from './base32.js';

/**
 * 지정된 시간 카운터(Counter)와 비밀키를 이용해 6자리 OTP를 생성합니다.
 * @param {string} secret Base32 인코딩된 비밀 키
 * @param {Object} options
 * @param {number} [options.timestamp=Date.now()] 기준 Unix Epoch 밀리초
 * @param {number} [options.step=30] 갱신 주기(초)
 * @param {number} [options.digits=6] OTP 자릿수
 * @returns {Promise<string>} 6자리 OTP 문자열
 */
export async function generateTotp(secret, options = {}) {
  const {
    timestamp = Date.now(),
    step = 30,
    digits = 6,
  } = options;

  if (!secret) {
    throw new Error('비밀 키(Secret)가 제공되지 않았습니다.');
  }

  const keyBytes = base32ToBytes(secret);
  if (keyBytes.length === 0) {
    throw new Error('유효한 비밀 키 바이트가 없습니다.');
  }

  // 1. 시간 스텝 T 계산
  const counter = Math.floor(timestamp / 1000 / step);

  // 2. 8바이트 Big-Endian 버퍼 생성
  const counterBuffer = new ArrayBuffer(8);
  const dataView = new DataView(counterBuffer);
  dataView.setBigUint64(0, BigInt(counter), false);

  // 3. Web Crypto API를 통한 HMAC-SHA1 키 가져오기 및 서명
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hmac = new Uint8Array(signature);

  // 4. RFC 4226 Dynamic Truncation (동적 절단)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const modulo = 10 ** digits;
  const otpNumber = binary % modulo;

  return otpNumber.toString().padStart(digits, '0');
}

/**
 * 사용자가 입력한 OTP 코드가 현재 시간 또는 허용 오차 범위(Window) 내의 유효한 코드인지 검증합니다.
 * @param {string} inputCode 사용자가 입력한 6자리 코드
 * @param {string} secret Base32 비밀 키
 * @param {Object} options
 * @param {number} [options.timestamp=Date.now()] 기준 Unix Epoch 밀리초
 * @param {number} [options.step=30] 갱신 주기(초)
 * @param {number} [options.digits=6] OTP 자릿수
 * @param {number} [options.window=1] 허용할 앞뒤 스텝 범위 (0이면 현재만, 1이면 -1, 0, +1 스텝 허용)
 * @returns {Promise<{ isValid: boolean, delta: number | null }>} 검증 결과 및 시간 델타
 */
export async function verifyTotp(inputCode, secret, options = {}) {
  const {
    timestamp = Date.now(),
    step = 30,
    digits = 6,
    window: windowSteps = 1,
  } = options;

  const sanitizedInput = (inputCode || '').toString().trim().replace(/\s+/g, '');
  if (!sanitizedInput || sanitizedInput.length !== digits) {
    return { isValid: false, delta: null };
  }

  // -windowSteps ~ +windowSteps 시간 범위 검사
  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    const targetTimestamp = timestamp + delta * step * 1000;
    const generated = await generateTotp(secret, {
      timestamp: targetTimestamp,
      step,
      digits,
    });

    if (generated === sanitizedInput) {
      return { isValid: true, delta };
    }
  }

  return { isValid: false, delta: null };
}

/**
 * 30초 주기에서 현재 남아있는 초를 정밀하게 계산합니다.
 * @param {number} [timestamp=Date.now()]
 * @param {number} [step=30]
 * @returns {number} 1 ~ 30 사이의 남은 초
 */
export function getRemainingSeconds(timestamp = Date.now(), step = 30) {
  const currentSeconds = Math.floor(timestamp / 1000);
  const remaining = step - (currentSeconds % step);
  return remaining === 0 ? step : remaining;
}

/**
 * 30초 주기 내의 남은 비율(백분율)을 밀리초 정밀도로 계산합니다. (원형 프로그레스 링 등에 활용)
 * @param {number} [timestamp=Date.now()]
 * @param {number} [step=30]
 * @returns {number} 0 ~ 100 사이의 진행 비율 (100 = 갓 시작, 0 = 만료 직전)
 */
export function getRemainingProgressPercent(timestamp = Date.now(), step = 30) {
  const msInPeriod = (timestamp % (step * 1000));
  const remainingMs = (step * 1000) - msInPeriod;
  return (remainingMs / (step * 1000)) * 100;
}

/**
 * 스마트폰 Authenticator 앱이 인식하는 표준 otpauth:// URI를 생성합니다.
 * @param {Object} params
 * @param {string} params.secret Base32 비밀 키
 * @param {string} [params.account='user@otplab.local'] 사용자 계정
 * @param {string} [params.issuer='OTP LAB'] 서비스 발급자명
 * @param {number} [params.digits=6]
 * @param {number} [params.period=30]
 * @returns {string}
 */
export function buildOtpAuthUri({
  secret,
  account = 'user@otplab.local',
  issuer = 'OTP LAB',
  digits = 6,
  period = 30,
}) {
  const encodedIssuer = encodeURIComponent(issuer.trim());
  const encodedAccount = encodeURIComponent(account.trim());
  const sanitizedSecret = secret.replace(/\s+/g, '').toUpperCase();

  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${sanitizedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${digits}&period=${period}`;
}
