# PixelProof

Local-first visual feedback for AI-generated web interfaces.

Compare a design reference against an actual screenshot or a local page URL. PixelProof writes an offline HTML report, `result.json`, and a rule-based `fix-instructions.md` checklist for coding agents.

![PixelProof demo](./examples/pixelproof-demo.gif)

> Status: MVP usable locally. Image compare, loopback URL capture, offline HTML report, and rule-based fix instructions are implemented. GitHub remote / npm publish are not done yet.

## Requirements

- Node.js `^22.12.0 || ^24.0.0`
- npm
- For URL mode: Chromium via Playwright (`npx playwright install chromium`)

## Install (local)

```bash
npm install
npx playwright install chromium   # only needed for --url
npm run build
```

## Usage

### Image-to-image

```bash
node dist/cli/index.js compare \
  --target ./design.png \
  --actual ./screenshot.png \
  --out ./pixelproof-report
```

### Local URL (loopback only)

```bash
node dist/cli/index.js compare \
  --target ./design.png \
  --url http://127.0.0.1:3000 \
  --viewport 1440x900 \
  --out ./pixelproof-report
```

Only `localhost`, `127.0.0.1`, and `[::1]` are accepted for `--url`.

### Fixture demo

```bash
node dist/cli/index.js compare \
  --target ./tests/fixtures/diff-a.png \
  --actual ./tests/fixtures/diff-b.png \
  --out ./examples/out-diff
```

Then open `examples/out-diff/index.html` in a browser.

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
npm run demo:gif          # regenerate examples/pixelproof-demo.gif
```

## Docs

- [`docs/PROJECT_SPEC.md`](./docs/PROJECT_SPEC.md) — engineering baseline
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — ADRs
- [`docs/CLI.md`](./docs/CLI.md) — CLI reference
- [`docs/METRICS.md`](./docs/METRICS.md) — metric definitions
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## License

MIT
