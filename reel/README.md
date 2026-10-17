# EFH · École Fly Hyani Privé — Instagram Reel

Vertical 1080×1920 / 30 fps motion-graphics reel (48.5 s) built around the Darija voice-over
(ElevenLabs, "Ghizlane"). Arabic karaoke captions, original music and sound design.

## Deliverables (`out/`)

| File | What |
| --- | --- |
| `EFH_reel_final.mp4` | Final reel: H.264 High 1080×1920 30 fps + AAC 320 kbps 48 kHz, −14 LUFS / −1 dBTP |
| `EFH_reel_captions_ar.srt` | The same Arabic captions as a subtitle file (TikTok / YouTube Shorts / Facebook) |
| `EFH_reel_cover.jpg` | Suggested Instagram cover frame |

## Script (as spoken, force-aligned word by word)

| # | Time | Darija | Meaning |
| --- | --- | --- | --- |
| 1 | 0.1 s | كاين اللي كيجمع الفلوس شهور باش يسافر غير أسبوع واحد | Some save money for months to travel for just one week |
| 2 | 3.8 s | وكاين اللي السفر جزء من خدمتو | and for others, travel is part of the job |
| 3 | 6.1 s | وكيتخلص عليها | and they get paid for it |
| 4 | 7.5 s | تخيل معايا: اليوم فمراكش، وغدا فمدينة أخرى | Imagine: today Marrakech, tomorrow another city |
| 5 | 11.2 s | مطار جديد، وجوه جديدة، وتجربة مختلفة | a new airport, new faces, a different experience |
| 6 | 15.0 s | هذه هي مهنة كابين كرو | This is the Cabin Crew profession |
| 7 | 17.0 s | طاقم الضيافة الجوية | air hospitality crew |
| 8 | 18.8 s | ولكن، واش هاد المهنة غير السفر وتصاور زوينين؟ | But is it just travel and nice photos? |
| 9 | 22.3 s | لا! | No! |
| 10 | 22.9 s | ورا هاد الأناقة كاين انضباط، تواصل، مسؤولية، وتكوين على السلامة | Behind the elegance: discipline, communication, responsibility, safety training |
| 11 | 28.5 s | والأجمل؟ حتى انت تقدر تبدا توجه دراستك لهاد العالم، خطوة بخطوة | The best part? You can start too, step by step |
| 12 | 33.4 s | فمدرسة فلاي الحياني الخاصة بمراكش، كنوفرو تكوين مضيفات ومضيفي الطيران | At Fly Hyani private school in Marrakech we train flight attendants |
| 13 | 38.8 s | التسجيل مازال مفتوح، والأماكن محدودة. تواصل معانا اليوم! | Registration open, places limited. Contact us today! |

## Storyboard

| Time | Scene |
| --- | --- |
| 0 – 7.5 | **VS split screen**: VOYAGE = VACANCES (calendar months flip, savings stack, "1 SEMAINE" stamp) vs VOYAGE = MÉTIER (crew member above the clouds, "Salaire reçu ✓" notification) |
| 7 – 11.4 | **Dotted 3D globe**: Marrakech pin, flight arcs fan out to 13 cities, plane flies to Dubai |
| 11 – 15 | **Airport**: split-flap departures board → new faces → passport stamps |
| 14.6 – 19 | **Title drop on the beat**: CABIN behind the hostess, CREW in front, crew joins |
| 18.6 – 23 | **Phone feed** (scene freezes into the first post), shutter flashes, likes… then **"لا!"** freeze + red X + tape stop |
| 22.5 – 28.6 | **Behind the elegance**: portrait scanned into a blueprint, 4 pillars land on each word |
| 28.4 – 33.6 | **Golden hour**: boarding pass prints "VOUS", 3-step flight path |
| 33.4 – 39 | **Logo build** on the second drop (vector-traced logo), Marrakech, fuselage windows: hostesses → stewards |
| 38.6 – 43.5 | **CTA**: INSCRIPTIONS OUVERTES flaps, seat map fills up (places limitées), phones + website |
| 43 – 48.5 | **Location**: satellite map dive, route along Bd Allal Al Fassi, pin drop, end card |

## How it is made

* **Picture**: `src/` is an HTML/CSS/GSAP scene graph driven by one paused timeline. `tools/render.js`
  seeks it frame by frame in headless Chromium (4 parallel workers) and pipes frames to ffmpeg;
  every frame averages 4 sub-frames (180° shutter) for real motion blur.
* **Captions**: words were force-aligned to the audio (Meta Omnilingual ASR, CTC) after transcription
  with Whisper large-v3; ambiguous Darija words were decided by scoring alternatives against the audio.
* **Sound**: `audio/music.py` composes the music (120 BPM, two drops locked to the edit) and
  `audio/sfx.py` synthesises every effect. Scenes register their sound cues on the same timeline,
  so picture and sound share one clock (`audio/cues.json`).
* **Mix** (`audio/mix.py`): voice kept near-untouched (70 Hz rumble filter, gentle leveling); music
  ducks under the voice with a look-ahead, band-split ducker (−14 dB in the speech band); master
  −14 LUFS, true peak −1.2 dBTP. In speech the voice sits a median ~14 dB above music + effects
  in the 1–4 kHz band (`audio/analyze_mix.py`).

## Rebuild

```bash
npm install                                  # gsap, playwright, world-atlas, lucide-static ...
node tools/build_data.js                     # icons, word timings, logo paths -> src/data
node tools/render.js stills --times 16.2     # preview frames
node tools/render.js cues --out audio/cues.json
(cd audio && python3 music.py build && python3 mix.py ../assets/audio/voice_original.mp3 cues.json build build/mix_final.wav 48.5)
node tools/render.js video --sub 4 --workers 4 --crf 17 --out out/video_noaudio.mp4
tools/mux.sh out/video_noaudio.mp4 audio/build/mix_final.wav out/EFH_reel_final.mp4
```

Python deps: numpy scipy soundfile pedalboard pyloudnorm pillow opencv-contrib-python-headless potracer.

## Credits

Fonts: Alexandria, Montserrat, Barlow Condensed, JetBrains Mono (SIL OFL, Google Fonts) ·
Animation: GSAP · Icons: Lucide (ISC) · Land data: Natural Earth via world-atlas ·
Map imagery © Google (school location screenshot) · Music and sound effects: original, synthesised for this reel.
