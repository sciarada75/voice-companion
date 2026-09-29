#!/usr/bin/env bash
# index.html -> ../CLOSER-deck.pdf, one 1920x1080 page per slide.
#
# Headless Chrome, because the deck is a web page and the film is too: the same
# design tokens, no design tool in the loop, and a one-line change re-renders it.
# Never hand-edit the PDF - change index.html and run this.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out="$here/../CLOSER-deck.pdf"

chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$chrome" ] || { echo "Google Chrome not found at $chrome"; exit 1; }

# --virtual-time-budget gives the cover image time to decode before the print.
"$chrome" \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --no-pdf-header-footer \
  --virtual-time-budget=15000 \
  --print-to-pdf="$out" \
  "file://$here/index.html" 2>/dev/null

echo "wrote $out"
ls -lh "$out" | awk '{print $5}'
