# Al Fursan airshow edit

Vertical (1080x1920, 50 fps) beat-synced edit, 44.5 s.

- `music.py` – generates the original 128 BPM soundtrack (no copyright claims): `python3 music.py music_raw.wav`, then
  `ffmpeg -i music_raw.wav -af loudnorm=I=-14:TP=-1.0:LRA=11 -ar 48000 music.wav`
- `render.py` – cuts, color grade, rotation fix for the ground shots, zoom punches, beat bounce, shake, flashes,
  RGB-split glitches and animated text: `python3 render.py source.mp4 music.wav out.mp4 [from:to]`

Requires ffmpeg, numpy, scipy, pillow. Output in `../output/`.
