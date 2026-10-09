import { describe, expect, it } from 'vitest';
import { computePixelDiff, countMaskBits } from '../../src/core/pixel-diff.js';
import { extractRegions } from '../../src/core/regions.js';
import { buildMetrics } from '../../src/core/metrics.js';
import type { NormalizedImage } from '../../src/core/types.js';

function solid(width: number, height: number, rgba: [number, number, number, number]): NormalizedImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data.set(rgba, i * 4);
  }
  return { width, height, data };
}

function withBlock(
  base: NormalizedImage,
  x0: number,
  y0: number,
  w: number,
  h: number,
  rgba: [number, number, number, number],
): NormalizedImage {
  const data = new Uint8ClampedArray(base.data);
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) {
      data.set(rgba, (y * base.width + x) * 4);
    }
  }
  return { width: base.width, height: base.height, data };
}

describe('computePixelDiff', () => {
  it('reports zero mismatch for identical images', async () => {
    const a = solid(32, 32, [10, 20, 30, 255]);
    const b = solid(32, 32, [10, 20, 30, 255]);
    const diff = await computePixelDiff(a, b, { threshold: 0.1, includeAA: false });
    expect(diff.mismatchedPixels).toBe(0);
    expect(countMaskBits(diff.mask)).toBe(0);
    expect(extractRegions(diff.mask, 32, 32)).toEqual([]);
    const metrics = buildMetrics(32, 32, diff.mismatchedPixels);
    expect(metrics.mismatchRatio).toBe(0);
    expect(metrics.pixelMatchRatio).toBe(1);
  });

  it('counts a solid color block difference', async () => {
    const a = solid(40, 40, [255, 255, 255, 255]);
    const b = withBlock(a, 5, 5, 10, 8, [0, 0, 0, 255]);
    const diff = await computePixelDiff(a, b, { threshold: 0.1, includeAA: false });
    expect(diff.mismatchedPixels).toBe(80);
    expect(countMaskBits(diff.mask)).toBe(diff.mismatchedPixels);
    const regions = extractRegions(diff.mask, 40, 40);
    expect(regions.length).toBe(1);
    expect(regions[0]?.bounds).toEqual({ x: 5, y: 5, width: 10, height: 8 });
    expect(regions[0]?.mismatchedPixels).toBe(80);
  });
});
