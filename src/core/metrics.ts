import type { CompareMetrics } from './types.js';

export function buildMetrics(
  width: number,
  height: number,
  mismatchedPixels: number,
): CompareMetrics {
  const totalPixels = width * height;
  const mismatchRatio = totalPixels === 0 ? 0 : mismatchedPixels / totalPixels;
  return {
    totalPixels,
    mismatchedPixels,
    mismatchRatio,
    pixelMatchRatio: 1 - mismatchRatio,
  };
}
