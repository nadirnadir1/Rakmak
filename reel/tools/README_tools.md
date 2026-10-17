# Build tools

| Script | What it does |
| --- | --- |
| `transcribe.py`, `transcribe_phrases.py` | Whisper large-v3 (sherpa-onnx) transcription of the voice-over |
| `omni_ctc.py` | Meta Omnilingual ASR (CTC): greedy decode + forced alignment -> `src/data/words.json` |
| `omni_score.py` | Scores alternative Darija wordings against the audio (CTC likelihood) |
| `trace_logo.py` | Vectorises the EFH logo into per-part SVG paths (`assets/img/logo.svg`) |
| `clean_map.py` | Removes Google Maps UI buttons from the location screenshot |
| `make_clouds.py` | Procedural lit cumulus sprites + film-grain tile |
| `make_globe_dots.js/.py` | Land dots for the 3D dotted globe |
| `build_data.js` | Icons, word timings and logo paths -> `src/data/*.js` |
| `render.js` | Frame-accurate renderer (Playwright + ffmpeg, sub-frame motion blur) |
| `make_cabin.js` + `cabin/cabin.html` | three.js airplane cabin (3-3 economy, mood lighting) rendered to a PNG |
| `make_cabin.py` | Lens (bokeh) blur of the cabin render -> `assets/img/cabin.jpg` |
| `shot.js`, `cabin/plane_test.html` | Screenshot a WebGL test page (used to frame the opening airliner shot) |

Cabin plate used in the reel:

```bash
node tools/make_cabin.js /tmp/cabin_raw.png "w=1296&h=2304&exp=1.05&hemi=0.3&hemic=%23b8c8ff&pl=0.7&ply=1.2&spot=6&mood=40&moodw=0.3&moodc=%235d86ff&psuL=0.001&fogc=%23162a58&fog0=7&fog1=36&winc=%23ffc58a&wini=2.6&sun=0.001&ly=0.3&pax=0.55"
python3 tools/make_cabin.py /tmp/cabin_raw.png assets/img/cabin.jpg 24
```
