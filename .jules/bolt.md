# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-08-14 - [rAF Loops with React State Dependencies Tear Down 60 Times/Sec]
**Learning:** Calling React state updates (`setThreats`) on every frame in a 60 FPS `requestAnimationFrame` canvas render loop causes ~60 React component re-renders/sec. Worse, if the `useEffect` running the loop depends on that state, the effect tears down and recreates the rAF loop every frame, resetting internal frame counters (`frame = 0`) and breaking periodic state generation logic (`frame % 60 === 0`). Managing high-frequency canvas objects in a `useRef` and only syncing React state when elements are added or removed maintains smooth 60 FPS rendering and eliminates ~98.3% of unnecessary re-renders.
**Action:** In canvas-based components with `requestAnimationFrame` loops, store high-frequency frame state in `useRef` and separate canvas updates from React render state updates.
