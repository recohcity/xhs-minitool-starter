# Changelog

本项目所有值得记录的变更都会记录在此文件中。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本 SemVer](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added
- 暂无待发布内容

## [1.0.5] - 2026-09-03

### Added
- 安装官方最新 `minitool-zip-builder v1.6.0` skill 到工作区 `.skill/minitool-zip-builder/`（含新增的 `css-compatibility` / `js-compatibility` / `performance-budget` references 与 `audit_artifact` 审计脚本）

### Fixed
- 按官方 v1.6.0 兼容基线（Chrome 61 / Android 8.1）修复产物：
  - JS 语法升级到 ES2017（消除 6 处 ES2018+ 语法：可选链、空值合并、对象展开、`\p{...}` 正则），避免旧内核解析失败白屏
  - CSS 兼容：3 处 `inset` 简写改物理属性、3 处 `max()` 加 Chrome 61 基线值、14 处 Flex `gap` 采用「行为检测 `.supports-flex-gap` + 相邻子项 margin 基线」（Chrome 61 下间距不丢失）

### Changed
- 更新 `dist/` 构建产物并重建 `release/float_mini_tool.zip` 发布包（含上述兼容性修复）

## [1.0.4] - 2026-09-03

### Fixed
- 修复分享按钮需点击两次才弹出发布笔记页的问题：点击链路净化（去掉 `postNote` 前的强制重排，改为 CSS class 防重）、分享图在进入页面时预渲染并缓存到内存（点击零准备、直接同步触发）、`postNote` 失败自动补发一次、增加 6s 超时兜底防止按钮卡死

### Changed
- 报告页 / 结算页排版回放为透气档：内容区与游戏界面内容区同高、铺满整屏，单屏完整显示且不再紧密（徽章 / 四维信息条 / 分区标题 / 字号整体回放宽松值）
- 分享笔记正文最后一行改为「点击下方小红书小工具：飘， 测一下你的反应力」引导语
- 更新 `dist/` 构建产物并重建 `release/float_mini_tool.zip` 发布包（含上述全部改动）

## [1.0.3] - 2026-09-03

### Fixed
- 真机容器适配：报告页 / 结算页标题避开手机状态栏（摄像头 / 灵动岛）与容器导航栏（返回 / 分享按钮）遮挡——顶部按「安全区 + 容器导航高度」让位，标题不再被摄像头位置遮住
- 修复报告内容可上下左右整页拖动、露出浏览器滚动条的问题：页面级滚动 / 回弹锁死（`html/body` 高度 100% + `overflow:hidden` + `overscroll-behavior:none`），内容仅在屏内滚动且隐藏滚动条，横向溢出消除

### Added
- 新增 `xhs-minitool-dev` Skill 优化经验沉淀文档 `references/optimization-experience.md`（视觉层级改版模式、Canvas 分享卡同源、系统表情→线描 SVG 三层清洗、真机容器适配、验证方法，含可复用代码片段与「追加区」），并登记进 SKILL.md Reference 索引

### Changed
- 更新 `dist/` 构建产物并重建 `release/float_mini_tool.zip` 发布包（含上述真机适配修复）

## [1.0.2] - 2026-09-03

### Added
- 报告页（结算页 + 历史报告页）视觉改版：等级从文字改为 108px 圆形渐变光环徽章（S 金 / A 绿 / B 蓝，带呼吸光晕动画）、解读文字彻底去框、四维能力改为横向信息条（色环图标 + 大数值）、本局小记改为三栏统计条（竖分隔线）、训练建议保留色带强调、区块间距拉开 + 分区小标题引导、支持页面滚动
- 分享卡片重写：等级圆环徽章（随等级变色 + 外发光）、四维能力 line-icon（Path2D 复用 HTML SVG 同源路径）、新增「本局小记」得分三栏、绿色 slogan 色带横幅、按内容高度自适应裁剪
- 系统表情统一替换：等级标题 / 解读 / 训练建议 / 口号等全部改用与四维能力同源的线描 SVG 图标（奖牌 / 对勾 / 上升 / 星标 / 灯泡），历史 localStorage 旧数据自动清洗表情并回写，资源链接加版本号防缓存
- 圆角矩形绘制兼容旧内核 WebView（原生 `ctx.roundRect` 缺失时自动降级为手动路径）

### Changed
- 分享卡纵向压缩更紧凑：720×1598 → 720×1508
- 清理 372 行无用遗留 CSS（`stats-grid` / `stat-card` / `reaction-breakdown` / `leaderboard-*` / `report-entry-*` / `rule-*` 等）
- 更新 `dist/` 构建产物并重建 `release/float_mini_tool.zip` 发布包（含上述全部改动）

### Fixed
- 修复历史报告页得分为 0 时误显示「—」（得分 0 正常显示；倍率 / 最快反应为 0 仍显示占位符）

## [1.0.1] - 2026-09-02

### Added
- Float（飘）UI 吸引力专项优化：深海氛围气泡上升 + 光束扫过、Logo 叶片漂浮呼吸、「立即挑战」CTA 呼吸光晕（hover 暂停）
- 叶片按颜色（绿/橙）呼吸辉光；答对时金色「+分数」飘字 + 粒子迸发 + 得分数字滚动；倍率提升提示条「倍率提升 xN！」+ 数字弹跳
- 命中反馈由静态内发光改为扩散脉冲；倒计时最后 5 秒数字心跳放大提醒
- 结算页卡片依次浮现（等级→解读→四维→小记→建议）、等级标题金色辉光呼吸
- 屏幕切换柔和上浮淡入；按钮统一 hover 扫光效果
- 新增 `prefers-reduced-motion` 无障碍适配，尊重系统「减弱动态效果」设置
- 更新 `dist/` 构建产物与 `release/float_mini_tool.zip` 发布包（含上述全部 UI 改动）

### Changed
- 得分显示由瞬时跳变改为数字滚动动画（计分规则 `50 × 倍率` 数学不变）
- 命中反馈视觉由静态内发光改为扩散脉冲

### Fixed
- 无

## [1.0.0] - 2026-08-30

### Added
- 项目起步模板：基于小红书官方「小工具容器・能力清单」（minitool-zip-builder v1.2.0）
- 内置 `xhs-minitool-dev` Skill：`SKILL.md` + 4 份 references（device-capabilities / zip-artifact-spec / cross-platform-h5 / jsbridge-api）
- Float（飘）实例游戏：60 秒反应力训练小游戏，纯 H5 + Canvas + Web Audio，已上线小红书小工具
- `docs/skill-usage.md`：Skill 安装、触发口令、开发工作流与 FAQ 使用说明书
- 打包与合规自检命令及完整自检清单
- `release/` 发布产物（图标与可直接上传的 zip 包）
- MIT License

[1.0.5]: https://github.com/recohcity/xhs-minitool-starter/releases/tag/v1.0.5
[1.0.4]: https://github.com/recohcity/xhs-minitool-starter/releases/tag/v1.0.4
[1.0.3]: https://github.com/recohcity/xhs-minitool-starter/releases/tag/v1.0.3
[1.0.2]: https://github.com/recohcity/xhs-minitool-starter/releases/tag/v1.0.2
[1.0.1]: https://github.com/recohcity/xhs-minitool-starter/releases/tag/v1.0.1
[1.0.0]: https://github.com/recohcity/xhs-minitool-starter/releases/tag/v1.0.0
