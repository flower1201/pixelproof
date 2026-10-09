# PixelProof

**Visual feedback for AI-generated interfaces.**

Compare a design reference against a screenshot or a local page URL. PixelProof writes an offline HTML report, `result.json`, and a rule-based `fix-instructions.md` checklist for coding agents — so AI coding tools get machine-readable visual feedback, not just another screenshot folder.

![PixelProof demo](./examples/pixelproof-demo.gif)

Local-first · No AI API required · Offline HTML report · Loopback URL capture only

> **Public beta:** GitHub Pre-release [`v0.1.0-rc.2`](https://github.com/flower1201/pixelproof/releases/tag/v0.1.0-rc.2) is available. npm package name will be `pixelproof-cli` (CLI binary: `pixelproof`). **Not published to npm yet.**

## Why PixelProof (vs generic screenshot diff)

- Built for **AI coding workflows**: deterministic `fix-instructions.md` + JSON metrics agents can read
- **Local-first**: no cloud upload, no LLM API key
- **Strict by default**: fail-fast on size mismatch (no silent resize)
- Offline interactive report: Before / After / Overlay / Diff

PixelProof measures pixel difference. It does **not** auto-locate CSS/DOM root causes or apply fixes.

## Quick start — try the included demo

**Try the included demo — no design files or API keys needed.**

Requires Node.js `^22.12.0 || ^24.0.0`. Still needs `git clone`, `npm install`, and `npm run build` (not a one-command install). Built-in fixtures mean you do not bring your own design PNGs.

```bash
git clone https://github.com/flower1201/pixelproof.git
cd pixelproof
npm install
npm run build
npm run demo
```

Open `examples/out-demo/index.html` in a browser. You should see Before/After, Overlay, Diff, plus `result.json` and `fix-instructions.md` in the same folder.

## Quick start — install from GitHub Release (no clone of source tree for the CLI)

Verified on Windows with Node 24. Download the Pre-release tarball, install it, then compare any two same-size images (fixtures below are optional):

```bash
# download release asset
curl -L -o pixelproof-cli.tgz \
  https://github.com/flower1201/pixelproof/releases/download/v0.1.0-rc.2/pixelproof-cli-0.1.0-rc.2.tgz

npm install ./pixelproof-cli.tgz
npx pixelproof --version   # 0.1.0-rc.2

# optional: fixture images from the repo (no Chromium needed for image mode)
curl -L -o design.png \
  https://raw.githubusercontent.com/flower1201/pixelproof/main/tests/fixtures/diff-a.png
curl -L -o actual.png \
  https://raw.githubusercontent.com/flower1201/pixelproof/main/tests/fixtures/diff-b.png

npx pixelproof compare \
  --target ./design.png \
  --actual ./actual.png \
  --out ./pixelproof-report
```

Open `pixelproof-report/index.html`.

For `--url` mode you also need Chromium:

```bash
npx playwright install chromium
```

Only loopback hosts are accepted: `localhost`, `127.0.0.1`, `[::1]`.

## Your own screenshots

```bash
npx pixelproof compare \
  --target ./design.png \
  --actual ./screenshot.png \
  --out ./pixelproof-report
```

Or against a local page (after `npm run build` in a source checkout, or via the installed CLI):

```bash
npx pixelproof compare \
  --target ./design.png \
  --url http://127.0.0.1:3000 \
  --viewport 1440x900 \
  --out ./pixelproof-report
```

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

`mismatchRatio` / pixel match numbers measure pixel difference against the reference. They are **not** a design-quality score.

## After npm publish (not yet)

```bash
npm i -g pixelproof-cli
pixelproof compare --target ./design.png --actual ./shot.png --out ./pixelproof-report
```

## Development

```bash
npm test
npm run typecheck
npm run build
npm run demo              # fixture compare → examples/out-demo
npm run demo:gif          # regenerate examples/pixelproof-demo.gif
```

## Docs

- [`docs/CLI.md`](./docs/CLI.md) — CLI reference
- [`docs/METRICS.md`](./docs/METRICS.md) — metric definitions
- [`docs/LAUNCH_KIT.md`](./docs/LAUNCH_KIT.md) — launch / community prep notes
- [`docs/PROJECT_SPEC.md`](./docs/PROJECT_SPEC.md) — engineering baseline
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — ADRs
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`SECURITY.md`](./SECURITY.md)

## License

MIT
