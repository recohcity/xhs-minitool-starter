#!/usr/bin/env python3
"""
Batch words scraper pipeline for thesaurus.com using Scrapling Spider.
Supports batch sizes (e.g., 300 to 10,000 words), concurrency control, 
error handling, checkpointing (pause/resume), and JSON/CSV export.

Usage:
    uv run python batch_words.py --input sample_words.txt --output results.json --concurrency 10
    uv run python batch_words.py --words "apple,banana,cherry,serendipity" --output out.json
"""

import argparse
import os
import sys
import urllib.parse
from typing import List

from scrapling.spiders import Spider, Request, Response
from scrapling.fetchers import FetcherSession
from parser import parse_thesaurus_page


class ThesaurusBatchSpider(Spider):
    name = "thesaurus_batch"
    robots_txt_obey = False

    def __init__(self, words: List[str], crawldir: str = None, **kwargs):
        super().__init__(crawldir=crawldir, **kwargs)
        self.words = words

    def configure_sessions(self, manager):
        # High performance TLS Chrome fingerprint session
        manager.add("default", FetcherSession(impersonate="chrome"))

    async def start_requests(self):
        for w in self.words:
            clean = w.strip()
            if not clean:
                continue
            safe_enc = urllib.parse.quote(clean.lower())
            url = f"https://www.thesaurus.com/browse/{safe_enc}"
            yield Request(url, meta={"query_word": clean})

    async def parse(self, response: Response):
        query_word = response.meta.get("query_word", "")
        
        if response.status == 404:
            yield {
                "query_word": query_word,
                "actual_word": query_word,
                "found": False,
                "url": response.url,
                "entries_count": 0,
                "entries": []
            }
            return

        parsed = parse_thesaurus_page(response, query_word=query_word)
        parsed["url"] = response.url
        parsed["entries_count"] = len(parsed.get("entries", []))
        
        yield parsed


def run_batch_pipeline(
    words: List[str],
    output_file: str,
    concurrency: int = 12,
    crawldir: str = None,
    output_format: str = "json"
):
    print(f"Starting batch crawl for {len(words)} words with concurrency={concurrency}...", file=sys.stderr)
    
    spider = ThesaurusBatchSpider(words=words, crawldir=crawldir)
    spider.concurrent_requests = concurrency
    result = spider.start()

    # Save results
    total_scraped = len(result.items)
    print(f"Finished. Total scraped items: {total_scraped}", file=sys.stderr)

    if output_format.lower() == "csv" or output_file.endswith(".csv"):
        # For CSV, flatten entries
        import csv
        with open(output_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["query_word", "actual_word", "found", "pos", "definition", "synonyms_strongest", "synonyms_other", "antonyms", "example_sentences"])
            for item in result.items:
                q_word = item.get("query_word", "")
                a_word = item.get("actual_word", "")
                found = item.get("found", False)
                entries = item.get("entries", [])
                
                # Format example sentences summary
                ex_sentences = item.get("example_sentences", {})
                ex_list = []
                for form, quotes in ex_sentences.items():
                    for q in quotes[:3]:
                        src = f" ({q['source']})" if q.get('source') else ""
                        ex_list.append(f"[{form}] \"{q['sentence']}\"{src}")
                ex_text = " | ".join(ex_list)

                if not entries:
                    writer.writerow([q_word, a_word, found, "", "", "", "", "", ex_text])
                else:
                    for idx, ent in enumerate(entries):
                        pos = ent.get("pos", "")
                        defn = ent.get("definition", "")
                        syns = ent.get("synonyms", {})
                        strong_syn = "; ".join(syns.get("STRONGEST", []))
                        other_syn = "; ".join([w for k, v in syns.items() if k != "STRONGEST" for w in v])
                        ants = ent.get("antonyms", {})
                        all_ants = "; ".join([w for v in ants.values() for w in v])
                        # Only write example sentences on first entry row to avoid duplication
                        row_ex = ex_text if idx == 0 else ""
                        writer.writerow([q_word, a_word, found, pos, defn, strong_syn, other_syn, all_ants, row_ex])
        print(f"CSV exported successfully to {output_file}", file=sys.stderr)
    else:
        result.items.to_json(output_file)
        print(f"JSON exported successfully to {output_file}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Batch pipeline to scrape word definitions and synonyms from thesaurus.com")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("-i", "--input", help="Path to input text file with words (one word per line)")
    group.add_argument("-w", "--words", help="Comma-separated list of words (e.g. 'happy,sad,fast,slow')")
    
    parser.add_argument("-o", "--output", default="batch_results.json", help="Path to output file (JSON or CSV)")
    parser.add_argument("-c", "--concurrency", type=int, default=12, help="Number of concurrent requests (default: 12)")
    parser.add_argument("--format", choices=["json", "csv"], default="json", help="Output format (json or csv)")
    parser.add_argument("--crawldir", default=None, help="Directory for checkpointing (supports pause and resume with Ctrl+C)")

    args = parser.parse_args()

    words = []
    if args.input:
        if not os.path.exists(args.input):
            print(f"Error: input file {args.input} does not exist!", file=sys.stderr)
            sys.exit(1)
        with open(args.input, "r", encoding="utf-8") as f:
            words = [line.strip() for line in f if line.strip()]
    elif args.words:
        words = [w.strip() for w in args.words.split(",") if w.strip()]

    if not words:
        print("Error: No words found to scrape.", file=sys.stderr)
        sys.exit(1)

    run_batch_pipeline(
        words=words,
        output_file=args.output,
        concurrency=args.concurrency,
        crawldir=args.crawldir,
        output_format=args.format
    )


if __name__ == "__main__":
    main()
