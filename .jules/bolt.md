# Bolt's Journal - Critical Learnings Only

## 2026-09-17 - [rAF Canvas Loops and React State Update Thrashing]
**Learning:** Calling React state setters (e.g., `setThreats`) on every frame within a `requestAnimationFrame` callback causes 60 re-renders/sec, continuously destroys and recreates local closure variables (like frame counters), and creates heavy GC pressure. Backing state in a `useRef` allows high-frequency (60 FPS) canvas rendering inside a single persistent `rAF` loop, while React state setter calls can be throttled/gated to only fire when state actually changes (~1 update/sec), reducing re-renders by ~98%+.
**Action:** Always decouple high-frequency canvas `requestAnimationFrame` render loops from React component state by backing dynamic rendering data in `useRef` and triggering React state updates only on structural state changes.

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.
