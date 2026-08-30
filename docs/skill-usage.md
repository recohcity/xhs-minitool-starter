# xhs-minitool-dev 使用说明书

用 AI 开发工具（Trae / Claude Code / Cursor / Codex 等）+ 本 skill，把一个创意变成可发布到小红书「Builder hub → 小工具」的合规 zip 包。

> 适用读者：想用 AI（Vibe Coding）开发小红书小工具的创作者 / 开发者。
> 规范来源：小红书官方「小工具容器・能力清单」（minitool-zip-builder v1.2.0）。

---

## 目录

1. [这个 Skill 能做什么](#1-这个-skill-能做什么)
2. [快速开始（3 步）](#2-快速开始3-步)
3. [安装到主流 AI 开发工具](#3-安装到主流-ai-开发工具)
4. [怎么触发使用（口令示例）](#4-怎么触发使用口令示例)
5. [Skill 内置开发工作流](#5-skill-内置开发工作流)
6. [合规红线速查](#6-合规红线速查)
7. [打包与自检命令](#7-打包与自检命令)
8. [上传发布到小红书](#8-上传发布到小红书)
9. [常见问题 FAQ](#9-常见问题-faq)
10. [Skill 文件清单](#10-skill-文件清单)

---

## 1. 这个 Skill 能做什么

**小工具 = 离线 H5 打包成的 zip**，由小红书容器（PC 模拟器 / 真机 WebView）加载运行。本质是网页，但运行在受控沙箱：**纯本地、不联网、部分 Web API 被禁用**。

本 Skill 把官方规范固化成 AI 可执行的开发流程，用于：

| 场景 | Skill 做的事 |
| --- | --- |
| 从零新建小工具 | 按模板生成 `index.html` + 外置 JS/CSS，只用允许的能力，直接产出合规 zip |
| 改写已有 H5 页面 | 扫描代码中被禁 API/行为，逐项替换成替代写法，再打包 |
| 部署失败排查 | 对照能力清单与打包规范定位失败原因（内联脚本、外部资源、zip 层级等） |

不负责的环节：小红书后台的账号申请、内测资格开通、图标/文案设计（属人工操作）。

---

## 2. 快速开始（3 步）

```bash
# ① 把 skill 复制到你的项目（以 Trae 为例，其他工具见第 3 节）
cp -r .trae/skills/xhs-minitool-dev  你的项目/.trae/skills/

# ② 用 AI 工具打开你的项目，发一句口令（见第 4 节）
#    例如：帮我开发一个"英语单词消消乐"小红书小工具并打包成 zip

# ③ 拿到 zip → 小红书创作后台 Builder hub 上传（见第 8 节）
```

---

## 3. 安装到主流 AI 开发工具

Skill 就是一个文件夹（`SKILL.md` + `references/`），把它复制到对应工具的 skills 目录即可。本仓库中的源路径：`.trae/skills/xhs-minitool-dev/`。

| AI 工具 | 项目级安装路径（推荐） | 用户级（全局所有项目可用） |
| --- | --- | --- |
| **Trae** | `<项目>/.trae/skills/xhs-minitool-dev/` | — |
| **Claude Code** | `<项目>/.claude/skills/xhs-minitool-dev/` | `~/.claude/skills/xhs-minitool-dev/` |
| **Cursor** | `<项目>/.cursor/skills/xhs-minitool-dev/`（或按官方指引放 `.claude/skills/`） | — |
| **Codex CLI** | `<项目>/.codex/skills/xhs-minitool-dev/` | `~/.codex/skills/xhs-minitool-dev/` |
| **其他 Agent** | `<项目>/.skill/xhs-minitool-dev/`（官方通用约定） | — |

安装示例：

```bash
# Claude Code
mkdir -p .claude/skills && cp -r .trae/skills/xhs-minitool-dev .claude/skills/

# Cursor
mkdir -p .cursor/skills && cp -r .trae/skills/xhs-minitool-dev .cursor/skills/

# Codex
mkdir -p .codex/skills && cp -r .trae/skills/xhs-minitool-dev .codex/skills/
```

安装后校验：目录内应有 5 个文件——`SKILL.md`、`references/device-capabilities.md`、`references/zip-artifact-spec.md`、`references/cross-platform-h5.md`、`references/jsbridge-api.md`。**references 必须随 SKILL.md 一起复制**，skill 工作流依赖它们。

> 若你的工具不支持自动识别 skills：直接在对话里让 AI「先读取 `.trae/skills/xhs-minitool-dev/SKILL.md` 并严格按其工作流执行」，效果等同。

---

## 4. 怎么触发使用（口令示例）

### 场景 A：从零新建小工具

```
帮我开发一个小红书小工具：<一句话描述功能与玩法>。
按 xhs-minitool-dev skill 的规范开发，完成后打包成可上传的 zip，输出校验摘要和产物路径。
```

示例：

```
帮我开发一个小红书小工具：看图选拼音练习，随机展示包内图片，
点选正确拼音得分，支持本地最高分记录。
按 xhs-minitool-dev skill 的规范开发，完成后打包成 zip，输出校验摘要和产物路径。
```

### 场景 B：把已有 H5 改写为小工具

```
把当前目录的 H5 页面改写为符合小红书小工具规范的离线包并打包：
按 xhs-minitool-dev skill 执行——先扫描被禁能力和行为并替换，
仅替换被禁能力、不改其余业务逻辑，最后打包成 zip 并给出自检结果。
```

### 场景 C：部署失败排查

```
我的小工具 zip 上传小红书后部署失败。产物在 ./dist，
按 xhs-minitool-dev skill 的 zip-artifact-spec 与 device-capabilities
逐项检查（zip 根目录、内联脚本、外部资源、禁用 API），列出问题并修复后重新打包。
```

> 提示：描述需求时给出**素材边界**（图片/音频是否已备好、体积多大）能显著减少来回。所有资源必须进 zip，总包建议 < 2MB、单图 < 500KB。

---

## 5. Skill 内置开发工作流

AI 严格执行以下 5 步（每步先读对应 reference，不凭记忆产出）：

```
① 编写/适配 HTML ──► 读 zip-artifact-spec.md
   目录结构、index.html 模板、相对路径引用、CSP 资源加载规则

② 端能力合规 ──────► 读 device-capabilities.md
   对照「不可用能力/行为」逐项扫描，移除或改用替代写法

③ 跨端适配 ────────► 读 cross-platform-h5.md
   Pointer Events 统一交互、安全区 env()、PC 模拟器 vs 真机差异

④ 改写正确性自查
   被禁 API 无残留、脚本加载顺序正确、引用资源都在 zip 内、未误改业务逻辑

⑤ 打包
   逐条核对各 reference 自检清单 → 全部通过 → 打 zip → 输出校验摘要和路径
```

推荐项目结构（AI 会按此生成）：

```
你的项目/
└── dist/                  # 打包目录（zip 压缩它的内容）
    ├── index.html         # 唯一入口，必须在根
    └── assets/
        ├── style.css
        ├── main.js        # 脚本必须外置，事件用 addEventListener
        └── images/
```

---

## 6. 合规红线速查

**五条铁律**（90% 的部署失败源于违反它们）：

1. **不联网** — `fetch` / `XMLHttpRequest` / WebSocket / 一切 `https://` 外部资源加载不到；资源全部打进 zip 相对引用。
2. **脚本必须外置** — 容器 CSP 禁止内联 `<script>`、行内事件 `onclick="..."`、`javascript:` URI、`eval()`、`new Function()`。
3. **`index.html` 必须在 zip 根目录** — 压缩「目录内容」而非「目录本身」，否则解压多一层目录直接部署失败。
4. **单页应用** — 一个 `index.html`，视图用 JS 切换 DOM；禁 `window.open` / `target="_blank"` / 跳转站外。
5. **改写只动被禁能力** — 适配已有 H5 时不顺手改其余业务逻辑与 UI。

**能力边界一览**：

| ✅ 可用 | 🔴 禁用 |
| --- | --- |
| 标准 HTML/CSS/JS、Flexbox/Grid、动画 | 网络请求（fetch/XHR/WebSocket/WebRTC） |
| Canvas 2D、WebGL（仅包内资源做纹理） | 定位、剪贴板 API、传感器、蓝牙/USB |
| 相机/麦克风 `getUserMedia`（须按钮点击等用户手势 + 授权） | Worker（Web/Shared/Service）、WASM |
| `<input type="file">` 选图/视频（仅图片和视频） | `eval` / `new Function` / 内联脚本 |
| `localStorage` / `sessionStorage` / `IndexedDB`（按小工具隔离） | iframe / object、表单跳转提交、文件下载 |
| `alert()` / `confirm()`、touch/pointer 手势 | `window.open` / `window.prompt`、全屏 API、外部资源 |

---

## 7. 打包与自检命令

### 打包（正确姿势）

```bash
cd dist && zip -r ../tool.zip . -x '*.DS_Store'
```

```bash
# ❌ 错误：压缩目录本身，解压后 index.html 变成 dist/index.html → 部署失败
zip -r tool.zip dist
```

### 自检命令（AI 会执行，也可手动验证）

```bash
# 1. 确认 zip 根目录直接是 index.html（顶层不应先出现文件夹）
unzip -l tool.zip

# 2. 扫描禁用 API / 外部资源残留（应无输出）
grep -rnE "fetch\(|XMLHttpRequest|eval\(|new Function|window\.open\(|window\.prompt\(|<iframe|target=\"_blank\"" dist/
grep -rnE "https?://" dist/ --include="*.html" --include="*.js" --include="*.css"

# 3. 确认无内联脚本与行内事件
grep -rnE "<script>[^<]|onclick=|onchange=|javascript:" dist/*.html

# 4. 确认无开发垃圾文件
unzip -l tool.zip | grep -E "node_modules|\.DS_Store|\.map|config\."
```

### 完整自检清单（AI 打包前逐条核对）

- [ ] `index.html` 在 zip 根目录，未多套一层目录
- [ ] `<!DOCTYPE html>` + `lang="zh-CN"` + `charset=UTF-8`，viewport 含 `viewport-fit=cover`
- [ ] 全部资源相对路径（`./assets/...`），无 `http(s)://` 引用
- [ ] 脚本全部外置 `<script src>`，事件全部 `addEventListener`
- [ ] 无禁用 API（网络、定位、剪贴板、传感器、Worker、WASM…）
- [ ] 相机/麦克风/选图符合「用户手势触发 + 授权」
- [ ] 仅含允许文件类型：html/css/js/图片/woff(2)/json
- [ ] 总包 < 2MB，单图 < 500KB
- [ ] 交互用 pointer/touch events，布局自适应无写死宽度，安全区用 `env() + fallback`

---

## 8. 上传发布到小红书

1. **入口**：小红书创作后台（PC）→ **Builder hub → 小工具 → 上传小工具**（内测期需受邀可见）
2. **基础信息**：名称、产品 Slogan、图标
3. **部署**：上传 zip → 选择版本号 → 勾选所需权限（相册 / 摄像头 / 麦克风 / 本地存储）
4. **预览**：手机扫码预览，确认交互正常
5. **审核**：提交后一般数分钟到数小时出结果
6. **挂载**：手机端发布笔记时从「小工具」入口选择挂载；用户在笔记下方直接使用，不跳出小红书
7. **管理**：Builder hub → 小工具，可下架、编辑、更新版本

> 设计建议（官方口径）：定位「轻量、简单」，UI 简洁美观、贴合小红书社区氛围，更易过审与传播。

---

## 9. 常见问题 FAQ

**Q1：部署失败最常见的原因？**
按命中率排序：① zip 里多包了一层目录（index.html 不在根）；② HTML 里有内联 `<script>` 或 `onclick=`；③ 引用了外部 `https://` 资源。用第 7 节自检命令逐项排查。

**Q2：为什么摄像头/麦克风不弹授权框？**
容器要求**用户手势触发**。必须放在按钮 `click` 等事件回调里调用 `getUserMedia`，不能在页面加载时直接调。

**Q3：`<input type="file">` 的 `accept` 不生效？**
系统选择器被容器接管，**无论 accept 怎么设都只能选图片和视频**，不要依赖选其他格式。

**Q4：复制文本怎么做？**
剪贴板 API 全禁用。展示可选中文本，引导用户手动选中复制。

**Q5：数据能存多久？**
`localStorage` / `IndexedDB` 可用且按小工具隔离，但**不保证永久持久化**，关键数据别只存本地一份预期。

**Q6：能用 Three.js / AI 模型吗？**
纯 WebGL 渲染可用（纹理必须打包在内）；但依赖 **WASM**（Draco/Basis/ONNX/抠图算法）或 **Worker**（OffscreenCanvas）或**联网**的方案全部不可用。Three.js 基础功能可用，注意剔除其 WASM/联网相关模块。

**Q7：能做多页面跳转吗？**
不能。只有一个 `index.html`，「页面」用 JS 切换视图 DOM 实现。

**Q8：能用 CDN 引入 React/Vue 吗？**
不能引外部 CDN，但可以把框架文件下载后打进 zip 用相对路径引用（注意体积，小工具推荐原生 JS 保持轻量）。

**Q9：官方规范更新了怎么办？**
Skill 头部标注了规范版本（1.2.0）。官方包地址：`https://fe-static.xhscdn.com/mini-tool/1.2.0/minitool-zip-builder.zip`（版本号可能升级，以 Builder hub 文档页为准），可下载最新版对照更新 skill 内容。

---

## 10. Skill 文件清单

| 文件 | 作用 |
| --- | --- |
| `SKILL.md` | 入口：触发条件、五条铁律、工作流调度、能力速览 |
| `references/device-capabilities.md` | 能力清单：可用/不可用 API 与行为、替代写法、改写扫描清单 |
| `references/zip-artifact-spec.md` | ZIP 构建规范：目录结构、CSP 资源规则、index.html 模板、打包自检 |
| `references/cross-platform-h5.md` | 跨端适配：触摸、滚动、安全区、PC 模拟器 vs 真机 |
| `references/jsbridge-api.md` | JSBridge API 规范：`window.xhs.miniTool.*` 调用约定与可用接口 |
