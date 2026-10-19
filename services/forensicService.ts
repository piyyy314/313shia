// Pre-allocated frequency array for ASCII characters (0-255) to avoid heap allocations
const CHAR_COUNTS = new Uint32Array(256);

/**
 * Calculates Shannon Entropy of a string.
 * High entropy (> 4.5 for URLs) often indicates obfuscation, 
 * randomized paths, or generated DGA domains.
 *
 * Performance optimization:
 * Uses a pre-allocated Uint32Array buffer with charCodeAt() fast-paths
 * for ASCII strings to eliminate object allocations, string slice overhead,
 * and Object.values() heap array allocations during calculations.
 */
export const calculateEntropy = (data: string): number => {
  if (!data) return 0;
  
  const len = data.length;
  CHAR_COUNTS.fill(0);
  let isAscii = true;

  // Single pass to count frequencies for ASCII and check for non-ASCII characters
  for (let i = 0; i < len; i++) {
    const code = data.charCodeAt(i);
    if (code < 256) {
      CHAR_COUNTS[code]++;
    } else {
      isAscii = false;
      break;
    }
  }

  // Fast-path: ASCII string (URLs, paths, tokens)
  if (isAscii) {
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
      const count = CHAR_COUNTS[i];
      if (count > 0) {
        const p = count / len;
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }

  // Fallback for non-ASCII strings (Unicode/emojis) using Map to avoid Object.values allocation
  const frequencies = new Map<string, number>();
  for (let i = 0; i < len; i++) {
    const char = data[i];
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
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
