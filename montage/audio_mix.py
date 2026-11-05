"""Mix the montage soundtrack (48 kHz stereo) to match render.py's timeline.

usage: audio_mix.py WORK_DIR OUT.wav
Uses WORK_DIR/audio/{anthemA.wav, v21_clean.wav, v19_clean.wav}.
"""
import math
import os
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter, lfilter_zi, sosfilt

WORK, OUT = sys.argv[1], sys.argv[2]
SR = 48000

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from timeline import SONG_OFF_MAIN, Timeline  # noqa: E402

TL = Timeline(WORK)                       # same timeline as render.py
SEG = TL.SEG
SEG_G0, SEG_B0, SEG_O1, SEG_O3, TOTAL = SEG["G"][0], SEG["B"][0], SEG["O1"][0], SEG["O3"][0], TL.TOTAL
SONG_OFF_OUTRO = TL.song_off_outro        # final chord of the song lands on the end card

N = int(round(TOTAL * SR))


def load(name):
    y, sr = sf.read(os.path.join(WORK, "audio", name), dtype="float32", always_2d=True)
    assert sr == SR, (name, sr)
    if y.shape[1] == 1:
        y = np.repeat(y, 2, axis=1)
    return y


def db(x):
    return 10 ** (x / 20)


def env(times, points):
    """Piecewise-linear gain envelope (in dB) sampled at `times`."""
    t, g = zip(*points)
    return db(np.interp(times, t, g))


def sweep_lowpass(x, times, f_points, order=2):
    """Low-pass with a time-varying cutoff (blockwise biquads, state carried)."""
    f_t, f_v = zip(*f_points)
    out = np.zeros_like(x)
    blk = 256
    zi = None
    for s in range(0, len(x), blk):
        tt = times[min(s + blk // 2, len(times) - 1)]
        fc = float(np.exp(np.interp(tt, f_t, np.log(f_v))))
        fc = min(fc, SR * 0.45)
        sos = butter(order, fc / (SR / 2), btype="low", output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2, x.shape[1]))
        seg = x[s:s + blk]
        y, zi = sosfilt(sos, seg, axis=0, zi=zi)
        out[s:s + blk] = y
    return out


def place(buf, clip, v_start):
    i0 = int(round(v_start * SR))
    i1 = min(len(buf), i0 + len(clip))
    if i1 > i0:
        buf[i0:i1] += clip[:i1 - i0]


def fade(clip, fin=0.02, fout=0.02):
    n = len(clip)
    g = np.ones(n, np.float32)
    a, b = int(fin * SR), int(fout * SR)
    if a:
        g[:a] = np.sin(np.linspace(0, math.pi / 2, a)) ** 2
    if b:
        g[-b:] = np.cos(np.linspace(0, math.pi / 2, b)) ** 2
    return clip * g[:, None]


song = load("anthemA.wav")
girl = load("v21_clean.wav")
boy = load("v19_clean.wav")
SPEECH_DB = -2.8   # mono speech duplicated to stereo reads ~3 LU hotter
stems = {k: np.zeros((N, 2), np.float32) for k in ("music", "bed", "speech", "sfx")}
mix = stems["music"]
t_all = np.arange(N) / SR

# ---------------------------------------------------------------- 1. hook + montage music
v0, v1 = 0.0, 20.3
s0 = int((v0 + SONG_OFF_MAIN) * SR)
m = song[s0:s0 + int((v1 - v0) * SR)].copy()
tm = v0 + np.arange(len(m)) / SR
m = sweep_lowpass(m, tm, [(0, 18000), (18.70, 18000), (19.60, 520), (20.3, 400)])
m *= env(tm, [(0, -5.5), (18.70, -5.5), (19.60, -17), (20.3, -60)])[:, None]
place(mix, fade(m, 0.01, 0.05), v0)

# ---------------------------------------------------------------- 2. bed under the speeches
lp = butter(6, 700 / (SR / 2), btype="low", output="sos")   # warm pad only: keep clear of the speech band
intro = sosfilt(lp, song[int(0.5 * SR):int(26.0 * SR)], axis=0).astype(np.float32)
bed_v0, bed_v1 = 19.0, SEG_O1 + 1.6
need = int((bed_v1 - bed_v0) * SR)
xf = int(2.5 * SR)
bed = np.zeros((need + len(intro), 2), np.float32)
pos = 0
win_in = np.sin(np.linspace(0, math.pi / 2, xf)) ** 2
while pos < need:
    piece = intro.copy()
    piece[:xf] *= win_in[:, None]
    piece[-xf:] *= win_in[::-1, None]
    bed[pos:pos + len(piece)] += piece
    pos += len(piece) - xf
bed = bed[:need]
tb = bed_v0 + np.arange(need) / SR
BED_DB = -11.0
bed *= env(tb, [(bed_v0, -60), (bed_v0 + 1.2, BED_DB), (SEG_B0 - 0.6, BED_DB), (SEG_B0, BED_DB - 4),
                (SEG_B0 + 1.0, BED_DB), (bed_v1 - 1.4, BED_DB), (bed_v1, -60)])[:, None]
place(stems["bed"], bed, bed_v0)

# ---------------------------------------------------------------- 3. speeches (cleaned, -14.5 LUFS), pauses tightened
def assemble(src, tight, f_end):
    """Concatenate the kept pieces; 12 ms fades at each joint (joints sit inside silences)."""
    out = np.zeros((int(round(tight.dur * SR)) + SR, 2), np.float32)
    last = len(tight.iv) - 1
    for k, ((a, b), s) in enumerate(zip(tight.iv, tight.starts)):
        piece = src[int(round(a * SR)):int(round(b * SR))]
        piece = fade(piece, 0.03 if k == 0 else 0.012, f_end if k == last else 0.012)
        place(out, piece, s)
    return out[:int(round(tight.dur * SR))]


place(stems["speech"], assemble(girl, TL.girl, 0.6) * db(SPEECH_DB), SEG_G0)
place(stems["speech"], assemble(boy, TL.boy, 1.0) * db(SPEECH_DB), SEG_B0)

# ---------------------------------------------------------------- 4. outro music (song's real ending)
o0 = SEG_O1 - 0.6
s0 = int((o0 + SONG_OFF_OUTRO) * SR)
o = song[s0:s0 + int((TOTAL - o0) * SR)].copy()
to = o0 + np.arange(len(o)) / SR
o = sweep_lowpass(o, to, [(o0, 380), (SEG_O1 + 1.1, 16000), (TOTAL, 18000)])
o *= env(to, [(o0, -40), (SEG_O1 + 0.6, -13), (SEG_O1 + 3.1, -13), (SEG_O1 + 3.8, -7.0),
              (TOTAL - 1.9, -7.0), (TOTAL, -60)])[:, None]
place(stems["music"], o, o0)

# ---------------------------------------------------------------- 5. sound design (procedural, subtle)
rng = np.random.default_rng(11)


def whoosh(center, dur=0.5, level=-25, f0=450, f1=3800):
    n = int(dur * SR)
    noise = rng.normal(0, 1, (n, 2)).astype(np.float32)
    tt = np.arange(n) / SR
    out = np.zeros_like(noise)
    blk = 256
    zi = None
    for s in range(0, n, blk):
        p = s / n
        fc = f0 * (f1 / f0) ** p
        sos = butter(2, [fc * 0.6 / (SR / 2), min(0.95, fc * 1.6 / (SR / 2))], btype="band", output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2, 2))
        out[s:s + blk], zi = sosfilt(sos, noise[s:s + blk], axis=0, zi=zi)
    peak_t = dur * 0.62
    e = np.where(tt < peak_t, (tt / peak_t) ** 2.2, np.exp(-(tt - peak_t) / 0.08))
    out *= e[:, None]
    out /= np.abs(out).max() + 1e-9
    place(stems["sfx"], out * db(level), center - peak_t)


def boom(at, level=-13):
    n = int(1.4 * SR)
    tt = np.arange(n) / SR
    f = 62 * np.exp(-tt * 1.3) + 34
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-tt * 3.2)
    x[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
    click = rng.normal(0, 1, n) * np.exp(-tt * 90) * 0.25
    y = (x + click).astype(np.float32)
    y /= np.abs(y).max()
    place(stems["sfx"], np.repeat(y[:, None], 2, 1) * db(level), at)


def riser(t0, t1, level=-27):
    n = int((t1 - t0) * SR)
    noise = rng.normal(0, 1, (n, 2)).astype(np.float32)
    tt = np.arange(n) / SR
    out = sweep_lowpass(noise, tt, [(0, 300), (t1 - t0, 9000)])
    e = (tt / tt[-1]) ** 2.5
    out *= e[:, None]
    out /= np.abs(out).max() + 1e-9
    place(stems["sfx"], fade(out, 0.05, 0.01) * db(level), t0)


riser(0.55, 2.18)
boom(2.20, -12)
for tc in (SEG["T1"][0], SEG["M1"][0]):
    whoosh(tc, 0.5, -28)
for tc in (SEG_G0, SEG_B0):            # flag-colour wipes into each speech
    whoosh(tc, 0.6, -25)
boom(SEG_O3, -16)

# ---------------------------------------------------------------- master: sum + look-ahead peak limiter
mix = sum(stems.values())
if len(sys.argv) > 3 and sys.argv[3] == "--stems":
    for k, v in stems.items():
        sf.write(OUT.replace(".wav", f"_{k}.wav"), v, SR, subtype="PCM_24")


def limiter(x, ceiling=db(-1.2), look=0.003, release=0.09):
    a = np.abs(x).max(axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(a, 1e-9))
    la = int(look * SR)
    # look-ahead: minimum over the next `la` samples
    from scipy.ndimage import minimum_filter1d
    need = minimum_filter1d(need, size=2 * la + 1, origin=0)
    # smooth release (one-pole), instant attack
    rel = math.exp(-1.0 / (release * SR))
    g = np.empty_like(need)
    cur = 1.0
    for i in range(0, len(need), 64):          # block-wise for speed
        blk = need[i:i + 64]
        m = blk.min()
        cur = m if m < cur else 1 - (1 - cur) * rel ** 64 if cur < 1 else 1.0
        cur = min(cur, 1.0)
        g[i:i + 64] = np.minimum(cur, blk)
    return x * g[:, None]


peak = np.abs(mix).max()
print("pre-limiter peak dBFS", round(20 * np.log10(peak + 1e-9), 2))
mix = limiter(mix).astype(np.float32)
sf.write(OUT, mix, SR, subtype="PCM_24")
print("wrote", OUT, mix.shape[0] / SR, "s")
