"""
Thesaurus.com HTML parser utility for Scrapling.
Extracts structured entries (Part of Speech, Definition, Synonyms by strength, Antonyms by strength).
"""

from typing import Any, Dict, List, Optional
from scrapling.parser import Selector


def parse_thesaurus_page(page: Selector, query_word: str = "") -> Dict[str, Any]:
    """
    Parses a Thesaurus.com word page Selector into structured dictionary.
    """
    h1 = page.css("h1::text").get("").strip()
    
    # Check if page is empty or "no results"
    if not h1 and not page.css(".definition-block"):
        return {
            "query_word": query_word,
            "actual_word": query_word,
            "found": False,
            "entries": []
        }

    data: Dict[str, Any] = {
        "query_word": query_word or h1,
        "actual_word": h1 or query_word,
        "found": True,
        "entries": []
    }

    definition_blocks = page.css(".definition-block")
    for block in definition_blocks:
        pos = str(block.css(".part-of-speech-label::text").get("")).strip()
        defn = str(block.css(".definition span::text").get("")).strip()

        synonyms: Dict[str, List[str]] = {}
        antonyms: Dict[str, List[str]] = {}

        for panel in block.css(".synonym-antonym-panel"):
            label = str(panel.css(".synonym-antonym-panel-label::text").get("")).strip().lower()
            is_antonym = "antonym" in label
            target = antonyms if is_antonym else synonyms

            for group in panel.css(".synonym-antonym-similarity-grouping-list"):
                raw_strength = group.css(".similarity-level-label::text").get("DEFAULT")
                strength = str(raw_strength).strip() if raw_strength else "DEFAULT"
                words = [str(w).strip() for w in group.css("a.word-chip::text").getall() if str(w).strip()]
                if words:
                    if strength not in target:
                        target[strength] = []
                    target[strength].extend(words)

        data["entries"].append({
            "pos": pos,
            "definition": defn,
            "synonyms": synonyms,
            "antonyms": antonyms,
        })

    # Extract Example Sentences (SSR rendered in .sec-example-sentences)
    example_sec = page.css(".sec-example-sentences")
    example_sentences: Dict[str, List[Dict[str, str]]] = {}
    if example_sec:
        labels: Dict[str, str] = {}
        for inp in example_sec.css(".example-word-selectors input[data-index]"):
            idx = str(inp.attrib.get("data-index", ""))
            lbl = example_sec.css(f'.example-word-selectors label[for="{inp.attrib.get("id")}"]::text').get("")
            labels[idx] = str(lbl).strip()
        if not labels:
            for i, lbl in enumerate(example_sec.css(".example-word-selectors label::text").getall()):
                labels[str(i)] = str(lbl).strip()

        for es in example_sec.css(".example-sentences"):
            idx = str(es.attrib.get("data-index", "0"))
            form_name = labels.get(idx, data["actual_word"])
            quotes = []
            for bq in es.css("blockquote.box-examples"):
                sentence_parts = bq.css(".txt-example::text, .txt-example *::text").getall()
                full_sentence = "".join([str(p) for p in sentence_parts]).strip()
                source = str(bq.css(".txt-source cite::text, .txt-source a::text").get("")).strip()
                source_link = str(bq.css(".txt-source a::attr(href)").get("")).strip()
                full_source = " ".join([str(t).strip() for t in bq.css(".txt-source *::text, .txt-source::text").getall() if str(t).strip()])
                
                # Extract date from full_source (e.g., 'From BBC ● Sep. 16, 2026')
                date = ""
                if "●" in full_source:
                    date = full_source.split("●")[-1].strip()

                if full_sentence:
                    quotes.append({
                        "sentence": full_sentence,
                        "source": source,
                        "date": date,
                        "source_url": source_link
                    })
            if quotes:
                example_sentences[form_name] = quotes

    data["example_sentences"] = example_sentences
    return data
