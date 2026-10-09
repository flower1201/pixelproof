# PixelProof Launch Kit

Materials for first real-user trials. **Do not auto-post** to Reddit, Hacker News, V2EX, or X from automation. No paid star farming, no fake testimonials, no mass DMs.

## Links

- Repository: https://github.com/flower1201/pixelproof
- Pre-release: https://github.com/flower1201/pixelproof/releases/tag/v0.1.0-rc.2
- Issues: https://github.com/flower1201/pixelproof/issues
- Phase 1 feedback pack: [BETA_FEEDBACK.md](./BETA_FEEDBACK.md)
- Community drafts (manual only): [COMMUNITY_DRAFTS.md](./COMMUNITY_DRAFTS.md)
- npm package: **not yet published**; name availability (`pixelproof-cli`) to be rechecked before publishing

## Core pitch

PixelProof is a **local-first** CLI that compares a design reference to a screenshot or loopback URL, then writes an offline HTML report plus agent-friendly JSON/Markdown feedback — without cloud upload or an LLM API.

## Demo (copy-paste)

From source (fixtures included — no design files or API keys needed):

```bash
git clone https://github.com/flower1201/pixelproof.git
cd pixelproof
npm install && npm run build && npm run demo
# open examples/out-demo/index.html
```

## English blurb (short)

> PixelProof gives AI coding workflows visual feedback: compare a design PNG to a screenshot or local page, get an offline Before/After report, pixel metrics, and a rule-based fix checklist — all local, no API keys.

## 中文简介（短）

> PixelProof 是本地优先的视觉对比 CLI：把设计稿和截图（或本机页面）做像素级对比，生成离线 HTML 报告、JSON 指标和给 Agent 用的修复清单。不上传云端，不需要 LLM API。

## Product boundaries (say this out loud)

- Pixel match ≠ design quality score
- Does **not** automatically find the CSS/DOM root cause
- Does **not** auto-patch the UI
- `--url` is loopback-only in this release
- Image dimensions must match (fail-fast)

## First-user feedback questions

1. Did install succeed on your OS/Node version without surprises?
2. Was the offline HTML report useful within 30 seconds?
3. Would you run this in an AI coding loop (Cursor/Copilot/etc.)?
4. What blocked you (Chromium, Node version, missing design asset)?
5. What one feature would make you Star / recommend it?

Target: **5–10** real developer trials before wider posting.

## Community checklist (manual)

### Before posting anywhere

- [ ] README Quick Start works on a clean machine
- [ ] Release tarball install still works
- [ ] Demo GIF loads on the GitHub repo page
- [ ] You can answer “how is this different from pixelmatch alone?”

### Phase 1 — private invites

- [ ] Share repo + demo commands with a few developers you know
- [ ] Collect Issues / notes; fix P0 install friction only

### Phase 2 — V2EX / CN developer communities

- [ ] Read the community self-promotion rules
- [ ] Lead with real before/after screenshots and build story
- [ ] Disclose you are the author

### Phase 3 — Show HN / Reddit / X

- [ ] Show HN: write the post yourself; stay for discussion ([guidelines](https://news.ycombinator.com/showhn.html))
- [ ] Reddit: follow each subreddit’s self-promo rules; prefer value-first posts
- [ ] X: short demo + link; no engagement bait

## What not to do

- Do not claim npm install works until publish is approved
- Do not claim Windows/macOS/Linux “fully supported” beyond what you verified
- Do not ask people to Star as a favor
- Do not fabricate usage numbers or testimonials
