# EFH — "بلا فيزا؟" cabin-crew reel

Vertical Instagram reel (1080×1920, 30 fps, 62.5 s) for **EFH – École Fly Hyani Privé, Marrakech**,
built around the Darija voice-over (`media/voiceover.mp3`).

**Deliverables** (in `out/`)
- `EFH_reel.mp4` — final reel, H.264 + AAC, loudness −14 LUFS / −1 dBTP (Instagram spec)
- `EFH_reel_cover.jpg` — cover image (key content kept inside the 4:5 grid crop)

## How it is made
- `web/engine.js` — a small deterministic canvas motion-graphics engine (easing, springs, video layers with
  24→30 fps frame blending, whip/zoom/iris/slide transitions, camera shake, flashes, frosted glass, grain).
- `web/scenes.js` — the storyboard: 14 scenes timed to the voice, plus word-by-word Arabic captions
  (Whisper timings, hand-corrected Darija) with a sliding highlight.
- `render.mjs` — renders frames in headless Chromium (Playwright) and encodes them with ffmpeg.
- `audio/make_audio.py` — original score (117 BPM, D minor) and all sound effects, synthesized in numpy/scipy
  (no third-party music → no copyright claims). `audio/mix.py` mixes voice / music / SFX with ducking and an
  EQ pocket so the voice stays clear.
- `tools/prep_assets.py` — logo transparency, map grading, fonts (fontsource), dotted map (world-atlas).

## Storyboard
| time | voice | visual |
|---|---|---|
| 0–3.6 | واحد كيقلب على موعد الفيزا… | hook headline, visa-appointment UI "Aucun créneau disponible", Paris polaroid |
| 3.6–9 | وواحد ممكن يدخلها بلا فيزا… | VS split screen: VISA ? vs CREW ✓, tourist visa struck out, CABIN CREW badge |
| 9–11.9 | واللي غادي يفاجئك: بجوجهم مغاربة | Moroccan flag star drawn, passport drop, both faces with 🇲🇦 badges |
| 11.9–14.9 | الفرق؟ الثاني خدام مضيف طيران | drop + glitch type, swinging crew ID badge |
| 14.9–19.8 | فوجهات بحال فرانسا، إسبانيا وبريطانيا | dotted map RAK → MAD/CDG/LHR, cuts synced to each country + waving flags |
| 19.8–26.2 | إعفاءات خاصة أثناء الخدمة، بشروط ووثائق | stamp synced to the real stamp, documents checklist |
| 26.2–36.5 | المميزات، السفر، اكتشاف مدن | perk cards, split-flap departures board, polaroids |
| 36.5–44.3 | مرتبطة بالخدمة ماشي بالسياحة / أمريكا C1/D | service ✓ vs tourism ✗, USA crew-visa card |
| 44.3–48.7 | ودابا السؤال: واش حتى نتا…؟ | question mark, aircraft door opens onto the crew |
| 48.7–54.8 | مدرسة فلاي حياني… | logo reveal, Marrakech, Formation Cabin Crew |
| 54.8–62.5 | التسجيل مفتوح | big type + confetti, animated map pin (Bd Allal Al Fassi), phones, website, Instagram |

Rebuild: `./build.sh` (see the header of the script for requirements).
