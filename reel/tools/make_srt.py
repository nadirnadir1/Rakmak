"""Arabic SRT subtitles from the force-aligned word timings, using the same caption pages
as the on-screen captions. Usage: python3 make_srt.py src/data/words.json out.srt"""
import sys, json, re

SPLITS = {1: [4, 3, 3], 2: [3, 3], 3: [2], 4: [2, 2, 3], 5: [2, 2, 2], 6: [3, 2], 7: [3],
          8: [2, 2, 2, 2], 9: [1], 10: [3, 2, 2, 3], 11: [1, 4, 4, 2], 12: [3, 2, 2, 3], 13: [3, 2, 3]}


def ts(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


phrases = json.load(open(sys.argv[1]))
pages = []
for ph in phrases:
    k = 0
    for n in SPLITS[ph['id']]:
        ws = ph['words'][k:k + n]
        k += n
        pages.append((ws[0]['start'], ws[-1]['end'], ' '.join(re.sub(r'[،.:]', '', w['w']) for w in ws)))
out = []
for i, (a, b, txt) in enumerate(pages):
    nxt = pages[i + 1][0] if i + 1 < len(pages) else None
    end = min(b + 0.3, nxt - 0.07) if nxt else b + 0.4  # next cue starts at nxt - 0.05
    out.append(f"{i + 1}\n{ts(max(0, a - 0.05))} --> {ts(end)}\n‫{txt}‬\n")
open(sys.argv[2], 'w', encoding='utf-8').write('\n'.join(out))
print(len(out), 'subtitles ->', sys.argv[2])
