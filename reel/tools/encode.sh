#!/usr/bin/env bash
# Encode rendered frames + soundtrack into an Instagram-ready MP4 (1080x1920, 30 fps, H.264 High, BT.709, AAC 320k).
# Usage: tools/encode.sh <frames_dir> <audio.wav> <out.mp4>
set -euo pipefail
ffmpeg -v error -y -framerate 30 -i "$1/%05d.jpg" -i "$2" -map 0:v -map 1:a \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -profile:v high -level 4.2 -preset slow -crf 18 -maxrate 12M -bufsize 24M -g 60 -bf 2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart -shortest "$3"
