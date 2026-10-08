# 优化经验沉淀（Optimization Experience）

> 本文档沉淀小工具迭代过程中的可复用模式、踩坑与真机适配经验。
>
> **每完成一轮优化，把新的经验按下列分区追加到对应小节**
>
> ，保持「模式 + 反例 + 代码片段」的格式，便于后续直接复用。来源：Float（飘）反应力游戏 v1.0.2 视觉改版 + 真机适配。

## 维护约定（重要）

- 本文档是本项目 **唯一 skill（`minitool-zip-builder`）的一部分**，随 skill 一起使用、一起入库。
- **官方 skill 会不定期更新**：更新时下载最新 `.skill` 包 → 解压覆盖 `.skill/minitool-zip-builder/`（references/scripts 一并覆盖）→ **务必保留本文件**（若被覆盖，从 git 历史恢复）→ 按新版本自检清单重新校验产物。
- 沉淀文档随优化、新游戏加入**持续生长**：新增游戏 / 新优化轮次时，在下方「追加区」按「现象 → 根因 → 解法 → 验证」追加，并同步登记目录。

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

### 7.1 分享按钮「点两次才弹出发布页」——点击链路净化 + 降体积 + filePath 优先 + 桥预热（终案·真机验证通过）

**现象**：真机每次点击分享按钮都要点 2 次才弹出发布笔记页。用户精确描述：第 1 次点击按钮「闪一下」无效果，第 2 次点击看到「100% 加载完成」后进入发布页——**第 1 次用的是未落盘的 dataURL（容器静默失败），第 2 次用的是已就绪的 filePath（本地文件加载成功）**。

**根因（分层）**：
1. 点击处理里 `postNote` 之前的主线程重活 + 大 base64 首次过桥，会让容器吞掉首次调用（旧 `handleShare` 改 `textContent`/`disabled` 强制 reflow；每次点击 `JSON.parse` ~1MB base64 + emoji 正则扫描 + 实时 `renderShareCard`）；
2. **真机定论：`postNote` 的 `image_resources[].url` 传 `data:` base64 直传不可靠（首次过桥慢/易失败、静默吞掉），传 `writeTempFile` 返回的 `filePath` 才稳定**——这是反复 5 轮修复后最终确认的行为；
3. 预热 `writeTempFile` 若在用户点击后才完成，点击时只能回退 dataURL → 首次调用失败；
4. 容器 JSBridge 首次调用存在初始化延迟，首个 `postNote` 可能被吞（无 reject/resolve，Promise 挂起，自动补也不触发）。

**解法（终案，五层叠加）**：
1. **点击零准备**：进入页面时就绪分享图与文案并缓存到内存（结算页 `endGame` 预渲染；报告页 `showReport` 时 `prepareSharePayload` 预渲染并写入 `cachedReportShare`），点击瞬间直接取用，不再实时渲染 / 解析 / 清洗。
2. **点击链路纯净**：`handleShare` 不再写 `disabled` / 改文本（会强制 reflow），改用 CSS class `.is-sharing`（`opacity` + `pointer-events:none`）防重；`shareReport` 是点击同步栈里几乎唯一的动作，`postNote` 同步发出、零 await（预热 filePath 优先，否则 dataURL 保底）。
3. **分享图降体积（治本之一）**：导出格式 PNG → **JPEG 0.85**（分享卡深蓝渐变背景不透明，JPEG 无视觉损失；WebP 有旧内核兼容风险慎用）。720 宽分享卡实测 **810KB → 57KB（缩小 14 倍）**，过桥数据量级从 ~1MB 降到 ~57KB。
4. **filePath 优先 + 预热提前（治本之二·真机关键）**：`prewarmShareImage` 在 **`endGame` 生成分享图后立即调用**（结算动画 + 用户阅读报告期间完成 `writeTempFile` 落盘，天然 2~3s 缓冲），点击时 `shareImagePath` 必已就绪；首页报告路径 `showReport` 同样预热（`prewarmShareImage` 内部有 `shareImagePath` 防重）。
5. **桥预热 + 防重窗口缩短**：页面加载/开局即调**无副作用只读 API `getLaunchOptions`** 建立 JSBridge 通道（`warmupBridge()`，避免首次 postNote 撞初始化延迟）；`postNote` reject 时 400ms 自动补发一次（成功即跳转离开页面，无重复弹窗风险）；超时兜底从 6s 缩至 **2.5s**（容器弹页后 Promise 挂起时更快恢复按钮，用户可再点，此时桥已预热 + filePath 已就绪，第二次几乎必成）。
6. 附带：`sanitizeReportData` 跳过 `shareImageDataUrl`（base64 无 emoji，避免扫描大字符串）。

**验证**：
- 本地 mock 容器：注入 `getLaunchOptions` / `postNote` / `writeTempFile` mock——页面 load 即调 `getLaunchOptions` 1 次；预热 250ms 完成 → 点击 1 次恰好 1 次 postNote、`image_resources[0].url` 为预热 `filePath`（非 dataURL）；3 次快速连点只触发 1 次 postNote；首调 reject 自动补发。
- **真机（用户验收）**：修复前点 2 次（第 1 次闪一下失败）；修复后游戏结束直接点分享，**1 次点击即弹出发布笔记页**。
- **挂起补发增强（2026-10-08 复测回归）**：真机偶发「又要点 2 次」，根因是容器吞掉首次 postNote 时 Promise **挂起（不 resolve 不 reject）**，原有 catch 补发不触发。新增：postNote 发出后 600ms 未 settle 即视为被吞，自动补发一次（`shareReport(snapshot, true)`，此时 filePath 大概率已就绪）；成功跳转后页面 JS 上下文销毁，定时器不再触发，无重复弹窗风险。mock 验证：首次挂起 → 600ms 自动补发成功（补发 url 为 filePath），`autoRetryWorked: true`。
- **彻底根治（2026-10-08 全链路加固）**：此前终案依赖「预热必早于点击完成」，但真机存在两类窗口让首次点击仍失败：① 容器桥注入晚于页面 JS（`warmupBridge` 在 load 时调用，当时 `miniTool` 尚未注入则跳过，之后无人再预热）；② 用户在结算动画/报告刚出现时立刻点击，`writeTempFile` 尚未完成 → 首次 postNote 只能走 dataURL → 被吞 → 600ms 自动补发**脱离用户手势上下文**，容器拒绝非手势触发的 postNote → 用户被迫点第 2 次（第 2 次手势内 filePath 已就绪 → 成功）。三层加固：**① 桥就绪轮询 `waitForBridge()`**（50ms 间隔轮询 `window.xhs.miniTool`，注入后立即 `getLaunchOptions` 预热，`warmupBridge` 改为轮询入口）；**② 点击手势内确保 filePath**：`shareReport` 开头若 `shareImagePath` 未就绪，先 `await` 已发出的预热 Promise（`snapshot._prewarm` single-flight），仍无则**在同一手势内 `await writeTempFile`** 再 `postNote`——把「确保 filePath + 发布」压缩进同一次点击的手势激活窗口；③ 保留 600ms 挂起补发 + reject 后 400ms 补发。**关键认知：容器可能拒绝脱离手势上下文的自动补发，补发只是兜底，真正根治是让首次点击手势内 filePath 必就绪**。mock 四场景验证全过：A writeTemp 慢 800ms+100ms 即点 → 手势内 await 完成，1 次调用用 filePath；B 桥晚注入 600ms → 轮询预热后 1 次成功；C 点击时桥未注入（200ms 点、250ms 注入）→ `waitForBridge(300)` 手势内等到桥，1 次成功；D 首次被吞挂起 → 600ms 自动补发 2 次调用均 filePath。

**要点**：`postNote` 媒体字段传 `filePath` 优先于 `dataURL`；预热必须早于用户可点击时刻完成（提前到结果生成即预热）；首次桥调用前先用 `getLaunchOptions` 预热通道；容器吞调用可能是「静默挂起」而非 reject——必须加超时判吞自动补发，不能只依赖 catch；**桥注入时机不可假设早于页面 JS，必须轮询等待；自动补发脱离手势上下文可能被容器拒绝，根治=首次点击手势内确保 filePath（等待/手势内写入）**。

### 7.2 postNote 的 tags 必须是 string——传数组会被 Native 忽略

**现象**：同义替换词「发笔记（多图词卡）」测试，发布页标题/正文正常预填，但**话题区空**，只有小红书按内容自动推荐的快捷话题（如 #英语写作 #雅思大作文），用户需手动点选，即「看不到添加的标签」。

**根因**：`jsbridge-api.md` 规定 `postNote.tags` 类型为 **string**（"表中未声明的字段不要传"），而代码传的是数组（`["#英语学习", ...]`），Native 解析失败/直接忽略，话题未附着。

**解法**：统一在 postNote 边界做数组 → 字符串转换，空格分隔、保留 `#` 前缀（与发布页话题展示形式一致）：

```js
function tagsToStr(tags) {
  if (!tags || !tags.length) return "";
  var arr = [];
  for (var i = 0; i < tags.length; i++) {
    var s = String(tags[i]).trim();
    if (!s) continue;
    arr.push(s.charAt(0) === "#" ? s : "#" + s);
  }
  return arr.join(" ");
}
```

三处调用点都要改：标准词卡多图分享（`doShareImage`）、练习成绩分享（`doPost`）、词库反馈分享；`if (tags.length) postData.tags = ...` 改为 `var tagStr = tagsToStr(tags); if (tagStr) postData.tags = tagStr;`。

**验证（本地 mock 容器）**：注入 `window.xhs.miniTool.postNote` mock 后走完整点击路径，断言捕获的 `postData.tags` 为 string：`"#英语学习 #同义替换 #英语写作 #雅思 #四六级 #important #英语词汇 #学习打卡 #英语口语 #英语干货"`。

**注意**：JSBridge 文档未规定 tags 字符串分隔符。真机后续两轮实测（见 7.3 终案）证明：`postData.tags` 无论传 "#前缀空格串" 还是 "纯话题名空格串"，话题都不附着——**tags 字段在真机上不承载话题预置能力**，不要再花精力调其格式。

### 7.3 postNote 真机复测：tags 字段（string）仍未附着话题 → 正文内嵌话题双保险

**现象（真机复测）**：按 7.2 把 `postData.tags` 改为 string（空格 + #前缀）后重新上传，发布页**话题区依然空白**，只有小红书按内容关键词自动推荐的快捷话题按钮，用户仍需手动点选。

**结论**：`postNote.tags` 字段在真机上不可靠（PC 模拟器是否生效未验证），不要再依赖它单独完成话题预置。后续两轮真机实测进一步确认：纯 `#话题` 文字只以灰色普通文本展示（可见但不可点击、不算话题），**唯一能让话题真实附着（蓝字）的是正文内嵌 `#话题名[话题]#` 序列化格式**——见下方「终案」。

**解法（双保险）**：在笔记 `content` 正文末尾追加完整话题串（平台按正文 #话题 识别/转话题），同时保留 `postData.tags` string 字段：
- `stdCardNote` / `quizNote`（两分支）：`content += "\n\n" + tags.join(" ")`（tags 数组须先于 content 定义）；
- 词库反馈文案原本已在正文末尾带 `#同义替换词 #词库反馈`，保持。
- 内容长度控制在 1000 字内（实测 331 字含 10 话题，安全）。

**验证（本地 mock）**：mock postNote 断言 `content` 以 `"\n\n#英语学习 #同义替换 #英语写作 …"` 结尾、`tags` 为同值 string。

**终案（2026-09-15 真机确认，v2026.09.15-t3）**：小红书话题的富文本序列化格式为 `#话题名[话题]#`。把正文末尾话题串从纯 `#名称` 改为该格式后，真机发布页把 10 个话题全部还原为**真实蓝字话题**，用户确认"话题生效了"。实现：

```js
/* tags 数组 → 话题标记串：xhs 话题序列化格式 "#名称[话题]#"，pre-fill 可还原为真话题（蓝字） */
function topicMarkup(tags) {
  if (!tags || !tags.length) return "";
  var arr = [];
  for (var i = 0; i < tags.length; i++) {
    var s = String(tags[i]).trim();
    if (!s) continue;
    if (s.charAt(0) !== "#") s = "#" + s;
    arr.push(s + "[话题]#");
  }
  return arr.join(" ");
}
```

替换点：`stdCardNote`、`quizNote` 两分支的 `tags.join(" ")` → `topicMarkup(tags)`；词库反馈正文内联改 `#同义替换词[话题]# #词库反馈[话题]#`。`postData.tags` 保留纯话题名 string（无害，备用）。实测正文 381 字（10 话题 + 标记）< 1000 上限。

**真机判定路径速查（不要再重走）**：
1. tags 数组 → 话题区空（Native 忽略类型不符字段）
2. tags string "#前缀空格串" → 话题区空
3. tags string 纯话题名空格串 → 话题区空
4. 正文内嵌纯 "#名称" 空格串 → 发布后为灰色普通文本，非话题
5. 正文内嵌 "#名称[话题]#" 空格串 → **话题生效（蓝字）** ✅

**流程教训（2026-09-15）**：封面/设计类改版，先向用户确认设计方向再动代码与打包；用户仅提供设计参考图≠已授权实施，擅自改并重打包会被要求回滚。

* （待追加）真机实测 `--container-nav-h` 最终校准值：\_\_\_

* （待追加）v1.0.3 及之后迭代的新经验：\_\_\_