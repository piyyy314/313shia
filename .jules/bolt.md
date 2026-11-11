# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - [PQC Hex Conversion Performance Bottlenecks]
**Learning:** Naive hexadecimal serialization (`Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')`) and deserialization (`parseInt(hex.substring(i, i + 2), 16)`) in cryptographic tasks like ML-DSA-65 keys/signatures create severe performance bottlenecks due to massive object allocation and substring slicing. Using precomputed lookup tables (LUT) for encoding and byte values for decoding completely avoids intermediate heap/garbage collection overhead and yields substantial speedups.
**Action:** Always replace naive string-manipulation-based hexadecimal transformations with LUT-based algorithms when handling post-quantum cryptography payloads or large typed arrays.

## 2026-10-03 - [Canvas Animation Gradient Allocation Overhead]
**Learning:** Instantiating CanvasGradient objects (`ctx.createRadialGradient`) inside a 60 FPS `requestAnimationFrame` loop creates constant garbage collection pressure and native handle allocation overhead. Caching the gradient outside the animation loop alongside precomputed trigonometric constants (`Math.sin`/`Math.cos` for orbit inclination) completely eliminates heap churn and CPU recalculation during continuous 3D canvas projections.
**Action:** Always precompute gradient objects, canvas text font settings, and fixed trigonometric factors outside 60 FPS `requestAnimationFrame` render loops.
