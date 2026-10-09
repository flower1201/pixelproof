import { chromium, type Browser } from 'playwright';
import { PixelProofError } from '../shared/errors.js';
import type { Size } from '../core/types.js';
import { assertLoopbackUrl, isLoopbackHostname } from './url.js';

export type CaptureOptions = {
  url: string;
  viewport: Size;
  navigationTimeoutMs?: number;
  settleTimeoutMs?: number;
};

export type CaptureResult = {
  png: Buffer;
  viewport: Size;
  dpr: 1;
  warnings: string[];
  finalUrl: string;
};

let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.isConnected()) {
    return sharedBrowser;
  }
  try {
    sharedBrowser = await chromium.launch({
      headless: true,
    });
    return sharedBrowser;
  } catch (cause) {
    throw new PixelProofError(
      'CAPTURE_ERROR',
      'failed to launch Chromium; run: npx playwright install chromium',
      3,
      { cause },
    );
  }
}

/** Close shared browser (tests / process shutdown). */
export async function closeSharedBrowser(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => undefined);
    sharedBrowser = null;
  }
}

export async function capturePage(options: CaptureOptions): Promise<CaptureResult> {
  const parsed = assertLoopbackUrl(options.url);
  const warnings: string[] = [];
  const navigationTimeoutMs = options.navigationTimeoutMs ?? 15_000;
  const settleTimeoutMs = options.settleTimeoutMs ?? 3_000;

  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: {
      width: options.viewport.width,
      height: options.viewport.height,
    },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
    javaScriptEnabled: true,
  });

  const page = await context.newPage();

  try {
    page.on('framenavigated', (frame) => {
      if (frame !== page.mainFrame()) return;
      try {
        const next = new URL(frame.url());
        if (!isLoopbackHostname(next.hostname)) {
          warnings.push(
            `blocked or detected non-loopback navigation target: ${next.hostname}`,
          );
        }
      } catch {
        // ignore parse failures
      }
    });

    try {
      await page.goto(parsed.toString(), {
        waitUntil: 'domcontentloaded',
        timeout: navigationTimeoutMs,
      });
    } catch (cause) {
      throw new PixelProofError(
        'CAPTURE_ERROR',
        `navigation failed for ${parsed.toString()}`,
        3,
        { cause },
      );
    }

    const finalUrl = page.url();
    try {
      const finalParsed = new URL(finalUrl);
      if (!isLoopbackHostname(finalParsed.hostname)) {
        throw new PixelProofError(
          'CAPTURE_ERROR',
          `top-level navigation left loopback host: ${finalParsed.hostname}`,
          3,
        );
      }
      if (finalParsed.username || finalParsed.password) {
        throw new PixelProofError(
          'CAPTURE_ERROR',
          'final URL must not include credentials',
          3,
        );
      }
    } catch (cause) {
      if (cause instanceof PixelProofError) throw cause;
      throw new PixelProofError('CAPTURE_ERROR', `invalid final URL: ${finalUrl}`, 3, {
        cause,
      });
    }

    try {
      // String form avoids pulling DOM libs into the Node TS project.
      await page.evaluate(`async () => {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      }`);
    } catch {
      warnings.push('document.fonts.ready wait failed or timed out');
    }

    try {
      await page.evaluate(`async () => {
        const images = Array.from(document.images);
        await Promise.all(
          images.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            });
          }),
        );
      }`);
    } catch {
      warnings.push('image decode wait failed');
    }

    // Brief layout settle; bounded.
    await new Promise((resolve) => {
      setTimeout(resolve, Math.min(settleTimeoutMs, 250));
    });

    let png: Buffer;
    try {
      png = await page.screenshot({
        type: 'png',
        fullPage: false,
        animations: 'disabled',
        caret: 'hide',
        scale: 'css',
        timeout: navigationTimeoutMs,
      });
    } catch (cause) {
      throw new PixelProofError('CAPTURE_ERROR', 'screenshot failed', 3, { cause });
    }

    return {
      png,
      viewport: options.viewport,
      dpr: 1,
      warnings,
      finalUrl,
    };
  } finally {
    await page.close().catch(() => undefined);
    await context.close().catch(() => undefined);
  }
}
