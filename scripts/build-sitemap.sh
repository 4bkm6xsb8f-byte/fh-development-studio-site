#!/usr/bin/env bash
# build-sitemap.sh — regenerate sitemap.xml with a <lastmod> per page.
#
# lastmod comes from each file's last commit date, so it stays honest without
# anyone remembering to touch it. Run from the repository root after changing
# page content, and commit the result alongside it:
#
#     scripts/build-sitemap.sh && git add sitemap.xml
#
# Pages are listed in the order they appear in the site's navigation. Add a new
# page here when you add one (the README's maintenance notes say the same).

set -euo pipefail

BASE="https://www.fhdevelopmentstudio.com"
PAGES=(
  "index.html"
  "services.html"
  "apps.html"
  "links.html"
  "privacy.html"
  "terms.html"
  "support.html"
  "process.html"
)

cd "$(dirname "$0")/.."

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  for page in "${PAGES[@]}"; do
    [ -f "$page" ] || { echo "missing page: $page" >&2; exit 1; }
    # Uncommitted edits mean the page changed today, whatever git last recorded.
    if [ -n "$(git status --porcelain -- "$page")" ]; then
      lastmod=$(date +%F)
    else
      lastmod=$(git log -1 --format=%cs -- "$page")
    fi
    if [ "$page" = "index.html" ]; then loc="$BASE/"; else loc="$BASE/$page"; fi
    echo '  <url>'
    echo "    <loc>${loc}</loc>"
    echo "    <lastmod>${lastmod}</lastmod>"
    echo '  </url>'
  done
  echo '</urlset>'
} > sitemap.xml

echo "sitemap.xml rebuilt with ${#PAGES[@]} pages"
