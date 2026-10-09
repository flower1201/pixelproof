import fs from 'node:fs/promises';
import sharp from 'sharp';
import { imageError, PixelProofError } from '../shared/errors.js';
import type { NormalizedImage } from './types.js';

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_SIDE = 4096;
const MAX_TOTAL_PIXELS = 16_000_000;

export async function normalizeImage(inputPath: string): Promise<NormalizedImage> {
  let stat;
  try {
    stat = await fs.stat(inputPath);
  } catch (cause) {
    throw imageError('IMAGE_READ_ERROR', `cannot read image: ${inputPath}`, cause);
  }

  if (!stat.isFile()) {
    throw imageError('IMAGE_READ_ERROR', `not a file: ${inputPath}`);
  }
  if (stat.size > MAX_FILE_BYTES) {
    throw imageError(
      'IMAGE_TOO_LARGE',
      `file exceeds 25 MiB limit: ${inputPath} (${stat.size} bytes)`,
    );
  }

  return normalizeImageInput(inputPath, inputPath);
}

export async function normalizeImageBuffer(
  buffer: Buffer,
  label = 'buffer',
): Promise<NormalizedImage> {
  if (buffer.byteLength > MAX_FILE_BYTES) {
    throw imageError(
      'IMAGE_TOO_LARGE',
      `file exceeds 25 MiB limit: ${label} (${buffer.byteLength} bytes)`,
    );
  }
  return normalizeImageInput(buffer, label);
}

async function normalizeImageInput(
  input: string | Buffer,
  label: string,
): Promise<NormalizedImage> {
  let meta;
  try {
    meta = await sharp(input, {
      failOn: 'error',
      limitInputPixels: MAX_TOTAL_PIXELS,
    }).metadata();
  } catch (cause) {
    throw imageError('IMAGE_DECODE_ERROR', `cannot decode image: ${label}`, cause);
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width <= 0 || height <= 0) {
    throw imageError('IMAGE_DECODE_ERROR', `invalid image dimensions: ${label}`);
  }
  if (width > MAX_SIDE || height > MAX_SIDE) {
    throw imageError(
      'IMAGE_TOO_LARGE',
      `image side exceeds ${MAX_SIDE}px: ${width}x${height} (${label})`,
    );
  }
  if (width * height > MAX_TOTAL_PIXELS) {
    throw imageError(
      'IMAGE_TOO_LARGE',
      `image exceeds ${MAX_TOTAL_PIXELS} pixels: ${width}x${height} (${label})`,
    );
  }

  try {
    const { data, info } = await sharp(input, {
      failOn: 'error',
      limitInputPixels: MAX_TOTAL_PIXELS,
    })
      .rotate()
      .toColorspace('srgb')
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (info.channels !== 4) {
      throw imageError(
        'IMAGE_DECODE_ERROR',
        `expected RGBA output, got ${info.channels} channels: ${label}`,
      );
    }

    return {
      width: info.width,
      height: info.height,
      data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    };
  } catch (cause) {
    if (cause instanceof PixelProofError) {
      throw cause;
    }
    throw imageError('IMAGE_DECODE_ERROR', `cannot normalize image: ${label}`, cause);
  }
}

export function assertSameDimensions(
  target: NormalizedImage,
  actual: NormalizedImage,
): void {
  if (target.width !== actual.width || target.height !== actual.height) {
    throw imageError(
      'IMAGE_DIMENSION_MISMATCH',
      `target=${target.width}x${target.height} actual=${actual.width}x${actual.height}; re-export reference or fix --viewport`,
    );
  }
}
