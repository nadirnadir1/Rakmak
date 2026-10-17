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
