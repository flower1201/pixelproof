# PixelProof — Architecture Decision Records

本文记录已批准的架构决策。与 `docs/PROJECT_SPEC.md` 冲突时，以最新 ADR + 更新后的 SPEC 为准；不得静默偏离。

## ADR-001 — 工程规范基线

- **状态**：Accepted
- **决定**：`docs/PROJECT_SPEC.md`（v1.1）为唯一工程基线；优先级高于原 Blueprint。
- **影响**：所有实现、测试与 README 声明必须与 SPEC 一致。

## ADR-002 — Git 仓库启动方式

- **状态**：Accepted
- **决定**：空工作区执行本地 `git init -b main`；仓库目录名暂为 `pixelproof`；不得擅自创建远程仓库。
- **影响**：发布前再检查 GitHub 名称冲突；不假设远端已存在。

## ADR-003 — Node.js 版本

- **状态**：Accepted
- **决定**：`engines.node = "^22.12.0 || ^24.0.0"`；本地 Node 24 可用；CI 同时测试 Node 22 与 24；不支持 Node 20。
- **影响**：依赖与语法需兼容 Node 22/24。

## ADR-004 — 包管理器

- **状态**：Accepted（修订 Blueprint）
- **决定**：统一使用 npm + `package-lock.json` + `npm ci`；不使用 pnpm。
- **影响**：不混用锁文件；CI 使用 `npm ci`。

## ADR-005 — 图片尺寸不一致策略

- **状态**：Accepted
- **决定**：始终 fail-fast；禁止隐式缩放、裁剪、填充、自动对齐。
- **影响**：抛出 `IMAGE_DIMENSION_MISMATCH`，错误信息包含 target/actual 尺寸。

## ADR-006 — fix-instructions.md 生成方式

- **状态**：Accepted
- **决定**：纯规则模板、确定性输出；不调用任何 LLM API。
- **影响**：用语必须是建议/可能原因，不得声称已定位具体 CSS/DOM 根因。

## ADR-007 — 技术栈

- **状态**：Accepted
- **决定**：TypeScript、Node ESM、Commander、Zod、Sharp、pixelmatch、Playwright Chromium、静态 HTML/CSS/原生 JS、tsup、Vitest、GitHub Actions。
- **影响**：P0 不得引入未批准的大型框架或后端服务。

## ADR-008 — 包与模块边界

- **状态**：Accepted
- **决定**：单 npm 包、非 Monorepo；核心比较逻辑不得依赖 CLI / Playwright / HTML 报告。
- **影响**：`src/core/*` 保持可独立测试。

## ADR-009 — URL 模式主机限制

- **状态**：Accepted
- **决定**：默认 `--url` 仅接受回环主机（`localhost`、`127.0.0.1`、`[::1]`）；禁止跟随跳转到非回环顶层 URL；公网 URL 留待单独设计。
- **影响**：降低 SSRF/意外外连风险；远程 URL 不在 P0 范围。

## ADR-010 — Application orchestration layer

- **状态**：Accepted（D-013）
- **决定**：新增 `src/app/run-compare.ts` 负责 `capture → core → report` 编排。
- **理由**：SPEC 要求 core 不依赖 Playwright/HTML；CLI 只做参数解析与退出码。
- **影响**：对外推荐 `runCompare()`；`comparePrepared()` 保持纯计算、不写文件。`app` 只做编排与生命周期，不成通用 Service Framework。

## Release process notes (D-010 … D-014)

- **D-010**：首个本地 MVP commit 已批准并完成。
- **D-011**：创建 GitHub 远程暂缓；需用户确认账号/组织/可见性。当前环境 `gh` 未登录。
- **D-012**：OSS Hardening 顺序：npm pack → E2E → 离线 HTML → 安全边界 → examples/demo → 文档 → CI。
- **D-014**：验收阶段不扩展新功能。

## 补充约定（写入 SPEC，非独立 ADR）

- 默认 `threshold = 0.1`、`includeAA = false`（pixelmatch 语义：单像素阈值，不是整图 10% 差异）。
- URL 截图：`deviceScaleFactor=1`、`fullPage=false`、固定 locale/timezone/reducedMotion。
- Agent 报告第一版必须使用确定性模板，不得声称已确定某条 CSS 规则或 DOM 元素是根因。
