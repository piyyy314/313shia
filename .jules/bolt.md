# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-09-19 - [Canvas Animation Loop State Decoupling]
**Learning:** Calling `setState` directly inside a `requestAnimationFrame` loop when `useEffect` has the state as a dependency creates 60 re-renders per second, continuously cancels and restarts `requestAnimationFrame`, and resets internal frame counters. Backing high-frequency animation data with a `useRef` and throttling React state updates to low-frequency ticks (e.g. 1 Hz) eliminates 98%+ of re-renders while keeping canvas animations perfectly smooth.
**Action:** When creating canvas animation loops in React components, store live animation state in `useRef` and run `useEffect(..., [])` with empty dependencies. Only call `setState` periodically for UI stats.
