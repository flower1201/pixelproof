import type { CompareOptions, CompareResult } from '../core/types.js';

function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(4)}%`;
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:@-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

function buildCliCommand(options: CompareOptions): string {
  const parts = [
    'pixelproof compare',
    `--target ${shellQuote(options.targetPath)}`,
  ];
  if (options.actual.kind === 'image') {
    parts.push(`--actual ${shellQuote(options.actual.path)}`);
  } else {
    parts.push(`--url ${shellQuote(options.actual.url)}`);
  }
  parts.push(`--out ${shellQuote(options.outputDir)}`);
  if (options.viewport) {
    parts.push(`--viewport ${options.viewport.width}x${options.viewport.height}`);
  }
  parts.push(`--threshold ${options.threshold}`);
  if (options.includeAA) parts.push('--include-aa');
  if (options.failAbove !== undefined) {
    parts.push(`--fail-above ${options.failAbove}`);
  }
  return parts.join(' \\\n  ');
}

export function renderFixInstructions(
  result: CompareResult,
  options: CompareOptions,
): string {
  const lines: string[] = [];
  lines.push('# PixelProof Fix Instructions');
  lines.push('');
  lines.push(
    'This checklist is derived from pixel differences. It is **not** a verified root-cause analysis. Treat every item as a suggested check that needs human or agent verification.',
  );
  lines.push('');
  lines.push('## Inputs & Environment');
  lines.push('');
  lines.push(`- Source: \`${result.source.kind}\` → \`${result.source.displayValue}\``);
  lines.push(`- Image size: ${result.image.width}×${result.image.height}`);
  if (result.capture) {
    lines.push(
      `- Capture: ${result.capture.browser}, viewport ${result.capture.viewport.width}×${result.capture.viewport.height}, DPR ${result.capture.dpr}`,
    );
  } else {
    lines.push('- Capture: none (image-to-image mode)');
  }
  lines.push(`- threshold: ${result.config.threshold}`);
  lines.push(`- includeAA: ${result.config.includeAA}`);
  if (result.config.failAbove !== undefined) {
    lines.push(`- failAbove: ${result.config.failAbove}`);
  }
  lines.push('');
  lines.push('## Pixel Difference Summary');
  lines.push('');
  lines.push(`- mismatchedPixels: ${result.metrics.mismatchedPixels}`);
  lines.push(`- totalPixels: ${result.metrics.totalPixels}`);
  lines.push(`- mismatchRatio: ${pct(result.metrics.mismatchRatio)}`);
  lines.push(`- pixelMatchRatio: ${pct(result.metrics.pixelMatchRatio)}`);
  lines.push('');
  lines.push(
    '`pixelMatchRatio` measures pixel agreement only. It is not a score of design quality, accessibility, or UX.',
  );
  lines.push('');
  lines.push('## Priority Regions');
  lines.push('');
  if (result.regions.length === 0) {
    lines.push('No priority regions. Pixel differences are zero or below region extraction.');
  } else {
    for (const region of result.regions) {
      const b = region.bounds;
      lines.push(
        `- **${region.id}**: bbox=(${b.x}, ${b.y}, ${b.width}, ${b.height}), mismatchedPixels=${region.mismatchedPixels}, density=${pct(region.mismatchDensity)}`,
      );
    }
  }
  lines.push('');
  lines.push('## Suggested Checks');
  lines.push('');
  if (result.regions.length === 0) {
    lines.push('No region-specific checks. If metrics are non-zero, inspect the diff image manually.');
  } else {
    lines.push(
      'For each priority region, inspect layout, spacing, sizing, typography, color, borders, and content. Do **not** assume a specific CSS file, class name, or DOM node is the cause.',
    );
    for (const region of result.regions) {
      const b = region.bounds;
      lines.push(
        `- ${region.id} around (${b.x}, ${b.y}) size ${b.width}×${b.height}: check visual alignment and styling in this area.`,
      );
    }
  }
  lines.push('');
  lines.push('## Verification');
  lines.push('');
  lines.push('Re-run:');
  lines.push('');
  lines.push('```bash');
  lines.push(buildCliCommand(options));
  lines.push('```');
  lines.push('');
  lines.push('Compare whether `mismatchRatio` decreased after your UI changes.');
  if (result.config.failAbove !== undefined) {
    lines.push(
      `Current fail threshold is ${result.config.failAbove}; exit code 10 means the ratio still exceeds this gate.`,
    );
  }
  lines.push('');
  lines.push('## Warnings & Limitations');
  lines.push('');
  if (result.warnings.length === 0) {
    lines.push('- None reported.');
  } else {
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push(
    '- Fonts, animations, dynamic content, platform rasterization, and anti-aliasing can affect pixel results.',
  );
  lines.push('');
  return `${lines.join('\n')}\n`;
}
