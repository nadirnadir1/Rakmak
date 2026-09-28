#!/usr/bin/env bash
# Cuts ONLY the source ranges an edit needs from the untouched original and grades them.
# usage: scripts/cut_segments.sh name:start:end [name:start:end ...]
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=original/EFH_original.mp4
# Cinematic grade: soft S-curve with protected highlights, cool navy shadows / warm skin,
# light sharpening and fine temporal grain so the phone footage reads as film.
GRADE="curves=all='0/0.02 0.25/0.225 0.5/0.5 0.75/0.785 1/0.975',colorbalance=rs=-0.03:gs=-0.01:bs=0.05:rm=0.01:bm=-0.01:rh=0.03:gh=0.01:bh=-0.03,eq=saturation=1.04,unsharp=5:5:0.3:5:5:0,noise=alls=3:allf=t"
for spec in "$@"; do
  IFS=: read -r name ss to <<<"$spec"
  ffmpeg -v error -y -ss "$ss" -to "$to" -i "$SRC" -vf "$GRADE" -c:v libx264 -preset medium -crf 14 -g 10 -pix_fmt yuv420p \
    -c:a pcm_s16le -ar 48000 "public/seg/$name.mov"
  echo "seg $name $ss-$to"
done
