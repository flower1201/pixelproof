# Contributing to PixelProof

Thanks for helping improve PixelProof.

## Development setup

- Node.js `^22.12.0 || ^24.0.0`
- npm

```bash
npm ci
npx playwright install chromium
npm run typecheck
npm run build
npm test
```

## Project rules

1. Read `docs/PROJECT_SPEC.md` before changing architecture.
2. Keep module boundaries: `core` must not import Playwright, CLI, or HTML renderers.
3. Prefer small, testable changes with real tests — do not claim untested behavior.
4. Do not add LLM APIs, cloud backends, databases, or remote URL capture without an ADR.
5. Record approved architecture changes in `docs/DECISIONS.md`.

## Useful commands

```bash
npm run build
npm test
node dist/cli/index.js compare --help
npm run example:basic-ui
```

## Testing URL capture

When spawning the CLI against a local fixture server **in the same Node process**, use async `spawn` (not `spawnSync`). `spawnSync` blocks the event loop and will starve the in-process HTTP server, causing false `CAPTURE_ERROR` navigation timeouts.

## Pull requests

- Describe what changed and why.
- Include test commands and results.
- Keep README claims aligned with implemented features only.
