# Al Fursan – Marrakech Air Show 2026 edit (v3)

Vertical 1080x1920, 50 fps, 45 s. Original shot orientation; intro text and waving UAE flag are
rotated to match the footage. Fighter-pilot style 80s synth-rock score with aircraft-radio ATC chatter
(Fursan One / Marrakech Tower, runway 10).

1. Samples: download MusyngKite instruments from
   `https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite/<name>-mp3.js` into `sf/`
   (distortion_guitar, overdriven_guitar, electric_guitar_muted, electric_bass_pick, synth_bass_1,
   synth_brass_1, synth_brass_2, pad_3_polysynth, lead_2_sawtooth, synth_strings_1, melodic_tom),
   then `python3 decode_soundfont.py sf sfnpz`.
2. Radio voices (kokoro-onnx, model files from the kokoro-onnx GitHub release):
   `python3 tts.py <model_dir> radio_lines.json vo`
3. Score: `python3 music.py sfnpz score_raw.wav vo` and
   `ffmpeg -i score_raw.wav -af loudnorm=I=-14:TP=-1.0:LRA=11 -ar 48000 score.wav`
4. Video: `python3 render.py source.mp4 score.wav out.mp4 [from:to]`

Requires ffmpeg, numpy, scipy, pillow, soundfile, kokoro-onnx.
