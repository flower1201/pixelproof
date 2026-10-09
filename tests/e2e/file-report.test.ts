import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { afterAll, describe, expect, it } from 'vitest';
import { runCompare } from '../../src/app/run-compare.js';
import { closeSharedBrowser } from '../../src/capture/chromium.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('offline file:// HTML report', () => {
  afterAll(async () => {
    await closeSharedBrowser();
  });

  it('opens report over file:// with interactive controls and no console errors', async () => {
    const out = path.join(root, '.tmp', 'file-report');
    fs.rmSync(out, { recursive: true, force: true });

    await runCompare({
      targetPath: path.join(root, 'tests/fixtures/diff-a.png'),
      actual: {
        kind: 'image',
        path: path.join(root, 'tests/fixtures/diff-b.png'),
      },
      outputDir: out,
      threshold: 0.1,
      includeAA: false,
    });

    const htmlPath = path.join(out, 'index.html');
    expect(fs.existsSync(htmlPath)).toBe(true);
    expect(fs.existsSync(path.join(out, 'target.png'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'actual.png'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'diff.png'))).toBe(true);

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(pathToFileURL(htmlPath).href, {
        waitUntil: 'domcontentloaded',
      });

      expect(await page.locator('button[data-view="ba"]').isVisible()).toBe(true);
      await page.click('button[data-view="overlay"]');
      await page.locator('#opacity').fill('30');
      await page.click('button[data-view="diff"]');
      expect(await page.locator('#img-diff').isVisible()).toBe(true);

      await page.waitForFunction(`() => {
        const ids = ['img-target', 'img-actual-ba', 'img-diff'];
        return ids.every((id) => {
          const img = document.getElementById(id);
          return !!(img && img.complete && img.naturalWidth > 0);
        });
      }`);

      // String must be an IIFE expression; a bare `() => {}` is not invoked by evaluate.
      const loaded = (await page.evaluate(`(() => {
        const ids = ['img-target', 'img-actual-ba', 'img-diff'];
        const results = {};
        for (const id of ids) {
          const img = document.getElementById(id);
          results[id] = !!(img && img.complete && img.naturalWidth > 0);
        }
        return results;
      })()`)) as Record<string, boolean>;

      expect(loaded).toEqual({
        'img-target': true,
        'img-actual-ba': true,
        'img-diff': true,
      });
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  }, 60_000);
});
