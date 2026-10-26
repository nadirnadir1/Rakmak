# Real-estate reel montage

Automated edit of a talking-head video (Darija, burned-in subtitles) for a real-estate agency.
Graphics are placed **behind** the speaker using an AI matte, and some items **react to his hands**.

Final videos are in [`../output/`](../output):

| File | Contents |
|---|---|
| `montage_immo.mp4` | Full edit: voice + sound effects + soft music bed |
| `montage_immo_sans_musique.mp4` | Same edit, voice + sound effects only (add a trending sound in TikTok/Instagram) |

1080×1920, 25 fps, 45 s, loudness normalised to −14 LUFS.

## Edit decisions

**Hook (0–1.5 s):** cold open on *"كاع القوالب اللي كيخبيوها عليك"* (src 32.72–34.20 s), dark red
background, "ATTENTION" behind his head, camera shake, glitch transition into the start of the video.

Then the full take (src 0–43.5 s). Subtitles are kept exactly as they were (burned-in pixels
are restored on top of the new background). Text behind him never repeats the subtitle text.

| Time (src) | He says | On screen |
|---|---|---|
| 0.0–2.7 | كتفكر تشري عقار عن طريق وسيط عقاري | "ACHAT · VENTE" split around his head; 2 apartment photos rise from behind his shoulders following his open hands, sparkles from his palms |
| 2.7–4.4 | خاصك ضروري تعرف هادشي | "À SAVOIR" opens out from behind his head |
| 4.4–5.2 | قبل ما تقولب | "ARNAQUE" slam, red flash, warning icons, camera punch + shake |
| 5.2–8.4 | agent كيوريك غير les appartements… راه ماشي هادشي | 4 photos slide out from behind his head, then a red ✗ and "INSUFFISANT"; photos fall away |
| 8.4–13.2 | اللي خاصك تعرف… تشري عقار… appartement لي عجباتك و صافي | House icon floats above his left palm, key above his right palm; the key flies into the house, which flips into a photo with a ❤ ("COUP DE CŒUR ?"), then shakes "no" at *و صافي* |
| 13.4–20.0 | le prix / الموقع / الإحتياجات / les informations / قبل ما تشري | "CHECK-LIST": checklist card (Budget, Quartier, Surface, Documents) ticks in sync; price gauge settles on "JUSTE"; map with pin drop + amenities; document scan; "VALIDÉ" stamp |
| 20.0–21.6 | و إلا كنتي باغي تبيع | "VENDEURS" + swinging "À VENDRE" sign |
| 21.6–23.1 | تحدد الثمن | "ESTIMATION" + animated bar chart and trend line (rises as his hand rises) |
| 23.1–26.9 | tprésenter العقار… la valeur | "HOME STAGING", photos fan out from behind him, 5-star rating fills |
| 27.6–29.4 | أنا صلاح agent immobilier فكازا | Casablanca skyline (with minaret) rises behind him, "CASABLANCA" |
| 29.4–31.9 | 8 ans L'expérience | Year counter rolls 2018 → 2026, timeline fills, trophy + confetti pops on his open palm |
| 31.9–34.1 | كاع القوالب اللي كيخبيوها عليك | "LES SECRETS", padlock shakes then unlocks |
| 34.2–36.3 | décision importante | "INVESTISSEMENT", coin stacks grow, balance icon |
| 36.4–39.0 | حقك تفهم مزيان قبل ما تاخد أي قرار | "CONFIANCE", light bulb switches on; ripples from his fingertip when he points |
| 39.5–41.9 | خلي معاك follow | "S'ABONNER" button, cursor clicks it as he points down → "ABONNÉ", bell rings, hearts |
| 41.7–43.5 | المجال والقوالب ديالو | "ACHAT · VENTE · CONSEILS" + photos |

## Pipeline

All scripts read the working folder from the `MS` environment variable
(expects `input.mp4`, `audio_orig.wav`, `audio16k.wav`, `fonts/`, `models/`, `photos/photo1..4.jpg`).

1. `analyze.py` – RobustVideoMatting (ONNX) alpha matte + MediaPipe hand & pose tracking per frame.
2. `prep.py` – decodes frames, smooths hand tracks; `submask2.py` – mask of the burned-in subtitles.
3. `subs.py` – detects subtitle change times (used to sync every animation to the voice).
4. `montage.py` – renders the video (`python3 montage.py range START END out.mp4`, or `frames DIR i j …` for stills).
5. `audio.py` – voice edit, synthesized SFX timeline and music bed with ducking.

Models: `rvm_mobilenetv3_fp32.onnx` (RobustVideoMatting), MediaPipe `hand_landmarker.task`,
`pose_landmarker_full.task`. Fonts: Anton, Poppins (Google Fonts, OFL), Font Awesome Free (icons).
