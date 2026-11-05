# Rakmak

## Green March 51 — École FLY HYANI Privé montage

Vertical (9:16, 1080×1920, 30 fps) montage for the **51st anniversary of the Green March**
(6 November 1975 – 6 November 2026), made from the school's ceremony footage.

Final video: `output/EFH_Marche_Verte_51.mp4` (2:08, under the 3-minute limit).

### Structure

| Time | Part | Notes |
|------|------|-------|
| 0:00 | Hook | Archive photo 1975 → beat drop → students today, year rolls 1975 → 2026, «نفس العلم • نفس الروح» |
| 0:04 | Title | «الذكرى 51 للمسيرة الخضراء المظفرة» over the students' entrance |
| 0:08 | School montage | Logo card, beat-synced cuts: وحدة · وفاء · انتماء · فخر |
| 0:18 | Speech 1 — Siham (English) | Every word kept, long pauses shortened; Arabic translated subtitles; archive photos |
| 0:55 | Speech 2 — Ahmed Amine (Arabic) | Every word kept, long pauses shortened; Arabic karaoke subtitles, Hassan II portrait, archive photos, 350.000 counter, map, punchy «عاش الملك…» finale |
| 1:53 | Outro | Cheering, group photo «كل عام والمغرب بخير», end card |

### Editing style

* School identity: EFH logo badge at the top, name tags «سهام» / «أحمد أمين — متدرب لدى مدرسة FLY HYANI»
  in the school blue and orange with the logo mark.
* Subtitles in Almarai ExtraBold; the real flag image (gently waving) in the outro and end card.

* Clean editorial motion: text rises from a mask, focus pulls, smooth photo inserts with a slow
  zoom inside, hard cuts on the beat, a flag-colour wipe into each speech, crossfades in the outro.
* No bounce, shake, flashes or automatic zoom jumps; framing changes only at real cuts.
* `montage/timeline.py` shortens silent pauses in the speeches (no words removed) and keeps
  picture, sound and subtitles in sync.

### Privacy

* Faces of students who do not speak are softly blurred (YuNet face detection + tracking,
  feathered blur scaled to face size), in video and in photos. The two speakers stay visible.
* The part of the ceremony clip where a man in a blue striped shirt appears is not used.
* Raw footage is **not** stored in this repository.

### Audio

* Speeches: declip, gentle denoise, EQ for clarity, compression, loudness normalised.
* Music: «نداء الحسن» (Green March anthem). Full energy for hook/montage/outro, a soft muffled
  bed under the speeches, and the song's real ending under the end card.

### Rebuild

Work directory layout (not committed): `src/` (original clips/photos), `audio/`, `blur/`, `shots/`.

```bash
python3 tools/faceblur.py MODEL src/v47.mp4 blur/v47_blur.mp4 --ss 0 --t 36.5   # etc.
python3 tools/faceblur_image.py MODEL src/img_group.jpg blur/img_group_blur.jpg
python3 montage/prep_clips.py WORK
python3 montage/audio_mix.py WORK WORK/final/mix_raw.wav
python3 montage/render.py WORK WORK/final/video_noaudio.mp4
```

Fonts in `assets/fonts/` are from Google Fonts (SIL Open Font License).
