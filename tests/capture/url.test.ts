import { describe, expect, it } from 'vitest';
import { assertLoopbackUrl } from '../../src/capture/url.js';
import { PixelProofError } from '../../src/shared/errors.js';

describe('assertLoopbackUrl', () => {
  it('accepts localhost http', () => {
    expect(assertLoopbackUrl('http://localhost:3000/app').hostname).toBe('localhost');
  });

  it('accepts 127.0.0.1', () => {
    expect(assertLoopbackUrl('http://127.0.0.1:8080/').hostname).toBe('127.0.0.1');
  });

  it('rejects public hosts', () => {
    expect(() => assertLoopbackUrl('https://example.com')).toThrow(PixelProofError);
  });

  it('rejects credentials', () => {
    expect(() => assertLoopbackUrl('http://user:pass@localhost:3000')).toThrow(
      /username\/password/,
    );
  });

  it('rejects file protocol', () => {
    expect(() => assertLoopbackUrl('file:///tmp/a.html')).toThrow(/protocol/);
  });
});
