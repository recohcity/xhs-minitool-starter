# xhs-minitool-starter

> 基于小红书官方 Skill 规范的小工具开发起步模板，含完整小游戏实例与发布指南，帮助开发者用 AI（Vibe Coding）快速创建并上架小红书小工具。

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![小红书](https://img.shields.io/badge/平台-小红书-ff2442.svg)](https://www.xiaohongshu.com)

---

## ✨ 项目特性

- **官方规范对齐**：基于小红书「小工具容器・能力清单」（minitool-zip-builder v1.2.0），确保产出合规
- **AI 驱动开发**：内置 Skill，支持 Trae / Claude Code / Cursor / Codex 等主流 AI 开发工具
- **完整实例**：附带 `float` 反应力训练小游戏，从开发到发布全流程可参考
- **零外部依赖**：纯 HTML/CSS/JS，离线运行，不联网，符合小红书沙箱要求
- **一键打包**：内置打包与合规自检脚本，产出可直接上传的 zip 包

---

## 🎮 实例游戏：Float（飘）

一个 60 秒反应力训练小游戏，已上线小红书小工具。

| 维度 | 说明 |
|---|---|
| **玩法** | 绿叶看指向、橙叶看移动，滑动响应，锻炼任务切换能力 |
| **技术** | 纯 H5 + Canvas 分享图 + Web Audio 合成音效/BGM |
| **特性** | 新手教学、反应力报告、分享海报生成、背景音效 |
| **适配** | 移动端触摸滑动 + 桌面端键盘方向键 |

游戏截图与体验：访问小红书搜索「飘·60 秒测测你的反应力」。

---

## 📁 目录结构

```
xhs-minitool-starter/
├── README.md                    # 项目说明（本文件）
├── CHANGELOG.md                 # 版本变更记录
├── VERSION                      # 当前版本号（如 1.0.4）
├── docs/
│   └── skill-usage.md           # Skill 详细使用说明书
├── .trae/
│   └── skills/
│       └── xhs-minitool-dev/    # 小红书小工具开发 Skill（核心资产）
│           ├── SKILL.md
│           └── references/
│               ├── device-capabilities.md
│               ├── zip-artifact-spec.md
│               ├── cross-platform-h5.md
│               └── jsbridge-api.md
├── game/
│   └── float/                   # 实例游戏：反应力训练
│       ├── index.html
│       ├── game.js
│       ├── styles.css
│       ├── README.md
│       └── dist/                # 构建产物（可直接打包上传）
└── release/
    ├── float_icon_1024.png      # 小工具图标
    ├── float_mini_tool.zip      # 可直接上传的发布包
    └── icon.svg
```

---

## 🚀 快速开始

### 1. 安装 Skill 到你的 AI 开发工具

Skill 位于 `.trae/skills/xhs-minitool-dev/`，复制到对应工具的 skills 目录即可：

```bash
# Claude Code
mkdir -p .claude/skills && cp -r .trae/skills/xhs-minitool-dev .claude/skills/

# Cursor
mkdir -p .cursor/skills && cp -r .trae/skills/xhs-minitool-dev .cursor/skills/

# Trae
mkdir -p .trae/skills && cp -r .trae/skills/xhs-minitool-dev .trae/skills/

# Codex CLI
mkdir -p .codex/skills && cp -r .trae/skills/xhs-minitool-dev .codex/skills/
```

### 2. 用 AI 开发你的小工具

在 AI 工具中输入口令，例如：

```
帮我开发一个"英语单词消消乐"小红书小工具，按 skill 规范完成开发并打包成可上传的 zip
```

Skill 会自动：
- 按规范生成 `index.html` + 外置 JS/CSS
- 只使用允许的 Web API
- 扫描并替换禁用 API
- 打包成合规 zip

### 3. 上传发布

拿到 zip 包后，前往 [小红书创作后台](https://creator.xiaohongshu.com/) → Builder hub → 小工具，上传发布。

---

## 📋 开发规范要点

小红书小工具本质是**离线 H5 打包成的 zip**，运行在受控沙箱中：

| 规范 | 要求 |
|---|---|
| **入口** | zip 根目录必须有 `index.html` |
| **脚本** | 禁止内联 `<script>`，必须外置 JS 文件 |
| **网络** | 禁止 `fetch` / `XMLHttpRequest` / `WebSocket`，纯本地运行 |
| **禁用 API** | geolocation、clipboard、Worker、eval、WebAssembly、iframe 等 |
| **资源** | 禁止外部资源引用，所有文件打包在 zip 内 |
| **包体积** | zip < 5MB，单资源 < 2MB |
| **分享** | 通过 `window.xhs.miniTool.postNote()` 生成分享笔记 |

完整规范见 `.trae/skills/xhs-minitool-dev/references/`。

---

## 📦 打包与自检

```bash
# 进入实例游戏目录
cd game/float

# 同步 dist 并打包
cp index.html game.js styles.css dist/
cd dist && zip -r ../../release/your-tool.zip . -x '*.DS_Store'

# 合规自检（无禁用 API、无内联脚本）
grep -rnE "fetch\(|XMLHttpRequest|new WebSocket|eval\(|new Function" . || echo "✅ 合规"
```

---

## 🛠️ 技术栈

- **前端**：原生 HTML5 / CSS3 / JavaScript（ES6+）
- **音效**：Web Audio API 实时合成（无外部音频文件）
- **分享图**：Canvas 动态生成
- **存储**：localStorage 本地持久化
- **AI 开发**：Skill 驱动的 Vibe Coding 工作流

---

## 📖 相关文档

- [CHANGELOG](./CHANGELOG.md) — 版本变更记录
- [Skill 使用说明书](./docs/skill-usage.md) — Skill 安装、触发口令、开发工作流、FAQ
- [Skill 规范](./.trae/skills/xhs-minitool-dev/SKILL.md) — 开发工作流与约束
- [实例游戏 README](./game/float/README.md) — Float 游戏的玩法与技术说明

---

## 📄 许可证

[MIT License](./LICENSE)

---

## 🙋 常见问题

**Q：没有 AI 工具能直接用吗？**
A：可以。参考 `game/float/` 实例，手动编写纯 H5 页面，按规范打包即可。Skill 只是加速开发。

**Q：审核要多久？**
A：通常 1-3 个工作日，具体以小红书后台为准。

**Q：可以用 React/Vue 吗？**
A：可以，但最终必须打包成静态 H5（构建产物），且不能有运行时网络请求。

---

如果这个项目对你有帮助，欢迎 ⭐ Star 支持！
