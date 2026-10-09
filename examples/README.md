# Examples

## Image-to-image

From the repo root after `npm run build`:

```bash
node dist/cli/index.js compare \
  --target ./tests/fixtures/same-a.png \
  --actual ./tests/fixtures/same-b.png \
  --out ./examples/out-same

node dist/cli/index.js compare \
  --target ./tests/fixtures/diff-a.png \
  --actual ./tests/fixtures/diff-b.png \
  --out ./examples/out-diff
```

Open `examples/out-*/index.html` in a browser (`file://` works offline).

## Local URL capture

Start any local app, then:

```bash
node dist/cli/index.js compare \
  --target ./path/to/design.png \
  --url http://127.0.0.1:3000 \
  --viewport 1440x900 \
  --out ./examples/out-url
```

Only loopback hosts are accepted (`localhost`, `127.0.0.1`, `[::1]`).
