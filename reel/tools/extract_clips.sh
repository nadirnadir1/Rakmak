#!/usr/bin/env bash
# Extract every source frame (24 fps) of each clip, upscaled 2x with lanczos + light sharpening.
# Usage: extract_clips.sh <clips_dir> <out_dir>
set -euo pipefail
CLIPS="$1"; OUT="$2"
mkdir -p "$OUT"
for f in "$CLIPS"/*.mp4; do
  id=$(basename "$f" .mp4 | cut -d_ -f1)
  mkdir -p "$OUT/$id"
  if [ ! -f "$OUT/$id/00001.jpg" ]; then
    ffmpeg -v error -y -i "$f" -vf "scale=2560:1440:flags=lanczos,unsharp=5:5:0.55:5:5:0.0" -q:v 3 "$OUT/$id/%05d.jpg"
  fi
  echo "$id $(ls "$OUT/$id" | wc -l) frames"
done
# smooth slow-motion source for the passport stamp (v6 5.6s-7.4s) -> 96 fps
mkdir -p "$OUT/v6slow"
if [ ! -f "$OUT/v6slow/00001.jpg" ]; then
  ffmpeg -v error -y -ss 5.6 -t 1.8 -i "$CLIPS/v6_crew_passport_stamp.mp4" \
    -vf "minterpolate=fps=96:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=2560:1440:flags=lanczos,unsharp=5:5:0.55:5:5:0.0" \
    -q:v 3 "$OUT/v6slow/%05d.jpg"
fi
echo "v6slow $(ls "$OUT/v6slow" | wc -l) frames"
