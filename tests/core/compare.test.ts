import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { runCompare } from '../../src/app/run-compare.js';
import { PixelProofError } from '../../src/shared/errors.js';

const tempDirs: string[] = [];

async function png(
  dir: string,
  name: string,
  width: number,
  height: number,
  color: { r: number; g: number; b: number },
): Promise<string> {
  const file = path.join(dir, name);
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
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

describe('runCompare image mode', () => {
  it('writes report artifacts including HTML and markdown', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pixelproof-cmp-'));
    tempDirs.push(dir);
    const target = await png(dir, 'target.png', 20, 20, { r: 255, g: 0, b: 0 });
    const actual = await png(dir, 'actual.png', 20, 20, { r: 0, g: 0, b: 255 });
    const out = path.join(dir, 'report');

    const result = await runCompare({
      targetPath: target,
      actual: { kind: 'image', path: actual },
      outputDir: out,
      threshold: 0.1,
      includeAA: false,
    });

    expect(result.schemaVersion).toBe('1.0');
    expect(result.metrics.mismatchedPixels).toBeGreaterThan(0);
    const html = await fs.readFile(path.join(out, 'index.html'), 'utf8');
    const md = await fs.readFile(path.join(out, 'fix-instructions.md'), 'utf8');
    expect(html).toContain('Before / After');
    expect(html).toContain('const data = ');
    expect(md).toContain('# PixelProof Fix Instructions');
    expect(md).toContain('## Priority Regions');
    await expect(fs.stat(path.join(out, 'result.json'))).resolves.toBeTruthy();
    await expect(fs.stat(path.join(out, 'diff.png'))).resolves.toBeTruthy();
  });

  it('fails fast on size mismatch', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pixelproof-cmp-'));
    tempDirs.push(dir);
    const target = await png(dir, 'target.png', 20, 20, { r: 0, g: 0, b: 0 });
    const actual = await png(dir, 'actual.png', 21, 20, { r: 0, g: 0, b: 0 });

    await expect(
      runCompare({
        targetPath: target,
        actual: { kind: 'image', path: actual },
        outputDir: path.join(dir, 'report'),
        threshold: 0.1,
        includeAA: false,
      }),
    ).rejects.toMatchObject({ code: 'IMAGE_DIMENSION_MISMATCH' } satisfies Partial<PixelProofError>);
  });
});
