#!/usr/bin/env python3
"""
Single word scraper for thesaurus.com using Scrapling.
Usage:
    uv run python single_word.py serendipity
    uv run python single_word.py "ice cream" --output ice_cream.json
"""

import argparse
import json
import sys
import urllib.parse
from scrapling.fetchers import Fetcher
from parser import parse_thesaurus_page


def scrape_single_word(word: str, verbose: bool = True) -> dict:
    clean_word = word.strip()
    encoded = urllib.parse.quote(clean_word.lower())
    url = f"https://www.thesaurus.com/browse/{encoded}"
    
    if verbose:
        print(f"Fetching: {url} ...", file=sys.stderr)

    page = Fetcher.get(url, impersonate="chrome")
    if page.status == 404:
        return {
            "query_word": clean_word,
            "actual_word": clean_word,
            "found": False,
            "status": 404,
            "entries": []
        }
    
    data = parse_thesaurus_page(page, query_word=clean_word)
    data["status"] = page.status
    data["url"] = url
    return data


def format_text_output(data: dict) -> str:
    lines = []
    word = data.get("actual_word") or data.get("query_word")
    lines.append("=" * 60)
    lines.append(f" Word: {word.upper()} (Found: {data.get('found', False)})")
    lines.append("=" * 60)
    
    if not data.get("found"):
        lines.append(" No definitions or synonyms found on Thesaurus.com.")
        return "\n".join(lines)

    for i, entry in enumerate(data.get("entries", []), 1):
        pos = entry.get("pos") or "N/A"
        defn = entry.get("definition") or "(no definition text)"
        lines.append(f"\n[Entry {i}] {pos}: \"{defn}\"")
        
        # Synonyms
        syns = entry.get("synonyms", {})
        if syns:
            lines.append("  Synonyms:")
            for strength, words in syns.items():
                preview = ", ".join(words[:12])
                more = f" (+{len(words)-12} more)" if len(words) > 12 else ""
                lines.append(f"    • [{strength}] {preview}{more}")
        
        # Antonyms
        ants = entry.get("antonyms", {})
        if ants:
            lines.append("  Antonyms:")
            for strength, words in ants.items():
                preview = ", ".join(words[:8])
                more = f" (+{len(words)-8} more)" if len(words) > 8 else ""
                lines.append(f"    • [{strength}] {preview}{more}")

    # Example Sentences
    ex_sentences = data.get("example_sentences", {})
    if ex_sentences:
        lines.append("\n" + "-" * 40)
        lines.append(" Example Sentences (真实语料例句):")
        lines.append("-" * 40)
        for form, quotes in ex_sentences.items():
            lines.append(f"  • [{form}] ({len(quotes)} sentences):")
            for q in quotes[:3]:  # Show top 3 in text view
                src = f" — {q['source']}" if q.get("source") else ""
                date = f" ({q['date']})" if q.get("date") else ""
                lines.append(f"    - \"{q['sentence']}\"{src}{date}")

    # Synonym Examples if fetched
    syn_examples = data.get("synonym_examples", {})
    if syn_examples:
        lines.append("\n" + "-" * 40)
        lines.append(" Synonym Example Sentences (同义词例句):")
        lines.append("-" * 40)
        for syn_word, syn_data in syn_examples.items():
            lines.append(f"\n  [Synonym: {syn_word.upper()}]")
            for form, quotes in syn_data.get("example_sentences", {}).items():
                for q in quotes[:2]:
                    src = f" — {q['source']}" if q.get("source") else ""
                    lines.append(f"    - \"{q['sentence']}\"{src}")
                
    lines.append("\n" + "=" * 60)
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Scrape word definitions, synonyms, and example sentences from thesaurus.com")
    parser.add_argument("word", help="The word to query (e.g., 'happy', 'serendipity')")
    parser.add_argument("-o", "--output", help="Optional output JSON file path")
    parser.add_argument("--json", action="store_true", help="Print raw JSON to stdout instead of formatted text")
    parser.add_argument("-s", "--synonym-examples", type=int, default=0, help="Also fetch example sentences for top N strongest synonyms")
    
    args = parser.parse_args()
    result = scrape_single_word(args.word, verbose=not args.json)

    # Optional: fetch example sentences for top N strongest synonyms
    if args.synonym_examples > 0 and result.get("found"):
        strongest_syns = []
        for ent in result.get("entries", []):
            strongest_syns.extend(ent.get("synonyms", {}).get("STRONGEST", []))
        
        # Deduplicate while preserving order
        unique_syns = []
        for s in strongest_syns:
            if s.lower() != args.word.lower() and s not in unique_syns:
                unique_syns.append(s)
        
        target_syns = unique_syns[:args.synonym_examples]
        if target_syns:
            result["synonym_examples"] = {}
            for s_word in target_syns:
                s_res = scrape_single_word(s_word, verbose=not args.json)
                result["synonym_examples"][s_word] = {
                    "url": s_res.get("url"),
                    "example_sentences": s_res.get("example_sentences", {})
                }
    
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"Saved result to {args.output}", file=sys.stderr)
    
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(format_text_output(result))


if __name__ == "__main__":
    main()
