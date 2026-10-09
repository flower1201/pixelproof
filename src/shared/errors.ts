export const EXIT = {
  OK: 0,
  USAGE: 2,
  CAPTURE: 3,
  IMAGE: 4,
  REPORT: 5,
  FAIL_ABOVE: 10,
} as const;

export type ExitCode = (typeof EXIT)[keyof typeof EXIT];

export type PixelProofErrorCode =
  | 'USAGE_ERROR'
  | 'IMAGE_READ_ERROR'
  | 'IMAGE_DECODE_ERROR'
  | 'IMAGE_TOO_LARGE'
  | 'IMAGE_DIMENSION_MISMATCH'
  | 'CAPTURE_ERROR'
  | 'REPORT_WRITE_ERROR'
  | 'INTERNAL_ERROR';

export class PixelProofError extends Error {
  readonly code: PixelProofErrorCode;
  readonly exitCode: ExitCode;

  constructor(
    code: PixelProofErrorCode,
    message: string,
    exitCode: ExitCode,
    options?: { cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'PixelProofError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

export function usageError(message: string): PixelProofError {
  return new PixelProofError('USAGE_ERROR', message, EXIT.USAGE);
}

export function imageError(
  code: Exclude<
    PixelProofErrorCode,
    'USAGE_ERROR' | 'CAPTURE_ERROR' | 'REPORT_WRITE_ERROR' | 'INTERNAL_ERROR'
  >,
  message: string,
  cause?: unknown,
): PixelProofError {
  return new PixelProofError(
    code,
    message,
    EXIT.IMAGE,
    cause !== undefined ? { cause } : undefined,
  );
}

export function reportError(message: string, cause?: unknown): PixelProofError {
  return new PixelProofError(
    'REPORT_WRITE_ERROR',
    message,
    EXIT.REPORT,
    cause !== undefined ? { cause } : undefined,
  );
}

export function toExitCode(error: unknown): ExitCode {
  if (error instanceof PixelProofError) {
    return error.exitCode;
  }
  return EXIT.USAGE;
}

function causeMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('cause' in error)) return undefined;
  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof Error) return cause.message;
  if (cause !== undefined) return String(cause);
  return undefined;
}

export function formatError(error: unknown): string {
  if (error instanceof PixelProofError) {
    const cause = causeMessage(error);
    return cause
      ? `${error.code}: ${error.message} (${cause})`
      : `${error.code}: ${error.message}`;
  }
  if (error instanceof Error) {
    return `INTERNAL_ERROR: ${error.message}`;
  }
  return `INTERNAL_ERROR: ${String(error)}`;
}
