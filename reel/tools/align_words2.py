"""Word boundaries by 'virtual truncation' with Whisper large-v3.

For a phrase with words w1..wn and every k < n, we look for the cut time c that
maximises  log P(w1..wk, EOT | audio truncated at c).  Truncation is simulated by
replacing the encoder frames after c with the frames of an all-silent encoding
(computed once), so each probe costs only one decoder pass.

Usage: python3 align_words2.py <tools_dir> <model_dir> <vo16k.wav> <transcript.json> <out.json> [seg_index ...]
"""
import json
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, sys.argv[1])
from whisper_align import Whisper  # noqa: E402

model_dir, wav, tr_path, out_path = sys.argv[2:6]
only = [int(x) for x in sys.argv[6:]]
audio, sr = sf.read(wav, dtype="float32")
W = Whisper(model_dir)
segs = json.load(open(tr_path))
PRE, POST = 0.3, 0.8
FR = 0.02  # encoder frame = 20 ms

hop = int(0.01 * sr)
frames = len(audio) // hop
edb = 20 * np.log10(np.sqrt(np.array([np.mean(audio[i * hop:(i + 1) * hop] ** 2) for i in range(frames)]) + 1e-12))


def speech_bounds(s, e, thr_db=-38):
    i0, i1 = int(s / 0.01), min(frames, int(e / 0.01))
    act = np.where(edb[i0:i1] > thr_db)[0]
    if len(act) == 0:
        return s, e
    return (i0 + act[0]) * 0.01, (i0 + act[-1] + 1) * 0.01


silent = W.encode(np.zeros(int(1.0 * sr), np.float32))


def joint_logp(cross, toks, cut_frame):
    k, v = cross
    k2 = np.concatenate([k[:, :, :cut_frame], silent[0][:, :, cut_frame:]], axis=2)
    v2 = np.concatenate([v[:, :, :cut_frame], silent[1][:, :, cut_frame:]], axis=2)
    pre = W.prefix("ar", timestamps=False)
    seq = pre + toks + [W.eot]
    lg = W.logits((k2, v2), seq[:-1])[:, : W.ts0]
    lp = lg - np.logaddexp.reduce(lg, axis=1, keepdims=True)
    tgt = seq[len(pre):]
    return float(sum(lp[len(pre) - 1 + i, t] for i, t in enumerate(tgt)))


out = []
for si, seg in enumerate(segs):
    if only and si not in only:
        continue
    s, e, text = seg["start"], seg["end"], seg["text"]
    words = text.split()
    mw = [w.strip("؟?!.,،") for w in words]
    a = audio[int(s * sr): int(e * sr)]
    a = np.concatenate([np.zeros(int(PRE * sr), np.float32), a, np.zeros(int(POST * sr), np.float32)])
    cross = W.encode(a)
    sb, se = speech_bounds(s, e)
    # prior: boundaries proportional to letter counts
    lens = np.array([max(2, len(w)) + 1.5 for w in mw], float)
    cum = np.cumsum(lens) / lens.sum()
    toks_all = []
    ends_tok = []
    for w in mw:
        toks_all += W.tok.encode(" " + w)
        ends_tok.append(len(toks_all))
    bounds = []
    lo_lim = sb + 0.06
    for k in range(1, len(words)):
        prior = sb + (se - sb) * cum[k - 1]
        win_frame = lambda t: int(round((t - s + PRE) / FR))
        best = None
        # coarse scan +-0.36 s (40 ms), then fine (20 ms)
        cands = [prior + d for d in np.arange(-0.36, 0.361, 0.04)]
        cands = [c for c in cands if lo_lim <= c <= se - 0.05]
        if not cands:
            cands = [max(lo_lim, min(prior, se - 0.05))]
        scores = []
        for c in cands:
            scores.append((joint_logp(cross, toks_all[: ends_tok[k - 1]], win_frame(c)), c))
        sc, c0 = max(scores)
        fine = [c0 + d for d in (-0.02, 0.02)]
        for c in fine:
            if lo_lim <= c <= se - 0.03:
                scores.append((joint_logp(cross, toks_all[: ends_tok[k - 1]], win_frame(c)), c))
        sc, cb = max(scores)
        bounds.append(cb)
        lo_lim = cb + 0.08
        sys.stdout.flush()
    starts = [sb] + bounds
    ends = bounds + [se]
    res = [{"w": w, "start": round(a_, 3), "end": round(b_, 3)} for w, a_, b_ in zip(words, starts, ends)]
    print(f"[{s:6.2f}-{e:6.2f}] speech {sb:.2f}-{se:.2f}")
    for r in res:
        print(f"    {r['start']:7.3f} {r['end']:7.3f}  {r['w']}")
    sys.stdout.flush()
    out.append({"start": s, "end": e, "speech_start": round(sb, 3), "speech_end": round(se, 3), "text": text, "words": res})
json.dump(out, open(out_path, "w"), ensure_ascii=False, indent=1)
