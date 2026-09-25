#!/bin/bash
# Renders CLOSER.mp4 as ONE composition. It used to render nine sections and
# concatenate them, and each of those files carried ~50ms of AAC padding on the
# end of its audio - half a second across the film, against a hard 5:00 cap.
# As a Series the runtime is the frame count and nothing else.
#
#   ./render-all.sh              the film
#   ./render-all.sh Section4     one section, to look at it
set -euo pipefail
cd "$(dirname "$0")"
# The film lands with the rest of the submission material, not in .tmp: .tmp is
# disposable by convention in this repo and the file that gets uploaded is not.
# A single section is a look, so that one stays disposable.
REPO="$(cd .. && pwd)"
FILM="$REPO/docs/submission/CLOSER.mp4"
LOOK="$REPO/.tmp/video"
if [ $# -gt 0 ]; then
  mkdir -p "$LOOK"
  npx remotion render src/index.ts "$1" "$LOOK/$1.mp4" --log=error
  npx remotion ffprobe "$LOOK/$1.mp4" 2>&1 | grep -i duration
  exit 0
fi
npx remotion render src/index.ts Film "$FILM" --log=error
echo "RUNTIME:"
npx remotion ffprobe "$FILM" 2>&1 | grep -iE "duration|Stream #"
ls -la "$FILM"
