# Changelog

本项目所有值得记录的变更都会记录在此文件中。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本 SemVer](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added
- Float（飘）UI 吸引力专项优化：深海氛围气泡上升 + 光束扫过、Logo 叶片漂浮呼吸、「立即挑战」CTA 呼吸光晕（hover 暂停）
- 叶片按颜色（绿/橙）呼吸辉光；答对时金色「+分数」飘字 + 粒子迸发 + 得分数字滚动；倍率提升提示条「倍率提升 xN！」+ 数字弹跳
- 命中反馈由静态内发光改为扩散脉冲；倒计时最后 5 秒数字心跳放大提醒
- 结算页卡片依次浮现（等级→解读→四维→小记→建议）、等级标题金色辉光呼吸
- 屏幕切换柔和上浮淡入；按钮统一 hover 扫光效果
- 新增 `prefers-reduced-motion` 无障碍适配，尊重系统「减弱动态效果」设置
- 更新 `dist/` 构建产物与 `release/float_mini_tool.zip` 发布包（含上述全部 UI 改动）
- 新增合规检查报告 `ui-polish-compliance-report.html`（容器合规 + UI 特性验证 + 业务逻辑未动核查）

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

[1.0.0]: https://github.com/recohcity/xhs-minitool-starter/releases/tag/v1.0.0
