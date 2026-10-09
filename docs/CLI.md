# PixelProof CLI

npm package: `pixelproof-cli` · binary: `pixelproof`

```bash
pixelproof compare --target <file> (--actual <file> | --url <address>) [options]
```

## Options

| Option | Default | Notes |
|--------|---------|-------|
| `--target <file>` | required | Reference/design image (PNG/JPEG/WebP) |
| `--actual <file>` | — | Mutually exclusive with `--url` |
| `--url <address>` | — | Loopback only: `localhost`, `127.0.0.1`, `[::1]` |
| `--out <dir>` | `./pixelproof-report` | Overwrites managed artifact names only |
| `--viewport <WxH>` | target image size | URL mode only |
| `--threshold <0..1>` | `0.1` | Per-pixel threshold (pixelmatch) |
| `--include-aa` | off | Count anti-aliased pixels as diffs |
| `--fail-above <0..1>` | unset | Exit `10` when mismatchRatio exceeds gate |

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 2 | Usage/config error |
| 3 | Capture/navigation failure |
| 4 | Image read/decode/dimension error |
| 5 | Report write error |
| 10 | Success but `--fail-above` exceeded |

## Examples

```bash
pixelproof compare --target ./design.png --actual ./shot.png --out ./report

pixelproof compare \
  --target ./design.png \
  --url http://127.0.0.1:3000 \
  --viewport 1440x900 \
  --fail-above 0.02
```
