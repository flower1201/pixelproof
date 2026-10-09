import { describe, expect, it } from 'vitest';
import { renderHtmlReport } from '../../src/report/render-html.js';
import { renderFixInstructions } from '../../src/report/render-markdown.js';
import type { CompareOptions, CompareResult } from '../../src/core/types.js';

const result: CompareResult = {
  schemaVersion: '1.0',
  engineVersion: '0.1.0',
  source: { kind: 'image', displayValue: 'x<script>.png' },
  image: { width: 10, height: 10 },
  metrics: {
    totalPixels: 100,
    mismatchedPixels: 4,
    mismatchRatio: 0.04,
    pixelMatchRatio: 0.96,
  },
  config: { threshold: 0.1, includeAA: false },
  regions: [
    {
      id: 'region-1',
      bounds: { x: 1, y: 2, width: 3, height: 4 },
      mismatchedPixels: 4,
      areaPixels: 12,
      mismatchDensity: 4 / 12,
    },
  ],
  warnings: ['watch </script>'],
  artifacts: {
    target: 'target.png',
    actual: 'actual.png',
    diff: 'diff.png',
    html: 'index.html',
    markdown: 'fix-instructions.md',
  },
};

const options: CompareOptions = {
  targetPath: './a.png',
  actual: { kind: 'image', path: './b.png' },
  outputDir: './out',
  threshold: 0.1,
  includeAA: false,
};

describe('report renderers', () => {
  it('escapes HTML-sensitive values in embedded JSON', () => {
    const html = renderHtmlReport(result);
    expect(html).toContain('\\u003c');
    expect(html).toContain('x\\u003cscript\\u003e.png');
    expect(html).toContain('watch \\u003c/script\\u003e');
    expect(html).toContain('Before / After');
  });

  it('renders deterministic markdown chapters', () => {
    const md = renderFixInstructions(result, options);
    expect(md).toContain('## Inputs & Environment');
    expect(md).toContain('## Pixel Difference Summary');
    expect(md).toContain('## Priority Regions');
    expect(md).toContain('## Suggested Checks');
    expect(md).toContain('## Verification');
    expect(md).toContain('## Warnings & Limitations');
    expect(md).toContain('region-1');
  });
});
