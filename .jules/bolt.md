# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-08-14 - [React State Updates in requestAnimationFrame Loops]
**Learning:** Calling `setState` on every frame (60 FPS) in a `requestAnimationFrame` loop causes non-stop React component re-renders. If `state` is included in `useEffect` dependencies, it continuously tears down and re-creates the animation loop, resetting frame counters (e.g. `frame = 0`) and breaking animations while causing unnecessary CPU thrashing.
**Action:** Use `useRef` to hold mutable animation state inside `requestAnimationFrame` loops. Only call `setState` when UI-visible metadata (e.g. item count) changes, and keep `useEffect` dependencies empty (`[]`) for persistent rAF loops.
