import { defineConfig } from 'tsup';

const shared = {
  format: ['esm'] as const,
  target: 'node22' as const,
  platform: 'node' as const,
  sourcemap: true,
  splitting: false,
  // Native / browser-driver packages must resolve from node_modules at runtime.
  external: ['playwright', 'playwright-core', 'sharp'],
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    dts: true,
    clean: true,
  },
  {
    ...shared,
    entry: { 'cli/index': 'src/cli/index.ts' },
    dts: false,
    clean: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
