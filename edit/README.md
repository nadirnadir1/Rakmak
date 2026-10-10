# Al Fursan airshow edit (v2)

Vertical 1080x1920, 50 fps, 45 s. Original orientation kept, exposure-balanced color grade,
cinematic orchestral score cut to the picture, "HYANI" watermark.

1. Samples: download MusyngKite instruments (string_ensemble_1, tremolo_strings, contrabass, cello,
   french_horn, brass_section, trombone, tuba, timpani, choir_aahs, taiko_drum, orchestra_hit) from
   `https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite/<name>-mp3.js` into `sf/`,
   then `python3 decode_soundfont.py sf sfnpz`.
2. Score: `python3 music.py sfnpz score_raw.wav` and
   `ffmpeg -i score_raw.wav -af loudnorm=I=-14:TP=-1.0:LRA=11 -ar 48000 score.wav`
3. Video: `python3 render.py source.mp4 score.wav out.mp4 [from:to]`

Requires ffmpeg, numpy, scipy, pillow.
