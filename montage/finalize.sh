#!/usr/bin/env bash
# Mux rendered video + mixed audio into the delivery file.
# usage: finalize.sh WORK_DIR OUT.mp4
set -euo pipefail
WORK="$1"; OUT="$2"
V="$WORK/final/video_noaudio.mp4"; A="$WORK/final/mix_raw.wav"
# small static gain so the whole programme sits at about -14 LUFS (social-media level)
I=$(ffmpeg -hide_banner -nostats -i "$A" -af ebur128=framelog=quiet -f null - 2>&1 | awk '/ I:/{v=$2} END{print v}')
G=$(python3 -c "print(round(-14.0-($I),2))")
echo "mix integrated: $I LUFS -> gain $G dB"
ffmpeg -v error -y -i "$V" -i "$A" -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -preset slow -tune film -crf 21 -maxrate 9M -bufsize 18M -profile:v high -level 4.1 \
  -pix_fmt yuv420p -g 60 \
  -af "volume=${G}dB,alimiter=limit=0.89:level=false" -c:a aac -b:a 192k -ar 48000 \
  -movflags +faststart -metadata title="الذكرى 51 للمسيرة الخضراء — École FLY HYANI Privé" \
  -shortest "$OUT"
ffprobe -v error -show_entries format=duration,size,bit_rate -of default=nw=1 "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true:framelog=quiet -f null - 2>&1 | grep -E " I:| LRA:|Peak:"
