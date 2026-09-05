# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-09-05 - [Canvas Animation Loop State Synchronization]
**Learning:** Calling React state setters directly inside requestAnimationFrame loops when the effect depends on that state tears down and restarts the animation frame loop on every single frame, resetting frame counters to 0 and forcing 60 FPS React re-renders. Storing mutable animation state in a useRef and syncing to React state only when discrete element changes occur preserves smooth 60 FPS animations while reducing React component re-renders from ~60 FPS to ~0.5 FPS (~99% reduction).
**Action:** Always decouple continuous canvas animation frame state from React component state using useRef, and only call React state setters when discrete data changes occur.
