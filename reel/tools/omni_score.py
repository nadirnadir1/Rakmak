"""Score alternative transcripts of a phrase against the audio with CTC (forward log-likelihood).
Usage: python3 -I omni_score.py <model_dir> <wav16k> <cands.json>"""
import sys, json, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from omni_ctc import load_model, logprobs

def ctc_forward(lp, targets, blank=0):
    S = 2 * len(targets) + 1
    ext = [blank] * S
    for i, t in enumerate(targets): ext[2 * i + 1] = t
    a = np.full(S, -np.inf); a[0] = lp[0, blank]; a[1] = lp[0, ext[1]]
    for t in range(1, lp.shape[0]):
        prev = a.copy()
        s1 = np.concatenate([[-np.inf], prev[:-1]])
        s2 = np.concatenate([[-np.inf, -np.inf], prev[:-2]])
        skip = np.array([ext[s] != blank and s >= 2 and ext[s] != ext[s - 2] for s in range(S)])
        s2 = np.where(skip, s2, -np.inf)
        a = np.logaddexp(np.logaddexp(prev, s1), s2) + lp[t, ext]
    return np.logaddexp(a[-1], a[-2])

mdir, wav, cj = sys.argv[1:4]
sess, vocab = load_model(mdir); inv = {v: k for k, v in vocab.items()}
audio, sr = sf.read(wav, dtype='float32')
for item in json.load(open(cj)):
    a, b = item['span']
    lp = logprobs(sess, audio[int(a * sr):int(b * sr)])
    scores = []
    for c in item['cands']:
        tg = [inv[ch] if ch != ' ' else inv[' '] for ch in c if ch in inv or ch == ' ']
        scores.append((ctc_forward(lp, tg), c))
    best = max(s for s, _ in scores)
    print(f"--- {a}-{b}")
    for s, c in sorted(scores, reverse=True):
        print(f"  {s - best:8.2f}  {c}")
