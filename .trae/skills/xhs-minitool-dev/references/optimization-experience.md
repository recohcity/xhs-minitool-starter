# 优化经验沉淀（Optimization Experience）

> 本文档沉淀小工具迭代过程中的可复用模式、踩坑与真机适配经验。
>
> **每完成一轮优化，把新的经验按下列分区追加到对应小节**
>
> ，保持「模式 + 反例 + 代码片段」的格式，便于后续直接复用。来源：Float（飘）反应力游戏 v1.0.2 视觉改版 + 真机适配。

## 目录



* [1. 视觉层级改版（报告 / 结算类页面）](#1-视觉层级改版报告--结算类页面)

* [2. Canvas 分享卡与页面同源](#2-canvas-分享卡与页面同源)

* [3. 系统表情 → 线描 SVG 统一](#3-系统表情--线描-svg-统一)

* [4. 真机容器适配（重点）](#4-真机容器适配重点)

* [5. 验证方法](#5-验证方法)

* [6. 追加区（新经验写这里）](#6-追加区新经验写这里)



***

## 1. 视觉层级改版（报告 / 结算类页面）

**目标**：打破「人人平等的方框堆砌」，用大小、留白、色彩建立信息层级，第一眼看到最重要信息。

### 可复用模式（Float 已落地验证）



| 原样式              | 新样式             | 要点                                                                  |
| ---------------- | --------------- | ------------------------------------------------------------------- |
| 等级 = 一行文字 + 边框卡片 | **108px 圆形徽章**  | 大号字母居中，conic 渐变光环随等级变色（S 金 / A 绿 / B 蓝）+ 呼吸光晕动画                     |
| 解读文字装方框          | **纯文字居中**       | 靠留白呼吸，去框                                                            |
| 四维指标 = 方块网格      | **横向信息条**       | 每行：左侧色环图标（速度 = 蓝 / 准确 = 绿 / 切换 = 紫 / 专注 = 橙）+ 名称 / 评价，右侧大字号数值，像体检报告 |
| 本局小记 = 独立卡片      | **三栏统计条**       | 竖分隔线区分三个数据，不套框                                                      |
| 训练建议             | **色带横幅**        | 大图标 + 宽松内边距，作为收尾强调区块                                                |
| 全局               | **分区小标题 + 可滚动** | 「四维能力」「本局小记」等 section-label 引导视线；允许页面滚动而非硬塞一屏                       |

### 核心 CSS 骨架



```
/\* 等级徽章：108px 圆形 + 渐变光环 + 呼吸光晕 \*/

.rank-badge {

&#x20; width: 108px; height: 108px; border-radius: 50%;

&#x20; display: grid; place-items: center;

&#x20; background: conic-gradient(from 210deg, var(--rank-ring-a), var(--rank-ring-b), var(--rank-ring-a));

&#x20; box-shadow: 0 0 28px var(--rank-glow);

&#x20; animation: rankBreathe 3s ease-in-out infinite;

}

.rank-badge-letter { font-size: 3rem; font-weight: 900; color: var(--rank-text); }

/\* 横向信息条：色环图标 + 文字 + 右对齐大数值 \*/

.ability-card {

&#x20; display: flex; align-items: center; gap: 14px;

&#x20; background: rgba(255,255,255,0.05); border-radius: 18px;

}

.ability-icon-wrap { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; }

.ability-value { margin-left: auto; font-size: 1.4rem; font-weight: 800; }

/\* 三栏统计条：竖分隔线 \*/

.sub-data-strip { display: flex; }

.sub-data-item + .sub-data-item { border-left: 1px solid rgba(255,255,255,0.12); }
```



***

## 2. Canvas 分享卡与页面同源

**问题**：分享卡是 Canvas 手绘图片，不会随 CSS 自动变，容易和页面视觉脱节（旧版就是「方框 + emoji」）。

**解法（Float 已落地）**：



* **同一套 line-icon 路径数据双用**：SVG `<path d="...">` 与 Canvas `new Path2D('...')` 复用同一份路径字符串，保证页面内图标与分享卡图标完全同源同形。

* 等级徽章、四维信息条、本局小记、slogan 色带在分享卡上重绘，与报告页视觉语言一一对应。

* **自适应裁剪**：先按足够高度绘制，再按实际内容 `Math.min(canvas.height, bottomY + padding)` 裁到刚好，避免底部大片空白或内容截断。



```
// 复用同一路径：页面 SVG 与 Canvas 图标同源

const ICON\_LIGHTNING = 'M13 2 3 14 12 14 11 22 21 10 12 10 13 2';

// HTML: \<svg>\<path d="M13 2 3 14..."/>\</svg>

// Canvas: ctx.fill(new Path2D(ICON\_LIGHTNING));
```



***

## 3. 系统表情 → 线描 SVG 统一

**问题**：页面残留系统表情（🎉✨💪🥳💡），与线描图标风格不统一；且「改完没生效」往往有三层原因。

**三层根治**：



1. **源码层**：所有 emoji 文案换成与四维能力同风格的 line-icon（奖牌 / 对勾 / 上升 / 星标 / 灯泡）。

2. **历史数据层**：localStorage 旧数据由旧代码写入、自带表情。用 Unicode 属性正则清洗并**回写**存储：



```
const stripEmoji = (s) => s.replace(/\p{Extended\_Pictographic}/gu, '').trim();

function sanitizeReportData(d) { /\* 遍历所有字符串字段 stripEmoji，有变化则回写 localStorage \*/ }
```



1. **缓存层**：资源链接加版本号 `styles.css?v=YYYYMMDD`、`game.js?v=YYYYMMDD`，否则浏览器 / 容器缓存旧文件，新图标「没生效」实为没加载。



***

## 4. 真机容器适配（重点）

**核心认知**：小红书容器的导航栏（返回 / 分享按钮）是**覆盖在 webview 顶部**的外壳，页面内容从 `y=0` 渲染会顶到状态栏 / 摄像头 / 导航按钮下面。窗口样式、导航栏、下拉刷新等外壳行为由容器统一控制（见 zip-artifact-spec），H5 必须自行让出顶部空间。

### 4.1 标题被摄像头 / 容器导航遮挡



```
/\* 根变量：容器导航栏高度，真机按实测微调 \*/

:root { --container-nav-h: 44px; }

/\* 报告 / 结算等顶部有标题的屏：顶部让出「状态栏 + 容器导航」 \*/

\#gameOverScreen, #reportScreen {

&#x20; padding-top: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + var(--container-nav-h, 44px));

}
```



* PC 模拟器注入 `--safe-area-inset-*` 变量、真机用 `env()`，用 `var(--x, env(...))` 组合两端生效。

* 需配合 `<meta name="viewport" ... viewport-fit=cover">`。

### 4.2 整页可上下左右拖动、露出浏览器滑条

**根因**：`body { height:100vh; width:100vw }` 在容器内实际可见高度 < 100vh，页面比可视区高出一截 → 页面级滚动；100vw 在出现滚动条时还产生横向溢出。

**锁死方案（Float 已落地）**：



```
html, body {

&#x20; height: 100%;            /\* 不要用 100vh/100dvh 撑出溢出 \*/

&#x20; width: 100%;             /\* 不要用 100vw（横向溢出源） \*/

&#x20; overflow: hidden;

&#x20; overflow-x: hidden;

&#x20; overscroll-behavior: none;

}

.app-container {

&#x20; height: 100%;

&#x20; overflow: hidden;

}

.screen {

&#x20; height: 100%;

&#x20; overflow-y: auto;        /\* 唯一滚动容器：屏内滚动 \*/

&#x20; overflow-x: hidden;

&#x20; overscroll-behavior: contain;

&#x20; -webkit-overflow-scrolling: touch;

&#x20; scrollbar-width: none;   /\* 隐藏屏内滚动条 \*/

}

.screen::-webkit-scrollbar { display: none; }
```

效果：页面级滚动 / 回弹消除，内容只在 `.screen` 内滚动且不露滑条，横向拖动消除。

### 4.3 其他真机要点



* 底部安全区：`.app-container` 用 `padding-bottom: max(15px, env(safe-area-inset-bottom))`。

* 软键盘遮挡：监听 `visualViewport` 处理（未用到的场景可跳过）。

* 容器导航标题由容器 UI 配置（zip-artifact-spec），页面内不要再放一个重复的顶栏标题。



***

## 5. 验证方法



* 本地起 `python3 -m http.server 8137`，用浏览器（mac\_computer\_use\_tool + browser-use 平面）导航 `http://localhost:8137/dist/index.html?t=<时间戳>` 防缓存。

* **模拟真机容器**：注入 `position:fixed` 顶部条（状态栏 0\~47px + 导航 47\~91px，带返回 / 分享图标）作为对照，再注入 `:root{ --safe-area-inset-top: 59px }` 模拟 iPhone 14 Pro Max 安全区，用 `getBoundingClientRect()` 确认标题顶端 < 导航底部。

* **验证滚动**：对比 `body.scrollHeight == body.clientHeight`（页面不滚）+ `screen.scrollHeight > screen.clientHeight`（屏内可滚）。

* **截图注意**：页面有无限 CSS 动画时浏览器截图易超时，先注入 `*{animation:none !important;transition:none !important;}` 再截图。

* 输出文件先 `mkdir -p` 输出目录，避免 `shutil.copy` 报 No such file。



***

## 6. 报告类页面单屏紧凑化（报告 / 结算 / 分享卡三端同步）

**现象**：真机反馈「报告新排版高度超出手机屏幕视口，需要上下滑动」。迷你小游戏报告应**单屏完整显示、无需滚动**。

**根因**：真机 390×844 视口下，去掉顶部避让（安全区 59 + 容器导航 44 + 容器 padding 15 ≈ 118px）与底部安全区（≈34px）后，**可用高度约 688px**；而紧凑化前报告内容约 752px，超出约 64px+。区块间距、字号、徽章偏大是主要来源。

**目标**：内容高度压到 **≤680px**（844 视口留余量），并在 780px 高视口尽量接近单屏。

**压缩清单（真机移动端生效值，对应 `@media (max-width: 480px)`）**：

| 区块 | 压缩前 → 压缩后 | 节省 |
| --- | --- | --- |
| 等级徽章 | 92px → 72px，下距 12 → 6px | ~26px |
| 徽章字母 | 2.3rem → 1.9rem | ~2px |
| 等级标题/标签 | 1.1/0.82 → 1.0/0.76rem，标题下距 4→2 | ~5px |
| 解读 | 0.86 → 0.8rem，下距 3→1 | ~4px |
| 分区小标题 | margin 18/8 → 7/3px（×2 处） | ~16px |
| 四维行 | padding 11→5px，行距 gap 10→7，图标圆 34→27 | ~40px |
| 四维行内文字 | name/eval 0.82/0.72 → 0.78/0.68rem，值 1.15→1.04rem | ~8px |
| 本局小记 | 值 1.1→0.96rem，行距 gap 5→3 | ~6px |
| 建议色带 | padding 12→8px，下距 20→10 | ~12px |
| 按钮组 | 高 40→37px，字号 0.84→0.78rem | ~4px |
| 页头标题 | 1.25→1.12rem，下距 10→8 | ~5px |

合计节省约 **120~130px**。`scrollHeight`（含顶部 padding-top 103px）从 ~870 压到 814 ≈ `clientH`，**overflow=0**，底部按钮 `btnBottom < 视口底`，单屏完成。

**验证（复用 §5 方法）**：

```
/* 注入固定手机高度 + 容器 chrome 条，逐一测 844/780/740/700 */
html,body{height:H px !important} .app-container{height:H px !important}
:root{--safe-area-inset-top:59px}
/* 断言 */
screen.scrollHeight - screen.clientHeight == 0   // 单屏
btn-group.getBoundingClientRect().bottom <= screen.clientHeight  // 按钮不裁切
```

**分享卡（Canvas）同步压缩**：页面 CSS 是响应式会自动变，但 Canvas 手绘必须**手动同步压缩**。本次 720×1495 → **720×1306**（约 -13%）：徽章环 R 86→78、四维行高 78→66 且行距 13→10、统计条/色带/页脚整体按比例收紧、底部按内容重新裁剪。参数集中在 `renderShareCard()` 顶部常量（`badgeCY / ringOuterR / rowH / rowGap / tipH / footerY / bottomLineY`），改一处出图即可对拍。

**经验要点**：

- 「单屏」要先算**可用高度** = 视口高 - 顶部避让 - 底部安全区，不要只看视口高。
- 优先压「间距 / 内边距 / 徽章」这类感知弱的部分，字号只小幅下调，保可读性。
- CSS 与 Canvas 双端排版**必须同源改版**（数值按比例），否则页面紧凑、分享卡仍旧高大，视觉不一致。

### 6.1 迭代修正：别过度压缩，让内容区「铺满整屏」与游戏界面同高

**真机二次反馈**：压缩版虽单屏，但用户嫌「排版太紧密」。用户期望报告内容显示高度**与游戏界面高度一致**——游戏页内容从顶部状态条铺到底部按钮、中间占满，报告页却内容块偏短、居中带上下死区。

**修正**：不是继续压，而是**恢复被压过的间距/字号**，让内容自然长到「可用高度 - 少量余量」，配合 `justify-content: safe center` 居中铺满，上下只剩 ~10px 死区，与游戏页内容区（≈681px，从 ~122px 到 ~803px）高度一致。

- 恢复幅度参考：徽章 72→78、四维行 padding 5→7、分区标题 margin 7/3→9/5、行距 7→8、字号各 +0.02~0.06rem。
- 验证目标：`screen.scrollHeight - screen.clientHeight == 0` 且内容块起点 ~118px、按钮底 ~800px（≈游戏页 803px），即「铺满整屏 + 单屏 + 不紧」。

**测量坑（关键）**：浏览器（mac\_computer\_use\_tool）视口常为 1800px 宽，`@media (max-width: 480px)` **不会命中**，测到的是基础值而非真机生效的移动端值！真机测量必须**手动注入一份移动端样式覆盖**（把 media 块内规则原样贴成无媒体包裹的 `<style>` 追加），再量 844/780/740 三档高度。若不注入，会误判溢出/不溢出。

***

## 7. 追加区（新经验写这里）

> 后续每轮优化完成后，按「现象 → 根因 → 解法（含代码）→ 验证」格式追加到下方，保持文档可持续生长。

### 7.1 分享按钮「点两次才弹出发布页」——点击链路净化 + 失败自动补一次

**现象**：真机每次点击分享按钮都要点 2 次才弹出发布笔记页。

**根因**：点击处理里 `postNote` 之前的主线程重活 + 大 base64 首次过桥，会让容器吞掉首次调用：
1. 旧 `handleShare` 在 `postNote` 前改 `textContent` / 置 `disabled` → 强制 reflow；
2. 报告页分享每次点击都 `JSON.parse`（含 ~1MB 大 base64 的 localStorage）→ `sanitizeReportData` 用 emoji 正则扫描大字符串 → 实时 `renderShareCard`；
3. `postNote` 携带的分享图 data:uri 约 **1.1MB** base64，首次过桥慢/易失败。

**解法（三层）**：
1. **点击零准备**：进入页面时就绪分享图与文案并缓存到内存（结算页 `endGame` 预渲染；报告页 `showReport` 时 `prepareSharePayload` 预渲染并写入 `cachedReportShare`），点击瞬间直接取用，不再实时渲染 / 解析 / 清洗。
2. **点击链路纯净**：`handleShare` 不再写 `disabled` / 改文本（会强制 reflow），改用 CSS class `.is-sharing`（`opacity` + `pointer-events:none`）防重；`shareReport` 直接取缓存的 `shareImageDataUrl`，`postNote` 是点击同步栈里几乎唯一的动作。
3. **失败自动补一次**：`postNote` reject 时 400ms 后自动重发一次（成功即跳转离开页面，无重复弹窗风险）；另加 6s 超时兜底恢复按钮（容器弹页后 JS 侧 Promise 可能挂起）。
4. 附带：`sanitizeReportData` 跳过 `shareImageDataUrl`（base64 无 emoji，避免扫描大字符串）。

**验证（本地 mock 容器）**：注入 `window.xhs.miniTool.postNote` mock，断言——3 次快速连点只触发 1 次 postNote；首调 reject 时自动补发、最终 1 次点击成功；报告页点 1 次带缓存 dataUrl（len>100000）不实时渲染。

**注意**：分享图 720×1306 的 PNG data:uri 约 1.1MB，是过桥慢的隐患；若真机仍偶发需点两次，再考虑 `writeTempFile` 换小 `filePath` 或降体积（WebP 有旧内核兼容风险，慎用）。

* （待追加）真机实测 `--container-nav-h` 最终校准值：\_\_\_

* （待追加）v1.0.3 及之后迭代的新经验：\_\_\_