import fs from 'node:fs/promises';
import sharp from 'sharp';
import type { CompareArtifacts } from '../core/compare.js';
import type { CompareOptions, CompareResult, NormalizedImage } from '../core/types.js';
import { reportError } from '../shared/errors.js';
import { REPORT_FILES, resolveReportPath } from '../shared/paths.js';
import { renderHtmlReport } from './render-html.js';
import { renderFixInstructions } from './render-markdown.js';

async function writeNormalizedPng(
  image: NormalizedImage,
  outputPath: string,
): Promise<void> {
  await sharp(Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength), {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .png()
    .toFile(outputPath);
}

export async function writeReportBundle(args: {
  options: CompareOptions;
  result: CompareResult;
  artifacts: CompareArtifacts;
}): Promise<CompareResult> {
  const { options, result, artifacts } = args;

  try {
    await fs.mkdir(options.outputDir, { recursive: true });
  } catch (cause) {
    throw reportError(`cannot create output directory: ${options.outputDir}`, cause);
  }

  const targetOut = resolveReportPath(options.outputDir, REPORT_FILES.target);
  const actualOut = resolveReportPath(options.outputDir, REPORT_FILES.actual);
  const diffOut = resolveReportPath(options.outputDir, REPORT_FILES.diff);
  const jsonOut = resolveReportPath(options.outputDir, REPORT_FILES.json);
  const htmlOut = resolveReportPath(options.outputDir, REPORT_FILES.html);
  const mdOut = resolveReportPath(options.outputDir, REPORT_FILES.markdown);

  try {
    await writeNormalizedPng(artifacts.targetRgba, targetOut);
    await writeNormalizedPng(artifacts.actualRgba, actualOut);
    await fs.writeFile(diffOut, artifacts.diffPng);
    await fs.writeFile(jsonOut, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    await fs.writeFile(htmlOut, renderHtmlReport(result), 'utf8');
    await fs.writeFile(mdOut, renderFixInstructions(result, options), 'utf8');
    return result;
  } catch (cause) {
    throw reportError(`failed to write report artifacts in ${options.outputDir}`, cause);
  }
}
