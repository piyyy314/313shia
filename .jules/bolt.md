# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-08-13 - [Canvas requestAnimationFrame Loop Teardown Anti-Pattern]
**Learning:** Calling React `setState` inside a 60 FPS `requestAnimationFrame` loop when the state variable is in the `useEffect` dependency array creates a severe performance bottleneck. Every frame triggers a React re-render AND tears down/re-registers the animation loop, resetting frame counters continuously to zero. Backing animation data with a persistent `useRef` inside a `useEffect(..., [])` loop and syncing React state only on structural changes drops re-renders from 60 FPS to < 1 FPS while allowing the canvas loop to run smoothly.
**Action:** Always decouple 60 FPS canvas animation state from React state dependencies by using `useRef` for frame data and syncing `useState` only on actual collection mutations.
