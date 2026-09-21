# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-09-21 - [Canvas requestAnimationFrame State Update Anti-Pattern]
**Learning:** Calling `setState` inside a `requestAnimationFrame` loop when the `useEffect` has state in its dependency array causes 60 React component re-renders per second, continuously tears down and re-registers the `requestAnimationFrame` effect, and resets local frame counters on every tick. Backing dynamic state with a `useRef` and syncing React state only when data actually mutates preserves smooth canvas animations while reducing React re-renders by ~98%.
**Action:** Always back animation data with `useRef` inside canvas `useEffect` loops with `[]` dependency arrays, updating React UI state only on data mutation events.
