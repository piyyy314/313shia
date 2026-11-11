# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-09-13 - [Canvas Animation Loop Precomputed Lookup Tables]
**Learning:** In 60 FPS `requestAnimationFrame` canvas rendering loops, generating arrays (e.g. `Array.from({ length: 360 })`) and calling trigonometric functions (`Math.sin`, `Math.cos`) per angle creates heavy garbage collection pressure and CPU overhead (e.g. >86,000 trig calculations/sec). Precomputing static curve data and angle trigonometric values into top-level `Float64Array` lookup tables (LUT) eliminates runtime allocations and per-frame trig calculations completely.
**Action:** Always precompute static geometries, trig angles, and mock curves into module-level TypedArrays when rendering interactive 2D canvas visuals in 60 FPS animation loops.
