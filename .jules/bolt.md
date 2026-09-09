# Bolt's Journal - Critical Learnings Only

## 2026-09-09 - [60 FPS Animation Re-renders in Canvas Components]
**Learning:** Canvas components updating React state (`setState`) unconditionally inside `requestAnimationFrame` loops (e.g. `prev.filter(...)` returning new array references every frame) force 60 FPS component re-renders and cause continuous `useEffect` tear-down/re-initialization when included in dependency arrays.
**Action:** Track high-frequency frame state using `useRef` inside the `requestAnimationFrame` loop, trigger `setState` only when actual array item additions/removals occur, and keep the `useEffect` dependency array empty (`[]`).

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.
