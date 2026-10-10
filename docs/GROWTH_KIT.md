# PixelProof Growth Kit（本地 · 手动）

面向负责人的试用包。**禁止自动发帖 / 求星 / 群发。**  
更完整的阶段说明见 [LAUNCH_KIT.md](./LAUNCH_KIT.md)；社区草稿见 [COMMUNITY_DRAFTS.md](./COMMUNITY_DRAFTS.md)。

## Pitch（一句话）

给 AI 写前端用的本地视觉对比：设计稿 vs 截图 → 离线报告 + Agent 可读修复清单。不上云、不需要 LLM API。

## 最快演示

```bash
git clone https://github.com/flower1201/pixelproof.git
cd pixelproof
npm install
npm run build
npm run demo
# 打开 examples/out-demo/index.html
```

GIF：仓库内 `examples/pixelproof-demo.gif`。

## 边界（务必说清楚）

- 像素差 ≠ 设计质量分
- 不自动定位 CSS/DOM，不自动改代码
- `--url` 仅 loopback；图片尺寸必须一致

## 邀请私信模板（中文）

> 嗨，我做了 PixelProof：本地对比设计稿和截图（或本机页面），生成离线 Before/After 报告和给 Coding Agent 看的修复清单，不上云。  
> 想找几位用 Cursor / AI 写前端的朋友跑一下自带 demo（`npm run demo`），告诉我装得顺不顺、报告有没有用。不必 Star。  
> https://github.com/flower1201/pixelproof  

## 邀请 DM（English）

> PixelProof is a local CLI: design PNG vs screenshot → offline Before/After report + agent fix checklist (no cloud / no LLM). Looking for folks who ship UI with Cursor-like tools to try `npm run demo` and say if install + report help. No need to Star.  
> https://github.com/flower1201/pixelproof  

## 反馈记录表

| 日期 | 谁 | OS/Node | demo OK? | 有用? | 会再开? | 备注 |
|------|----|---------|----------|-------|---------|------|
| | | | | | | |

目标：5 试用 / ≥3 条实质反馈。有反馈后再考虑手动发 V2EX / Show HN。
