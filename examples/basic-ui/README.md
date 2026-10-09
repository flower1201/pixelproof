# Basic UI example

Self-contained demo with intentional visual differences. No third-party pages.

## Files

| File | Role |
|------|------|
| `expected.html` | Reference layout |
| `actual.html` | Broken layout (header color/height, CTA color/radius, spacing) |
| `target.png` | Screenshot of `expected.html` at 720×420 |
| `README.md` | This guide |

## Reproduce

```bash
# from repo root
npm run build
npm run example:basic-ui
```

This will:

1. Serve `expected.html` and capture `target.png`
2. Serve `actual.html` and run `pixelproof compare --url ...`
3. Write the report to `examples/basic-ui/report/`

Open `examples/basic-ui/report/index.html`.

Manual equivalent:

```bash
# terminal A
npx --yes serve examples/basic-ui -l 4177

# terminal B
node dist/cli/index.js compare \
  --target ./examples/basic-ui/target.png \
  --url http://127.0.0.1:4177/actual.html \
  --viewport 720x420 \
  --out ./examples/basic-ui/report
```

## Expected diffs

You should see mismatches around:

- header background / height
- card corner radius and padding
- CTA button color / radius
- vertical spacing under the header
