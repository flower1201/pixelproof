import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportDir = path.join(root, 'examples', 'out-diff');
const framesDir = path.join(root, 'examples', 'demo-frames');
const outGif = path.join(root, 'examples', 'pixelproof-demo.gif');

async function main() {
  await fs.mkdir(framesDir, { recursive: true });

  const server = http.createServer(async (req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
    const file = path.join(reportDir, rel);
    try {
      const data = await fs.readFile(file);
      const ext = path.extname(file).toLowerCase();
      const type =
        ext === '.html'
          ? 'text/html'
          : ext === '.png'
            ? 'image/png'
            : ext === '.json'
              ? 'application/json'
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

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 960, height: 720 },
    deviceScaleFactor: 1,
  });

  try {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 300));

    const shots = [
      ['01-ba.png', async () => {
        await page.click('button[data-view="ba"]');
        await page.locator('#ba-range').fill('35');
      }],
      ['02-ba-mid.png', async () => {
        await page.locator('#ba-range').fill('65');
      }],
      ['03-overlay.png', async () => {
        await page.click('button[data-view="overlay"]');
        await page.locator('#opacity').fill('55');
      }],
      ['04-diff.png', async () => {
        await page.click('button[data-view="diff"]');
      }],
    ];

    for (const [name, prep] of shots) {
      await prep();
      await new Promise((r) => setTimeout(r, 150));
      await page.screenshot({
        path: path.join(framesDir, name),
        type: 'png',
      });
    }
  } finally {
    await page.close();
    await browser.close();
    await new Promise((resolve) => server.close(() => resolve()));
  }

  const listFile = path.join(framesDir, 'frames.txt');
  const lines = [
    "file '01-ba.png'",
    'duration 1.2',
    "file '02-ba-mid.png'",
    'duration 1.2',
    "file '03-overlay.png'",
    'duration 1.2',
    "file '04-diff.png'",
    'duration 1.5',
    "file '04-diff.png'",
  ];
  await fs.writeFile(listFile, `${lines.join('\n')}\n`, 'utf8');

  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listFile,
      '-vf',
      'fps=8,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse',
      '-loop',
      '0',
      outGif,
    ],
    { cwd: framesDir, encoding: 'utf8' },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || 'ffmpeg failed\n');
    process.exit(result.status ?? 1);
  }

  process.stdout.write(`Wrote ${outGif}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exit(1);
});
