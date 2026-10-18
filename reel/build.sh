#!/usr/bin/env bash
# Rebuild the EFH reel end-to-end.
#   needs: ffmpeg, node + playwright (chromium), python3 venv with numpy scipy pillow matplotlib
#   fonts: fontsource packages unpacked into $FONTS_DIR, world-atlas into $NPM_DIR (see README)
set -euo pipefail
cd "$(dirname "$0")"
PY=${PY:-python3}
FONTS_DIR=${FONTS_DIR:-}
NPM_DIR=${NPM_DIR:-}

if [ -n "$FONTS_DIR" ] && [ -n "$NPM_DIR" ]; then
  "$PY" tools/prep_assets.py media "$FONTS_DIR" "$NPM_DIR" web
fi

# 1) clip frames (24 fps, lightly sharpened)
for i in 1 2 3 4 5 6 7; do
  mkdir -p web/frames/v$i
  ffmpeg -v error -y -i media/v$i.mp4 -vf "unsharp=5:5:0.5:5:5:0" -q:v 2 -start_number 0 web/frames/v$i/%04d.jpg
done

# 2) score + sound design + mix
mkdir -p build/audio
ffmpeg -v error -y -i media/voiceover.mp3 -ar 48000 -ac 1 -c:a pcm_f32le build/vo48.wav
"$PY" audio/make_audio.py build/vo48.wav build/audio
"$PY" audio/mix.py build/audio -13.5 -7

# 3) master to -14 LUFS / -1 dBTP (two-pass loudnorm)
M=$(ffmpeg -v info -i build/audio/mix.wav -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
read I TP LRA TH OF <<< "$(echo "$M" | "$PY" -c "import sys,json; d=json.load(sys.stdin); print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")"
ffmpeg -v error -y -i build/audio/mix.wav -af "loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OF:linear=true,aresample=48000" -c:a pcm_s16le build/audio/master.wav

# 4) video frames (4 parallel Chromium workers) + cover
node render.mjs all 4 build/video_noaudio.mp4
node render.mjs still build/cover -4.8 && mkdir -p out && cp build/cover/*.jpg out/EFH_reel_cover.jpg

# 5) mux
ffmpeg -v error -y -i build/video_noaudio.mp4 -i build/audio/master.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 20 -profile:v high -level 4.2 -pix_fmt yuv420p -maxrate 12M -bufsize 24M -g 60 \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest out/EFH_reel.mp4
echo "done -> out/EFH_reel.mp4"
