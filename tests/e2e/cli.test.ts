import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cli = path.join(root, 'dist/cli/index.js');
const fixtures = path.join(root, 'tests/fixtures');

describe('CLI e2e', () => {
  it('prints help', () => {
    const result = spawnSync(process.execPath, [cli, '--help'], {
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('pixelproof');
  });

  it('compares identical fixture images', () => {
    const out = path.join(root, '.tmp', 'e2e-same');
    fs.rmSync(out, { recursive: true, force: true });
    const result = spawnSync(
      process.execPath,
      [
        cli,
        'compare',
        '--target',
        path.join(fixtures, 'same-a.png'),
        '--actual',
        path.join(fixtures, 'same-b.png'),
        '--out',
        out,
      ],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('mismatchRatio=0.0000%');
    expect(fs.existsSync(path.join(out, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'result.json'))).toBe(true);
  });
});
