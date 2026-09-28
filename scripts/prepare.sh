#!/usr/bin/env bash
# Builds the Remotion inputs from the untouched original:
#  - public/source.mp4        colour-graded picture (CapCut outro trimmed), near-lossless
#  - public/source_audio.wav  original soundtrack decoded losslessly (voice + music untouched)
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=original/EFH_original.mp4
END=48.90   # original end card finishes here; the CapCut outro after it is dropped

# Grade: gentle contrast, clean whites, slightly cooler shadows (navy) with warm skin kept,
# light sharpening to recover detail lost in the CapCut export.
GRADE="eq=contrast=1.05:saturation=1.07:gamma=0.99,colorbalance=rs=-0.015:bs=0.03:rh=0.015:bh=-0.01,unsharp=5:5:0.35:5:5:0"

ffmpeg -v error -y -i "$SRC" -t $END -vf "$GRADE" -an \
  -c:v libx264 -preset slow -crf 12 -g 15 -pix_fmt yuv420p -movflags +faststart public/source.mp4
ffmpeg -v error -y -i "$SRC" -t $END -vn -c:a pcm_s16le -ar 48000 public/source_audio.wav
echo "prepared: $(ls -la public/source.mp4 public/source_audio.wav | awk '{print $5, $9}' | tr '\n' ' ')"
