import { usageError } from './errors.js';
import {
  compareCliOptionsSchema,
  type CompareCliOptions,
} from '../shared/schemas.js';
import type { CompareOptions, InputSource } from '../core/types.js';

export function parseCompareCliOptions(raw: unknown): CompareCliOptions {
  const parsed = compareCliOptionsSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ');
    throw usageError(message);
  }
  return parsed.data;
}

export function toCompareOptions(cli: CompareCliOptions): CompareOptions {
  let actual: InputSource;
  if (cli.actual) {
    actual = { kind: 'image', path: cli.actual };
  } else if (cli.url) {
    actual = { kind: 'url', url: cli.url };
  } else {
    throw usageError('exactly one of --actual or --url is required');
  }

  const options: CompareOptions = {
    targetPath: cli.target,
    actual,
    outputDir: cli.out,
    threshold: cli.threshold,
    includeAA: cli.includeAa,
  };

  if (cli.viewport !== undefined) {
    options.viewport = cli.viewport;
  }
  if (cli.failAbove !== undefined) {
    options.failAbove = cli.failAbove;
  }

  return options;
}
