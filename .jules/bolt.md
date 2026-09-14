# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-09-14 - [Canvas RAF Loop State Dependency Teardowns]
**Learning:** Including frequently updating state (like progress counters every 100ms) in `useEffect` dependency arrays for canvas `requestAnimationFrame` loops tears down and re-registers RAF subscriptions ~10 times/sec and resets internal frame counters back to 0. Backing reactive state with React `useRef` and running a single persistent mount-level RAF loop eliminates loop teardown overhead and avoids animation stutter/glitches.
**Action:** Always back high-frequency state with `useRef` inside canvas animation loops that depend on changing progress or status variables.
