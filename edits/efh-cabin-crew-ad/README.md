# EFH – Cabin Crew ad (premium re-edit)

Ready-to-publish vertical ad (1080x1920, 30 fps, H.264, AAC 48 kHz, −14 LUFS).

| File | Use |
|------|-----|
| `EFH_CabinCrew_Premium_FINAL.mp4` | Main version: voice + music + SFX |
| `EFH_CabinCrew_Premium_NoMusic.mp4` | Voice + SFX only, for adding a trending sound inside Instagram/TikTok |
| `EFH_cover.jpg` | Cover / thumbnail |

## What changed vs. the original

1. **Hook (first 3.6 s):** the video now opens on the strongest line ("+90% من خريجي المدرسة خدمو كمضيفات ومضيفي الطيران")
   with a big title: **حلمك تخدم فالطيران؟ ✈️ / هادشي خاصك تعرفو 👇**, a fast punch-in zoom, an impact and a riser into the drop.
2. **Pace:** speech is 10% faster (pitch preserved) and there are punch-in zooms on phrase boundaries,
   so the frame changes every 1.5–3 s.
3. **Look:** color grade (contrast curve, warm highlights, +saturation), sharpening and a soft vignette.
4. **Sound:** cleaned voice (EQ + compression), an original uplifting music bed that ducks under the voice,
   whooshes on every airplane transition, a "ding" + camera shake on "التسجيلات مفتوحة دابا".
5. **Branding:** an "EFH • MARRAKECH" chip and a gold progress bar (a retention signal).
6. **Ending:** the silent white card and the CapCut outro are replaced by an animated end card
   (logo, "التسجيلات مفتوحة دابا", both WhatsApp numbers, Instagram, CTA).

## Rebuild

Needs `ffmpeg`, Python 3 with `numpy scipy opencv-python-headless pillow` (Pillow with raqm).
Put the source video at `scripts/src.mp4` and the `fonts/` and `assets/` folders next to the scripts, then:

```bash
python3 audio.py                 # music.wav + sfx.wav
python3 render.py video_only.mp4 # picture
bash mix.sh                      # voice cleanup, ducked mix, -14 LUFS, final mux
```

Fonts: Cairo and Montserrat (SIL Open Font License).
