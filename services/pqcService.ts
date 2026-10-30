
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

// Precomputed lookup table for byte-to-hex string conversion
const HEX_LUT = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

// Precomputed lookup table for ASCII hex char to nibble value conversion
const HEX_VAL = new Int8Array(256).fill(-1);
for (let i = 0; i < 10; i++) HEX_VAL[48 + i] = i; // '0'-'9'
for (let i = 0; i < 6; i++) {
  HEX_VAL[65 + i] = 10 + i; // 'A'-'F'
  HEX_VAL[97 + i] = 10 + i; // 'a'-'f'
}

/**
 * Optimized Uint8Array to hexadecimal string converter.
 * Uses a precomputed lookup table to eliminate intermediate Array/string allocations
 * and string formatting overhead for high-frequency cryptographic operations (e.g. PQC ML-DSA-65).
 */
export const bytesToHex = (bytes: Uint8Array): string => {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += HEX_LUT[bytes[i]];
  }
  return hex;
};

/**
 * Optimized hexadecimal string to Uint8Array converter.
 * Uses charCodeAt lookup and bitwise arithmetic to avoid substring slicing
 * and parseInt calls during PQC signature/key deserialization.
 */
export const hexToBytes = (hex: string): Uint8Array => {
  const len = hex.length;
  const bytes = new Uint8Array(len >> 1);
  for (let i = 0; i < len; i += 2) {
    const high = HEX_VAL[hex.charCodeAt(i)];
    const low = HEX_VAL[hex.charCodeAt(i + 1)];
    bytes[i >> 1] = (high << 4) | low;
  }
  return bytes;
};
