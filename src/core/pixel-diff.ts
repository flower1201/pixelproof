import pixelmatch from 'pixelmatch';
import sharp from 'sharp';
import type { NormalizedImage, PixelDiffResult } from './types.js';

export async function computePixelDiff(
  target: NormalizedImage,
  actual: NormalizedImage,
  options: { threshold: number; includeAA: boolean },
): Promise<PixelDiffResult> {
  const { width, height } = target;
  const total = width * height;
  const diffRgba = new Uint8ClampedArray(total * 4);
  const mask = new Uint8Array(total);

  const mismatchedPixels = pixelmatch(
    target.data,
    actual.data,
    diffRgba,
    width,
    height,
    {
      threshold: options.threshold,
      includeAA: options.includeAA,
      diffMask: true,
      alpha: 0.1,
    },
  );

  // Build binary mask from diff output alpha/red channel produced by diffMask.
  for (let i = 0; i < total; i += 1) {
    const base = i * 4;
    const r = diffRgba[base] ?? 0;
    const g = diffRgba[base + 1] ?? 0;
    const b = diffRgba[base + 2] ?? 0;
    const a = diffRgba[base + 3] ?? 0;
    // With diffMask:true, mismatched pixels are opaque red-ish; matched are transparent.
    mask[i] = a > 0 && (r > 0 || g > 0 || b > 0) ? 1 : 0;
  }

  // Ensure transparent background PNG for visual diff (keep pixelmatch coloring).
  const diffPng = await sharp(Buffer.from(diffRgba.buffer, diffRgba.byteOffset, diffRgba.byteLength), {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();

  return { mismatchedPixels, mask, diffPng };
}

export function countMaskBits(mask: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i] === 1) count += 1;
  }
  return count;
}
