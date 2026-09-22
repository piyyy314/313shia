# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-09-22 - [React State Updates in Canvas Animation Loops]
**Learning:** Including state variables in a canvas `useEffect` dependency array while triggering state setters inside `requestAnimationFrame` creates a catastrophic 60 FPS re-render loop that tears down and re-registers the animation loop on every frame. Storing animated state in a `useRef` within a persistent `requestAnimationFrame` loop (`useEffect` with `[]` dependencies) and only dispatching React state updates when array items are actually added or removed reduces re-renders by ~97% and preserves smooth animation frame counting.
**Action:** Always back high-frequency canvas animation state with `useRef` and decouple React state dispatching from per-frame rendering.
