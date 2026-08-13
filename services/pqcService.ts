
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

/**
 * SatExpert PQC Service
 * Implements NIST-standardized ML-DSA-65 (Dilithium) for secure trap management.
 */

export const generatePQCKeyPair = () => {
  // ML-DSA keygen typically takes a 32-byte seed
  const seed = window.crypto.getRandomValues(new Uint8Array(32));
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

// Precomputed lookup tables (LUT) for high-performance hex encoding and decoding.
// This completely avoids expensive intermediate object allocation and parsing.
const LUT_HEX = new Array(256);
for (let i = 0; i < 256; i++) {
  LUT_HEX[i] = i.toString(16).padStart(2, '0');
}

const LUT_DEC = new Int8Array(256);
LUT_DEC.fill(-1);
for (let i = 0; i < 10; i++) LUT_DEC[48 + i] = i; // '0'-'9'
for (let i = 0; i < 6; i++) {
  LUT_DEC[97 + i] = 10 + i; // 'a'-'f'
  LUT_DEC[65 + i] = 10 + i; // 'A'-'F'
}

/**
 * Highly optimized bytes-to-hex converter.
 * Avoids array mapping/join overhead by utilizing a precomputed string LUT.
 * Measurably faster and highly memory-efficient.
 */
export const bytesToHex = (bytes: Uint8Array): string => {
  let hex = '';
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    hex += LUT_HEX[bytes[i]];
  }
  return hex;
};

/**
 * Highly optimized hex-to-bytes converter.
 * Uses a precomputed decode array with char codes to avoid substring slicing and parseInt calls.
 * Measurably faster and zero-allocation friendly.
 */
export const hexToBytes = (hex: string): Uint8Array => {
  const len = hex.length;
  if (len % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    const codeHigh = hex.charCodeAt(i);
    const codeLow = hex.charCodeAt(i + 1);

    // Guard against character codes out of range of the precomputed decode LUT (0-255)
    const high = codeHigh < 256 ? LUT_DEC[codeHigh] : -1;
    const low = codeLow < 256 ? LUT_DEC[codeLow] : -1;

    if (high === -1 || low === -1) {
      throw new Error('Invalid hex character');
    }
    bytes[i / 2] = (high << 4) | low;
  }
  return bytes;
};
