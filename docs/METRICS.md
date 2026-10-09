# PixelProof Metrics

## Definitions

| Metric | Formula | Meaning |
|--------|---------|---------|
| `totalPixels` | `width * height` | Pixels in the compared image |
| `mismatchedPixels` | count from pixelmatch | Pixels exceeding the per-pixel threshold |
| `mismatchRatio` | `mismatchedPixels / totalPixels` | Fraction of differing pixels (`0..1`) |
| `pixelMatchRatio` | `1 - mismatchRatio` | Fraction of matching pixels (`0..1`) |

## Important limits

- `threshold` is a **per-pixel color difference** threshold used by [pixelmatch](https://github.com/mapbox/pixelmatch). It is **not** “allow 10% of the image to differ”.
- `pixelMatchRatio` is **not** a design-quality, accessibility, or UX score.
- Region aggregation never changes global `mismatchedPixels` / `mismatchRatio`.
- Size mismatch is fail-fast; PixelProof does not auto-scale to improve scores.

## Defaults

- `threshold = 0.1`
- `includeAA = false`
- Capture DPR = `1`, `fullPage = false`

## CI gating

Use `--fail-above <ratio>` when you want a non-zero exit after a successful compare:

```bash
pixelproof compare --target ./design.png --actual ./shot.png --fail-above 0.02
```

Exit code `10` means the report was written, but `mismatchRatio` exceeded the gate.
