# Al Fursan – Marrakech Air Show 2026 edit (v4)

Vertical 1080x1920, 50 fps, 45 s. Original shot orientation, bright balanced grade, waving UAE flag +
title intro rotated to the footage orientation. Audio is radio only: pilot / Marrakech Tower
transmissions through an aircraft VHF-AM chain (cockpit noise, AGC, band-limit, squelch).

1. Voices (kokoro-onnx; model files from the kokoro-onnx GitHub release):
   `python3 tts.py <model_dir> radio_lines.json vo`
2. Radio track: `python3 radio_mix.py vo radio_raw.wav 45` then
   `ffmpeg -i radio_raw.wav -af loudnorm=I=-15:TP=-1.0:LRA=11 -ar 48000 radio.wav`
3. Video: `python3 render.py source.mp4 radio.wav out.mp4 [from:to]`

Requires ffmpeg, numpy, scipy, pillow, soundfile, kokoro-onnx.
