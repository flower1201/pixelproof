# PixelProof — Project Specification v1.1

状态：架构基线已确认，尚未实现。  
适用对象：Cursor / 项目贡献者。  
项目定位：Local-first visual feedback engine for AI-generated web interfaces。  
本文件优先级高于原 `PixelProof_Engineering_Blueprint.md`；修改关键架构需先记录 ADR。

## 1. 产品目标

给定一张目标设计截图，以及一个本地网页 URL 或一张实际截图，PixelProof 在本地执行可重复的像素差异分析，输出离线可交互报告、机器可读结果和供 AI 编程助手使用的检查清单。

产品闭环：`reference + URL/image → capture (URL only) → normalize → compare → regions → HTML/JSON/Markdown → developer or agent fixes UI → rerun`。

基本原则：CLI-first、local-first、无需 LLM API、无账号或后端、指标可追溯、单 npm 包、最小可用架构。Pixel match 不是审美或 UX 质量评分。

## 2. P0 范围与非目标

### P0 必须实现

- `compare`、`--help`、`--version` CLI
- 图片对图片比较（不需要浏览器）
- 本地 URL 的 Chromium 截图与图片比较
- PNG/JPEG/WebP 输入、统一图像归一化、尺寸严格校验
- pixelmatch 差异像素数、比例、可视化 diff mask
- 差异区域提取和排序
- 本地离线 HTML：Before/After 滑块、Overlay、Diff 视图、区域列表
- `result.json`、纯规则模板 `fix-instructions.md`
- 可读错误、退出码、单测、集成测试、CLI E2E、CI、README、示例和开源许可证

### P0 不实现

Figma 集成、云端分享、账户/数据库、LLM 调用、自动修改代码、GitHub App、复杂 CSS 定位、远程公网 URL、全页面滚动截图、批量网站扫描、VS Code/Cursor 插件、MCP、跨浏览器测试、智能缩放/对齐。

## 3. 已批准的架构决策

- **ADR-001**：本文为 `docs/PROJECT_SPEC.md` 的唯一工程基线。
- **ADR-002**：当前空工作区本地 `git init -b main`，仓库名暂为 `pixelproof`；不得擅自创建远程仓库。
- **ADR-003**：Node.js engines 为 `^22.12.0 || ^24.0.0`；本地 Node 24 可直接使用；CI 测 Node 22、24。
- **ADR-004**：npm + `package-lock.json` + `npm ci`；取代 Blueprint 里的 pnpm 决策。
- **ADR-005**：尺寸不一致始终 fail-fast；无自动 resize、pad、crop、register。
- **ADR-006**：`fix-instructions.md` 必须是无需 LLM 的确定性模板。
- **ADR-007**：TypeScript、Node ESM、Commander、Zod、Sharp、pixelmatch、Playwright Chromium、静态 HTML/CSS/原生 JS、tsup、Vitest、GitHub Actions。
- **ADR-008**：单包非 Monorepo；核心比较逻辑不得依赖 CLI/Playwright/HTML。
- **ADR-009**：默认 `--url` 仅接受回环主机（`localhost`、`127.0.0.1`、`[::1]`），禁止跟随跳转到非回环顶层 URL；公网 URL 留待单独设计。

## 4. 仓库目标结构

```text
pixelproof/
├── src/
│   ├── cli/
│   │   ├── index.ts
│   │   ├── options.ts
│   │   └── errors.ts
│   ├── core/
│   │   ├── types.ts
│   │   ├── normalize.ts
│   │   ├── pixel-diff.ts
│   │   ├── regions.ts
│   │   ├── metrics.ts
│   │   └── compare.ts
│   ├── capture/
│   │   └── chromium.ts
│   ├── report/
│   │   ├── write-report.ts
│   │   ├── render-html.ts
│   │   └── render-markdown.ts
│   ├── shared/
│   │   ├── schemas.ts
│   │   └── paths.ts
│   └── index.ts
├── tests/
│   ├── fixtures/
│   ├── core/
│   ├── capture/
│   ├── report/
│   └── e2e/
├── examples/
├── docs/
│   ├── PROJECT_SPEC.md
│   ├── DECISIONS.md
│   ├── CLI.md
│   └── METRICS.md
├── .github/workflows/ci.yml
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── LICENSE
└── README.md
```

按职责增量创建目录与文件；无需提前建立所有空目录。保留 `src/index.ts` 作为未来公开 JS API 的入口，初期不承诺稳定 SDK。

## 5. 模块契约与依赖

| 模块 | 输入 | 输出 | 禁止依赖 |
|------|------|------|----------|
| capture | 已验证 URL、viewport、超时设置 | PNG buffer + capture metadata/warnings | report、cli |
| normalize | 图像 buffer/path | RGBA 8-bit + width/height | capture、report、cli |
| pixel-diff | 两个同尺寸 RGBA buffer、threshold/includeAA | mismatch count + binary mask + diff PNG 数据 | capture、report、cli |
| regions | binary mismatch mask、尺寸 | 按差异像素排序的区域列表 | capture、report、cli |
| compare | 标准化图片和比较选项 | CompareResult 所需的指标、差异和区域 | capture、HTML |
| report | CompareResult + 图片资源 | 本地 HTML/JSON/Markdown 文件 | Playwright、CLI 参数解析 |
| cli | argv / 环境 | 编排模块、控制台输出、退出码 | 核心算法的内部实现细节 |

`src/cli/index.ts` 或独立 application 层负责编排 `capture → core → report`，而不是让 core 引入 capture。模块内部不调用 `process.exit()`；仅 CLI 顶层转换错误码。对外契约通过 TypeScript + Zod 校验。

## 6. CLI 契约

```bash
# URL 比较
pixelproof compare --target ./design.png --url http://localhost:3000 --out ./pixelproof-report

# 图片比较（无需浏览器）
pixelproof compare --target ./design.png --actual ./actual.png --out ./pixelproof-report

# 明确截图环境；在 CI 中按比例判定
pixelproof compare --target ./design.png --url http://localhost:3000 \
  --viewport 1440x900 --threshold 0.1 --fail-above 0.02
```

### 选项规则

- `--target <file>` 必填。
- `--actual <file>` 与 `--url <address>` 二选一，且必须恰选一个。
- `--out <dir>` 默认 `./pixelproof-report`；只覆盖工具自己生成的同名文件，不删除无关文件。
- `--viewport <width>x<height>` 仅用于 URL 模式；未指定时按 target 图像像素尺寸作为 CSS viewport。默认 DPR=1，`fullPage=false`。不按 Retina/@2x 推断缩放；若设计图为 2x 导出，要求用户自行提供 1x 参考图。
- `--threshold <0..1>` 默认 `0.1`，是每个像素的颜色差异阈值。
- `--include-aa` 默认 `false`，设置后将 pixelmatch 识别的抗锯齿差异计入。
- `--fail-above <0..1>` 可选；当且仅当 `mismatchRatio > failAbove` 时退出码 10，但仍须生成完整报告。

URL 模式仅接受 `http:`/`https:` 回环主机，拒绝 URL 用户名/密码和非回环顶层重定向；不支持 `file:`、`data:` 等协议。页面自身可能引用远程资源，不能宣称 URL 截图完全断网。

PNG/JPEG/WebP 输入；图片以解码后的实际格式验证，不能只看扩展名。

`--help`、`--version` 必须有效。

### 退出码

| 代码 | 含义 |
|------|------|
| 0 | 比较成功，且未超过可选失败门限 |
| 2 | CLI 参数或配置错误 |
| 3 | 浏览器/导航/截图失败 |
| 4 | 图片读取、尺寸或比较错误 |
| 5 | 报告写入错误 |
| 10 | 比较成功但 `mismatchRatio > failAbove` |

异常要打印可操作信息。例如：`IMAGE_DIMENSION_MISMATCH: target=1440x900 actual=1280x720; re-export reference or fix --viewport`。输出成功但超门限时不能报成图像处理故障。

## 7. TypeScript 核心契约

```ts
type InputSource =
  | { kind: 'url'; url: string }
  | { kind: 'image'; path: string };

type Size = { width: number; height: number };
type Rect = { x: number; y: number; width: number; height: number };

type DifferenceRegion = {
  id: string;                    // stable ID: region-1, region-2, ...
  bounds: Rect;                  // origin top-left, integer pixel coordinates
  mismatchedPixels: number;     // original mismatched pixels within this rect
  areaPixels: number;           // bounds.width * bounds.height
  mismatchDensity: number;      // mismatchedPixels / areaPixels
};

type CompareOptions = {
  targetPath: string;
  actual: InputSource;
  outputDir: string;
  viewport?: Size;
  threshold: number;            // per-pixel 0..1
  includeAA: boolean;
  failAbove?: number;           // image-wide mismatch ratio 0..1
};

type CompareResult = {
  schemaVersion: '1.0';
  engineVersion: string;
  source: { kind: 'url' | 'image'; displayValue: string };
  image: Size;
  capture?: {
    browser: 'chromium';
    viewport: Size;
    dpr: 1;
  };
  metrics: {
    totalPixels: number;
    mismatchedPixels: number;
    mismatchRatio: number;
    pixelMatchRatio: number;
  };
  config: {
    threshold: number;
    includeAA: boolean;
    failAbove?: number;
  };
  regions: DifferenceRegion[];  // P0: highest priority 5 regions at most
  warnings: string[];
  artifacts: {
    target: string;
    actual: string;
    diff: string;
    html: string;
    markdown: string;
  };
};
```

`result.json` 对应以上可序列化契约。`artifacts` 必须是报告目录下相对路径；不得包含机器专属绝对路径。`displayValue` 需避免泄露 URL 认证信息或查询参数；如展示 URL，默认去除 username/password、query 和 fragment。所有比例保持 0..1 浮点数，UI 才转成百分数。`schemaVersion` 升级时必须说明兼容性影响。

## 8. 图像归一化与差异算法

### 输入与资源限制

- P0 单文件上限 25 MiB，单边像素上限 4096，总像素上限 16,000,000；读取元数据并限制解码以防内存过量。
- 统一 EXIF 朝向、sRGB、白色背景合成透明像素，再转换成 RGBA 8-bit 4 通道。两张图片采用完全一致的归一化流程。
- 不同尺寸直接抛出 `IMAGE_DIMENSION_MISMATCH`；不做智能对齐，也不自动 pad/resize/crop。
- 目标图与实际图尺寸相同时，归一化输出像素不因调用方式不同而改变。

### 统计与掩码

- 由 pixelmatch 得到 `mismatchedPixels`；明确设置 `threshold`、`includeAA`、`diffMask: true`，避免依赖不透明默认值。
- `totalPixels = width * height`
- `mismatchRatio = mismatchedPixels / totalPixels`
- `pixelMatchRatio = 1 - mismatchRatio`，只代表像素一致度，不代表设计审美质量。
- 保存透明背景的差异 PNG。差异区域算法必须消费和 mismatch count 完全一致的二值 mask；用单测核对 mask 中置位像素数与 pixelmatch 统计一致。
- 差异区域的聚合与降噪不得修改全局 `mismatchedPixels` 或 `mismatchRatio`。

### 差异区域

- 从二值 mask 提取连通区域（可用 8 邻域），再按固定、可测试的邻近阈值合并碎片区域。
- 合并后区域矩形不能相互重叠；若合并则重新计算原始 mask 落在最终矩形中的像素数，保证 region 数值可信。
- `bounds` 坐标为整数，左上原点，width/height 包含边界像素。
- 按 `mismatchedPixels` 降序，坐标作为稳定的 tie-breaker；regions 只输出 Top 5。仅供定位视觉问题，不冒充精确 DOM 节点映射。

## 9. Chromium 截图确定性

- 使用 Playwright 独立 `BrowserContext`；不读取日常浏览器 profile/cookies。
- `deviceScaleFactor=1`、`colorScheme='light'`、`reducedMotion='reduce'`、`locale='en-US'`、`timezoneId='UTC'`、固定 viewport。
- `page.goto(..., { waitUntil: 'domcontentloaded' })`；随后分别有界等待 `document.fonts.ready`、已存在图片的解码/加载与短暂布局稳定。不单靠 `networkidle`。
- 截图采用 `animations:'disabled'`、`caret:'hide'`、`fullPage:false`、`scale:'css'`。
- 对导航、字体、图片与截图分别设置有界超时；可恢复的问题进入 `warnings`，不可截图时返回 exit 3。
- 即使失败也要关闭 page/context/browser，清理临时资源。
- 只承诺相同受控环境下尽量可复现；不承诺 Windows/macOS/Linux 像素结果必然相同。
- 如缺少 Chromium，可读错误提示 `npx playwright install chromium`。

## 10. 报告文件与 HTML 交互

```text
pixelproof-report/
├── index.html
├── target.png
├── actual.png
├── diff.png
├── result.json
└── fix-instructions.md
```

HTML 采用静态模板、内联或随文件发布的 CSS/原生 JS。通过 `file://` 直接打开可用，不依赖 HTTP server、CDN 或外部网络。

提供：Before/After 拖动滑块、Overlay 透明度控制、Diff 独立视图、指标摘要、Top 5 差异区域定位、环境与限制提示。

浏览器不能假设 `file://` 页面可以通过 `fetch('result.json')` 获取 JSON；直接把必要的、安全转义的数据嵌入 HTML，或由生成器预渲染。

对 URL、文本、文件名做上下文安全转义；禁止未经处理地拼接入 `<script>` 或 HTML 属性。报告不得执行用户提供的 HTML/JS。

报告可以包含敏感截图内容；默认本地存储、无遥测/默认上传，README 提醒勿随意公开。

输出已有目录时，只覆盖工具管理的同名文件，不删除未知文件；失败时尽量避免留下半写入 JSON。

## 11. fix-instructions.md 规范

必须使用确定性规则模板，不依赖任何 LLM。固定章节及顺序：

1. `# PixelProof Fix Instructions`：说明这是基于像素差异的检查清单，不是已验证的根因分析。
2. `## Inputs & Environment`：source 类型、目标/实际尺寸、viewport、DPR、threshold、includeAA。
3. `## Pixel Difference Summary`：mismatchedPixels、totalPixels、mismatchRatio、pixelMatchRatio；解释指标局限。
4. `## Priority Regions`：Top 5 区域，每个含 bbox、mismatchedPixels、density；0 差异时明确写无待检查区域。
5. `## Suggested Checks`：规则化建议依次检查相应区域的布局、间距、尺寸、字体、颜色、边框及内容；不得编造 CSS 文件/类名、DOM 元素或推断已证实的原因。
6. `## Verification`：重复运行 CLI 的完整命令（输入值需安全引用），比较 mismatchRatio 是否下降；如 `--fail-above` 存在，说明门限。
7. `## Warnings & Limitations`：传入 capture warnings、动态内容、字体、平台、抗锯齿等可能干扰因素。

模板用语必须是“可能原因 / 建议检查 / 需要人工核实”，不能写“已发现 CSS 错误是 ...”。在没有区域的情况下不要输出无意义的修复建议。

## 12. 测试与验收

### Core 单元测试

- 两张相同图：差异 0、regions 空、比率为 0/1。
- 固定色块差异：计数、mask、区域 bbox 正确；mask 置位总数与 pixelmatch 返回值一致。
- threshold / includeAA 对真实测试样本行为正确。
- 图像尺寸不一致：报错含 target 与 actual 尺寸，绝不做静默处理。
- PNG、JPEG、WebP、EXIF、透明图、损坏文件、超限图片覆盖。
- 区域合并不改变全局差异计数，区域排序稳定。
- JSON 字段、比例范围、schemaVersion、相对路径正确。
- Markdown 与 HTML 对特殊文本进行恰当转义。

### Capture/CLI/Report 集成与 E2E

- 本地 fixture 站点截图：尺寸与 viewport 一致，报告可生成。
- 动画停止、隐藏光标、字体等待都有覆盖测试或可复现 fixture。
- 图片模式不需要浏览器安装。
- HTML 在离线 `file://` 环境正确展示三种视图，不触发 CDN 请求。
- `--actual` / `--url` 互斥，非法参数的 exit code 为 2。
- `--fail-above`：小于等于阈值成功，大于阈值返回 10，同时保留报告。
- 截图失败、解码失败、输出不可写时分别返回 3、4、5。
- Node 22/24 CI 跑 typecheck、tests、build；有 Chromium 的 CI job 跑浏览器 E2E。
- `npm pack` 后在干净目录验证 bin 的 `--help` 与图片比较可执行；浏览器下载方式写入 README。

### 发布 Definition of Done

- 新用户可按 README 中的两个命令完成 URL 与图片比较。
- 真实且可复现的 fixture/demo，20 秒以内的展示动图可以从工具实际输出生成。
- 文档陈述与已实现功能一致，无虚构支持项或 benchmark。
- 许可证、第三方依赖许可、npm/GitHub 命名可用性在正式发布前核验。
- 默认没有向开发者以外的服务器上传图像、结果或日志的行为。

## 13. 实现顺序（依赖关系，非日期计划）

1. **Foundation**：初始化 Git、npm/TS/ESM、CLI bin、Zod、错误类型、Vitest、tsup、锁文件。先提交结构和测试方案。
2. **Image Core**：Sharp 归一化、尺寸校验、pixelmatch、mismatchRatio、最小 result.json、CLI 图片模式；形成首个可运行闭环。
3. **Capture**：受控 Chromium、URL 验证、timeout 与 warnings，连通 URL 模式。
4. **Region Analysis**：binary mask、连通/合并、Top 5 区域排序。
5. **Report Viewer**：离线 HTML、比较滑块、Overlay、Diff、区域定位。
6. **Agent Integration**：固定章节的 Markdown、最终版本化 JSON 契约和一致性测试。
7. **OSS Hardening**：文档、示例、CI、npm pack 验证、许可证与发布检查。

每个模块完成时提交：改动文件列表、核心实现说明、真实测试命令/结果、风险和下一步依赖。未运行测试不得声称通过。

## 14. Cursor 协作规则

- 先读本规范，再提出要修改的文件清单、接口及验收测试，之后才动手实现。
- 一般语法、配置、依赖错误由 Cursor 自行处理；跨模块接口更改、算法准确性、安全问题、显著架构改变才提交 ChatGPT。
- 重要方案冲突用 `[PixelProof · 向 ChatGPT 请求技术指导]` 格式，带当前模块、问题、代码/日志、候选方案、推荐和待决策问题。
- 维护 `docs/DECISIONS.md`；与本文不一致时，先提交 ADR 决策，不可静默偏离。
- 不得将内部依赖或测试通过情况编造为事实，不得添加未获批准的 LLM/后端/数据库或插件。
- 禁止一次性生成全部项目；按依赖顺序逐模块完成并验证。

## 15. 风险及边界

- **字体/环境变化**：固定截图上下文，CI 提供标准 fixture，报告提示跨平台可能不同。
- **动态页面**：等待和警告只能降低非确定性，不能保证消除。
- **高分辨率设计图**：用户自行提供合适 1x reference；不隐式缩放以取得更好的结果。
- **隐私**：本地报告可能包含网页内容；不要自动发布截图或带敏感路径的日志。
- **网络**：PixelProof 自身不上传数据，但 `--url` 加载的网页可能访问其自己的外部资源；不夸大为完整离线网页抓取。
- **指标误解**：`pixelMatchRatio` 是像素匹配率，不是 UI 美感、准确语义或易用性评分。

## 16. 参考文档

- Node.js release schedule: https://github.com/nodejs/Release
- Playwright screenshot API: https://playwright.dev/docs/api/class-page
- Playwright browser contexts: https://playwright.dev/docs/api/class-browser
- Sharp pixel output: https://sharp.pixelplumbing.com/api-output/
- pixelmatch options: https://github.com/mapbox/pixelmatch/blob/main/README.md

---

当前状态：Cursor 已完成环境调查，以上规范批准开始初始化。  
首个具体执行任务是 **Foundation + Image Core 的接口和测试方案**，待该方案给出后即可开始实现。  
上述功能尚未实现，不得在 README 或 GitHub 仓库声称已上线。
