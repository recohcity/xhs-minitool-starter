---
name: thesaurus-scraper
description: Specialized scraping pipeline and toolchain for Thesaurus.com. Supports single word extraction, batch wordlist processing (e.g., 300 to 10,000 words), and full corpus crawling (~86,000 words) using Scrapling with Cloudflare bypass, structured POS, definitions, similarity-ranked synonyms, and antonyms.
version: "1.0.0"
metadata:
  target: "https://www.thesaurus.com"
  dependencies:
    - scrapling>=0.4.15
    - curl_cffi
    - orjson
---

# Thesaurus.com Scraper Skill

This skill provides production-ready, battle-tested pipelines for scraping English vocabulary, definitions, parts of speech (POS), similarity-ranked synonyms, and antonyms from [Thesaurus.com](https://www.thesaurus.com/).

Powered by the **Scrapling** framework, this skill bypasses Cloudflare anti-bot protection using TLS/JA3 browser fingerprint impersonation without the overhead of heavy headless browsers.

---

## Directory Structure

```
thesaurus-scraper/
├── SKILL.md                          # Current skill guide & documentation
├── scripts/
│   ├── parser.py                     # Core DOM parser for Thesaurus.com
│   ├── single_word.py                # Pipeline 1: Single word CLI & programmatic query
│   ├── batch_words.py                # Pipeline 2: High-throughput batch crawl (e.g. 300~3000 words)
│   └── full_crawl.py                 # Pipeline 3: Full 86,000+ words sitemap crawler
└── examples/
    ├── sample_300_words.txt          # Ready-to-use 300 words list (GRE/TOEFL/CET)
    └── sample_single.json            # Reference JSON output schema
```

---

## Prerequisites & Standalone Portability

### Can it be used in other projects without `Scrapling-Skill`?
**Yes, absolutely.** This skill is completely self-contained. It does **NOT** require `Scrapling-Skill` (which is just a documentation reference skill).

### Does it require the Scrapling Python library?
**Yes.** The internal pipelines use Scrapling's high-speed TLS fingerprint fetcher and spider engine. In any external project, simply install the library:

```bash
pip install "scrapling[all]"
# or
uv add "scrapling[all]"
```

Then copy the `thesaurus-scraper/` directory into your project's skills or tools directory.

---

## Pipeline 1: Single Word Query (单一单词管线)

Use `scripts/single_word.py` when you need to inspect or query an individual word or phrase.

### 1. Terminal Interactive View (终端可视化排版，含例句)
```bash
uv run python scripts/single_word.py serendipity
```
**Output Example:**
```text
============================================================
 Word: SERENDIPITY (Found: True)
============================================================

[Entry 1] NOUN: "accidental discovery"
  Synonyms:
    • [STRONGEST] fluke, happenstance, blessing, break, luck, dumb luck, good luck, happy chance, lucky break, stumbling upon, tripping over
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

### 2. Fetch Example Sentences for Top N Synonyms (级联同义词例句)
```bash
# Fetch search word + top 2 strongest synonyms' example sentences
uv run python scripts/single_word.py serendipity -s 2
```

### 3. Save Directly to JSON
```bash
uv run python scripts/single_word.py "ice cream" --output ice_cream.json
```

### 4. Print Clean JSON to Stdout (for pipes/APIs)
```bash
uv run python scripts/single_word.py ubiquitous --json
```

### 5. Python In-Code Usage
```python
from scripts.single_word import scrape_single_word

data = scrape_single_word("resilient", verbose=False)
if data["found"]:
    for entry in data["entries"]:
        print(entry["pos"], entry["definition"])
        print("Strongest synonyms:", entry["synonyms"].get("STRONGEST", []))
    for form, quotes in data.get("example_sentences", {}).items():
        for q in quotes:
            print(f"Example: {q['sentence']} ({q['source']})")
```

---

## Pipeline 2: Batch Wordlist Pipeline (批量单词表管线, 如 300 词)

Use `scripts/batch_words.py` to crawl a word list (300, 3,000, or 10,000 words).

### Performance Metrics:
- **300 Words**: ~30–45 seconds with 12 concurrency.
- **3,000 Words**: ~3–5 minutes.
- Memory usage: < 60MB RAM.

### 1. Scrape the Built-in 300 Words Sample
```bash
uv run python scripts/batch_words.py \
  --input examples/sample_300_words.txt \
  --output 300_results.json \
  --concurrency 12
```

### 2. Export Directly to CSV (Spreadsheet / Excel friendly)
```bash
uv run python scripts/batch_words.py \
  --input examples/sample_300_words.txt \
  --output 300_results.csv \
  --format csv \
  --concurrency 15
```

### 3. Command-Line Inline Word List
```bash
uv run python scripts/batch_words.py \
  --words "abandon,serendipity,ubiquitous,resilient" \
  --output quick_test.json
```

### 4. Checkpointing (Pause and Resume with Ctrl+C)
For large lists (e.g., 3,000+ words), specify `--crawldir`:
```bash
uv run python scripts/batch_words.py \
  --input my_words.txt \
  --output results.json \
  --crawldir ./batch_checkpoint \
  --concurrency 15
```
> If interrupted (e.g. network disconnect or `Ctrl+C`), re-running the exact same command will immediately pick up where it left off without duplicate network requests.

---

## Pipeline 3: Full Corpus Crawl (86,000 词全量词典管线)

Use `scripts/full_crawl.py` to crawl the entire Thesaurus.com database using Scrapling's `SitemapSpider`.

### How it Works:
- Scrapling extracts word URLs directly from the official sitemaps:
  - `https://www.thesaurus.com/sitemap-thesaurus-1.xml` (45,000 words)
  - `https://www.thesaurus.com/sitemap-thesaurus-2.xml` (41,047 words)
- Filters strictly matching `^https://www.thesaurus.com/browse/[^/]+$`
- Automatically adheres to `robots.txt` and rate limits with `autothrottle_enabled = True`.

### Execution:
```bash
uv run python scripts/full_crawl.py \
  --output thesaurus_full_corpus.json \
  --crawldir ./crawl_full_data \
  --concurrency 15
```
Press `Ctrl+C` at any time to pause safely. Run the same command to resume.

---

## Output Data Schema

Each word produces a structured JSON object:

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
    }
  ]
}
```

---

## Anti-Bot and Reliability Architecture

1. **TLS / HTTP/2 Impersonation**:
   Thesaurus.com operates behind Cloudflare. Standard python `requests` or `urllib` will trigger 403 Forbidden or captcha challenges. Scrapling uses `curl_cffi` to mimic real Google Chrome TLS fingerprints (`impersonate="chrome"`), maintaining a clean 200 OK throughput.
2. **Graceful 404 Handling**:
   Misspelled words or rare terms not indexed on Thesaurus.com return `found: false` with an empty entry list, preventing the pipeline from crashing.
3. **Encoding Safety**:
   Words with spaces, hyphens, or special characters are safely escaped via `urllib.parse.quote`.
