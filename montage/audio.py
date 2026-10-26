"""Builds the soundtrack: voice (hook + full take), synthesized SFX and a soft music bed."""
import math, os, sys, wave
import numpy as np

S = os.environ["MS"]
SR = 44100
HOOK = (32.72, 34.20)
MAIN_LEN = 43.52
HL = HOOK[1] - HOOK[0]
TOTAL = HL + MAIN_LEN
N = int(round(TOTAL * SR))
rng = np.random.default_rng(42)


def read_wav(p):
    w = wave.open(p)
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    return a.reshape(-1, w.getnchannels())


# ------------------------------------------------------------------ voice
src = read_wav(f"{S}/audio_orig.wav")
if src.shape[1] == 1:
    src = np.repeat(src, 2, 1)


def seg(t0, t1, fin=0.006, fout=0.012):
    a = src[int(t0 * SR):int(t1 * SR)].copy()
    n = len(a)
    fi, fo = int(fin * SR), int(fout * SR)
    a[:fi] *= np.linspace(0, 1, fi)[:, None]
    a[n - fo:] *= np.linspace(1, 0, fo)[:, None]
    return a


voice = np.zeros((N, 2), np.float32)
h = seg(*HOOK)
voice[:len(h)] += h
m = seg(0, MAIN_LEN, 0.004, 0.03)
o = int(round(HL * SR))
voice[o:o + len(m)] += m[:N - o]


# ------------------------------------------------------------------ synth helpers
def t_(d):
    return np.arange(int(d * SR)) / SR


def expdec(d, tau):
    return np.exp(-t_(d) / tau)


def svf_band(x, fc, q=1.2):
    """Chamberlin state-variable band-pass with per-sample cutoff array."""
    low = band = 0.0
    out = np.empty_like(x)
    f = 2 * np.sin(np.pi * np.clip(fc, 20, SR / 6) / SR)
    qq = 1 / q
    for i in range(len(x)):
        high = x[i] - low - qq * band
        band += f[i] * high
        low += f[i] * band
        out[i] = band
    return out


def onepole_lp(x, fc):
    a = math.exp(-2 * math.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a) * x[i] + a * s
        y[i] = s
    return y


def norm(x, peak=1.0):
    m_ = np.max(np.abs(x)) + 1e-9
    return x / m_ * peak


def whoosh(d=0.45, f0=350, f1=2600, peak=0.55, q=1.4):
    n = int(d * SR)
    x = rng.standard_normal(n).astype(np.float64)
    tt = np.linspace(0, 1, n)
    fc = f0 * (f1 / f0) ** (np.sin(np.pi * np.clip(tt / (peak * 2), 0, 1) * 0.5) if False else tt)
    fc = np.where(tt < peak, f0 * (f1 / f0) ** (tt / peak), f1 * (f0 * 1.5 / f1) ** ((tt - peak) / (1 - peak)))
    y = svf_band(x, fc, q)
    env = np.where(tt < peak, (tt / peak) ** 1.6, ((1 - tt) / (1 - peak)) ** 1.3)
    return norm(y * env).astype(np.float32)


def swish(d=0.26):
    return whoosh(d, 900, 5200, 0.4, 1.8)


def pop(f0=900, f1=260, d=0.12):
    tt = t_(d)
    f = f1 + (f0 - f1) * np.exp(-tt / 0.018)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-tt / 0.035)
    y[:60] += rng.standard_normal(60) * np.linspace(0.5, 0, 60)
    return norm(y).astype(np.float32)


def ding(f=1568, d=0.9, bright=1.0):
    tt = t_(d)
    y = (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.32)
         + 0.45 * bright * np.sin(2 * np.pi * f * 2.0 * tt) * np.exp(-tt / 0.16)
         + 0.25 * bright * np.sin(2 * np.pi * f * 3.01 * tt) * np.exp(-tt / 0.08))
    y *= np.minimum(1, tt / 0.003)
    return norm(y).astype(np.float32)


def tick(f=2600):
    tt = t_(0.03)
    y = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.006)
    y[:40] += rng.standard_normal(40) * 0.6
    return norm(y).astype(np.float32)


def boom(d=1.1):
    tt = t_(d)
    f = 38 + 110 * np.exp(-tt / 0.09)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-tt / 0.38)
    nz = rng.standard_normal(len(tt)) * np.exp(-tt / 0.03)
    y += 0.5 * onepole_lp(nz, 900)
    y = np.tanh(y * 1.8)
    return norm(y).astype(np.float32)


def riser(d=1.2):
    n = int(d * SR)
    tt = np.linspace(0, 1, n)
    x = rng.standard_normal(n)
    y = svf_band(x, 300 * (7000 / 300) ** tt, 2.0) * tt ** 2
    f = 180 * (1400 / 180) ** tt
    y += 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR) * tt ** 2
    return norm(y).astype(np.float32)


def buzzer():
    out = []
    for f, d in ((310, 0.13), (205, 0.24)):
        tt = t_(d)
        sq = np.sign(np.sin(2 * np.pi * f * tt)) + 0.6 * np.sign(np.sin(2 * np.pi * f * 1.01 * tt))
        out.append(onepole_lp(sq, 1600) * np.minimum(1, (d - tt) / 0.03))
    return norm(np.concatenate(out)).astype(np.float32)


def thud(d=0.25):
    tt = t_(d)
    f = 50 + 70 * np.exp(-tt / 0.04)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.08)
    nz = onepole_lp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt / 0.015)
    return norm(y + 0.7 * nz).astype(np.float32)


def click():
    tt = t_(0.05)
    y = np.sin(2 * np.pi * 1900 * tt) * np.exp(-tt / 0.006)
    y[:90] += svf_band(rng.standard_normal(90), np.full(90, 3500.0), 1.0) * 2
    return norm(y).astype(np.float32)


def bell(d=1.4):
    tt = t_(d)
    y = 0.0
    for f, a, tau in ((1318.5, 1.0, 0.45), (2637, 0.5, 0.3), (3955, 0.25, 0.18), (1975.5, 0.4, 0.35)):
        y = y + a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau)
    y = y * (1 + 0.25 * np.sin(2 * np.pi * 11 * tt))
    y = y * np.minimum(1, tt / 0.002)
    return norm(y).astype(np.float32)


def shimmer(d=0.8, n=14, seed=0):
    r = np.random.default_rng(seed)
    y = np.zeros(int(d * SR))
    for _ in range(n):
        st = int(r.uniform(0, d * 0.6) * SR)
        f = r.uniform(2400, 6500)
        tt = t_(0.18)
        p = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.05) * r.uniform(0.4, 1)
        e = min(len(y), st + len(p))
        y[st:e] += p[:e - st]
    y *= np.linspace(1, 0.3, len(y))
    return norm(y).astype(np.float32)


def coin(seed=0):
    r = np.random.default_rng(seed)
    tt = t_(0.22)
    y = 0
    for f in (3150, 4210, 5630, 7310):
        f *= r.uniform(0.96, 1.04)
        y = y + np.sin(2 * np.pi * f * tt) * np.exp(-tt / r.uniform(0.04, 0.09))
    y[:30] += r.standard_normal(30) * 0.5
    return norm(y).astype(np.float32)


def chime():
    out = np.zeros(int(1.6 * SR), np.float32)
    for k, f in enumerate((1046.5, 1318.5, 1568, 2093)):
        d = ding(f, 1.2, 0.7)
        st = int(k * 0.07 * SR)
        out[st:st + len(d)] += d[:len(out) - st] * (0.8 if k < 3 else 1.0)
    return norm(out).astype(np.float32)


def rattle(d=0.42):
    y = np.zeros(int(d * SR), np.float32)
    for k in range(int(d * 18)):
        c = tick(1500 + 300 * (k % 2)) * 0.8
        st = int(k / 18 * SR)
        y[st:st + len(c)] += c[:len(y) - st]
    return norm(y).astype(np.float32)


def glitch(d=0.24):
    n = int(d * SR)
    y = rng.standard_normal(n) * 0.5
    gate = (np.sin(2 * np.pi * 26 * np.arange(n) / SR) > 0.2).astype(float)
    y = y * gate * np.linspace(1, 0.2, n)
    y = svf_band(y, np.full(n, 2000.0), 0.8)
    return norm(y).astype(np.float32)


def whomp():
    tt = t_(0.5)
    f = 70 + 260 * np.exp(-tt / 0.06)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.14)
    return norm(y + 0.4 * whoosh(0.5, 300, 1800, 0.25)[:len(y)]).astype(np.float32)


# ------------------------------------------------------------------ SFX timeline
sfx = np.zeros((N, 2), np.float32)


def add(T, snd, gain=0.3, pan=0.0):
    st = int(round(T * SR))
    if st >= N:
        return
    e = min(N, st + len(snd))
    lg = gain * math.cos((pan + 1) * math.pi / 4) * 1.414
    rg = gain * math.sin((pan + 1) * math.pi / 4) * 1.414
    sfx[st:e, 0] += snd[:e - st] * lg
    sfx[st:e, 1] += snd[:e - st] * rg


def B(t):
    return t + HL


W = {d: whoosh(d) for d in (0.35, 0.45, 0.6)}
SW = swish()
# hook
add(0.0, boom(), 0.55)
add(0.0, glitch(), 0.16)
add(0.13, pop(700, 200), 0.18, -0.6); add(0.19, pop(700, 200), 0.18, 0.6)
add(HL - 1.05, riser(1.05), 0.22)
add(HL - 0.12, W[0.35], 0.35)
add(HL, thud(0.3), 0.35)
# main
ev = [
    (0.10, shimmer(0.8, 12, 1), 0.10, -0.4), (0.20, shimmer(0.8, 12, 2), 0.10, 0.4),
    (0.14, SW, 0.18, 0), (0.20, pop(), 0.20, -0.6), (0.30, pop(), 0.20, 0.6), (2.52, SW, 0.12, 0),
    (2.78, W[0.45], 0.22, 0),
    (4.38, boom(0.8), 0.40, 0), (4.40, buzzer(), 0.13, 0), (4.44, pop(600, 180), 0.16, -0.6), (4.49, pop(600, 180), 0.16, 0.6),
    (5.25, SW, 0.18, -0.5), (5.55, SW, 0.18, 0.5), (6.62, SW, 0.18, -0.5), (7.05, SW, 0.18, 0.5),
    (7.76, buzzer(), 0.20, 0), (7.76, thud(), 0.30, 0), (8.12, whoosh(0.45, 1800, 300, 0.3), 0.2, 0),
    (8.40, shimmer(0.9, 16, 3), 0.14, -0.4), (8.40, pop(), 0.20, -0.4), (8.50, pop(1000, 300), 0.18, 0.3),
    (9.62, SW, 0.15, 0), (9.94, ding(1760, 0.8), 0.16, -0.3), (10.12, SW, 0.14, -0.3),
    (11.60, SW, 0.14, 0), (11.72, pop(1100, 400), 0.22, -0.3), (11.74, ding(2093, 0.7), 0.12, -0.3),
    (12.68, pop(500, 150), 0.18, -0.3),
    (13.38, W[0.45], 0.22, 0), (13.45, SW, 0.15, -0.5), (13.47, SW, 0.15, 0.5),
    (14.36, pop(1200, 500), 0.16, 0.5), (14.40, ding(1568), 0.17, -0.4),
    (15.00, SW, 0.15, 0.5), (15.25, pop(500, 120, 0.2), 0.25, 0.5), (15.40, ding(1568), 0.17, -0.4),
    (15.62, pop(1300, 600), 0.10, 0.4), (15.78, pop(1400, 650), 0.10, 0.6), (15.94, pop(1500, 700), 0.10, 0.4), (16.10, pop(1600, 750), 0.10, 0.6),
    (16.42, ding(1568), 0.17, -0.4), (17.25, SW, 0.15, 0.5), (18.66, ding(1760), 0.17, 0.4), (18.66, ding(1568), 0.10, -0.4),
    (19.38, thud(0.3), 0.40, -0.3), (19.80, SW, 0.14, 0),
    (20.08, W[0.45], 0.22, 0), (20.18, whoosh(0.3, 2500, 500, 0.5), 0.18, -0.5), (20.36, thud(0.2), 0.18, -0.5),
    (21.42, SW, 0.12, -0.5), (21.62, W[0.45], 0.22, 0),
    (22.35, whoosh(0.45, 600, 4000, 0.9), 0.12, 0.5), (22.80, ding(2093), 0.16, 0.5),
    (23.16, W[0.45], 0.22, 0), (23.22, SW, 0.14, -0.6), (23.32, SW, 0.14, 0.6), (23.42, SW, 0.12, -0.6), (23.52, SW, 0.12, 0.6),
    (24.84, SW, 0.14, 0), (26.58, whoosh(0.35, 3000, 600, 0.4), 0.14, 0),
    (27.66, whoosh(0.7, 200, 1500, 0.7), 0.20, 0), (28.38, W[0.45], 0.22, 0), (29.30, SW, 0.12, 0),
    (29.43, W[0.45], 0.20, 0), (30.14, chime(), 0.20, 0), (30.16, pop(900, 300), 0.18, -0.4), (30.16, shimmer(1.0, 18, 4), 0.12, -0.4),
    (31.60, SW, 0.12, 0), (31.92, W[0.45], 0.20, 0), (31.98, SW, 0.14, 0.5),
    (33.00, rattle(), 0.12, 0.5), (33.45, click(), 0.22, 0.5), (33.46, shimmer(0.9, 16, 5), 0.14, 0.5),
    (34.16, W[0.45], 0.20, 0), (35.00, SW, 0.14, -0.5), (35.20, pop(1300, 500), 0.12, 0.5),
    (36.36, W[0.45], 0.20, 0), (36.52, ding(1318.5, 1.0), 0.14, 0.5), (36.52, shimmer(0.8, 10, 6), 0.10, 0.5),
    (38.00, whomp(), 0.30, -0.3),
    (39.55, pop(800, 250), 0.22, 0), (40.00, whoosh(0.4, 600, 2500, 0.8), 0.08, 0.4), (40.48, click(), 0.30, 0.1),
    (40.55, pop(1200, 500), 0.14, 0), (40.60, bell(), 0.17, 0.5),
    (41.64, SW, 0.12, 0), (41.68, W[0.45], 0.20, 0), (41.76, pop(), 0.16, -0.6), (41.86, pop(), 0.16, 0.6),
]
for (t, snd, g, p) in ev:
    add(B(t), snd, g, p)
# year counter ticks: one per year change
tt = np.linspace(29.62, 30.16, 2000)
x = (tt - 29.62) / 0.54
v = 2018 + 8 * np.where(x < 0.5, 4 * x ** 3, 1 - (-2 * x + 2) ** 3 / 2)
for k in range(2019, 2027):
    i = np.argmax(v >= k - 1e-6)
    add(B(tt[i]), tick(2200 + 120 * (k - 2018)), 0.14, 0.5)
# star dings
for k, f in enumerate((1046.5, 1318.5, 1568, 2093, 2637)):
    add(B(24.86 + 0.15 + k * 0.13 + 0.06), ding(f, 0.7), 0.12, (k - 2) * 0.25)
# chart bars
for k in range(5):
    add(B(21.78 + k * 0.12 + 0.05), pop(700 + 160 * k, 300 + 80 * k), 0.12, 0.5)
# coins
ci = 0
for (ts, n) in ((34.30, 3), (34.55, 5), (34.85, 8)):
    for k in range(n):
        add(B(ts + k * 0.06 + 0.16), coin(ci), 0.06, 0.5); ci += 1


# ------------------------------------------------------------------ music bed
def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def music():
    bpm = 100; beat = 60 / bpm
    dur = MAIN_LEN + 0.5
    n = int(dur * SR)
    out = np.zeros((n, 2))
    chords = [(53, [65, 69, 72, 76]), (55, [67, 71, 74, 76]), (52, [64, 67, 71, 74]), (57, [64, 69, 72, 76])]
    bar = 4 * beat
    tt_all = np.arange(n) / SR
    # pads
    for ci in range(int(dur / (2 * bar)) + 1):
        root, notes = chords[ci % 4]
        st = ci * 2 * bar
        d = 2 * bar + 0.4
        i0 = int(st * SR); i1 = min(n, int((st + d) * SR))
        if i0 >= n:
            break
        tt = np.arange(i1 - i0) / SR
        env = np.minimum(1, tt / 0.5) * np.minimum(1, (d - tt) / 0.5)
        pad = np.zeros(len(tt))
        for nn in notes:
            for det in (-0.07, 0.0, 0.07):
                f = midi(nn + det)
                w_ = 2 * np.pi * f * tt
                pad += (np.sin(w_) + 0.22 * np.sin(2 * w_) + 0.07 * np.sin(3 * w_)) * 0.33
        pad *= 1 + 0.08 * np.sin(2 * np.pi * 0.25 * tt)
        out[i0:i1, 0] += pad * env * 0.075
        out[i0:i1, 1] += pad * env * 0.075
        # sub bass (half notes)
        bass = np.sin(2 * np.pi * midi(root - 12) * tt) * env
        out[i0:i1] += (bass * 0.20)[:, None]
    # pluck arpeggio (8ths)
    step = beat / 2
    k = 0
    while k * step < dur:
        st = k * step
        root, notes = chords[int(st / (2 * bar)) % 4]
        nn = notes[[0, 2, 1, 3, 2, 1, 3, 2][k % 8]] + 12
        tt = t_(0.5)
        pl = (np.sin(2 * np.pi * midi(nn) * tt) + 0.3 * np.sin(4 * np.pi * midi(nn) * tt)) * np.exp(-tt / 0.16)
        i0 = int(st * SR); i1 = min(n, i0 + len(pl))
        pan = 0.35 if k % 2 else -0.35
        out[i0:i1, 0] += pl[:i1 - i0] * 0.07 * (1 - pan)
        out[i0:i1, 1] += pl[:i1 - i0] * 0.07 * (1 + pan)
        k += 1
    # kick + hat
    kk = 0
    while kk * beat < dur:
        st = kk * beat
        i0 = int(st * SR)
        if kk % 2 == 0:
            tt = t_(0.3)
            f = 45 + 110 * np.exp(-tt / 0.03)
            kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.11)
            i1 = min(n, i0 + len(kick)); out[i0:i1] += (kick[:i1 - i0] * 0.38)[:, None]
        else:
            tt = t_(0.18)
            snap = onepole_lp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt / 0.05)
            i1 = min(n, i0 + len(snap)); out[i0:i1] += (snap[:i1 - i0] * 0.10)[:, None]
        hs = int((st + beat / 2) * SR)
        tt = t_(0.04)
        hat = rng.standard_normal(len(tt)) * np.exp(-tt / 0.008)
        hat = hat - onepole_lp(hat, 7000)
        i1 = min(n, hs + len(hat))
        if hs < n:
            out[hs:i1] += (hat[:i1 - hs] * 0.035)[:, None]
        kk += 1
    out *= np.minimum(1, np.maximum(0, (MAIN_LEN - tt_all) / 1.2))[:, None]
    return (out / (np.max(np.abs(out)) + 1e-9)).astype(np.float32)


mus = np.zeros((N, 2), np.float32)
mb = music()
mus[o:o + len(mb)] += mb[:N - o]

# ducking: follow voice envelope
venv = np.abs(voice).max(1)
win = int(0.05 * SR)
venv = np.convolve(venv, np.ones(win) / win, 'same')
venv = venv / (np.percentile(venv, 95) + 1e-9)
duck = 1 - 0.55 * np.clip(venv * 1.6, 0, 1)
duck = np.convolve(duck, np.ones(int(0.15 * SR)) / int(0.15 * SR), 'same')

vpk = np.percentile(np.abs(voice), 99.5)
voice_n = voice / (vpk + 1e-9) * 0.5
MUSIC_GAIN = 0.12
mix_music = voice_n + sfx * 0.5 + mus * MUSIC_GAIN * duck[:, None]
mix_nomusic = voice_n + sfx * 0.5


def write(p, x):
    x = np.clip(x, -1, 1)
    w = wave.open(p, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()


write(f"{S}/out/mix_music.wav", mix_music / max(1, np.abs(mix_music).max() / 0.95))
write(f"{S}/out/mix_nomusic.wav", mix_nomusic / max(1, np.abs(mix_nomusic).max() / 0.95))
write(f"{S}/out/sfx_only.wav", sfx * 0.5)
write(f"{S}/out/music_only.wav", mus * 0.5)
print("ok", TOTAL, N / SR)
