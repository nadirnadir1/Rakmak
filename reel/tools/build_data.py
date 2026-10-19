"""Build src/data.js: caption chunks + word timings in video time.

Chunk spec syntax (per voiceover segment):
  '|' separates caption chunks, [..] orange keyword box, {..} red box, <..> blue box,
  emoji at the end of a chunk is appended after the last word.
"""
import json
import re
import sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
OFF = 0.30          # voiceover starts 0.30 s into the video
TOTAL = 59.90

SPEC = [
    # (style, y, chunk spec)
    ("cap", 1250, "واحد كيقلب | على موعد [الفيزا] | باش يسافر [لباريس] 🇫🇷"),
    ("cap", 960, "وواحد"),
    ("cap", 960, "ممكن يدخل لها | [بلا فيزا] سياحية | غير حيت خدام | في [طاقم الطائرة] ✈️"),
    ("cap", 1250, "واللي غادي [يفاجئك؟]"),
    ("hero", 1290, "بجوجهم [مغاربة]"),
    ("hero", 930, "[الفرق؟]"),
    ("cap", 1250, "التاني خدام | [مضيف طيران] ✈️"),
    ("cap", 1250, "وهادشي [فعلا] كاين"),
    ("cap", 1250, "في وجهات بحال | [فرنسا،] [إسبانيا] | [وبريطانيا،] | طاقم الطائرة | يقدر يستافد | من [إعفاءات خاصة] | أثناء الخدمة | بشروط ووثائق [محددة]"),
    ("cap", 1250, "وهذه غير واحدة | من [المميزات] | اللي ما كيعرفوهاش | بزاف ديال الناس | على هاد المهنة"),
    ("cap", 1250, "السفر لوجهات [مختلفة] | واكتشاف [مدن جديدة] | خلال بعض التوقفات"),
    ("cap", 1250, "ولكن | هذه التسهيلات | مرتبطة [بالخدمة،]"),
    ("cap", 1250, "ماشي {بالسياحة}"),
    ("cap", 1250, "<وأمريكا> مثلا، 🇺🇸"),
    ("cap", 1250, "ممكن تطلب | [فيزا خاصة] بالطاقم"),
    ("hero", 930, "وهذا هو [السؤال]"),
    ("cap", 1250, "واش حتى [انت] | باغي تدخل | لعالم [مضيفي الطيران؟]"),
    ("cap", 1250, "مدرسة [فلاي الحياني] | الخاصة [بمراكش] | تقدم لك تكوين | [مضيفات] [ومضيفي الطيران]"),
    ("hero", 780, "[التسجيل مفتوح]"),
]

EMOJI_RE = re.compile(r"[\U0001F000-\U0001FAFF☀-➿️\U0001F1E6-\U0001F1FF]+")


def parse_chunk(txt):
    txt = txt.strip()
    emoji = ""
    m = EMOJI_RE.search(txt)
    if m:
        emoji = txt[m.start():].strip()
        txt = txt[: m.start()].strip()
    units = []
    for m in re.finditer(r"\[([^\]]+)\]|\{([^}]+)\}|<([^>]+)>|(\S+)", txt):
        if m.group(1):
            units.append((m.group(1).split(), "o"))
        elif m.group(2):
            units.append((m.group(2).split(), "r"))
        elif m.group(3):
            units.append((m.group(3).split(), "b"))
        else:
            units.append(([m.group(4)], ""))
    return units, emoji


# manual boundary fixes after a wider re-scan (seconds, voiceover time): (segment, word) -> (start, end)
CORR = {
    (8, "أثناء"): (23.046, 23.42), (8, "الخدمة"): (23.42, 24.15), (8, "بشروط"): (24.15, 24.687),
    (11, "هذه"): (37.055, 37.20), (11, "التسهيلات"): (37.20, 37.696),
}


def main():
    words = json.load(open(f"{ROOT}/data/words.json"))
    for si, seg in enumerate(words):
        for w in seg["words"]:
            if (si, w["w"]) in CORR:
                w["start"], w["end"] = CORR[(si, w["w"])]
    assert len(words) == len(SPEC), (len(words), len(SPEC))
    chunks, allw = [], []
    for seg, (style, y, spec) in zip(words, SPEC):
        ws = seg["words"]
        for w in ws:
            allw.append({"w": w["w"], "s": round(w["start"] + OFF, 3), "e": round(w["end"] + OFF, 3)})
        k = 0
        seg_chunks = []
        for ch in spec.split("|"):
            units, emoji = parse_chunk(ch)
            out_units = []
            for toks, box in units:
                span = ws[k: k + len(toks)]
                assert [w["w"] for w in span] == toks, (toks, [w["w"] for w in span])
                out_units.append({"t": " ".join(toks), "s": round(span[0]["start"] + OFF, 3),
                                  "e": round(span[-1]["end"] + OFF, 3), "box": box})
                k += len(toks)
            seg_chunks.append({"style": style, "y": y, "units": out_units, "emoji": emoji,
                               "s": out_units[0]["s"], "last": out_units[-1]["e"]})
        assert k == len(ws), (k, len(ws), spec)
        chunks += seg_chunks
    # display windows
    END_AT = {"وهذا هو السؤال": 45.69, "التسجيل مفتوح": 56.42, "الفرق؟": 12.70}  # hero text blows away on the beat drop
    for i, c in enumerate(chunks):
        nxt = chunks[i + 1]["s"] if i + 1 < len(chunks) else TOTAL
        hold = 0.55 if c["style"] == "hero" else 0.4
        c["e"] = round(min(nxt - 0.11, c["last"] + hold), 3)
        key = " ".join(u["t"] for u in c["units"])
        if key in END_AT:
            c["e"] = END_AT[key]
    data = {"OFF": OFF, "TOTAL": TOTAL, "words": allw, "chunks": chunks,
            "segs": [{"s": round(s["speech_start"] + OFF, 3), "e": round(s["speech_end"] + OFF, 3), "text": s["text"]} for s in words]}
    with open(f"{ROOT}/src/data.js", "w") as f:
        f.write("window.DATA = " + json.dumps(data, ensure_ascii=False) + ";\n")
    print(len(chunks), "chunks,", len(allw), "words")
    for c in chunks:
        print(f"{c['s']:6.2f}-{c['e']:6.2f} {c['style']:4s} y={c['y']}  " + " ".join(u["t"] for u in c["units"]) + (" " + c["emoji"] if c["emoji"] else ""))


if __name__ == "__main__":
    main()
