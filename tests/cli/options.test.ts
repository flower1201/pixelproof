import { describe, expect, it } from 'vitest';
import { parseCompareCliOptions, toCompareOptions } from '../../src/cli/options.js';
import { PixelProofError } from '../../src/shared/errors.js';

describe('parseCompareCliOptions', () => {
  it('accepts image mode defaults', () => {
    const parsed = parseCompareCliOptions({
      target: './a.png',
      actual: './b.png',
    });
    expect(parsed.out).toBe('./pixelproof-report');
    expect(parsed.threshold).toBe(0.1);
    expect(parsed.includeAa).toBe(false);
  });

  it('rejects missing actual and url', () => {
    expect(() => parseCompareCliOptions({ target: './a.png' })).toThrow(PixelProofError);
  });

  it('rejects both actual and url', () => {
    expect(() =>
      parseCompareCliOptions({
        target: './a.png',
        actual: './b.png',
        url: 'http://localhost:3000',
      }),
    ).toThrow(/exactly one/);
  });

  it('rejects viewport without url', () => {
    expect(() =>
      parseCompareCliOptions({
        target: './a.png',
        actual: './b.png',
        viewport: '1440x900',
      }),
    ).toThrow(/viewport/);
  });

  it('maps to CompareOptions', () => {
    const options = toCompareOptions(
      parseCompareCliOptions({
        target: './a.png',
        actual: './b.png',
        threshold: '0.2',
        includeAa: true,
        failAbove: '0.05',
      }),
    );
    expect(options.actual).toEqual({ kind: 'image', path: './b.png' });
    expect(options.threshold).toBe(0.2);
    expect(options.includeAA).toBe(true);
    expect(options.failAbove).toBe(0.05);
  });
});
