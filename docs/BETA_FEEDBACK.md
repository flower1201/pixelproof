# PixelProof Phase 1 — Private Beta Feedback

Phase 1 goal: **5–10 real developers** try PixelProof and report whether install works, the offline report helps, and they would use it again in an AI coding workflow.

Core product features are **frozen**. Fix P0 install/security only; park feature requests in backlog.

## Links

- Repository: https://github.com/flower1201/pixelproof
- Pre-release: https://github.com/flower1201/pixelproof/releases/tag/v0.1.0-rc.2
- Issues: https://github.com/flower1201/pixelproof/issues
- Feedback template (this file)
- npm: not yet published; name availability to be rechecked before publishing

## Environment

- Node.js: `^22.12.0 || ^24.0.0`
- Image-only compare: no Chromium required
- `--url` (loopback capture): Playwright Chromium required
- Verified so far: Windows + Node 24 (Release tarball); GitHub Actions Linux (unit / pack / e2e)

## Path A — Source + included demo

```bash
git clone https://github.com/flower1201/pixelproof.git
cd pixelproof
npm install
npm run build
npm run demo
```

Open `examples/out-demo/index.html`. Same folder also has `result.json` and `fix-instructions.md`.

## Path B — GitHub Release tarball

```bash
curl -L -o pixelproof-cli.tgz \
  https://github.com/flower1201/pixelproof/releases/download/v0.1.0-rc.2/pixelproof-cli-0.1.0-rc.2.tgz

npm install ./pixelproof-cli.tgz
npx pixelproof --version

# optional fixtures from the repo
curl -L -o design.png \
  https://raw.githubusercontent.com/flower1201/pixelproof/main/tests/fixtures/diff-a.png
curl -L -o actual.png \
  https://raw.githubusercontent.com/flower1201/pixelproof/main/tests/fixtures/diff-b.png

npx pixelproof compare --target design.png --actual actual.png --out ./out-report
```

Open `./out-report/index.html`.

## Outputs

| File | Purpose |
|------|---------|
| `index.html` | Offline Before / After / Overlay / Diff |
| `result.json` | Metrics (`mismatchRatio`, dimensions, paths) for agents |
| `fix-instructions.md` | Rule-based checklist (not LLM-generated) |
| Diff / overlay assets | Referenced by the HTML report |

## Known limits (say upfront)

- Pixel match ≠ design quality score
- Does not find CSS/DOM root cause or auto-patch UI
- `--url` is loopback-only in this release
- Image dimensions must match (fail-fast, no silent resize)
- npm global install is **not** available until publish is approved

## Feedback questionnaire

Please answer what you can (GitHub Issue or private note). Do **not** feel obligated to Star the repo.

1. OS + Node.js version?
2. Which path (A source / B tarball / both)?
3. Did install succeed?
4. Did you get a first HTML report?
5. First friction (Node version, Chromium, paths, unclear docs, other)?
6. Did `mismatchRatio` / the report make sense within ~30 seconds?
7. Was `fix-instructions.md` useful for an AI coding agent?
8. Would you run this again on a real project? Which scenario?
9. One improvement that would matter most?

### Success bar (validation targets — not marketing claims)

- ≥5 real developers attempt a run
- ≥3 produce a report successfully
- No unresolved P0 install/security bugs
- ≥2 express a concrete real-use intent or scenario
- Clear top-3 product improvement list

## Logging feedback (maintainers)

- Record only voluntary, necessary details
- Strip private paths, secrets, and identifying data before any public summary
- Classify: P0 install/security → fix now; P1 UX → prioritize; features → backlog
- Next report title when real data exists: `[PixelProof · Phase 1 Beta Feedback Report]`
- Do **not** invent trial counts or quotes

## Private invite copy (manual send only)

Automation must **not** email, DM, or mass-message anyone. Copy/paste yourself.

### English

> Hi — I'm looking for a few developers who use Cursor / AI coding tools on front-end work to try a local CLI I'm building.
>
> PixelProof compares a design PNG to a screenshot (or loopback URL) and writes an offline HTML report + agent-friendly JSON/MD. No cloud upload, no LLM API key. Pre-release: https://github.com/flower1201/pixelproof
>
> Fastest path: clone → `npm install && npm run build && npm run demo` → open `examples/out-demo/index.html`
>
> If you try it, a short note on OS/Node, whether the report landed, and one friction point would help a lot. No need to Star.

### 中文

> 你好——想找几位平时用 Cursor / AI 写前端的同学，帮忙试用一个本地 CLI。
>
> PixelProof：设计稿 PNG vs 截图（或本机 URL）像素对比，生成离线 HTML 报告 + 给 Agent 用的 JSON/MD。不上传云端，不需要 LLM API。仓库：https://github.com/flower1201/pixelproof
>
> 最快路径：clone → `npm install && npm run build && npm run demo` → 打开 `examples/out-demo/index.html`
>
> 若方便，回一下系统/Node、是否出报告、卡在哪一步即可。不必为了支持而 Star。
