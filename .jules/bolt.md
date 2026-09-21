# Bolt's Journal - Critical Learnings Only

## 2026-08-14 - [Canvas 60 FPS Animation Frame Array Spread Anti-Pattern]
**Learning:** Performing array spreading (`Math.max(...array)`) and `array.indexOf(...)` inside a 60 FPS `requestAnimationFrame` loop causes repeated heap allocations for rest argument lists and multiple array scans every 16.6ms. Inline tracking of peak values and indices during the main O(n) state update loop completely eliminates function call argument allocation and array traversals without affecting readability or functional behavior.
**Action:** In high-frequency 60 FPS canvas animation loops, always compute peak markers or summary statistics inline during the data generation loop rather than using array spread helpers.

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.
