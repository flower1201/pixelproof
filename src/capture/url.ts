import { PixelProofError } from '../shared/errors.js';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export function assertLoopbackUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch (cause) {
    throw new PixelProofError('USAGE_ERROR', `invalid --url: ${rawUrl}`, 2, { cause });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new PixelProofError(
      'USAGE_ERROR',
      `unsupported URL protocol ${parsed.protocol}; only http: and https: are allowed`,
      2,
    );
  }

  if (parsed.username || parsed.password) {
    throw new PixelProofError(
      'USAGE_ERROR',
      'URL username/password is not allowed',
      2,
    );
  }

  const host = parsed.hostname.toLowerCase();
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new PixelProofError(
      'USAGE_ERROR',
      `URL host must be a loopback address (localhost, 127.0.0.1, [::1]); got ${parsed.hostname}`,
      2,
    );
  }

  return parsed;
}

export function isLoopbackHostname(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname.toLowerCase());
}
