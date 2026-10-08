#!/usr/bin/env python3
"""
Full-scale thesaurus.com corpus scraper pipeline (86,000+ words).
Uses Scrapling SitemapSpider to parse official sitemaps, extract all entries,
with automatic rate limiting, concurrency, and checkpointing (pause/resume).

Usage:
    uv run python full_crawl.py --output thesaurus_corpus.json --crawldir ./crawl_full_data --concurrency 15
"""

import argparse
from scrapling.spiders import SitemapSpider, CrawlRule, LinkExtractor, Response
from scrapling.fetchers import FetcherSession
from parser import parse_thesaurus_page


class ThesaurusFullSpider(SitemapSpider):
    name = "thesaurus_full"
    
    # Official sitemaps containing all ~86,000 dictionary headwords
    sitemap_urls = [
        "https://www.thesaurus.com/sitemap-thesaurus-1.xml",
        "https://www.thesaurus.com/sitemap-thesaurus-2.xml",
    ]

    def rules(self):
        return [
            CrawlRule(
                LinkExtractor(allow=r"^https://www\.thesaurus\.com/browse/[^/]+$"),
                callback=self.parse_word,
            )
        ]

    # Robust defaults for massive crawling
    concurrent_requests = 15
    download_delay = 0.15
    autothrottle_enabled = True
    robots_txt_obey = True

    def configure_sessions(self, manager):
        # TLS fingerprint evasion session
        manager.add("default", FetcherSession(impersonate="chrome"))

    async def parse_word(self, response: Response):
        if response.status == 404:
            return

        parsed = parse_thesaurus_page(response)
        parsed["url"] = response.url
        yield parsed


def main():
    parser = argparse.ArgumentParser(description="Full corpus crawl for thesaurus.com (86,000 words)")
    parser.add_argument("-o", "--output", default="thesaurus_corpus.json", help="Destination JSON file")
    parser.add_argument("-c", "--concurrency", type=int, default=15, help="Concurrent requests (default: 15)")
    parser.add_argument("--crawldir", default="./crawl_full_data", help="Checkpoint directory for pause/resume")

    args = parser.parse_args()

    print(f"Initializing full corpus crawl (~86,000 words)...")
    print(f"Checkpoint directory: {args.crawldir}")
    print(f"You can press Ctrl+C at any time to pause safely. Rerunning this command will resume from where you stopped.")

    spider = ThesaurusFullSpider(crawldir=args.crawldir)
    spider.concurrent_requests = args.concurrency
    result = spider.start()

    print(f"Crawl finished! Total words harvested: {len(result.items)}")
    result.items.to_json(args.output)
    print(f"Saved complete corpus to {args.output}")


if __name__ == "__main__":
    main()
