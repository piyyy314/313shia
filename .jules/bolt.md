# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-08-20 - [rAF Loop React State Update Re-render Trap]
**Learning:** Calling `setState` unconditionally inside a 60 FPS `requestAnimationFrame` loop where the state variable is in the `useEffect` dependency array causes React to re-render 60 times per second while constantly tearing down and re-registering the rAF loop on every frame. This also resets local frame counters, breaking animations. Backing state with a `useRef` inside the rAF loop and only triggering React state updates when values actually change drops component re-renders from 60 FPS to ~0.5 FPS (~99% reduction) and keeps animations smooth.
**Action:** In animation components using rAF, manage animated items via `useRef` and only call React `setState` when item counts or structural data change.
