# Bolt's Journal - Critical Learnings Only

## 2026-08-14 - [Canvas Animation State Update Loops in React]
**Learning:** Calling `setState` on every frame inside a `requestAnimationFrame` loop while including state in `useEffect` dependency arrays creates an anti-pattern: it forces React to re-render 60 times/second and causes continuous effect disposal and re-registration. Using a `useRef` to back state inside RAF loops and only dispatching `setState` when actual state changes occur reduces component re-renders by ~98% and keeps RAF loops running continuously.
**Action:** When creating HTML5 canvas animation loops in React components, back state values with `useRef` and throttle `setState` calls to state transition boundaries.

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.
