# EFH – Cabin Crew Reel (9:16, 46.5 s)

Final video: `output/EFH_Cabin_Crew_Reel_9x16.mp4` (1080×1920, 30 fps, H.264 + AAC 48 kHz, −14 LUFS).

## Rebuild
```
pip install playwright opencv-python-headless scipy numpy pillow
ffmpeg -i assets/voiceover.mp3 -ar 48000 -ac 1 build/voice48k.wav
python3 src/render_overlays.py   # Arabic text + logo layers (Chromium shaping)
python3 src/make_audio.py        # voice + original synthesized music + ambience
# loudness-normalize build/mix.wav -> build/mix_norm.wav (ffmpeg loudnorm I=-14 TP=-1.5)
python3 src/make_video.py
```

## Edit sequence (cuts sit in the voice-over pauses)
| Time | Image | Move | On-screen text |
|---|---|---|---|
| 0.00–3.68 | traveler at kiosk | push-in to card/kiosk | كاين اللي كيخلّص باش يسافر... |
| 3.68–10.93 | crew walking | whip → tracking, reframe on faces at 7.35 | وكاين اللي السفر جزء من خدمتو! |
| 10.93–18.60 | trainee at window | lateral slide, reframe at 14.73, light sweep | كل نهار... تجربة جديدة |
| 18.60–26.80 | aircraft cabin | dolly down aisle, medium at 22.29 | CABIN CREW / أكثر من مجرد سفر |
| 26.80–33.25 | training room | whip, 3 reframes | الانضباط · التواصل · السلامة |
| 33.25–41.55 | couple at window | camera arc, close-up at 38.69 | علاش ما تكونش نتا؟ |
| 41.55–46.50 | group portrait | pull-out, logo + CTA | EFH logo, training line, registration, phones, website |

Subtitles of the narration are not burned in: no speech-to-text model was available,
so `output/EFH_subtitles_TIMING_TEMPLATE.srt` holds the exact phrase timings to fill in.
