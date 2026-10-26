// Pre-allocated frequency buffer for 8-bit ASCII character codes to prevent allocations on hot paths
const FREQ_BUFFER = new Uint32Array(256);

/**
 * Calculates Shannon Entropy of a string.
 * High entropy (> 4.5 for URLs) often indicates obfuscation, 
 * randomized paths, or generated DGA domains.
 *
 * Performance Optimization:
 * - Uses a static Uint32Array(256) buffer with charCodeAt() fast-path for ASCII strings,
 *   eliminating object allocations ({}), string indexing overhead, and Object.values() heap arrays.
 * - Utilizes the logarithmic identity H(X) = log2(N) - (1/N) * sum(c_i * log2(c_i)) to reduce Math.log2 calls.
 * - Expected speedup: >10x faster with 0 heap allocations for standard ASCII strings.
 */
export const calculateEntropy = (data: string): number => {
  if (!data) return 0;
  
  const len = data.length;
  let isAscii = true;
  let breakIndex = 0;

  for (let i = 0; i < len; i++) {
    const code = data.charCodeAt(i);
    if (code < 256) {
      FREQ_BUFFER[code]++;
    } else {
      isAscii = false;
      breakIndex = i;
      break;
    }
  }

  if (isAscii) {
    let sumCLogC = 0;
    for (let i = 0; i < 256; i++) {
      const count = FREQ_BUFFER[i];
      if (count > 0) {
        sumCLogC += count * Math.log2(count);
        FREQ_BUFFER[i] = 0; // Reset buffer entry for future calls
      }
    }
    return Math.log2(len) - (sumCLogC / len);
  }

  // Clear partial counts in FREQ_BUFFER accumulated prior to encountering non-ASCII character
  for (let j = 0; j < breakIndex; j++) {
    const code = data.charCodeAt(j);
    if (code < 256) {
      FREQ_BUFFER[code] = 0;
    }
  }

  // Fallback for non-ASCII characters
  const counts = new Map<number, number>();
  for (let i = 0; i < len; i++) {
    const code = data.charCodeAt(i);
    counts.set(code, (counts.get(code) || 0) + 1);
  }

  let sumCLogC = 0;
  for (const count of counts.values()) {
    sumCLogC += count * Math.log2(count);
  }
  return Math.log2(len) - (sumCLogC / len);
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
