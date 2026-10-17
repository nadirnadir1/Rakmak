"""Synthesize a music bed + sound effects synced to the animation, then mix under the voice.
usage: python3 audio.py voice.wav out.wav
"""
import sys, numpy as np
from scipy import signal

SR = 48000
DUR = 48.0
N = int(SR * DUR)
rng = np.random.default_rng(7)


def t_arr(d):
    return np.arange(int(SR * d)) / SR


def place(buf, x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= buf.shape[1] or i + len(x) <= 0:
        return
    j = min(buf.shape[1], i + len(x))
    s = max(0, -i)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i + s:j] += x[s:j - i] * gain * l * 1.414
    buf[1, i + s:j] += x[s:j - i] * gain * r * 1.414


def lp(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low', output='sos')
    return signal.sosfilt(sos, x)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc / (SR / 2), 'high', output='sos')
    return signal.sosfilt(sos, x)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos')
    return signal.sosfilt(sos, x)


def env(n, a, d, curve=4.0):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    tail = np.arange(n - na) / SR
    e[na:] = np.exp(-tail * curve / max(d, 1e-3))
    return e


def reverb(st, seconds=2.4, mix=0.25):
    n = int(SR * seconds)
    out = np.zeros_like(st)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 6.9 / seconds)
        ir = lp(ir, 6000)
        ir /= np.sqrt((ir ** 2).sum())
        out[ch] = signal.fftconvolve(st[ch], ir)[:st.shape[1]]
    return st * (1 - mix) + out * mix * 1.2


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


# ---------------- music ----------------
BPM = 100
BEAT = 60 / BPM
BAR = BEAT * 4
# A minor -> F -> C -> G  (vi IV I V in C)
PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
ROOT = [45, 41, 48, 43]

music = np.zeros((2, N))
pad = np.zeros((2, N))
# Pad: detuned saw chords, one chord per bar (2.4s)
nbars = int(DUR / BAR) + 1
for b in range(nbars):
    t0 = b * BAR
    chord = PROG[b % 4]
    d = BAR + 0.6
    tt = t_arr(d)
    for k, note in enumerate(chord + [chord[0] + 12]):
        for det, pan in [(-0.08, -0.6), (0.0, 0.0), (0.09, 0.6)]:
            f = midi(note + det)
            saw = 2 * ((tt * f + rng.random()) % 1) - 1
            e = np.minimum(1, tt / 0.5) * np.minimum(1, (d - tt) / 0.6)
            place(pad, saw * e * 0.035, t0, pan=pan)
# filter the pad: darker at start, opens up after the drop
cut = np.interp(np.arange(N) / SR, [0, 14, 18.4, 22.0, 22.6, 33, 40, 46, 48], [700, 1100, 1600, 2600, 900, 2200, 2600, 1400, 600])
for ch in range(2):
    # block-wise variable lowpass
    out = np.zeros(N)
    blk = 2400
    zi = None
    for i in range(0, N, blk):
        b_, a_ = signal.butter(2, cut[i] / (SR / 2), 'low')
        if zi is None:
            zi = signal.lfilter_zi(b_, a_) * 0
        out[i:i + blk], zi = signal.lfilter(b_, a_, pad[ch, i:i + blk], zi=zi)
    pad[ch] = out

# Pluck arpeggio (8th notes) - starts at 3.7
pl = np.zeros((2, N))
pattern = [0, 1, 2, 3, 2, 1, 2, 3]
for b in range(nbars):
    chord = PROG[b % 4] + [PROG[b % 4][0] + 12]
    for s in range(8):
        tt0 = b * BAR + s * BEAT / 2
        if tt0 < 3.7 or 21.95 < tt0 < 22.6 or tt0 > 44.5:
            continue
        note = chord[pattern[s]] + 12
        tt = t_arr(0.5)
        f = midi(note)
        x = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt) + 0.12 * np.sin(6 * np.pi * f * tt)) * np.exp(-tt * 9)
        g = 0.05 if tt0 < 22 else 0.065
        place(pl, x, tt0, g, pan=0.45 if s % 2 else -0.45)

# Drums from the drop (22.6) to 44.4, lighter hats before
dr = np.zeros((2, N))
kick_t = t_arr(0.45)
kick = np.sin(2 * np.pi * np.cumsum(55 + 110 * np.exp(-kick_t * 30)) / SR) * np.exp(-kick_t * 7)
hat_n = hp(rng.standard_normal(int(SR * 0.06)), 7000) * np.exp(-t_arr(0.06) * 70)
clap_n = bp(rng.standard_normal(int(SR * 0.25)), 900, 4000) * np.exp(-t_arr(0.25) * 18)
first_beat = np.ceil(22.6 / BEAT) * BEAT
b = first_beat
k = 0
while b < 44.4:
    if not (32.95 < b < 33.9):  # little break before the logo
        place(dr, kick, b, 0.55)
        if k % 2 == 1:
            place(dr, clap_n, b, 0.12)
    place(dr, hat_n, b + BEAT / 2, 0.06, pan=0.3)
    b += BEAT
    k += 1
# soft hats in the first half
b = 3.6
while b < 21.9:
    place(dr, hat_n, b + BEAT / 2, 0.025, pan=-0.3)
    b += BEAT
# sub bass after the drop
bass = np.zeros((2, N))
for bi in range(nbars):
    t0 = bi * BAR
    if t0 + BAR < 22.6 or t0 > 44.4:
        continue
    for s in range(4):
        tb = t0 + s * BEAT
        if tb < 22.6 or tb > 44.4 or 32.95 < tb < 33.9:
            continue
        tt = t_arr(BEAT * 0.9)
        f = midi(ROOT[bi % 4] - 12 + 12)
        x = np.tanh(1.5 * np.sin(2 * np.pi * f * tt)) * np.minimum(1, tt / 0.01) * np.exp(-tt * 3)
        place(bass, x, tb, 0.10)

music = reverb(pad + pl, 2.8, 0.35) + dr + bass

# ---------------- sfx ----------------
fx = np.zeros((2, N))


def whoosh(d=0.6, f0=300, f1=4000, rev=False):
    n = int(SR * d)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blk = 480
    for i in range(0, n, blk):
        q = i / n
        fc = f0 * (f1 / f0) ** q
        b_, a_ = signal.butter(2, [max(40, fc * 0.6) / (SR / 2), min(SR / 2 - 100, fc * 1.6) / (SR / 2)], 'band')
        out[i:i + blk] = signal.lfilter(b_, a_, x[i:i + blk])
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    out = out * e
    return out[::-1] if rev else out


def thump(d=0.35, f=70, noise=0.4):
    tt = t_arr(d)
    x = np.sin(2 * np.pi * np.cumsum(f + 90 * np.exp(-tt * 40)) / SR) * np.exp(-tt * 12)
    x += lp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt * 40) * noise
    return x


def click(d=0.03, fc=3000):
    tt = t_arr(d)
    return bp(rng.standard_normal(len(tt)), fc * .5, fc * 1.5) * np.exp(-tt * 200)


def clink(f=3200):
    tt = t_arr(0.25)
    x = sum(np.sin(2 * np.pi * f * r * tt) * a for r, a in [(1, 1), (1.47, .6), (2.09, .4), (2.76, .25)])
    return x * np.exp(-tt * 22)


def bell(f, d=1.6):
    tt = t_arr(d)
    x = sum(np.sin(2 * np.pi * f * r * tt) * a * np.exp(-tt * (2 + r)) for r, a in [(1, 1), (2, .4), (3.01, .2), (4.2, .1)])
    return x * np.minimum(1, tt / 0.004)


def blip(f0, f1, d=0.12):
    tt = t_arr(d)
    return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, len(tt))) / SR) * np.exp(-tt * 25) * np.minimum(1, tt / .003)


def riser(d=1.2):
    tt = t_arr(d)
    x = whoosh(d, 200, 6000)
    tone = np.sin(2 * np.pi * np.cumsum(np.linspace(200, 1200, len(tt))) / SR) * 0.25
    return (x + tone) * (tt / d) ** 2


# S1: coin clinks + drain
for i in range(46):
    place(fx, clink(2600 + rng.random() * 1600), 0.22 + i * 0.043 + 0.43, 0.035, pan=rng.uniform(-.4, .4))
place(fx, whoosh(0.7, 300, 5000), 2.75, 0.25)
for i in range(7):
    place(fx, blip(700 + i * 90, 900 + i * 90, 0.08), 2.72 + i * 0.075, 0.08)
# swipes
for t0 in [3.7, 11.1, 14.8, 18.62, 28.45, 38.7, 41.48]:
    place(fx, whoosh(0.6, 250, 5000), t0 - 0.32, 0.38)
# boarding pass entry / stamp / coins
place(fx, whoosh(0.45, 400, 3000), 3.75, 0.25)
place(fx, thump(0.4, 60, 0.9), 5.38, 0.75)
for i in range(16):
    place(fx, clink(3000 + rng.random() * 1500), 6.1 + i * 0.045 + 0.45, 0.03, pan=0.3)
place(fx, bell(midi(84), 1.2), 6.45, 0.12)
place(fx, bell(midi(88), 1.2), 6.55, 0.10)
# window shade + dive through
place(fx, bp(rng.standard_normal(int(SR * .5)), 800, 3000) * np.sin(np.pi * np.linspace(0, 1, int(SR * .5))), 7.42, 0.08)
place(fx, whoosh(0.7, 200, 7000), 7.85, 0.5)
# globe pin + flaps
place(fx, blip(500, 1400, 0.15), 8.9, 0.15)
for i in range(9):
    for k in range(4):
        place(fx, click(0.025, 2500 + rng.random() * 1500), 8.85 + i * .03 + k * .06, 0.12, pan=(i - 4) / 6)
for t0 in [9.62, 9.97, 10.32, 10.64]:
    for i in range(9):
        place(fx, click(0.025, 2500 + rng.random() * 1500), t0 + i * .03, 0.11, pan=(i - 4) / 6)
    place(fx, whoosh(0.35, 800, 5000), t0, 0.07)
# S5: tower + plane flyby, face pops, passport stamps
place(fx, whoosh(1.0, 120, 1500), 11.2, 0.35)
for i in range(7):
    place(fx, blip(500 + i * 60, 1100 + i * 60), 12.12 + i * .06, 0.10, pan=rng.uniform(-.5, .5))
for t0 in [13.3, 13.62, 13.92, 14.2]:
    place(fx, thump(0.3, 80, 1.0), t0, 0.55)
# S6: wings shimmer
for i, n in enumerate([72, 76, 79, 84, 88, 91]):
    place(fx, bell(midi(n), 2.0), 14.9 + i * 0.07, 0.07, pan=(i - 2.5) / 3)
place(fx, whoosh(0.8, 300, 3000, rev=True), 15.3, 0.12)
for i, n in enumerate([84, 88, 91, 96]):
    place(fx, bell(midi(n), 1.4), 17.5 + i * 0.05, 0.05)
# S7: polaroid drops, likes, camera shutter
for t0 in [18.8, 19.45, 20.25]:
    place(fx, whoosh(0.4, 600, 3000), t0, 0.12)
    place(fx, thump(0.2, 140, 0.6), t0 + 0.38, 0.25)
    for h in range(4):
        place(fx, blip(900, 1500, .08), t0 + 0.5 + h * 0.14, 0.04)
place(fx, click(0.02, 4000), 20.74, 0.5)
place(fx, click(0.05, 1500), 20.80, 0.4)
place(fx, blip(1200, 300, 0.25), 21.18, 0.15)
# S8: riser into "NO!" then boom
place(fx, riser(1.2), 20.85, 0.22)
boom_t = t_arr(1.6)
boom = np.sin(2 * np.pi * np.cumsum(38 + 120 * np.exp(-boom_t * 12)) / SR) * np.exp(-boom_t * 2.5)
boom += lp(rng.standard_normal(len(boom_t)), 1800) * np.exp(-boom_t * 8) * 0.6
place(fx, boom, 22.02, 0.9)
place(fx, whoosh(0.5, 3000, 200), 22.45, 0.3)
# S9: curtains, card pops
place(fx, whoosh(0.4, 200, 1500), 22.55, 0.3)
place(fx, whoosh(0.6, 300, 2500), 23.8, 0.25)
for t0 in [24.24, 25.15, 25.8, 26.94]:
    place(fx, blip(400, 1000, 0.14), t0, 0.22)
    place(fx, bell(midi(84), 0.8), t0 + 0.05, 0.04)
# S10: sparkles, "you", engines & takeoff
for i, n in enumerate([88, 91, 95, 100]):
    place(fx, bell(midi(n), 1.2), 28.5 + i * 0.08, 0.04)
place(fx, thump(0.4, 90, 0.3), 29.3, 0.3)
eng_t = t_arr(1.9)
eng = lp(rng.standard_normal(len(eng_t)), 900) * np.minimum(1, eng_t / 0.8) * np.exp(-np.maximum(0, eng_t - 1.2) * 3)
place(fx, eng, 30.4, 0.35)
place(fx, whoosh(1.4, 150, 2500), 30.6, 0.3)
# S11: step hops
for i, t0 in enumerate([32.24, 32.66, 33.04]):
    place(fx, blip(500 + i * 200, 900 + i * 300, 0.12), t0, 0.22)
# S12: logo reveal
place(fx, riser(0.9), 32.95, 0.2)
place(fx, whoosh(0.5, 200, 4000), 33.3, 0.35)
place(fx, thump(0.6, 50, 0.8), 33.88, 0.8)
for i, n in enumerate([76, 81, 84, 88, 93]):
    place(fx, bell(midi(n), 2.2), 33.9 + i * 0.06, 0.07, pan=(i - 2) / 3)
place(fx, whoosh(0.6, 2000, 8000), 34.6, 0.06)
# S13: banner, crew pops
place(fx, whoosh(0.3, 500, 3000), 35.8, 0.15)
place(fx, blip(500, 1200, 0.15), 36.86, 0.2)
place(fx, blip(450, 1100, 0.15), 37.44, 0.2)
# S14: stamp + seat ticks
place(fx, thump(0.4, 60, 1.0), 38.82, 0.8)
fill = sorted(39.05 + (np.arange(43) / 43) ** 0.8 * 2.2)
for t0 in fill:
    place(fx, click(0.02, 1800 + rng.random() * 1200), t0, 0.12, pan=rng.uniform(-.5, .5))
place(fx, blip(900, 600, 0.2), 40.18, 0.18)
# S15: CTA pops + typing + final chime
for t0 in [41.75, 41.95, 42.15]:
    place(fx, blip(500, 1300, 0.12), t0, 0.2)
    for k in range(14):
        place(fx, click(0.012, 5000), t0 + 0.15 + k * 0.04, 0.06)
for i, n in enumerate([69, 72, 76, 81]):
    place(fx, bell(midi(n), 3.0), 43.0 + i * 0.09, 0.07, pan=(i - 1.5) / 2)

fx = reverb(fx, 1.4, 0.18)

# ---------------- mix ----------------
import wave
w = wave.open(sys.argv[1])
assert w.getframerate() == SR and w.getnchannels() == 1
v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
voice = np.zeros(N)
voice[:min(N, len(v))] = v[:N]
voice = voice / (np.abs(voice).max() + 1e-9) * 0.85
# light presence EQ on voice
voice = voice + 0.25 * bp(voice, 2500, 6000)
# duck music under the voice
ve = np.sqrt(np.maximum(lp(voice ** 2, 6), 0))
ve = np.clip(ve / (ve.max() + 1e-9) * 4, 0, 1)
duck = 1 - 0.55 * lp(ve, 3)
# music fade in/out
mfade = np.interp(np.arange(N) / SR, [0, 0.4, 44.5, 47.8, 48], [0, 1, 1, 0.05, 0])
mix = np.zeros((2, N))
mix += music * duck * mfade * 0.55
mix += fx * 0.8
mix += np.vstack([voice, voice]) * 1.0
# soft limiter
peak = np.abs(mix).max()
mix = np.tanh(mix * 1.1) * 0.95
out = (mix.T * 32767).astype(np.int16)
wo = wave.open(sys.argv[2], 'wb')
wo.setnchannels(2); wo.setsampwidth(2); wo.setframerate(SR)
wo.writeframes(out.tobytes()); wo.close()
print('peak before limiter', peak)
if len(sys.argv) > 3:
    def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
    vm = ve > 0.2
    print('voice rms dB (voiced)', db(voice[vm]))
    print('music rms dB (under voice)', db((music * duck * mfade)[0][vm]), 'music between', db((music * mfade)[0][~vm]))
    print('fx rms dB', db(fx[0]))
