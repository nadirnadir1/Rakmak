"""Shared timeline for the montage.

The two speeches are "tightened": long silent pauses between phrases are shortened
(no words are removed). Both render.py and audio_mix.py build the same Timeline, so
picture, sound and subtitles always line up.
"""
import os

import numpy as np
import soundfile as sf

FPS = 30

# where the prepared speech shots (shots/G.mp4, shots/B.mp4) start inside the original clips
GIRL_PREP_IN, BOY_PREP_IN = 0.70, 0.30
# usable range inside the original clips
GIRL_IN, GIRL_OUT = 0.95, 38.90
BOY_IN, BOY_OUT = 1.00, 75.30
BOY_CUTAWAY = 72.00          # picture leaves the boy here (his applause + "شكراً" continue)
BOY_PROTECT = [(66.0, 75.3)]  # closing chant + applause keep their natural rhythm

# fixed opening (beat-synced to the song) and outro lengths
OPENING = {
    "H1": (0.000, 2.200), "H2": (2.200, 4.567),
    "T1": (4.567, 6.607), "T2": (6.607, 8.720),
    "M1": (8.720, 10.807), "M2": (10.807, 12.873), "M3": (12.873, 14.970),
    "M4": (14.970, 17.080), "M5": (17.080, 18.890),
}
O1_LEN, O2_LEN, O3_LEN = 3.40, 3.80, 8.50
SONG_FINAL_CHORD = 238.70     # song time of the last chord (lands on the end card)
SONG_OFF_MAIN = 27.57         # hook/montage: song time = video time + offset


def speech_regions(wav, thr_db=-38.0, hop=0.02, min_gap=0.16, min_len=0.15):
    y, sr = sf.read(wav, dtype="float32")
    if y.ndim > 1:
        y = y.mean(1)
    h = int(hop * sr)
    n = len(y) // h
    db = 10 * np.log10((y[:n * h].reshape(n, h) ** 2).mean(1) + 1e-12)
    act = db > thr_db
    segs, i = [], 0
    while i < n:
        if act[i]:
            j = i
            while j < n and act[j]:
                j += 1
            segs.append([i * hop, j * hop])
            i = j
        else:
            i += 1
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(list(s))
    return [s for s in merged if s[1] - s[0] >= min_len]


class Tight:
    """Kept intervals of a speech clip; maps original clip time <-> tightened time."""

    def __init__(self, intervals, prep_in):
        self.prep_in = prep_in
        q = lambda t: prep_in + round((t - prep_in) * FPS) / FPS  # noqa: E731  frame grid
        iv = [(q(a), q(b)) for a, b in intervals]
        self.iv = [(a, b) for a, b in iv if b - a > 0.5 / FPS]
        self.starts, s = [], 0.0
        for a, b in self.iv:
            self.starts.append(s)
            s += b - a
        self.dur = s

    def fwd(self, t):
        for (a, b), s in zip(self.iv, self.starts):
            if t < a:
                return s
            if t <= b:
                return s + (t - a)
        return self.dur

    def inv(self, tn):
        for (a, b), s in zip(self.iv, self.starts):
            if tn < s + (b - a):
                return a + max(0.0, tn - s)
        return self.iv[-1][1]

    def index(self, tn):
        for k, ((a, b), s) in enumerate(zip(self.iv, self.starts)):
            if tn < s + (b - a):
                return k
        return len(self.iv) - 1

    def removed(self):
        tot = self.iv[-1][1] - self.iv[0][0]
        return tot - self.dur


def tighten(regs, t_in, t_out, protect=(), min_cut_gap=0.70, min_piece=0.8):
    """Shorten pauses longer than `min_cut_gap`; never leave a piece shorter than `min_piece`."""
    regs = [r for r in regs if r[1] > t_in and r[0] < t_out]
    keep, cur = [], t_in
    for k in range(len(regs) - 1):
        end_k, start_n = regs[k][1], regs[k + 1][0]
        gap = start_n - end_k
        if gap <= min_cut_gap:
            continue
        if any(a <= end_k and start_n <= b for a, b in protect):
            continue
        new_gap = min(0.42, 0.30 + 0.08 * (gap - min_cut_gap))   # short, natural breath
        cut_a = end_k + new_gap * 0.55
        cut_b = start_n - new_gap * 0.45
        if cut_a - cur >= min_piece and cut_b > cut_a:
            keep.append((cur, cut_a))
            cur = cut_b
    keep.append((cur, t_out))
    return keep


class Timeline:
    def __init__(self, work):
        a = os.path.join(work, "audio")
        g_regs = speech_regions(os.path.join(a, "v21_clean16k.wav"))
        b_regs = speech_regions(os.path.join(a, "v19_clean16k.wav"))
        self.girl = Tight(tighten(g_regs, GIRL_IN, GIRL_OUT), GIRL_PREP_IN)
        self.boy = Tight(tighten(b_regs, BOY_IN, BOY_OUT, BOY_PROTECT), BOY_PREP_IN)
        seg = dict(OPENING)
        g0 = OPENING["M5"][1]
        seg["G"] = (g0, g0 + self.girl.dur)
        b0 = seg["G"][1]
        seg["B"] = (b0, b0 + self.boy.fwd(BOY_CUTAWAY))
        o1 = seg["B"][1]
        seg["O1"] = (o1, o1 + O1_LEN)
        seg["O2"] = (seg["O1"][1], seg["O1"][1] + O2_LEN)
        seg["O3"] = (seg["O2"][1], seg["O2"][1] + O3_LEN)
        self.SEG = seg
        self.TOTAL = seg["O3"][1]
        self.song_off_outro = SONG_FINAL_CHORD - seg["O3"][0]

    # original clip time -> video time
    def gv(self, tc):
        return self.SEG["G"][0] + self.girl.fwd(tc)

    def bv(self, tc):
        return self.SEG["B"][0] + self.boy.fwd(tc)


if __name__ == "__main__":
    import sys
    tl = Timeline(sys.argv[1])
    for name, t in (("girl", tl.girl), ("boy", tl.boy)):
        print(f"{name}: {len(t.iv)} pieces, {t.dur:.2f}s kept, {t.removed():.2f}s of pauses removed")
        print("   cuts at (orig):", " ".join(f"{b:.2f}->{a2:.2f}" for (a, b), (a2, b2) in zip(t.iv, t.iv[1:])))
    for k, (a, b) in tl.SEG.items():
        print(f"{k:3s} {a:7.2f} -> {b:7.2f}  ({b - a:5.2f}s)")
    print("TOTAL", round(tl.TOTAL, 2), "outro song offset", round(tl.song_off_outro, 2))
