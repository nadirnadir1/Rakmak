# EFH Video Studio – Remotion project

Premium enhancement of the EFH – École Fly Hyani Privé promotional reel.
The original edit, speaker, voice, music and on-screen text are kept. The project adds a hook,
motion design, aviation explainer graphics, a colour grade and sound design on top.

## Deliverables

| File | What it is |
| --- | --- |
| `original/EFH_original.mp4` | The uploaded video, **unchanged** (SHA-256 `3baa28c6…1ddc8`) |
| `output/EFH_enhanced_hookA.mp4` | Enhanced reel, opening hook **A** ("+90% من خريجي المدرسة…") |
| `output/EFH_enhanced_hookB.mp4` | Enhanced reel, opening hook **B** ("فأكبر شركات الطيران فالعالم") |

Both files are 1080×1920, 30 fps, H.264 High / yuv420p, with AAC 48 kHz stereo audio.

## What the edit does

**Opening hooks (flash-forwards of real lines, nothing invented)**
- **A – stat reveal:** the speaker's own "+90% من خريجي المدرسة…" (9.92–11.98 s) opens the
  video. A counter runs up to +90%, the words animate in (Cairo), and the sentence is left open
  as a curiosity gap. The full sentence then plays in its original place.
- **B – aircraft window:** "فأكبر شركات الطيران فالعالم" (13.76–15.68 s) plays inside an
  aircraft window. The blind lifts to a cabin chime, over a globe with routes from Casablanca.
- Both hooks cut on natural pauses in the speech. They are followed by an EFH logo sting, then
  the original video from its first frame.

**Explanatory cutaways** open in a lower-third panel, below the burned-in captions. The picture,
captions and voice keep running underneath.

| Source time | Line | Graphic |
| --- | --- | --- |
| 12.10 s | خدمو كمضيفات ومضيفي الطيران | Aircraft cabin dolly (seats, bins, mood lighting, seatbelt sign) |
| 14.05 s | فأكبر شركات الطيران فالعالم | Globe with real coastlines, routes from Casablanca |
| 15.70 s | أو فالمطارات | Split-flap departures board |
| 31.00 s | كتتكون فمجال الطيران | Aircraft cabin |
| 36.50 s | وكتستافد من تكوين تطبيقي | Cabin-safety pictograms drawing on |
| 38.25 s | وتحضير لمقابلات التوظيف | Candidate profile checklist card |

All cutaways are vector illustrations. No stock or AI footage is presented as EFH activity.

**Existing text:** the captions are burned into the MP4, so no second text layer is added.
Key phrases (100%, +90%, أطر محترفة, التسجيلات مفتوحة دابا !) get animated corner brackets and
a light glint. These sit inside the camera layer, so they stay locked to the text during zooms.

**Camera and finish:**
- Slow push-ins of up to 6%, each ending on an original cut, so the scale never jumps.
- A punch-in on the call to action.
- Light leaks on the original swipe transitions, and a vignette.
- An FFmpeg colour grade: contrast, clean whites, navy shadows, light sharpening.
- The CapCut outro is removed, and the original end card is held for one extra second.

**Audio:** the original soundtrack is decoded losslessly and plays continuously. The voice is
not processed. The sound effects are synthesised by `scripts/make_sfx.py`, so there are no
third-party samples: whooshes, impact, riser, aircraft "ding-dong" chime, ticks, shimmer and a
brand sting on the silent end card.

**Logo:** the authentic EFH logo is extracted from the original end card
(`public/efh-logo.png`). To use an official PNG instead, replace that file. Setting `LOGO_FILE`
to `null` in `src/config.ts` shows a clean placeholder slot.

## Rebuild

```bash
npm install
./scripts/prepare.sh              # grade + lossless audio from original/ (needs ffmpeg)
python3 scripts/make_sfx.py       # synthesise sound effects (needs numpy)
export REMOTION_BROWSER=/path/to/chrome-headless-shell   # optional
npm run render                    # writes output/EFH_enhanced_hook{A,B}.mp4
```

All timings live in `src/config.ts` (the edit decision list). The analysis frames that the
timings were measured from are in `analysis/`.

Note: Remotion is free for individuals and companies with up to 3 employees. Larger companies
need a Remotion company licence (https://remotion.dev/license).
