import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { capturePage, closeSharedBrowser } from '../../src/capture/chromium.js';
import { runCompare } from '../../src/app/run-compare.js';

const tempDirs: string[] = [];

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('failed to bind'));
        return;
      }
      resolve(address.port);
    });
  });
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

afterAll(async () => {
  await closeSharedBrowser();
});

describe('capturePage', () => {
  it('captures a local fixture page at requested viewport', async () => {
    const html =
      '<!doctype html><html><body style="margin:0;background:#112233;width:100%;height:100%"></body></html>';
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(html);
    });
    const port = await listen(server);
    try {
      const result = await capturePage({
        url: `http://127.0.0.1:${port}/`,
        viewport: { width: 120, height: 80 },
      });
      expect(result.png.byteLength).toBeGreaterThan(100);
      expect(result.viewport).toEqual({ width: 120, height: 80 });
      expect(result.dpr).toBe(1);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

describe('runCompare URL mode', () => {
  it('compares target image against a captured local page', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pixelproof-url-'));
    tempDirs.push(dir);

    const targetPath = path.join(dir, 'target.png');
    await sharp({
      create: {
        width: 100,
        height: 60,
        channels: 3,
        background: { r: 17, g: 34, b: 51 },
      },
    })
      .png()
      .toFile(targetPath);

    const html =
      '<!doctype html><html><body style="margin:0;background:#112233;width:100%;height:100%"></body></html>';
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(html);
    });
    const port = await listen(server);

    try {
      const result = await runCompare({
        targetPath,
        actual: { kind: 'url', url: `http://127.0.0.1:${port}/` },
        outputDir: path.join(dir, 'report'),
        viewport: { width: 100, height: 60 },
        threshold: 0.1,
        includeAA: false,
      });
      expect(result.source.kind).toBe('url');
      expect(result.capture?.browser).toBe('chromium');
      expect(result.image).toEqual({ width: 100, height: 60 });
      // Solid near-identical colors should be very close under threshold.
      expect(result.metrics.mismatchRatio).toBeLessThan(0.05);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
