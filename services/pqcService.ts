
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

// Precomputed lookup table for fast hex encoding (256 entries 00..ff)
// Avoids Array.from, toString(16), and padStart allocations per byte (~8x speedup)
const HEX_LUT = new Array<string>(256);
for (let i = 0; i < 256; i++) {
  HEX_LUT[i] = i.toString(16).padStart(2, '0');
}

// Precomputed lookup table for fast hex character decoding
// Avoids substring creation and parseInt parsing per char pair (~9x speedup)
const HEX_VAL = new Uint8Array(256);
for (let i = 0; i < 10; i++) HEX_VAL[48 + i] = i;      // '0'-'9'
for (let i = 0; i < 6; i++) {
  HEX_VAL[65 + i] = 10 + i;                           // 'A'-'F'
  HEX_VAL[97 + i] = 10 + i;                           // 'a'-'f'
}

export const bytesToHex = (bytes: Uint8Array): string => {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += HEX_LUT[bytes[i]];
  }
  return hex;
};

export const hexToBytes = (hex: string): Uint8Array => {
  const len = hex.length;
  const bytes = new Uint8Array(len >> 1);
  for (let i = 0; i < len; i += 2) {
    const c1 = hex.charCodeAt(i);
    const c2 = hex.charCodeAt(i + 1);
    const v1 = c1 < 256 ? HEX_VAL[c1] : 0;
    const v2 = c2 < 256 ? HEX_VAL[c2] : 0;
    bytes[i >> 1] = (v1 << 4) | v2;
  }
  return bytes;
};
