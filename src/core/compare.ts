import path from 'node:path';
import { ENGINE_VERSION } from '../version.js';
import {
  assertSameDimensions,
  normalizeImage,
  normalizeImageBuffer,
} from './normalize.js';
import { computePixelDiff } from './pixel-diff.js';
import { buildMetrics } from './metrics.js';
import { extractRegions } from './regions.js';
import type {
  CompareOptions,
  CompareResult,
  NormalizedImage,
} from './types.js';

export type PreparedActual = {
  image: NormalizedImage;
  capture?: CompareResult['capture'];
  warnings: string[];
};

export type CompareArtifacts = {
  targetRgba: NormalizedImage;
  actualRgba: NormalizedImage;
  diffPng: Buffer;
};

export type CoreCompareOutput = {
  result: CompareResult;
  artifacts: CompareArtifacts;
};

function sourceDisplayValue(options: CompareOptions): CompareResult['source'] {
  if (options.actual.kind === 'image') {
    return { kind: 'image', displayValue: path.basename(options.actual.path) };
  }
  try {
    const parsed = new URL(options.actual.url);
    parsed.username = '';
    parsed.password = '';
    parsed.search = '';
    parsed.hash = '';
    return { kind: 'url', displayValue: parsed.toString() };
  } catch {
    return { kind: 'url', displayValue: 'invalid-url' };
  }
}

/** Normalize target + actual image path. No Playwright / report. */
export async function prepareImageActual(actualPath: string): Promise<PreparedActual> {
  return {
    image: await normalizeImage(actualPath),
    warnings: [],
  };
}

/** Normalize an already-captured PNG buffer. No Playwright import here. */
export async function prepareBufferActual(
  png: Buffer,
  capture: NonNullable<CompareResult['capture']>,
  warnings: string[] = [],
): Promise<PreparedActual> {
  return {
    image: await normalizeImageBuffer(png, 'capture.png'),
    capture,
    warnings,
  };
}

/**
 * Pure core compare. Does not write files and does not import Playwright/HTML.
 */
export async function comparePrepared(
  options: CompareOptions,
  preparedActual: PreparedActual,
): Promise<CoreCompareOutput> {
  const warnings: string[] = [...preparedActual.warnings];
  const target = await normalizeImage(options.targetPath);
  const actual = preparedActual.image;
  assertSameDimensions(target, actual);

  const diff = await computePixelDiff(target, actual, {
    threshold: options.threshold,
    includeAA: options.includeAA,
  });
  const metrics = buildMetrics(target.width, target.height, diff.mismatchedPixels);
  const regions = extractRegions(diff.mask, target.width, target.height);

  const result: CompareResult = {
    schemaVersion: '1.0',
    engineVersion: ENGINE_VERSION,
    source: sourceDisplayValue(options),
    image: { width: target.width, height: target.height },
    ...(preparedActual.capture ? { capture: preparedActual.capture } : {}),
    metrics,
    config: {
      threshold: options.threshold,
      includeAA: options.includeAA,
      ...(options.failAbove !== undefined ? { failAbove: options.failAbove } : {}),
    },
    regions,
    warnings,
    artifacts: {
      target: 'target.png',
      actual: 'actual.png',
      diff: 'diff.png',
      html: 'index.html',
      markdown: 'fix-instructions.md',
    },
  };

  return {
    result,
    artifacts: {
      targetRgba: target,
      actualRgba: actual,
      diffPng: diff.diffPng,
    },
  };
}

/** Convenience for image-to-image unit tests. */
export async function compareImages(options: CompareOptions): Promise<CoreCompareOutput> {
  if (options.actual.kind !== 'image') {
    throw new Error('compareImages() only supports image actual');
  }
  const prepared = await prepareImageActual(options.actual.path);
  return comparePrepared(options, prepared);
}
