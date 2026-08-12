# Bolt's Journal - Critical Learnings Only

## 2025-02-22 - [PQC Hex Conversion Performance]
**Learning:** Converting standard array representations of large binary data like ML-DSA post-quantum cryptography keys and signatures (e.g. 4032 and 3300 bytes) via `Array.from().map().join()` generates considerable garbage collection overhead and CPU latency. Using pre-computed lookup tables and direct string/array concat is >10x faster.
**Action:** Replace high-frequency byte-to-hex and hex-to-byte utility functions with pre-computed lookup tables for O(1) character lookup and minimal garbage collection.
