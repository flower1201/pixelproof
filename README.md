# PixelProof

Local-first visual feedback for AI-generated web interfaces.

Compare a design reference image against an actual screenshot, get a pixel diff, `result.json`, and (later) an interactive HTML report plus agent-oriented fix instructions.

> Status: early development. Image-to-image compare, local loopback URL capture, offline HTML report, and rule-based fix-instructions are implemented. CI packaging/docs hardening is still in progress.

## Requirements

- Node.js `^22.12.0 || ^24.0.0`
- npm

## Install (local)

```bash
npm install
npm run build
```

## Usage (implemented)

```bash
node dist/cli/index.js compare \
  --target ./design.png \
  --actual ./screenshot.png \
  --out ./pixelproof-report
```

## Usage (URL mode, loopback only)

```bash
node dist/cli/index.js compare \
  --target ./design.png \
  --url http://localhost:3000 \
  --viewport 1440x900 \
  --out ./pixelproof-report
```

Requires Chromium via Playwright (`npx playwright install chromium`).

## Output

```text
pixelproof-report/
├── index.html            # offline Before/After, Overlay, Diff
├── target.png
├── actual.png
├── diff.png
├── result.json
└── fix-instructions.md   # rule-based agent checklist
```

## Development

```bash
npm test
npm run typecheck
npm run build
```

## Spec

See [`docs/PROJECT_SPEC.md`](./docs/PROJECT_SPEC.md) and [`docs/DECISIONS.md`](./docs/DECISIONS.md).

## License

MIT
