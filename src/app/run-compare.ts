import { capturePage } from '../capture/chromium.js';
import {
  comparePrepared,
  prepareBufferActual,
  prepareImageActual,
} from '../core/compare.js';
import { normalizeImage } from '../core/normalize.js';
import type { CompareOptions, CompareResult } from '../core/types.js';
import { writeReportBundle } from '../report/write-report.js';

/**
 * Application orchestration: capture (optional) → core compare → report artifacts.
 * Keeps Playwright out of src/core and HTML out of core algorithms.
 */
export async function runCompare(options: CompareOptions): Promise<CompareResult> {
  let prepared;
  if (options.actual.kind === 'image') {
    prepared = await prepareImageActual(options.actual.path);
  } else {
    const target = await normalizeImage(options.targetPath);
    const viewport = options.viewport ?? {
      width: target.width,
      height: target.height,
    };
    const captured = await capturePage({
      url: options.actual.url,
      viewport,
    });
    prepared = await prepareBufferActual(
      captured.png,
      {
        browser: 'chromium',
        viewport: captured.viewport,
        dpr: 1,
      },
      captured.warnings,
    );
  }

  const { result, artifacts } = await comparePrepared(options, prepared);
  return writeReportBundle({ options, result, artifacts });
}
