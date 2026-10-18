#!/usr/bin/env bash
# Opening split screen: graded, cropped JPEG sequences (24 fps) + ambience from the two generated clips.
#   office: source 0.0–4.0 s, cold desaturated grade, crop 1114x720 (fills the top half at 0.97x)
#   london: source 1.8–5.8 s, warm grade,             crop  864x720 (fills the bottom half at 1.25x)
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf assets/clips && mkdir -p assets/clips/office assets/clips/london
ffmpeg -hide_banner -loglevel error -ss 0 -t 4.0 -i assets/video/office_src.mp4 \
  -vf "crop=1114:720:83:0,eq=saturation=0.58:contrast=1.05:brightness=-0.015:gamma=0.97,colorbalance=rs=-0.05:gs=-0.01:bs=0.07:rm=-0.03:bm=0.04:rh=-0.02:bh=0.02" \
  -q:v 3 -start_number 0 assets/clips/office/f_%03d.jpg
ffmpeg -hide_banner -loglevel error -ss 1.8 -t 4.0 -i assets/video/london_src.mp4 \
  -vf "crop=864:720:208:0,eq=saturation=1.2:contrast=1.07:brightness=0.01,colorbalance=rs=0.03:bs=-0.04:rm=0.05:gm=0.01:bm=-0.04:rh=0.04:bh=-0.05" \
  -q:v 3 -start_number 0 assets/clips/london/f_%03d.jpg
ffmpeg -hide_banner -loglevel error -y -ss 0 -t 4.0 -i assets/video/office_src.mp4 -vn -ac 2 -ar 48000 assets/audio/amb_office.wav
ffmpeg -hide_banner -loglevel error -y -ss 1.8 -t 4.0 -i assets/video/london_src.mp4 -vn -ac 2 -ar 48000 assets/audio/amb_london.wav
echo "office: $(ls assets/clips/office | wc -l) frames, london: $(ls assets/clips/london | wc -l) frames"
