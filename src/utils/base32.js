/**
 * RFC 4648 Base32 인코딩 / 디코딩 유틸리티
 * 암호학적 안전한 난수(CSPRNG)를 활용한 비밀 키 생성 지원
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * CSPRNG(crypto.getRandomValues)를 사용하여 지정된 바이트 길이(기본 20바이트 = 160비트)의
 * 안전한 Base32 비밀 키를 생성합니다.
 * @param {number} length 바이트 수 (기본값: 20바이트 / 160비트 - RFC 6238 권장)
 * @returns {string} Base32 인코딩된 비밀 키 문자열
 */
export function generateBase32Secret(length = 20) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.getRandomValues) {
    throw new Error('Web Crypto API (crypto.getRandomValues)를 지원하지 않는 환경입니다.');
  }
  const randomBytes = new Uint8Array(length);
  window.crypto.getRandomValues(randomBytes);
  return bytesToBase32(randomBytes);
}

/**
 * Uint8Array 바이트 배열을 Base32 문자열로 변환합니다.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function bytesToBase32(bytes) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Base32 문자열을 Uint8Array 바이트 배열로 디코딩합니다.
 * 공백, 하이픈 제거 및 소문자 자동 대문자 변환, 패딩('=') 처리를 지원합니다.
 * @param {string} base32Str
 * @returns {Uint8Array}
 */
export function base32ToBytes(base32Str) {
  if (!base32Str || typeof base32Str !== 'string') {
    return new Uint8Array(0);
  }

  const cleaned = base32Str.toUpperCase().replace(/[\s\-_=]/g, '');
  let bits = 0;
  let value = 0;
  const result = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`유효하지 않은 Base32 문자: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(result);
}

/**
 * 사용자가 읽고 입력하기 편하도록 Base32 키를 4글자씩 공백으로 구분해 포맷팅합니다.
 * @param {string} secret
 * @returns {string} 예: "ABCD EFGH IJKL MNOP"
 */
export function formatSecretKey(secret) {
  if (!secret) return '';
  const cleaned = secret.replace(/\s+/g, '');
  return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
}
