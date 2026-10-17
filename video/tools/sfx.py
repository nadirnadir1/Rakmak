"""Synthesises the sound effects and mixes them under the voice -> assets/mix.wav"""
import sys, subprocess
import numpy as np
import soundfile as sf

SR = 48000
DUR = 45.2
rng = np.random.default_rng(7)
mix = np.zeros((int(SR * DUR), 2), np.float32)

def t_(d): return np.arange(int(SR * d)) / SR

def env(n, a, d):
    """attack a sec, exponential decay d sec"""
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
    return e

def lp(x, cut):
    """one-pole lowpass; cut can be array"""
    cut = np.broadcast_to(np.asarray(cut, float), x.shape)
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y

def hp(x, cut): return x - lp(x, cut)

def add(t0, sig, gain_db=-12, pan=0.0):
    g = 10 ** (gain_db / 20)
    if sig.ndim == 1:
        l = sig * np.sqrt(0.5 * (1 - pan)); r = sig * np.sqrt(0.5 * (1 + pan))
        sig = np.stack([l, r], 1) * np.sqrt(2)
    i0 = int(t0 * SR)
    if i0 >= len(mix): return
    n = min(len(sig), len(mix) - i0)
    mix[i0:i0 + n] += sig[:n] * g

def norm(x): return x / (np.max(np.abs(x)) + 1e-9)

# ---------------- generators ----------------
def tone(f, d, a=0.004, dec=0.4, partials=((1, 1),)):
    t = t_(d); s = sum(w * np.sin(2 * np.pi * f * k * t) for k, w in partials)
    return norm(s) * env(len(t), a, dec)

def chime():
    p = ((1, 1), (2, .35), (3, .12), (4.2, .05))
    a = tone(988, 1.6, 0.003, 0.55, p); b = tone(784, 1.8, 0.003, 0.7, p)
    out = np.zeros(int(SR * 2.4)); out[:len(a)] += a; out[int(.42 * SR):int(.42 * SR) + len(b)] += b
    return norm(out)

def whoosh(d=0.6, f0=300, f1=4000, peak=0.55):
    n = int(SR * d); t = np.arange(n) / n
    x = rng.standard_normal(n)
    cut = f0 * (f1 / f0) ** t
    y = lp(x, cut); y = hp(y, 120)
    e = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak)) ** 1.5)
    s = norm(y * e)
    pan = np.linspace(-0.8, 0.8, n)
    return np.stack([s * np.sqrt(0.5 * (1 - pan)), s * np.sqrt(0.5 * (1 + pan))], 1) * np.sqrt(2)

def pop(f0=900, f1=260, d=0.12):
    t = t_(d); f = f1 + (f0 - f1) * np.exp(-t / 0.018)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return norm(np.sin(ph)) * env(len(t), 0.002, 0.04)

def clink(base=2600):
    t = t_(0.35)
    s = sum(np.sin(2 * np.pi * base * r * t + rng.uniform(0, 6)) * w * np.exp(-t / dd) for r, w, dd in ((1, 1, .08), (1.47, .7, .06), (2.09, .5, .05), (2.76, .3, .04)))
    return norm(s) * env(len(t), 0.001, 0.12)

def thud(f0=140, f1=45, d=0.45):
    t = t_(d); f = f1 + (f0 - f1) * np.exp(-t / 0.03)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.14)
    n = lp(rng.standard_normal(len(t)), 1800) * env(len(t), 0.001, 0.02) * 3
    return norm(np.tanh(1.6 * (s + n)))

def boom():
    t = t_(1.6); f = 32 + 110 * np.exp(-t / 0.08)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.003, 0.45)
    n = lp(rng.standard_normal(len(t)), 900) * env(len(t), 0.001, 0.12) * 2.2
    return norm(np.tanh(2.2 * (s + n)))

def shutter():
    out = np.zeros(int(SR * 0.16))
    for off, d in ((0, .018), (0.055, .03)):
        n = int(SR * d); c = hp(rng.standard_normal(n), 1500) * env(n, 0.0005, d / 3)
        out[int(off * SR):int(off * SR) + n] += c
    return norm(out)

def twinkle(n=6, d=0.07, lo=2200, hi=4200):
    notes = np.linspace(lo, hi, n)
    out = np.zeros(int(SR * (n * d + 0.6)))
    for i, f in enumerate(notes):
        s = tone(f, 0.5, 0.002, 0.12, ((1, 1), (2.01, .2)))
        o = int(i * d * SR); out[o:o + len(s)] += s * (0.6 + 0.4 * i / n)
    return norm(out)

def marimba(f, d=0.6):
    return tone(f, d, 0.002, 0.18, ((1, 1), (4.0, .25), (9.9, .05)))

def tick():
    n = int(SR * 0.03); return norm(hp(rng.standard_normal(n), 3000) * env(n, 0.0005, 0.006))

def jet(d=1.7):
    n = int(SR * d); t = np.arange(n) / n
    y = lp(rng.standard_normal(n), 300 + 1500 * np.sin(np.pi * t)); y = hp(y, 80)
    e = np.sin(np.pi * t) ** 1.5
    s = norm(y * e); pan = np.linspace(0.7, -0.9, n)
    return np.stack([s * np.sqrt(0.5 * (1 - pan)), s * np.sqrt(0.5 * (1 + pan))], 1) * np.sqrt(2)

def swish(d=0.28): return whoosh(d, 800, 7000, 0.4)

# pentatonic-ish scale (C major pentatonic around 523 Hz)
SC = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5]

# ---------------- cue sheet ----------------
add(0.00, chime(), -17)
add(0.05, whoosh(0.5, 400, 3000, 0.7), -24)
add(0.62, pop(700, 200), -20)                       # calendar lands
add(0.32, pop(1000, 400), -22, -0.4)                 # jar
for i in range(5): add(0.72 + i * 0.27, swish(0.18), -30, 0.2)   # page flips
for i in range(7): add(0.87 + i * 0.22, clink(2400 + 140 * i), -24, -0.4)
add(2.25, whoosh(0.45, 300, 3500, 0.6), -24, -0.5)
add(2.6, pop(800, 300), -20, -0.4)
add(2.45, pop(1100, 500), -24, 0.4); add(2.8, pop(1100, 500), -24, -0.4)
add(3.22, whoosh(1.0, 250, 5000, 0.5), -17)          # zellige wipe
add(3.75, pop(600, 180), -20)
for i in range(4): add(4.45 + i * 0.16, pop(1300 - i * 80, 600), -24, [-.6, .6, -.6, .6][i])
add(6.08, swish(0.2), -24)
add(6.28, thud(), -15)
for i in range(6): add(6.32 + i * 0.05, clink(2800 + 200 * i), -28, rng.uniform(-.6, .6))
add(7.28, whoosh(0.6, 400, 6000, 0.7), -20)          # star iris
add(7.47, twinkle(7, 0.06), -26)
add(8.25, whoosh(0.7, 200, 1500, 0.4), -26)
add(8.55, pop(500, 150, 0.2), -20, 0.4)
add(8.9, pop(1000, 400), -24, -0.2)
add(9.3, whoosh(0.4, 400, 3000, 0.5), -26)
for i in range(6): add(9.55 + i * 0.22, tick(), -26)
add(9.5, jet(1.8), -19)
add(10.95, whoosh(0.45, 300, 4500, 0.5), -18)
for i, t in enumerate([11.08, 12.12, 13.26]):
    add(t, whoosh(0.35, 500, 5000, 0.6), -22, [-.6, .6, -.6][i]); add(t + 0.3, marimba(SC[i * 2 + 1]), -20)
add(14.3, jet(1.1), -14)                              # big fly-by
add(14.95, whoosh(0.6, 200, 2000, 0.4), -24)
for i in range(10): add(15.88 + i * 0.035, tick(), -26, -0.8 + i * 0.16)
add(16.2, pop(900, 300), -22); add(16.2, twinkle(6, 0.05, 2600, 4800), -26)
add(17.0, swish(0.4), -22); add(17.3, marimba(SC[4]), -22)
add(18.55, whoosh(0.5, 300, 4000, 0.6), -18)
for i in range(5): add(18.75 + i * 0.25 + 0.45, thud(400, 120, 0.2), -24, [-.5, .5, -.5, .5, 0][i])
add(20.25, pop(500, 900, 0.15), -22, 0.6)
add(20.75, pop(1200, 400), -22, -0.6)
add(20.86, shutter(), -16, -0.5); add(21.3, shutter(), -16, -0.5)
for i in range(5): add(20.95 + i * 0.12, pop(1400, 900, 0.08), -30, rng.uniform(-.6, .6))
add(21.95, whoosh(0.22, 2000, 300, 0.8), -22)
add(22.17, boom(), -14)
add(22.45, whoosh(0.5, 4000, 400, 0.3), -22)
add(22.6, twinkle(5, 0.05, 1800, 3600), -28)
add(23.3, twinkle(8, 0.06, 2400, 5200), -24)
add(23.92, whoosh(0.5, 300, 2500, 0.5), -28)
for i, (t, c) in enumerate([(24.33, 24.75), (25.08, 25.45), (25.8, 26.2), (26.88, 27.8)]):
    add(t, swish(0.25), -27, 0.6); add(c, marimba(SC[2 + i]), -18)
add(28.3, whoosh(0.55, 400, 6000, 0.75), -20)
add(28.45, twinkle(8, 0.05, 2200, 5000), -22); add(28.5, pop(700, 250), -20)
add(29.22, swish(0.2), -26); add(29.55, pop(500, 160, 0.18), -18)
add(29.72, whoosh(0.45, 900, 3500, 0.5), -28)
add(29.95, whoosh(0.6, 200, 2200, 0.4), -24, 0.6); add(30.05, whoosh(0.6, 200, 1800, 0.4), -26, -0.4)
for i, t in enumerate([30.6, 31.0, 31.4, 31.85, 32.41, 32.66]): add(t, marimba(SC[i + 1]), -17, -0.4 + i * 0.12)
add(32.85, twinkle(8, 0.05, 2600, 5600), -20); add(32.9, pop(900, 300), -22)
add(33.0, whoosh(0.9, 250, 6000, 0.55), -16)       # ripple wipe
add(33.78, twinkle(10, 0.045, 1500, 4500), -20)
for i in range(3): add(34.36 + i * 0.1, thud(220, 90, 0.25), -18, -0.3 + i * 0.3)
add(34.5, swish(0.4), -26)
add(34.6, chime(), -20)
add(35.1, twinkle(6, 0.05, 3000, 5500), -28)
add(35.45, whoosh(0.3, 3000, 500, 0.6), -26); add(35.95, pop(600, 200), -20)
add(36.0, swish(0.4), -24)
add(37.0, pop(800, 300), -20, -0.5); add(37.38, pop(900, 320), -20, 0.5)
add(37.18, marimba(SC[3]), -24, -0.5); add(37.56, marimba(SC[5]), -24, 0.5)
add(38.6, whoosh(0.45, 300, 4500, 0.5), -18)
add(38.85, whoosh(0.6, 200, 1500, 0.4), -26); add(39.4, thud(260, 110, 0.25), -24)
add(40.12, whoosh(0.4, 300, 2500, 0.5), -26); add(40.3, pop(900, 300), -22)
for j in range(21): add(40.45 + j * 0.04, pop(1500 + 30 * j, 900, 0.05), -31, rng.uniform(-.5, .5))
add(41.2, twinkle(3, 0.08, 2000, 2600), -26)
add(41.36, whoosh(0.4, 4000, 300, 0.4), -24)
add(41.5, whoosh(0.7, 200, 3500, 0.55), -18)
add(42.15, twinkle(8, 0.05, 2200, 5000), -24)
for i in range(3): add(41.95 + i * 0.22, marimba(SC[3 + i * 2]), -20)
add(43.2, pop(700, 220), -18); add(43.25, chime(), -18)
add(43.35, whoosh(0.8, 2000, 7000, 0.5), -32); add(44.35, whoosh(0.8, 2000, 7000, 0.5), -32)

# ---------------- voice + master ----------------
voice, vsr = sf.read(sys.argv[1], dtype='float32')
if voice.ndim > 1: voice = voice.mean(1)
if vsr != SR:
    import math
    x_old = np.arange(len(voice)) / vsr
    x_new = np.arange(int(len(voice) * SR / vsr)) / SR
    voice = np.interp(x_new, x_old, voice).astype(np.float32)
voice = voice / (np.max(np.abs(voice)) + 1e-9) * 0.89
out = mix.copy()
out[:len(voice), 0] += voice; out[:len(voice), 1] += voice
fade = int(SR * 0.4); out[-fade:] *= np.linspace(1, 0, fade)[:, None]
peak = np.max(np.abs(out))
if peak > 0.97: out *= 0.97 / peak
sf.write(sys.argv[2], out, SR, subtype='PCM_24')
print('sfx peak', float(np.max(np.abs(mix))), 'mix peak', float(np.max(np.abs(out))))
