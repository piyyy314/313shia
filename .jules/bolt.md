# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-08-14 - [rAF Canvas Loops and React State Updates Anti-Pattern]
**Learning:** Calling React state setters (`setState`) inside a 60 FPS `requestAnimationFrame` loop causes unnecessary component re-renders and React virtual DOM reconciliation overhead every 16.6ms. Additionally, including state in the `useEffect` dependency array triggers continuous loop teardown and re-registration, resetting frame counters. Backing animated state with `useRef` and only calling state setters when array/object structural changes actually occur preserves animation performance while keeping UI state in sync.
**Action:** When working on canvas animation components, back high-frequency animation state with `useRef` and maintain a stable `useEffect` loop (`[]` dependency array).
