# EFH – Cabin Crew ad (premium re-edit)

Ready-to-publish vertical ad (1080x1920, 30 fps, H.264, AAC 48 kHz, −14 LUFS).

| File | Use |
|------|-----|
| `EFH_CabinCrew_Premium_FINAL.mp4` | Main version: voice + music + SFX |
| `EFH_CabinCrew_Premium_NoMusic.mp4` | Voice + SFX only, for adding a trending sound inside Instagram/TikTok |
| `EFH_cover.jpg` | Cover / thumbnail |
| `light/` | Same videos under 30 MB, for sharing over WhatsApp |

## What changed vs. the original (v2)

1. **Hook (first 3.6 s):** cold open on "+90% من خريجي المدرسة…" with the presenter cut out and placed
   above the clouds, a jet flying behind her, a punch-in zoom with parallax, and an impact + whoosh.
2. **Background changes behind the presenter** (Robust Video Matting cutout, original colors untouched).
   Most switches happen inside the airplane transitions that are already in the footage:
   brand navy + EFH logo → original → airport DEPARTURES board (iris reveal) → original →
   rotating globe with flight routes from Marrakech → sunset above the clouds → original (flags) →
   brand navy → golden burst on "التسجيلات مفتوحة دابا" → original (Instagram + WhatsApp).
3. **Pace:** speech 10% faster (pitch preserved), punch-in zooms on phrase boundaries.
4. **Sound:** cleaned voice, original music bed ducked under the voice, whooshes synced to every
   airplane pass, a "ding" + camera shake on "التسجيلات مفتوحة دابا".
5. **No extra text over the footage.** The original captions are kept as they are, and the colors are the original ones.
6. **Ending:** animated end card (logo, "التسجيلات مفتوحة دابا", both WhatsApp numbers, Instagram)
   replaces the silent white card and the CapCut outro.

## Rebuild

Needs `ffmpeg`, Python 3 with `numpy scipy opencv-python-headless pillow` (Pillow with raqm).
Put the source video at `scripts/src.mp4` and the `fonts/` and `assets/` folders next to the scripts, then:

```bash
python3 matte.py 0 45.6 alpha     # presenter alpha mattes (needs models/rvm_mobilenetv3_fp32.onnx)
python3 audio.py                  # music.wav + sfx.wav
python3 render2.py video_only.mp4 # picture (backgrounds.py, land.geojson from assets/)
bash mix.sh                       # voice cleanup, ducked mix, -14 LUFS, final mux
```

Fonts: Cairo and Montserrat (SIL Open Font License). World map: Natural Earth (public domain).
Matting model: Robust Video Matting (GPL-3.0), downloaded separately and not included here.
