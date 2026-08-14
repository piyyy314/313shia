# Bolt's Journal - Critical Learnings

## 2026-08-09 - [Unused High-Frequency Interval State Updates]
**Learning:** Some components might define a state variable (e.g. `rotation` in a dynamic SVG component) and update it inside a high-frequency `setInterval` (e.g., 50ms interval) to simulate animation or rotation, but end up not actually using the state variable in the JSX or functions. This triggers a massive number of redundant React re-renders of the entire component, leading to high CPU/battery consumption without any visual or logical changes.
**Action:** Always verify that every high-frequency state variable (and its associated `setInterval` / `requestAnimationFrame`) is actually read or used to alter styles, attributes, or rendering logic. If it is not, completely remove both the state and the interval to restore idle CPU usage back to near 0%.
