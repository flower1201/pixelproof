import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { closeSharedBrowser, runCompare } from '../dist/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'examples', 'basic-ui');
const viewport = { width: 720, height: 420 };

async function serveDir(baseDir) {
  const server = http.createServer(async (req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    const rel = urlPath === '/' ? 'expected.html' : urlPath.replace(/^\//, '');
    const file = path.join(baseDir, rel);
    try {
      const data = await fs.readFile(file);
      const ext = path.extname(file).toLowerCase();
      const type =
        ext === '.html'
          ? 'text/html; charset=utf-8'
          : ext === '.png'
            ? 'image/png'
            : 'application/octet-stream';
      res.writeHead(200, { 'content-type': type });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });

  const port = await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') reject(new Error('bind failed'));
      else resolve(addr.port);
    });
  });

  return {
    port,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

async function main() {
  const targetPath = path.join(dir, 'target.png');
  const outDir = path.join(dir, 'report');
  const { port, close } = await serveDir(dir);

  try {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({
        viewport,
        deviceScaleFactor: 1,
        colorScheme: 'light',
        reducedMotion: 'reduce',
        locale: 'en-US',
        timezoneId: 'UTC',
      });
      await page.goto(`http://127.0.0.1:${port}/expected.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });
      await new Promise((r) => setTimeout(r, 200));
      await page.screenshot({
        path: targetPath,
        type: 'png',
        fullPage: false,
        animations: 'disabled',
        caret: 'hide',
        scale: 'css',
      });
      await page.close();
    } finally {
      await browser.close();
    }

    const result = await runCompare({
      targetPath,
      actual: {
        kind: 'url',
        url: `http://127.0.0.1:${port}/actual.html`,
      },
      outputDir: outDir,
      viewport,
      threshold: 0.1,
      includeAA: false,
    });

    process.stdout.write(
      `PixelProof example: mismatchRatio=${(result.metrics.mismatchRatio * 100).toFixed(4)}% mismatchedPixels=${result.metrics.mismatchedPixels}\n`,
    );
    process.stdout.write(`Report: ${outDir}\n`);
  } finally {
    await closeSharedBrowser();
    await close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exit(1);
});
