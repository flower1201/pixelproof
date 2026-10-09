import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { assertSameDimensions, normalizeImage } from '../../src/core/normalize.js';
import { PixelProofError } from '../../src/shared/errors.js';

const tempDirs: string[] = [];

async function makeTempPng(
  name: string,
  width: number,
  height: number,
  color: { r: number; g: number; b: number; alpha?: number },
): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pixelproof-'));
  tempDirs.push(dir);
  const file = path.join(dir, name);
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: color.r, g: color.g, b: color.b, alpha: color.alpha ?? 1 },
    },
  })
    .png()
    .toFile(file);
  return file;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe('normalizeImage', () => {
  it('returns RGBA buffer for solid PNG', async () => {
    const file = await makeTempPng('red.png', 16, 8, { r: 255, g: 0, b: 0 });
    const image = await normalizeImage(file);
    expect(image.width).toBe(16);
    expect(image.height).toBe(8);
    expect(image.data.length).toBe(16 * 8 * 4);
    expect(image.data[0]).toBe(255);
    expect(image.data[1]).toBe(0);
    expect(image.data[2]).toBe(0);
    expect(image.data[3]).toBe(255);
  });

  it('flattens transparency onto white', async () => {
    const file = await makeTempPng('alpha.png', 2, 2, {
      r: 0,
      g: 0,
      b: 0,
      alpha: 0,
    });
    const image = await normalizeImage(file);
    expect(image.data[0]).toBe(255);
    expect(image.data[1]).toBe(255);
    expect(image.data[2]).toBe(255);
    expect(image.data[3]).toBe(255);
  });

  it('throws on missing file', async () => {
    await expect(normalizeImage('does-not-exist.png')).rejects.toBeInstanceOf(
      PixelProofError,
    );
  });

  it('throws on dimension mismatch', async () => {
    const a = await makeTempPng('a.png', 10, 10, { r: 0, g: 0, b: 0 });
    const b = await makeTempPng('b.png', 12, 10, { r: 0, g: 0, b: 0 });
    const left = await normalizeImage(a);
    const right = await normalizeImage(b);
    try {
      assertSameDimensions(left, right);
      expect.fail('expected dimension mismatch');
    } catch (error) {
      expect(error).toBeInstanceOf(PixelProofError);
      expect((error as PixelProofError).code).toBe('IMAGE_DIMENSION_MISMATCH');
      expect((error as PixelProofError).message).toMatch(/target=10x10 actual=12x10/);
    }
  });
});
