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

## 6. 追加区（新经验写这里）

> 后续每轮优化完成后，按「现象 → 根因 → 解法（含代码）→ 验证」格式追加到下方，保持文档可持续生长。



* （待追加）真机实测 `--container-nav-h` 最终校准值：\_\_\_

* （待追加）v1.0.3 及之后迭代的新经验：\_\_\_