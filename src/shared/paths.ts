import path from 'node:path';

export const REPORT_FILES = {
  target: 'target.png',
  actual: 'actual.png',
  diff: 'diff.png',
  html: 'index.html',
  json: 'result.json',
  markdown: 'fix-instructions.md',
} as const;

export function resolveReportPath(outputDir: string, file: string): string {
  return path.join(outputDir, file);
}
