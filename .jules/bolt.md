# Bolt's Journal - Critical Learnings

## 2025-02-13 - State Update Storms in Canvas & Timer Loops
**Learning:** In highly interactive, multi-panel React dashboards, executing state updates inside high-frequency loops (like `requestAnimationFrame` at 60fps or high-frequency `setInterval` at 20fps) is a major performance bottleneck.
1. In `SpectrumAnalyzer.tsx`, setting peak-frequency metrics in React state on every frame of a `requestAnimationFrame` loop triggered full React reconciliation and DOM updates 60 times/second, even though the text displays do not need such high update rates. Throttling these state updates to 250ms (4Hz) dramatically reduces CPU rendering overhead while making the numbers readable for operators.
2. In `ConnectivityMesh.tsx`, driving an unused `rotation` state inside a 50ms interval triggered 20 useless component-tree re-render cycles per second, wasting valuable clock cycles. Removing unused animation/interaction state altogether or offloading animations to GPU-accelerated CSS transitions/animations prevents needless React overhead.

**Action:** Always scan for state setters inside `requestAnimationFrame` and interval loops. Throttle telemetry/sensor metric state updates to a human-readable pace (250-500ms) and offload non-interactive cosmetic animations entirely to GPU-bound CSS transitions.
