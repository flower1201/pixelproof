# Community post drafts (do not auto-publish)

**Status:** drafts only. Publish only after the repo owner manually confirms platform + wording. No automation, no mass DMs, no paid stars.

## Show HN (English draft)

**Title:** Show HN: PixelProof – local visual diffs that feed AI coding agents

**Body:**

I built PixelProof because AI coding tools often change UI without a clear “did this match the design?” signal.

It is a local-first CLI: compare a design PNG to a screenshot or a loopback URL, then write an offline HTML report, `result.json`, and a rule-based `fix-instructions.md` checklist agents can read. No cloud upload. No LLM API key.

Pre-release (not on npm yet): https://github.com/flower1201/pixelproof

```bash
git clone https://github.com/flower1201/pixelproof.git
cd pixelproof && npm install && npm run build && npm run demo
# open examples/out-demo/index.html
```

Limits I want to be clear about: pixel mismatch ≠ design quality; it does not find the CSS root cause or auto-patch; `--url` is loopback-only for now; image sizes must match.

Looking for feedback from people who ship front-end with Cursor / similar tools.

## V2EX（中文草稿）

**标题：** [开源] PixelProof：给 AI 写前端用的本地视觉对比 CLI（求试用反馈）

**正文：**

做了个本地优先的 CLI：设计稿 PNG 对比截图（或本机 URL），输出离线 HTML 报告、JSON 指标，以及给 Coding Agent 读的修复清单。不上云、不需要 LLM API。

仓库（Pre-release，尚未 npm）：https://github.com/flower1201/pixelproof

```bash
git clone https://github.com/flower1201/pixelproof.git
cd pixelproof && npm install && npm run build && npm run demo
# 打开 examples/out-demo/index.html
```

边界说明：像素差 ≠ 设计质量分；不会自动定位 CSS/DOM；`--url` 仅 loopback；图片尺寸必须一致。

本人作者。想找几位用 Cursor / AI 写前端的同学试用，反馈安装是否顺畅、报告是否有用。不必强求 Star。

## Reddit / X（短草稿）

Local CLI for AI coding UIs: design PNG vs screenshot → offline report + agent checklist. No cloud, no API keys.  
https://github.com/flower1201/pixelproof  
`npm run demo` after clone/build. Looking for real install + report feedback (not stars).

## 发帖前自检（2026-10-10 本机已验）

- [x] Release `pixelproof-cli-0.1.0-rc.2.tgz` → `npm install` → `--version 0.1.0-rc.2`（Win / Node 24）
- [x] `compare` 同尺寸 fixture → HTML + `result.json` + `fix-instructions.md`
- [ ] 你本人再跑一遍 `npm run demo` 确认 GIF / out-demo 仍在
- [ ] 文案未声称「已 npm publish」
- [ ] 已准备好回答 vs 裸 pixelmatch 的差异（Agent checklist + 离线报告）