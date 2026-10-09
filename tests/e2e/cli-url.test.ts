import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cli = path.join(root, 'dist/cli/index.js');
const fixtureHtml = path.join(root, 'examples/basic-ui/actual.html');
const target = path.join(root, 'examples/basic-ui/target.png');

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('bind failed'));
        return;
      }
      resolve(address.port);
    });
  });
}

function runCli(args: string[]): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    // IMPORTANT: use async spawn, not spawnSync. spawnSync blocks the event loop and
    // starves any HTTP server running in this same process.
    const child = spawn(process.execPath, [cli, ...args], {
      cwd: root,
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('close', (status) => {
      resolve({ status, stdout, stderr });
    });
  });
}

describe('CLI URL mode (packed entry)', () => {
  const servers: http.Server[] = [];

  afterAll(async () => {
    await Promise.all(
      servers.map(
        (server) =>
          new Promise<void>((resolve) => {
            server.close(() => resolve());
          }),
      ),
    );
  });

  it('compares via spawned CLI against a listening loopback server (5 runs)', async () => {
    expect(fs.existsSync(cli)).toBe(true);
    expect(fs.existsSync(target)).toBe(true);

    for (let i = 0; i < 5; i += 1) {
      const server = http.createServer((_req, res) => {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(fixtureHtml));
      });
      servers.push(server);
      const port = await listen(server);
      const url = `http://127.0.0.1:${port}/`;
      const out = path.join(root, '.tmp', `cli-url-${i}`);
      fs.rmSync(out, { recursive: true, force: true });

      const result = await runCli([
        'compare',
        '--target',
        target,
        '--url',
        url,
        '--viewport',
        '720x420',
        '--out',
        out,
      ]);

      expect(
        [0, 10],
        `run ${i + 1} status=${result.status} stderr=${result.stderr}`,
      ).toContain(result.status);
      expect(fs.existsSync(path.join(out, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(out, 'result.json'))).toBe(true);

      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }, 180_000);
});
