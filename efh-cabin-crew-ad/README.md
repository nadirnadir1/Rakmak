# EFH – Cabin Crew ad (Darija voiceover, Arabic captions)

48-second vertical (1080×1920, 60 fps) motion-graphics ad for École FLY HYANI Privé, timed word by word to the ElevenLabs Darija voiceover in `voice.mp3`.

Final video: `EFH_cabin_crew_ad.mp4`

## How it's built

- Each frame is drawn with Canvas 2D in `index.html`. `render(t)` is a pure function of time, so every frame renders the same way each time.
  - `core.js`: easing, shapes (planes, coins, split-flap cells…)
  - `scenes_a.js`, `scenes_b.js`, `scenes_c.js`: the 15 scenes
  - `frame.js`: background, karaoke captions, transitions, grain
- `captions.js`: Arabic caption words with start/end times. The timings come from Whisper word timestamps, and the text was corrected by hand.
- `audio.py`: synthesizes the music bed and sound effects, then mixes them under the voice, ducking the music while she speaks.

## Render

```bash
npm i playwright@1.56.1
python3 -m http.server 8765 --bind 127.0.0.1 &   # serve this folder
node stills.js out 12.5 22.1                       # preview single frames
./render_all.sh                                    # full render -> ../segs/video_noaudio.mkv
ffmpeg -i voice.mp3 -ar 48000 -ac 1 voice48.wav && python3 audio.py voice48.wav mix.wav
ffmpeg -i ../segs/video_noaudio.mkv -i mix.wav -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p \
  -af loudnorm=I=-14:TP=-1 -c:a aac -b:a 192k -movflags +faststart -shortest EFH_cabin_crew_ad.mp4
```

Fonts (Alexandria, Cairo, Montserrat, Lalezar, JetBrains Mono) are from Google Fonts under the SIL Open Font License.
