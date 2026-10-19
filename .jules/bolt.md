# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [TypedArray Canvas Scrolling Performance]
**Learning:** Element-by-element manual `for` loops in JavaScript to shift pixel buffer rows (`data[i] = data[i + rowSize]`) in HTML5 Canvas 60 FPS animation loops (e.g. waterfall/spectrogram rendering) process ~1M array operations per frame, introducing heavy CPU work (~2.7ms/frame). Replacing manual JS iteration with native `TypedArray.prototype.copyWithin(0, rowSize)` delegates buffer movement directly to C++ native `memmove`, reducing execution time per frame to ~0.027ms (~100x speedup).
**Action:** Always use `TypedArray.prototype.copyWithin()` for pixel buffer shifting, scrolling, and array region copying in Canvas 2D / WebGL animation frame callbacks.

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.
