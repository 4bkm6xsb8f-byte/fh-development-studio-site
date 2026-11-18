#!/usr/bin/env python3
"""Structural checks for the static site. No dependencies, no network.

Catches the kinds of breakage a hand audit found on 2026-11-18: a link to a
page that does not exist, an anchor whose id was renamed, an image referenced
but never committed, and a sitemap that has drifted from the pages on disk.

    python3 scripts/check-site.py        # from the repository root

Exits non-zero and prints every problem, so CI fails with the whole list
rather than one error at a time.
"""

from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://www.fhdevelopmentstudio.com"

# Pages that exist on purpose but are not in the sitemap: error pages, the
# admin hand-off, and internal reference pages. Each carries meta noindex.
NOT_IN_SITEMAP = {"404.html", "admin-login.html", "sms-consent.html",
                  "brand-standards.html", "discovery-workflow.html",
                  # Twilio domain verification: a bare token file that must sit
                  # at this exact path and must not be advertised to crawlers.
                  "1749ec7b0c0105008f95ca41c8a57fac.html"}


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.links: list[tuple[str, str]] = []  # (attr value, tag)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k: v for k, v in attrs if v is not None}
        if "id" in a:
            self.ids.add(a["id"])
        for attr in ("href", "src"):
            if attr in a:
                self.links.append((a[attr], tag))
        if "srcset" in a:
            for part in a["srcset"].split(","):
                candidate = part.strip().split(" ")[0]
                if candidate:
                    self.links.append((candidate, tag))


def parse(path: Path) -> Page:
    page = Page()
    page.feed(path.read_text(encoding="utf-8"))
    return page


def main() -> int:
    problems: list[str] = []
    pages = sorted(p for p in ROOT.glob("*.html"))
    parsed = {p.name: parse(p) for p in pages}

    for name, page in parsed.items():
        for value, tag in page.links:
            url = urlparse(value)
            if url.scheme in ("http", "https", "mailto", "tel", "data"):
                continue  # external: checked by hand, not on every push
            target, fragment = unquote(url.path), url.fragment

            if target:
                rel = target.lstrip("/")
                if not (ROOT / rel).exists():
                    problems.append(f"{name}: <{tag}> points at missing file {value!r}")
                    continue
                if fragment and rel.endswith(".html") and rel in parsed:
                    if fragment not in parsed[rel].ids:
                        problems.append(
                            f"{name}: <{tag}> links to #{fragment} in {rel}, which has no such id"
                        )
            elif fragment and fragment not in page.ids:
                problems.append(f"{name}: <{tag}> links to #{fragment}, which this page lacks")

    # Sitemap must list exactly the public pages, with a lastmod each.
    sitemap = ROOT / "sitemap.xml"
    if not sitemap.exists():
        problems.append("sitemap.xml is missing")
    else:
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        tree = ET.parse(sitemap)
        listed: set[str] = set()
        for url in tree.getroot().findall("s:url", ns):
            loc = (url.findtext("s:loc", namespaces=ns) or "").strip()
            if url.find("s:lastmod", ns) is None:
                problems.append(f"sitemap.xml: {loc} has no <lastmod>")
            path = loc.removeprefix(BASE).lstrip("/")
            listed.add(path or "index.html")
        public = {p.name for p in pages} - NOT_IN_SITEMAP
        for missing in sorted(public - listed):
            problems.append(f"sitemap.xml does not list {missing}")
        for extra in sorted(listed - public):
            problems.append(f"sitemap.xml lists {extra}, which is not a public page")

    if problems:
        print(f"{len(problems)} problem(s):\n")
        for p in problems:
            print(f"  - {p}")
        return 1

    print(f"OK — {len(pages)} pages, every internal link, anchor and asset resolves, "
          "sitemap matches.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
