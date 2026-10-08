# Thesaurus.com 词库抓取工具与 Skill

基于 [Scrapling](https://github.com/D4Vinci/Scrapling) 爬虫框架构建的 **Thesaurus.com** 专用抓取工具包与 Agent Skill。

针对 [Thesaurus.com](https://www.thesaurus.com/) 提供了完整的工程化抓取管线，能够稳定绕过 Cloudflare 反爬机制，结构化提取英文单词的**词性（POS）、英文释义、相似度分级同义词（STRONGEST / STRONG / WEAK）及反义词**。

---

## 🌟 核心特性

- ⚡ **超高性能与轻量化**：基于 Scrapling 的 TLS/JA3 指纹伪装（`impersonate="chrome"`），**无需启动笨重的无头浏览器**即可秒级获取 SSR 页面，内存占用 < 60MB。
- 🛡️ **天然过 Cloudflare**：有效应对 Cloudflare 的基础质询与安全检测，保障高并发请求成功率。
- 🎯 **三套即用管线**：
  1. **单词精准查询**：终端可视化卡片打印、JSON 输出、支持多词性多释义展示。
  2. **批量词表抓取**（如 300 ~ 3,000 词）：支持并发调节、进度监控、导出 JSON 与 CSV 表格。
  3. **8.6 万词全库爬取**：基于官方 XML 站点地图（Sitemap）索引驱动，精准全量爬取。
- ⏯️ **断点续爬（Checkpointing）**：批量与全量爬虫原生支持按 `Ctrl+C` 优雅暂停，重新执行同一命令即可无缝从断点继续，零重复开销。

---

## 📁 目录结构

```text
thesaurus-scraper/
├── README.md                         # 中文说明文档（本文件）
├── SKILL.md                          # Agent Skill 规范文件（供 AI Agent 自动读取）
├── scripts/
│   ├── parser.py                     # 核心 DOM 页面解析模块
│   ├── single_word.py                # 【管线 1】单一单词查询 CLI
│   ├── batch_words.py                # 【管线 2】批量单词表抓取脚本
│   └── full_crawl.py                 # 【管线 3】8.6 万全量词典 Sitemap 爬虫
└── examples/
    ├── sample_300_words.txt          # 真实 300 个核心词汇示例（GRE/托福高频词）
    └── sample_single.json            # 单词抓取产出的标准 JSON 结构
```

---

## 📦 跨项目独立使用说明（无需 Scrapling-Skill）

### 1. 是否可以脱离当前项目独立使用？
**可以，完全独立！**
- `thesaurus-scraper` 是一个**自包含（Self-contained）**的独立工具包与 Skill，内部自带了所有抓取与解析逻辑（`parser.py`、`batch_words.py` 等）。
- **不需要**外部携带 `Scrapling-Skill`（`Scrapling-Skill` 仅为 Scrapling 框架本身的文档型知识库，非运行时代码）。

### 2. 是否需要 Scrapling 运行环境？
**是的，需要安装 `scrapling` Python 库。**
- 本工具的底层 HTTP 请求与 Cloudflare TLS 指纹伪装依赖于 `scrapling` 库。
- 在任何新项目中，**只需安装 `scrapling` Python 包**，即可立即运行此 Skill。

---

## 🚀 环境准备与跨项目安装

在任何需要使用本工具的外部项目中，按以下步骤配置：

### 步骤 1：安装 Scrapling 依赖包

根据你项目使用的包管理工具选择一条命令安装：

```bash
# 方式 A：使用 pip（标准方式）
pip install "scrapling[all]"

# 方式 B：使用 uv（极速方式，推荐）
uv add "scrapling[all]"
# 或如果是在已有虚拟环境中：
uv pip install "scrapling[all]"

# 方式 C：使用 poetry
poetry add "scrapling[all]"
```

> **注意**：必须带有 `[all]` 或 `[fetchers]` 扩展标签，因为抓取 Thesaurus.com 绕过 Cloudflare 需要其中的 `curl_cffi` 底层支持。

### 步骤 2：将本目录复制到你的项目中

将整个 `thesaurus-scraper/` 目录复制到你项目的任意位置，例如：
- 存放于你的 AI Agent 技能目录：`<你的项目根目录>/.agents/skills/thesaurus-scraper/`
- 或者作为你项目的普通脚本工具：`<你的项目根目录>/tools/thesaurus-scraper/`

复制后即可直接执行下列所有命令！

---

## 🛠️ 三大抓取管线使用指南

### 管线 1：单一单词即时查询 (`single_word.py`)

适用于日常查词、词条分析或编写独立脚本时调用。

#### 1. 终端可视化格式化展示（含真实语料例句）
```bash
uv run python agent-skill/thesaurus-scraper/scripts/single_word.py serendipity
```
**终端输出效果：**
```text
============================================================
 Word: SERENDIPITY (Found: True)
============================================================

[Entry 1] NOUN: "accidental discovery"
  Synonyms:
    • [STRONGEST] fluke, happenstance, blessing, break, luck, dumb luck, good luck...
  Antonyms:
    • [STRONG] bad fortune, bad luck, misfortune

----------------------------------------
 Example Sentences (真实语料例句):
----------------------------------------
  • [serendipity] (5 sentences):
    - "Yes, that’s why I like the word serendipity." — Slate (Mar. 2, 2026)
    - "When you’re just another tourist following a well-trodden itinerary, serendipity is rare..." — The Wall Street Journal (Oct. 30, 2025)
  • [serendipities] (5 sentences):
    - "The serendipities of age keep improving his designs." — New York Times (Sep. 1, 2022)

============================================================
```

#### 2. 同时抓取“同义词的例句”（级联抓取前 N 个最强同义词）
```bash
# 同时抓取本词 + 前 2 个最强同义词的例句
uv run python agent-skill/thesaurus-scraper/scripts/single_word.py serendipity -s 2
```

#### 3. 保存为 JSON 结果文件
```bash
uv run python agent-skill/thesaurus-scraper/scripts/single_word.py "ice cream" --output ice_cream.json
```

#### 4. 输出纯 JSON 到终端（方便管道符传输）
```bash
uv run python agent-skill/thesaurus-scraper/scripts/single_word.py resilient --json
```

#### 5. 在 Python 代码中导入使用
```python
import sys
sys.path.append("agent-skill/thesaurus-scraper/scripts")
from single_word import scrape_single_word

data = scrape_single_word("ubiquitous", verbose=False)
if data["found"]:
    for entry in data["entries"]:
        print(f"[{entry['pos']}] {entry['definition']}")
        print("最强同义词:", entry["synonyms"].get("STRONGEST", []))
    
    # 获取真实例句与媒体出处
    for form, quotes in data.get("example_sentences", {}).items():
        for q in quotes:
            print(f"例句: {q['sentence']} 出处: {q['source']} ({q['date']})")
```

---

### 管线 2：批量单词表抓取 (`batch_words.py`)

专门针对 **300 ~ 3,000 个单词**的词表抓取场景设计：
- **300 个单词**：12 并发下约 **30~45 秒**完成。
- **3,000 个单词**：15 并发下约 **3~5 分钟**完成。

#### 1. 抓取内置的 300 词测试集并保存为 JSON
```bash
uv run python agent-skill/thesaurus-scraper/scripts/batch_words.py \
  --input agent-skill/thesaurus-scraper/examples/sample_300_words.txt \
  --output 300_words_result.json \
  --concurrency 12
```

#### 2. 导出为 CSV 表格（适配 Excel / 飞书 / 数据库导入）
```bash
uv run python agent-skill/thesaurus-scraper/scripts/batch_words.py \
  --input agent-skill/thesaurus-scraper/examples/sample_300_words.txt \
  --output 300_words_result.csv \
  --format csv \
  --concurrency 15
```

#### 3. 启用断点续爬（Checkpointing）
处理大规模词表时，加上 `--crawldir` 参数。若抓取过程中断（网络波动或手动按 `Ctrl+C`），再次运行同一命令会自动从暂停位置继续抓取：
```bash
uv run python agent-skill/thesaurus-scraper/scripts/batch_words.py \
  --input my_words.txt \
  --output results.json \
  --crawldir ./batch_checkpoint \
  --concurrency 15
```

#### 4. 命令行快速指定测试单词（逗号隔开）
```bash
uv run python agent-skill/thesaurus-scraper/scripts/batch_words.py \
  --words "abandon,serendipity,ubiquitous,resilient" \
  --output quick_test.json
```

---

### 管线 3：8.6 万全量词典爬取 (`full_crawl.py`)

抓取 Thesaurus.com 的全站词库。利用官方公开的两份 Sitemap 索引：
- `https://www.thesaurus.com/sitemap-thesaurus-1.xml` (约 45,000 词)
- `https://www.thesaurus.com/sitemap-thesaurus-2.xml` (约 41,047 词)

#### 运行命令：
```bash
uv run python agent-skill/thesaurus-scraper/scripts/full_crawl.py \
  --output thesaurus_full_corpus.json \
  --crawldir ./full_corpus_checkpoint \
  --concurrency 15
```
- 内置 `autothrottle_enabled = True`，根据响应延迟自动限速。
- 随时按 `Ctrl+C` 暂停，下次运行会自动加载断点。

---

## 📊 数据输出格式（Schema）

每个词条输出完整的 JSON 结构，包含多个词性义项卡片（Entry）：

```json
{
  "query_word": "happy",
  "actual_word": "happy",
  "found": true,
  "url": "https://www.thesaurus.com/browse/happy",
  "entries_count": 2,
  "entries": [
    {
      "pos": "ADJECTIVE",
      "definition": "in high spirits; delighted",
      "synonyms": {
        "STRONGEST": ["cheerful", "delighted", "ecstatic", "elated", "glad", "joyful"],
        "STRONG": ["blessed", "captivated", "gleeful", "jolly"],
        "WEAK": ["flying high", "on cloud nine", "tickled pink"]
      },
      "antonyms": {
        "STRONGEST": ["depressed", "disappointed", "sad", "unhappy"],
        "WEAK": ["hopeless", "morose"]
      }
    },
    {
      "pos": "ADJECTIVE",
      "definition": "favored by fortune",
      "synonyms": {
        "STRONGEST": ["fortunate", "lucky"],
        "STRONG": ["apt", "successful"],
        "WEAK": ["advantageous", "favorable", "promising"]
      },
      "antonyms": {
        "WEAK": ["unfortunate", "unlucky"]
      }
    }
  ]
}
```

---

## ❓ 常见问题与注意事项

1. **终端提示 `command not found: scrapling`**
   - 依赖位于虚拟环境中。请在命令前加上 `uv run`（如 `uv run python ...`），或者先执行 `source .venv/bin/activate` 激活环境。
2. **生僻词或拼写错误（404）如何处理？**
   - 管线脚本内置了 404 捕获，未收录词条会标记为 `"found": false, "entries": []`，不会中断整体批处理任务。
3. **遇到包含空格或特殊字符的短语怎么办？**
   - 解析器自动进行了 `urllib.parse.quote` 编码（如 `ice cream` 自动编码为 `ice%20cream`），Thesaurus.com 会正确重定向并返回内容。
4. **并发设置建议**：
   - 批量模式推荐并发设置为 `10 ~ 15`。过大并发可能触发 Cloudflare 的速率限制（429）。
