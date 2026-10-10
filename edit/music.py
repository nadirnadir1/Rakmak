"""Procedural cinematic/EDM track synced to the edit. 128 BPM, 23 bars.
Sections (bars): 0-1 hook, 2-5 build, 6-19 drop (12 = mini break), 20-22 outro."""
import numpy as np
from scipy import signal
import sys, wave

SR = 44100
BPM = 128.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
NBARS = 23
TAIL = 2.5
N = int((NBARS * BAR + TAIL) * SR)
rng = np.random.default_rng(7)

def t_(sec):
    return np.arange(int(sec * SR)) / SR

def place(buf, x, at):
    i = int(round(at * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    if buf.ndim == 2:
        buf[i:j] += x[: j - i]
    else:
        buf[i:j] += x[: j - i]

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)

def polyblep_saw(freq, dur, phase0=0.0):
    n = int(dur * SR)
    dt = freq / SR
    ph = (phase0 + dt * np.arange(n)) % 1.0
    y = 2 * ph - 1
    # polyBLEP
    m = ph < dt
    x = ph[m] / dt
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt
    y[m] -= x * x + x + x + 1
    return y

def sos_lp(fc, order=2):
    return signal.butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos")

def sos_hp(fc, order=2):
    return signal.butter(order, fc, "high", fs=SR, output="sos")

def sos_bp(lo, hi, order=2):
    return signal.butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos")

def sweep_filter(x, fc_curve, kind="low", block=256):
    """Time-varying filter: fc_curve gives cutoff per sample."""
    y = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        fc = float(fc_curve[min(s, len(fc_curve) - 1)])
        if kind == "low":
            sos = sos_lp(fc)
        else:
            sos = sos_hp(max(fc, 20))
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[s : s + block], zi = signal.sosfilt(sos, x[s : s + block], zi=zi)
    return y

def env_adsr(n, a=0.005, d=0.1, s=0.7, r=0.1, sus_len=None):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    if sus_len is None:
        sus_len = max(0, n - a_n - d_n - r_n)
    e = np.concatenate([
        np.linspace(0, 1, a_n, endpoint=False),
        np.linspace(1, s, d_n, endpoint=False),
        np.full(sus_len, s),
        np.linspace(s, 0, r_n),
    ])
    if len(e) < n:
        e = np.pad(e, (0, n - len(e)))
    return e[:n]

def reverb_ir(sec=2.2, decay=3.0, bright=6000):
    n = int(sec * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-decay * np.arange(n) / SR * (5.0 / sec))[:, None]
    ir = signal.sosfilt(sos_lp(bright), ir, axis=0)
    ir[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
    return ir / np.sqrt((ir ** 2).sum(axis=0))

def reverb(x, wet=0.3, **kw):
    ir = reverb_ir(**kw)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    w = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], 1)
    return x * (1 - wet) + w * wet

def stereo(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l, x * r], 1)

# ---------------------------------------------------------------- instruments
def kick(level=1.0):
    d = 0.45
    t = t_(d)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = signal.sosfilt(sos_hp(2500), rng.standard_normal(len(t))) * np.exp(-t * 300) * 0.35
    k = np.tanh(2.2 * (body + click)) * 0.9
    return k * level

def clap(level=1.0):
    d = 0.5
    t = t_(d)
    n = signal.sosfilt(sos_bp(900, 5000), rng.standard_normal(len(t)))
    e = np.zeros_like(t)
    for off in (0.0, 0.011, 0.022):
        e += np.where(t >= off, np.exp(-(t - off) * 140), 0)
    e += np.where(t >= 0.03, np.exp(-(t - 0.03) * 16), 0) * 0.6
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4
    return (n * e * 0.55 + tone) * level

def hat(open_=False, level=1.0):
    d = 0.35 if open_ else 0.06
    t = t_(d)
    n = signal.sosfilt(sos_hp(7500), rng.standard_normal(len(t)))
    e = np.exp(-t * (9 if open_ else 70))
    return n * e * 0.28 * level

def crash(level=1.0):
    d = 2.5
    t = t_(d)
    n = signal.sosfilt(sos_hp(4000), rng.standard_normal(len(t)))
    return n * np.exp(-t * 1.6) * 0.3 * level

def impact(level=1.0):
    d = 3.0
    t = t_(d)
    f = 30 + 90 * np.exp(-t * 6)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    nz = signal.sosfilt(sos_lp(2500), rng.standard_normal(len(t))) * np.exp(-t * 5) * 0.5
    return np.tanh(1.8 * (boom + nz)) * 0.9 * level

def riser(dur, level=1.0, f0=300, f1=9000):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    curve = f0 * (f1 / f0) ** (np.linspace(0, 1, n) ** 1.6)
    y = sweep_filter(x, curve, "low")
    y = sweep_filter(y, curve * 0.25, "high")
    amp = np.linspace(0, 1, n) ** 2.2
    # pitch riser
    pf = 200 * (8 ** np.linspace(0, 1, n) ** 2)
    tone = polyblep_saw(1, dur) * 0  # placeholder for shape
    tone = np.sin(2 * np.pi * np.cumsum(pf) / SR) * 0.15
    return (y * 0.5 + tone) * amp * level

def downlifter(dur=1.5, level=1.0):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    curve = 9000 * (200 / 9000) ** np.linspace(0, 1, n)
    y = sweep_filter(x, curve, "low")
    return y * np.exp(-np.linspace(0, 4, n)) * 0.5 * level

def whoosh(dur=1.2, level=1.0):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    u = np.linspace(0, 1, n)
    curve = 400 + 6000 * np.sin(np.pi * u) ** 2
    y = sweep_filter(x, curve, "low")
    amp = np.sin(np.pi * u) ** 1.5
    st = np.stack([y * amp * (1 - u), y * amp * u], 1) * 1.4  # pans L->R like a fly-by
    return st * 0.5 * level

def supersaw(notes, dur, voices=7, detune=0.18, fc=None):
    out = np.zeros((int(dur * SR), 2))
    for n_ in notes:
        f = midi(n_)
        for v in range(voices):
            dv = (v - (voices - 1) / 2) / ((voices - 1) / 2)
            fv = f * 2 ** (dv * detune / 12)
            s = polyblep_saw(fv, dur, rng.random())
            out += stereo(s, pan=dv * 0.8) / voices
    out /= max(1, len(notes))
    if fc is not None:
        out = signal.sosfilt(sos_lp(fc), out, axis=0)
    return out

def pluck(note, dur=0.3, bright=4000):
    t = t_(dur)
    s = polyblep_saw(midi(note), dur) * 0.6 + np.sign(np.sin(2 * np.pi * midi(note) * t)) * 0.3
    curve = 300 + bright * np.exp(-t * 18)
    s = sweep_filter(s, curve, "low", block=128)
    return s * np.exp(-t * 6)

def bass_note(note, dur):
    t = t_(dur)
    f = midi(note)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)
    s = np.tanh(1.5 * s) * env_adsr(len(t), 0.004, 0.08, 0.85, 0.05)
    return s * 0.55

def pad(notes, dur, fc=1800):
    out = supersaw(notes, dur, voices=5, detune=0.12, fc=fc)
    return out * env_adsr(int(dur * SR), 0.25, 0.3, 0.9, 0.4)[:, None]

# ---------------------------------------------------------------- arrangement
# Am - F - C - G  (root midi notes)
PROG = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [48, 52, 55]), (55, [55, 59, 62])]
LEAD = [  # 8th-note arp pattern per chord (relative scale steps)
    [69, 72, 76, 72, 79, 76, 72, 76],
    [65, 69, 72, 69, 77, 72, 69, 72],
    [64, 67, 72, 67, 76, 72, 67, 72],
    [62, 67, 71, 67, 74, 71, 67, 71],
]

drums = np.zeros((N, 2))
bass = np.zeros((N, 2))
chords = np.zeros((N, 2))
lead = np.zeros((N, 2))
fx = np.zeros((N, 2))
pads = np.zeros((N, 2))

HOOK = range(0, 2)
BUILD = range(2, 6)
DROP = range(6, 20)
BREAK = {12}
OUTRO = range(20, 23)

def bt(bar, beat=0.0):
    return bar * BAR + beat * BEAT

for bar in range(NBARS):
    root, ch = PROG[bar % 4]
    full = (bar in HOOK) or (bar in DROP and bar not in BREAK)
    if full:
        for b in range(4):
            place(drums, stereo(kick(1.0)), bt(bar, b))
            place(drums, stereo(hat(True, 0.55), 0.2), bt(bar, b + 0.5))
            for s16 in range(4):
                place(drums, stereo(hat(False, 0.5 if s16 % 2 else 0.28), -0.3), bt(bar, b + s16 * 0.25))
        place(drums, stereo(clap(0.9)), bt(bar, 1))
        place(drums, stereo(clap(0.9)), bt(bar, 3))
        # rolling bass: offbeat 8ths with octave jumps
        for e in range(8):
            n_ = root - 12 + (12 if e % 4 == 3 else 0)
            place(bass, stereo(bass_note(n_, BEAT / 2 * 0.95)), bt(bar, e * 0.5))
        place(chords, supersaw(ch + [ch[0] + 12], BAR, fc=5500) * 0.55, bt(bar))
        for e, n_ in enumerate(LEAD[bar % 4]):
            place(lead, stereo(pluck(n_ + 12, 0.35), 0.15 if e % 2 else -0.15) * 0.5, bt(bar, e * 0.5))
    if bar in BUILD:
        k = bar - 2
        fc = 500 + 900 * k
        place(pads, pad(ch + [ch[0] - 12], BAR + 0.3, fc=fc) * 0.95, bt(bar))
        place(drums, stereo(kick(0.6)), bt(bar, 0))
        place(drums, stereo(kick(0.6)), bt(bar, 2))
        for e in range(8):
            place(lead, stereo(pluck(LEAD[bar % 4][e], 0.3, bright=1200 + 700 * k)) * 0.35, bt(bar, e * 0.5))
        # snare roll last two bars
        if bar == 4:
            for e in range(8):
                place(drums, stereo(clap(0.25 + 0.05 * e)), bt(bar, e * 0.5))
        if bar == 5:
            for e in range(12):  # 3 beats of 16ths then silence on beat 4
                place(drums, stereo(clap(0.4 + 0.04 * e)), bt(bar, e * 0.25))
    if bar in BREAK:
        place(pads, pad(ch + [ch[0] + 12], BAR + 0.3, fc=2500) * 0.6, bt(bar))
        for e in range(8):
            place(lead, stereo(pluck(LEAD[bar % 4][e] + 12, 0.4, bright=2500)) * 0.4, bt(bar, e * 0.5))
    if bar in OUTRO:
        place(pads, pad(ch + [ch[0] + 12, ch[0] - 12], BAR + 0.5, fc=2200) * 0.7, bt(bar))
        for e in range(8):
            if e % 2 == 0 or bar < 22:
                place(lead, stereo(pluck(LEAD[bar % 4][e] + 12, 0.5, bright=2000)) * 0.35 * (1 - 0.25 * (bar - 20)), bt(bar, e * 0.5))
        if bar < 22:
            place(drums, stereo(kick(0.5)), bt(bar, 0))
            place(drums, stereo(kick(0.5)), bt(bar, 2))

# last bar of outro ends on a held Am chord with final impact
place(pads, pad([57, 60, 64, 69, 45], 3.5, fc=2000) * 0.7, bt(22))

# FX ------------------------------------------------------------------------
place(fx, stereo(impact(1.0)), 0.0)
place(fx, stereo(crash(1.0)), 0.0)
place(fx, stereo(downlifter(1.6)), bt(1, 2))
place(fx, stereo(riser(BAR * 2 - BEAT, 1.3)), bt(4))
place(fx, stereo(impact(1.0)), bt(6))
place(fx, stereo(crash(1.0)), bt(6))
place(fx, stereo(riser(BAR - BEAT * 0.5, 0.6)), bt(12))
place(fx, stereo(impact(0.9)), bt(13))
place(fx, stereo(crash(0.9)), bt(13))
for b in (8, 10, 16, 18):
    place(fx, stereo(crash(0.6)), bt(b))
place(fx, stereo(downlifter(2.0, 0.8)), bt(20))
place(fx, stereo(impact(0.8)), bt(22, 2))
# jet fly-by whooshes on some shot changes
for at in (bt(2), bt(4), bt(8, -1.0), bt(10, -1.0), bt(14, -1.2), bt(18, -1.0), bt(20, -0.8)):
    place(fx, whoosh(1.4, 0.9), at)

# countdown hits on beats 1,2,3 of bar 5 (3-2-1)
for b in range(3):
    t = t_(0.25)
    blip = np.sin(2 * np.pi * (880 + 220 * b) * t) * np.exp(-t * 18) * 0.35
    place(fx, stereo(blip), bt(5, b))

# ---------------------------------------------------------------- mixing
# sidechain envelope from kick positions in full sections
sc = np.ones(N)
for bar in range(NBARS):
    full = (bar in HOOK) or (bar in DROP and bar not in BREAK)
    if not full:
        continue
    for b in range(4):
        i = int(bt(bar, b) * SR)
        L = int(BEAT * SR)
        tt = np.arange(L) / SR
        seg = 1 - 0.75 * np.exp(-tt * 14)
        j = min(N, i + L)
        sc[i:j] = np.minimum(sc[i:j], seg[: j - i])
sc = sc[:, None]

chords = reverb(chords, 0.25, sec=1.8) * sc
lead = reverb(lead, 0.3, sec=2.0)
# simple stereo ping-pong delay on lead (dotted 8th)
dly = int(BEAT * 0.75 * SR)
ld = np.zeros_like(lead)
ld[dly:, 1] += lead[:-dly, 0] * 0.35
ld[2 * dly:, 0] += lead[:-2 * dly, 1] * 0.2
lead = (lead + ld) * sc
pads = reverb(pads, 0.4, sec=3.0) * (0.6 + 0.4 * sc)
bass = signal.sosfilt(sos_lp(900), bass, axis=0) * sc
fx = reverb(fx, 0.2, sec=2.5)
drums = drums + reverb(drums, 1.0, sec=0.8) * 0.08

mix = drums * 0.9 + bass * 0.85 + chords * 0.42 + lead * 0.5 + pads * 0.5 + fx * 0.8
mix = signal.sosfilt(sos_hp(25), mix, axis=0)
mix = mix * 0.75 + signal.sosfilt(sos_lp(9000), mix, axis=0) * 0.25
# master fade at very end
fade = np.ones(N)
fe = int((NBARS * BAR + TAIL) * SR)
fs = int((NBARS * BAR - 0.5) * SR)
fade[fs:fe] = np.linspace(1, 0, fe - fs) ** 1.5
mix *= fade[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.6) / np.tanh(1.6) * 0.95

out = sys.argv[1]
pcm = (mix * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out, len(mix) / SR, "s")
