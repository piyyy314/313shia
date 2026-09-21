# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-08-21 - [Canvas Animation Loop Re-render Anti-Pattern]
**Learning:** Calling React `setState` inside `requestAnimationFrame` while including the state variable in `useEffect` dependency array causes React to re-render 60 times/second and continuously tear down/re-initialize the animation frame loop. Using `useRef` for state needed inside the animation loop keeps rendering smooth at 60 FPS while reducing React component re-renders by ~98% (only triggering React updates when structure changes).
**Action:** For HTML5 canvas animation loops in React, keep mutable frame state in `useRef` rather than React `useState` to avoid unnecessary React reconciliation on every frame.
