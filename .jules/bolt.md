# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-10-04 - [React State Updates in requestAnimationFrame Loops]
**Learning:** Calling React state setters (`setState`) inside a 60 FPS `requestAnimationFrame` loop forces unnecessary component re-renders every frame. Additionally, including state dependencies in `useEffect` dependency arrays causes `requestAnimationFrame` hooks to tear down and re-register constantly, resetting frame counters and degrading animation performance. Backing animation state in a mutable `useRef` and updating React state only when UI counters or structural items change decouples rendering from React's component lifecycle.
**Action:** Use mutable `useRef` for high-frequency animation state (such as element arrays or positions) inside RAF loops, and limit `setState` calls to infrequent discrete events (e.g., spawn/despawn intervals).
