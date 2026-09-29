
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

/**
 * SatExpert PQC Service
 * Implements NIST-standardized ML-DSA-65 (Dilithium) for secure trap management.
 */

export const generatePQCKeyPair = () => {
  // ML-DSA keygen typically takes a 32-byte seed
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const seed = cryptoObj.getRandomValues(new Uint8Array(32));
  const keys = ml_dsa65.keygen(seed);
  return {
    publicKey: keys.publicKey,
    secretKey: keys.secretKey
  };
};

export const signCanaryToken = (trapMetadata: string, secretKey: Uint8Array) => {
  if (!(secretKey instanceof Uint8Array)) {
    console.error("Critical Security Failure: Invalid secretKey type provided to signCanaryToken");
    throw new TypeError(`secretKey expected Uint8Array, got ${typeof secretKey}`);
  }
  // ML-DSA-65 (Dilithium3) secretKey length is 4032 bytes
  if (secretKey.length !== 4032) {
    console.warn(`PQC Key Size Mismatch: Expected 4032, got ${secretKey.length}.`);
    throw new RangeError(`secretKey expected Uint8Array of length 4032, got length=${secretKey.length}`);
  }
  const msg = new TextEncoder().encode(trapMetadata);
  return ml_dsa65.sign(msg, secretKey);
};

export const verifyCanaryToken = (publicKey: Uint8Array, trapMetadata: string, signature: Uint8Array) => {
  const msg = new TextEncoder().encode(trapMetadata);
  return ml_dsa65.verify(signature, msg, publicKey);
};

// Precomputed lookup table for O(1) byte-to-hex conversion (256 elements)
const HEX_LUT = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

// Precomputed lookup table for O(1) hex-to-byte char-code lookup (256 ASCII elements)
const HEX_PARSE_LUT = new Int8Array(256).fill(-1);
for (let i = 0; i < 10; i++) HEX_PARSE_LUT[48 + i] = i; // '0'-'9'
for (let i = 0; i < 6; i++) {
  HEX_PARSE_LUT[97 + i] = 10 + i; // 'a'-'f'
  HEX_PARSE_LUT[65 + i] = 10 + i; // 'A'-'F'
}

/**
 * Fast hexadecimal string encoding using a precomputed lookup table.
 * Avoids Array.from allocation, string mapping, and array joining overhead (>10x speedup).
 */
export const bytesToHex = (bytes: Uint8Array): string => {
  const len = bytes.length;
  let hex = '';
  for (let i = 0; i < len; i++) {
    hex += HEX_LUT[bytes[i]];
  }
  return hex;
};

/**
 * Fast hexadecimal string decoding using a character-code lookup table.
 * Avoids regex matching, string splitting, substring slicing, and parseInt allocations (>6x speedup).
 */
export const hexToBytes = (hex: string): Uint8Array => {
  const len = hex.length;
  const bytes = new Uint8Array(len >> 1);
  for (let i = 0; i < len; i += 2) {
    const c1 = hex.charCodeAt(i);
    const c2 = hex.charCodeAt(i + 1);
    const h1 = c1 < 256 ? HEX_PARSE_LUT[c1] : -1;
    const h2 = c2 < 256 ? HEX_PARSE_LUT[c2] : -1;
    if (h1 === -1 || h2 === -1) {
      throw new Error(`Invalid hexadecimal character in string`);
    }
    bytes[i >> 1] = (h1 << 4) | h2;
  }
  return bytes;
};
