#!/usr/bin/env bash
# Mux the rendered picture with the final mix -> Instagram-ready MP4 (H.264 High + AAC 48 kHz).
# Usage: tools/mux.sh out/video_noaudio.mp4 audio/build/mix_final.wav out/EFH_reel_final.mp4
set -euo pipefail
ffmpeg -hide_banner -loglevel error -y -i "$1" -i "$2" -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 320k -ar 48000 -ac 2 -shortest \
  -metadata title="EFH — École Fly Hyani Privé · Cabin Crew" -metadata:s:a:0 language=ara \
  -movflags +faststart "$3"
ffprobe -v error -show_entries format=duration,bit_rate,size -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate -of compact "$3"
