---
name: 同义替换卡 (Synonym Cards)
description: 暖心手账书斋风的英语同义替换小红书小工具
colors:
  primary: "#ff9a76"
  primary-deep: "#e07850"
  secondary: "#ffd97a"
  tertiary-green: "#b7e0c0"
  tertiary-green-deep: "#4a9c5d"
  tertiary-blue: "#a8c8f0"
  tertiary-blue-deep: "#3b6fd4"
  tertiary-lilac: "#d9c8f2"
  tertiary-lilac-deep: "#6b4e9e"
  neutral-bg: "#faf5ea"
  neutral-paper: "#f3ead9"
  neutral-surface: "#fffdf7"
  neutral-text: "#3d352c"
  neutral-text-muted: "#8a7d6c"
  neutral-border: "#e8dfc8"
  craft-edge: "#c8b898"
  craft-edge-light: "#e0d5bf"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif"
    fontSize: "30px"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "0.5px"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "1px"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.3px"
rounded:
  sm: "8px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "18px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  chip-intent:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  card-base:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "16px 14px"
---

# Design System: 同义替换卡 (Synonym Cards)

## Overview

**Creative North Star: "The Stationery Study & Washi Notebook"**

「同义替换卡」并非冷冰冰的词典搜索器，而是一本温暖、可靠且井然有序的随身手账词斋。其视觉设计围绕真实特种纸品、和纸胶带贴角与彩色研习便签展开，赋予高频英语词汇替换一种触手可及的纸质书写温度。界面的每一寸材质都在向实体手作质感致敬，克制而亲和，让用户在小红书容器内体验到沉浸式沉淀感。

系统贯彻「视觉分级」策略：查词主屏保持纯粹与高效，白底微暖卡片配合极简搜索框，绝不以装饰喧宾夺主；词卡与收藏屏切换为温暖手账态，借助物理双层纸边与胶带层次营造收藏珍视感；挑战练习与成绩卡则点缀活泼的印章对错圈点与手作标签反馈。全系统杜绝科技暗黑模式、高光炫目滤镜、虚浮的深色投影与 AI 样板渐变。

**Key Characteristics:**
- **Warm Paper Canvas**: 采用温润米黄特种纸底色（`#faf5ea` / `#f3ead9`），绝不用刺眼纯冷白作为主视界面。
- **Physical Stationery Edges**: 运用实体卡片厚度投影与 1.5px/2.5px 浅卡其暖边，模拟纸张层叠的厚实质感。
- **Handmade & Playful Accents**: 和纸胶带黄、彩色分类便签标与印章圈划反馈，营造愉悦的手作研习体验。
- **Bilingual Typographic Harmony**: 现代无衬线中英系统字体与例句中的典雅 Georgia 衬线字体自然呼应。

## Colors

调色盘取材于天然植物染料与文房纸札：温润陶土柿橙、蜜糖日晒胶带黄，以及鼠尾草绿、天空蓝与丁香紫等便签点缀。

### Primary
- **Warm Persimmon (暖柿橙)** (`#ff9a76` / `#e07850`): 主强调色与决策高光。专用于 BEST MATCH 最优推荐卡边框、选中的意图胶囊、高频替换词高亮与核心收藏动作。在温和纸色中提供第一时间的视觉锚点。

### Secondary
- **Honey Amber (蜜糖琥珀黄)** (`#ffd97a`): 次强调色。模拟半透明和纸胶带与柔和日光色泽，专用于场景试玩 Chip、练习挑战主按键、已选 Tab 切换状态与提示背景。

### Tertiary
- **Sage Herbal Green (鼠尾草绿)** (`#b7e0c0` / `#4a9c5d`): 熟练度达成、正确答案圈点（`#4f9a63`）与学术词汇标签背景（`#E0EDE8`）。
- **Sky Stationery Blue (天空蓝)** (`#a8c8f0` / `#3b6fd4`): 口语/日常语境标签、词库新词徽标（`#E0EDFF`）与高亮链接。
- **Lilac Lavender (丁香紫)** (`#d9c8f2` / `#6b4e9e`): 学术核心词（AWL）专属标签背景（`#EDE7F5`），呈现考究的学术沉静感。

### Neutral
- **Parchment Paper (米黄羊皮纸)** (`#faf5ea`): 全局应用画布背景，温润护眼，奠定手账书斋底色。
- **Layered Kraft Paper (牛皮特种纸)** (`#f3ead9`): 侧边抽屉底板、次级容器背景与输入框清除按键底色。
- **Ivory Card Surface (象牙白卡面)** (`#fffdf7` / `#ffffff`): 词卡、搜索框与内容块主要表层，与纸质底色拉开微妙明暗层次。
- **Deep Espresso Ink (浓缩咖啡墨黑)** (`#3d352c`): 正文与主词标题的主阅读色，比死黑更具人文印刷触感。
- **Pencil Lead Gray (铅笔灰暖调)** (`#8a7d6c`): 辅助释义、说明文字、未激活标签与英文例句中文字义。
- **Craft Separator Line (暖调纸纹分隔线)** (`#e8dfc8`): 卡片边框、虚线分隔与底部分割线。
- **Stationery Edge Shadow (卡片物理厚边)** (`#c8b898` / `#e0d5bf`): 模拟物理卡片右侧与底部的 2.5px 浅卡其厚度立体边。

### Named Rules
**The Washi Accent Rule.** 暖柿橙作为主决策引导，单屏视区内覆盖面积严控在 ≤15%。它的稀缺与精准即是用户替换词决策的最高信号。
**The Natural Ink Rule.** 严禁使用 `#000000` 纯黑文字；所有文字均采用调配了微量赭暖倾向的浓缩咖啡墨（`#3d352c`）或铅笔暖灰（`#8a7d6c`），保障阅读温润度。

## Typography

**Display Font:** `-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
**Body Font:** `-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`
**Literary / Example Font:** `Georgia, serif` (斜体)

**Character:** 界面以清晰明朗的现代中英文系统排版为主，词汇大字重达 900 突出第一辨识度；英文例句则特意引入经典的 Georgia 衬线字体配合斜体排版，传递原汁原味的西方经典文学出版物研习质感。

### Hierarchy
- **Display** (weight: 900, size: `30px`, line-height: `1.1`, letter-spacing: `0.5px`): 目标词与 BEST MATCH 推荐词主标题。
- **Headline** (weight: 800, size: `17px`, line-height: `1.3`, letter-spacing: `1px`): 顶部导航品牌标题与弹窗主标题。
- **Title** (weight: 700, size: `15px`, line-height: `1.4`): 预测词项、卡片分块标题与考级分类。
- **Body** (weight: 400/600, size: `13px`, line-height: `1.6`): 中文短释义、使用区别解析与语感对比。
- **Literary Example** (weight: 400, size: `12px~13px`, line-height: `1.5`, style: `italic`, family: `Georgia, serif`): 词卡上下文双语例句。
- **Label** (weight: 700, size: `11px`, line-height: `1.4`, letter-spacing: `0.3px`): AWL、雅思核心、语气分类小标签与词频分级。

### Named Rules
**The Editorial Quote Rule.** 所有英文例句必须使用 `Georgia, serif` 斜体渲染，中文例句翻译保持常规铅笔暖灰排布在侧，构建经典词汇手册的双语对照韵律。

## Layout

移动端容器限定最大宽度为 `480px`（`max-width: 480px; margin: 0 auto;`），严格适配小红书小程序及 iOS/Android 屏幕顶部安全区（`env(safe-area-inset-top)`）与底部手势条（`env(safe-area-inset-bottom)`）。

- **Container Padding**: 屏幕主水平内边距固定为 `14px`；卡片内部常用 `16px 14px` 紧凑网格。
- **Rhythm & Gaps**: 标签组与 Chip 阵列采用 `6px` ~ `8px` 网格步进；各功能卡片块间距为 `12px` ~ `18px`。
- **Sticky Zones**: 查词页顶部固顶 `topbar`（高度 `56px` + 安全区），底部固顶 `tabbar`（高度 `72px` 预留安全区）；收藏卡分类标签支持平滑吸顶。
- **Internal Card Scroll**: 查词出现结果态后，主视区自适应填充屏幕高度，卡片头部保持可视，卡身详情与例句采用独立微细滚动条（`0.5px` 暖调手柄）。

## Elevation & Depth

本系统摒弃传统扁平 UI 的单一图层，也拒绝数字界面的重度模糊高斯投影，确立**物理纸张层叠与实体书卡厚度**法则。

- **Layer 0 (Canvas)**: 温润米黄特种纸底色（`#faf5ea`）。
- **Layer 1 (Cards & Inputs)**: 象牙白纸卡面，依靠 `1.5px solid #e0d5bf` 浅卡其边框，并在右侧和底部叠加 `2.5px solid #c8b898` 实体阴影边，模拟裁切平整的厚卡纸边缘。
- **Layer 2 (Highlighted Decisions)**: BEST MATCH 推荐卡采用 `2px solid #ff9a76` 珊瑚边框，配合极浅暖光微晕（`box-shadow: 0 4px 16px rgba(255, 154, 118, .18)` 或 `2px 2px 0 rgba(217, 119, 87, .1)`）。
- **Layer 3 (Modals & Bottom Sheet)**: 纯纸色磨砂遮罩（`rgba(61, 53, 44, .6)`），模态卡片带 `20px` 饱满圆角与温润阴影。

### Named Rules
**The Physical Paper Edge Rule.** 核心词卡不使用虚化弥散的深黑阴影，而必须使用右边与底边加粗的浅卡其边框（`border-right: 2.5px solid #c8b898; border-bottom: 2.5px solid #c8b898;`），确保视觉重量如同一张实体拿在手心的硬纸卡。

## Shapes

- **Card Corners**: 主词卡与浮层圆角为 `14px` ~ `20px`，柔润舒适，消除尖锐冷漠感。
- **Capsule Pills**: 意图 Chips、操作按钮与分类标签统一为高度饱和的胶囊圆角（`border-radius: 14px` ~ `16px`）。
- **Search Pill**: 搜索主框采用 `border-radius: 20px`，呈现饱满开阔的视觉张力。
- **Tags & Badges**: 权威词库徽标（AWL / IELTS）采用规整微圆角（`4px`），体现小印章般的形式感。

## Components

所有组件设计均体现「手作趣味、清晰可辨、触感踏实」。

### Buttons
- **Shape**: 胶囊圆角（`14px` ~ `18px`）。
- **Primary Action (收藏/跳转/确认)**: 背景为温润暖柿橙（`#ff9a76`），文字纯白，文字字重 `700`，内边距 `6px 14px`。按压态透明度变为 `0.7`。
- **Secondary / Mini Button**: 背景为蜜糖琥珀黄（`#ffd97a`），文字为墨黑（`#3d352c`），字重 `800`，内边距 `8px 16px`。
- **Share Capsule (发笔记/分享)**: 背景为水草深绿（`#4a9c5d`），白字，字重 `700`，微带圆角胶囊。

### Chips & Intent Selectors
- **Style**: 默认态为纯白卡面底色（`#ffffff`），搭配 `1.5px solid #e8dfc8` 浅浅纸纹描边，内边距 `6px 12px`，文字字重 `700`。
- **Selected State**: 切换为暖柿橙满铺背景（`#ff9a76`），描边同步为橙色，文字反白。
- **Touch**: 按压态透明度 `0.7`，微动画利落明确。

### Cards / Containers
- **Corner Style**: `14px`（详情卡）/ `18px`（基础卡）/ `24px`（结果主卡）。
- **Background**: 象牙白（`#fffdf7`）渐变至微暖纸色（`#fdf4e3`）。
- **Border**: `1.5px` 暖色基准描边，右侧与底部为 `2.5px solid #c8b898` 实体厚边。

### Inputs / Search Box
- **Style**: 饱满胶囊框，背景纯白（`#ffffff`），`1.5px solid #e8dfc8` 浅边，内部嵌入放大镜铅笔灰线稿 SVG 图标与圆形清空按键。
- **Focus**: `border-color: #ff9a76`，微弱过渡，聚焦时不产生突兀的浏览器默认黑框。

### Navigation / Tabbar
- **Style**: 底部固定栏，圆角上顶收腰（`border-radius: 20px 20px 0 0`），背景为象牙白纸卡色（`#fffdf7`），顶部带有 `1px solid #e8dfc8` 分界线。
- **Active State**: 选中项被一抹温暖的蜜糖琥珀黄胶囊底色（`#ffd97a`）托起，图标与文字变粗为 `800` 浓墨黑，如同手账标签被和纸胶带轻轻贴住。

### Signature Component: The Best Match Deck
- **Description**: 经过智能排序的最高匹配词展示盒，外框饰以温暖鲜明的暖柿橙高亮细描边，右上角提供一键跳转深挖按钮，卡内嵌 Georgia 斜体例句，是用户做出替换决策的核心阵地。

## Do's and Don'ts

### Do:
- **Do** 坚持使用暖调纸质色系（`#faf5ea` / `#f3ead9` / `#fffdf7`），保持手账纸质研习氛围。
- **Do** 始终为英文例句套用 `Georgia, serif` 斜体排版，维持与正文现代无衬线字体的层次对照。
- **Do** 遵守「暖柿橙高亮严控 ≤15%」法则，将主色留给最核心的决策推荐（BEST MATCH）与动作按钮。
- **Do** 采用实体双边加粗（右侧与底部 `2.5px solid #c8b898`）构建卡片厚度，而非大面积深灰高斯阴影。
- **Do** 严格保持小红书容器 480px 宽度约束，妥善处理 iOS/Android 全面屏安全边距。

### Don't:
- **Don't** 引入任何深黑背景模式（Dark Mode）、科技感霓虹渐变（Neon Blue/Purple）、或赛博发光投影。
- **Don't** 对正文与标题使用 `#000000` 纯死黑，必须使用调和后的浓缩咖啡墨（`#3d352c`）。
- **Don't** 使用尖锐直角；除小印章 Tag 保持 4px 规整微圆角外，所有可交互组件和卡片均应为 10px~24px 柔润圆角。
- **Don't** 滥用过度动画；所有状态切换控制在 150ms~300ms 轻快微过渡，严禁对 `width`/`height` 引起重排的属性施加过渡动画。
