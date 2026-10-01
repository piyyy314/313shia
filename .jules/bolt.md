# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-08-14 - [React State Updates Inside Canvas Animation Loops]
**Learning:** Calling React state updater functions (e.g., `setThreats`) inside a `requestAnimationFrame` canvas loop on every frame when that state variable is listed in `useEffect` dependencies causes 60 FPS React re-renders and continuously cancels/re-creates the animation loop every 16ms (resetting frame counters and creating heavy GC pressure). Backing animation state with `useRef` and conditionally calling state setters only when data actually changes avoids continuous re-renders and loop teardowns.
**Action:** Always back canvas animation state with `useRef` in persistent `requestAnimationFrame` loops and sync with React state only on actual state mutations.
