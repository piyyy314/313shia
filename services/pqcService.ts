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

/**
 * Pre-allocated lookup table mapping numbers 0-255 to their 2-character hexadecimal string representation.
 * This avoids calling `.toString(16)` and `.padStart(2, '0')` on every byte.
 */
const BYTE_TO_HEX_LUT: string[] = Array.from({ length: 256 }, (_, i) =>
  i.toString(16).padStart(2, '0')
);

/**
 * Pre-allocated lookup table mapping character codes to their corresponding hexadecimal value (0-15).
 * Initialized to 0 by default, with valid hex char ranges updated.
 */
const CHAR_TO_INT_LUT = new Uint8Array(256);
for (let i = 0; i < 10; i++) {
  CHAR_TO_INT_LUT[48 + i] = i; // '0'-'9'
}
for (let i = 0; i < 6; i++) {
  CHAR_TO_INT_LUT[97 + i] = 10 + i; // 'a'-'f'
  CHAR_TO_INT_LUT[65 + i] = 10 + i; // 'A'-'F'
}

/**
 * Converts a Uint8Array of bytes into a hexadecimal string representation.
 * Optimized via a pre-allocated lookup table (BYTE_TO_HEX_LUT) and an iterative loop
 * to avoid expensive array creation, mapping overhead, and string joining.
 * Expects ~10x speedup over the previous `Array.from(bytes).map(...).join('')` approach.
 */
export const bytesToHex = (bytes: Uint8Array): string => {
  let hex = '';
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    hex += BYTE_TO_HEX_LUT[bytes[i]];
  }
  return hex;
};

/**
 * Converts a hexadecimal string into a Uint8Array of bytes.
 * Optimized via a pre-allocated lookup table (CHAR_TO_INT_LUT) and individual charCode access.
 * This avoids expensive substring creations and slow native parsing via `parseInt(..., 16)`.
 * Expects ~9x speedup over the previous `parseInt(hex.substring(i, i + 2), 16)` approach.
 */
export const hexToBytes = (hex: string): Uint8Array => {
  const len = hex.length;
  const bytes = new Uint8Array(len >> 1);
  for (let i = 0; i < len; i += 2) {
    const high = CHAR_TO_INT_LUT[hex.charCodeAt(i)];
    const low = CHAR_TO_INT_LUT[hex.charCodeAt(i + 1)];
    bytes[i >> 1] = (high << 4) | low;
  }
  return bytes;
};
