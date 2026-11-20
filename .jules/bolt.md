# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-10-09 - [Canvas2D ShadowBlur and Forward-Splice Animation Bottlenecks]
**Learning:** Setting `ctx.shadowBlur` on individual objects inside 60 FPS Canvas2D requestAnimationFrame loops causes extreme rendering lag because browsers perform expensive CPU/GPU Gaussian blur passes per draw call. Additionally, using `forEach` with `splice(i, 1)` during array iteration skips elements due to index shifting and incurs $O(N)$ copy overhead. Iterating backwards (`for (let i = arr.length - 1; i >= 0; i--)`) and batching fill styles without `shadowBlur` eliminates element skipping bugs and drastically speeds up canvas frame rendering.
**Action:** In high-frequency 60 FPS animation loops, batch drawing by fill color, replace `shadowBlur` with layered rectangle fills or outer glow shapes, and prune arrays using reverse `for` loops.
