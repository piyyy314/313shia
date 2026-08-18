// Pre-allocated frequency buffer for standard ASCII characters (0-255).
// Prevents heap allocations of Record objects and Object.values() arrays during forensic entropy scans.
const FREQ_BUFFER = new Uint32Array(256);

/**
 * Calculates Shannon Entropy of a string.
 * High entropy (> 4.5 for URLs) often indicates obfuscation, 
 * randomized paths, or generated DGA domains.
 *
 * Performance Optimized: Uses a pre-allocated Uint32Array frequency buffer and
 * charCodeAt() fast-path to eliminate heap object allocation and substring slicing overhead.
 */
export const calculateEntropy = (data: string): number => {
  if (!data) return 0;
  
  const len = data.length;
  FREQ_BUFFER.fill(0);
  let isAscii = true;

  for (let i = 0; i < len; i++) {
    const code = data.charCodeAt(i);
    if (code < 256) {
      FREQ_BUFFER[code]++;
    } else {
      isAscii = false;
      break;
    }
  }

  let entropy = 0;

  if (isAscii) {
    for (let i = 0; i < 256; i++) {
      const count = FREQ_BUFFER[i];
      if (count > 0) {
        const p = count / len;
        entropy -= p * Math.log2(p);
      }
    }
  } else {
    // Unicode fallback using Map for characters outside ASCII range (>= 256)
    const frequencies = new Map<number, number>();
    for (let i = 0; i < len; i++) {
      const code = data.charCodeAt(i);
      frequencies.set(code, (frequencies.get(code) || 0) + 1);
    }
    for (const count of frequencies.values()) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
};

/**
 * Normalizes entropy for URL-specific context.
 */
export const getUrlRiskFactor = (url: string): { score: number; level: 'LOW' | 'MED' | 'HIGH' } => {
  const entropy = calculateEntropy(url);
  let level: 'LOW' | 'MED' | 'HIGH' = 'LOW';
  
  if (entropy > 4.5) level = 'HIGH';
  else if (entropy > 3.8) level = 'MED';
  
  return { score: entropy, level };
};
