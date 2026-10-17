"""Builds captions.js: word-level timings for the Arabic captions.

Phrase boundaries come from pauses in the voice track (exact). Inside a phrase,
word times are spread by letter count, then snapped to the nearest dip in the
loudness envelope so highlights land on real word onsets.
"""
import json, sys, re
import numpy as np
import soundfile as sf

WAV = sys.argv[1]
OUT = sys.argv[2]

# (phrase start, phrase end, [caption lines])  — lines split with " | "
SCRIPT = [
    (0.08, 3.44, "كاين اللي كيجمع الفلوس شهور | باش يسافر غير أسبوع واحد"),
    (3.80, 5.92, "وكاين اللي السفر جزء من خدمتو"),
    (6.09, 7.24, "وكيتخلص عليها"),
    (7.47, 8.22, "تخيل معايا"),
    (8.40, 10.80, "اليوم في مراكش | وغدا في مدينة أخرى"),
    (11.10, 14.59, "مطار جديد | وجوه جديدة | وتجربة مختلفة"),
    (14.86, 16.68, "هذه هي مهنة كابين كرو"),
    (17.01, 18.42, "طاقم الضيافة الجوية"),
    (18.77, 21.81, "ولكن واش هاد المهنة | غير السفر وتصاور زوينين؟"),
    (22.11, 22.46, "لا."),
    (22.65, 24.98, "وراء هاد الأناقة كاين انضباط"),
    (25.15, 26.66, "تواصل، مسؤولية"),
    (26.94, 28.21, "وتكوين على السلامة"),
    (28.51, 29.11, "والأجمل"),
    (29.28, 33.13, "حتى أنت تقدر تبدا | توجد راسك لهاد العالم | خطوة بخطوة"),
    (33.38, 38.58, "في مدرسة فلاي الحياني | الخاصة بمراكش | كنوفرو تكوين | مضيفات ومضيفي الطيران"),
    (38.79, 41.45, "التسجيل مازال مفتوح | والأماكن محدودة"),
    (41.65, 42.84, "تواصل معنا اليوم"),
]
if len(sys.argv) > 3:
    SCRIPT = json.load(open(sys.argv[3]))

wav, sr = sf.read(WAV, dtype="float32")
hop = int(sr * 0.01)
frames = len(wav) // hop
rms = np.array([np.sqrt(np.mean(wav[i * hop:(i + 1) * hop + hop] ** 2) + 1e-12) for i in range(frames)])
db = 20 * np.log10(rms + 1e-9)
k = np.ones(5) / 5
dbs = np.convolve(db, k, mode="same")

def letters(w):
    w = re.sub(r"[^ء-ي]", "", w)
    return max(1, len(w))

def snap(t, lo, hi, win=0.12):
    a = max(lo, t - win); b = min(hi, t + win)
    ia, ib = int(a * 100), int(b * 100)
    if ib <= ia + 1:
        return t
    seg = dbs[ia:ib]
    j = int(np.argmin(seg))
    # only snap when the dip is clearly deeper than the local level
    if np.median(seg) - seg[j] > 4:
        return (ia + j) / 100
    return t

lines = []
for a, b, text in SCRIPT:
    chunks = [c.strip() for c in text.split("|")]
    words = [(ci, w) for ci, c in enumerate(chunks) for w in c.split()]
    wts = np.array([letters(w) + 1.6 for _, w in words], float)
    edges = a + np.concatenate([[0], np.cumsum(wts)]) / wts.sum() * (b - a)
    for i in range(1, len(edges) - 1):
        edges[i] = snap(edges[i], edges[i - 1] + 0.08, edges[i + 1] - 0.08)
    for ci, c in enumerate(chunks):
        idx = [i for i, (cj, _) in enumerate(words) if cj == ci]
        ws = [{"w": words[i][1], "s": round(float(edges[i]), 3), "e": round(float(edges[i + 1]), 3)} for i in idx]
        lines.append({"s": ws[0]["s"], "e": ws[-1]["e"], "words": ws})

# each line stays up until the next one starts (or a short hold after a phrase)
for i, ln in enumerate(lines):
    nxt = lines[i + 1]["s"] if i + 1 < len(lines) else ln["e"] + 0.6
    ln["out"] = round(min(nxt, ln["e"] + 0.45), 3)

with open(OUT, "w") as f:
    f.write("window.CAPTIONS = " + json.dumps(lines, ensure_ascii=False, indent=1) + ";\n")
for ln in lines:
    print(f'{ln["s"]:6.2f}-{ln["e"]:6.2f}  ' + "  ".join(f'{w["w"]}@{w["s"]:.2f}' for w in ln["words"]))
