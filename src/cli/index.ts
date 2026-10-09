import { Command } from 'commander';
import { runCompare } from '../app/run-compare.js';
import { ENGINE_VERSION } from '../version.js';
import { EXIT, formatError, toExitCode } from './errors.js';
import { parseCompareCliOptions, toCompareOptions } from './options.js';

export async function main(argv = process.argv): Promise<number> {
  const program = new Command();
  program.exitOverride();

  program
    .name('pixelproof')
    .description('Local-first visual feedback for AI-generated web interfaces')
    .version(ENGINE_VERSION);

  program
    .command('compare')
    .description('Compare a target design image against an actual image or local URL')
    .requiredOption('--target <file>', 'path to target/reference image')
    .option('--actual <file>', 'path to actual screenshot image')
    .option('--url <address>', 'local loopback page URL to capture')
    .option('--out <dir>', 'output report directory', './pixelproof-report')
    .option('--viewport <size>', 'viewport as WxH (URL mode only)')
    .option('--threshold <n>', 'per-pixel color threshold 0..1', '0.1')
    .option('--include-aa', 'include anti-aliased pixels as differences', false)
    .option('--fail-above <n>', 'exit 10 when mismatchRatio exceeds this value')
    .action(async (opts: Record<string, unknown>) => {
      const cli = parseCompareCliOptions({
        target: opts.target,
        actual: opts.actual,
        url: opts.url,
        out: opts.out,
        viewport: opts.viewport,
        threshold: opts.threshold,
        includeAa: Boolean(opts.includeAa),
        failAbove: opts.failAbove,
      });

      const options = toCompareOptions(cli);
      const result = await runCompare(options);

      const ratioPct = (result.metrics.mismatchRatio * 100).toFixed(4);
      process.stdout.write(
        `PixelProof: mismatchRatio=${ratioPct}% mismatchedPixels=${result.metrics.mismatchedPixels} out=${options.outputDir}\n`,
      );

      if (
        options.failAbove !== undefined &&
        result.metrics.mismatchRatio > options.failAbove
      ) {
        throw Object.assign(new Error('mismatch ratio exceeds --fail-above'), {
          exitCode: EXIT.FAIL_ABOVE,
        });
      }
    });

  try {
    await program.parseAsync(argv);
    return EXIT.OK;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'exitCode' in error &&
      (error as { exitCode?: number }).exitCode === EXIT.FAIL_ABOVE
    ) {
      return EXIT.FAIL_ABOVE;
    }
    // Commander help/version exits
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      ((error as { code?: string }).code === 'commander.helpDisplayed' ||
        (error as { code?: string }).code === 'commander.version')
    ) {
      return EXIT.OK;
    }
    process.stderr.write(`${formatError(error)}\n`);
    return toExitCode(error);
  }
}

const exitCode = await main();
process.exit(exitCode);
