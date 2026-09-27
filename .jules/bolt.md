# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [React State in Canvas rAF Loops]
**Learning:** Updating React state inside canvas `requestAnimationFrame` loops when state is included in `useEffect` dependency arrays creates exponential loop accumulation because `cancelAnimationFrame` only cancels stale initial frame IDs. Backing mutable frame state in `useRef` and using an empty dependency array `[]` keeps animation loops singular, preventing severe memory leaks and CPU exhaustion.
**Action:** Always decouple React state updates from canvas animation loops by using `useRef` for mutable frame state and `[]` for `useEffect` dependencies.

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.
