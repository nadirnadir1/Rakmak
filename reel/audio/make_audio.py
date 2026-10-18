"""Original score + sound design for the EFH reel, synthesized from scratch.

usage: python make_audio.py <voice_48k.wav> <out_dir>
writes: music.wav, sfx.wav, voice.wav (stems, 48 kHz stereo float) and mix.wav
All cue times below are VOICE time; the video starts OFF seconds earlier.
"""
import sys, os
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
OFF = 0.20
DUR = 62.5
N = int(SR * DUR)
rng = np.random.default_rng(7)

VOICE_IN, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)


# ----------------------------------------------------------------- basics --
def db(x): return 10 ** (x / 20)
def T(n): return np.arange(n) / SR
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def env_exp(n, tau): return np.exp(-T(n) / tau)
def noise(n): return rng.standard_normal(n)


def adsr(n, a=0.005, d=0.1, s=0.7, r=0.1):
    t = T(n); e = np.ones(n) * s
    ai = int(a * SR); di = int(d * SR); ri = int(r * SR)
    if ai > 0: e[:ai] = np.linspace(0, 1, ai)
    if di > 0: e[ai:ai + di] = np.linspace(1, s, len(e[ai:ai + di]))
    if ri > 0 and ri < n: e[-ri:] *= np.linspace(1, 0, ri)
    return e


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def lp(x, f, order=2):
    sos = signal.butter(order, f, btype='low', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def hp(x, f, order=2):
    sos = signal.butter(order, f, btype='high', fs=SR, output='sos'); return signal.sosfilt(sos, x)


def var_lp(x, cut_fn, block=512, q=0.8):
    """time-varying RBJ lowpass; cut_fn(t_seconds_array)->Hz"""
    y = np.zeros_like(x); zi = np.zeros(2)
    for i in range(0, len(x), block):
        t = (i + block / 2) / SR
        f = float(np.clip(cut_fn(t), 30, SR * 0.45))
        w0 = 2 * np.pi * f / SR; al = np.sin(w0) / (2 * q); c = np.cos(w0)
        b = np.array([(1 - c) / 2, 1 - c, (1 - c) / 2]); a = np.array([1 + al, -2 * c, 1 - al])
        b /= a[0]; a /= a[0]
        y[i:i + block], zi = signal.lfilter(b, a, x[i:i + block], zi=zi)
    return y


def stft_sweep(x, center_fn, width_oct=1.0):
    """band-pass sweep in the STFT domain: center_fn(t)->Hz"""
    f, t, Z = signal.stft(x, SR, nperseg=1024)
    fc = np.array([center_fn(tt) for tt in t])
    lf = np.log2(np.maximum(f, 20))[:, None]
    m = np.exp(-0.5 * ((lf - np.log2(fc)[None, :]) / (width_oct / 2)) ** 2)
    _, y = signal.istft(Z * m, SR, nperseg=1024)
    y = y[:len(x)]
    return np.pad(y, (0, len(x) - len(y)))


def saw(freq, n, ph0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    dt = f / SR
    ph = (ph0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m1 = ph < dt; x = ph[m1] / dt[m1]; y[m1] -= x + x - x * x - 1
    m2 = ph > 1 - dt; x = (ph[m2] - 1) / dt[m2]; y[m2] -= x * x + x + x + 1
    return y


def stereo(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.4142, x * r * 1.4142], axis=1)


def place(bus, x, t, gain=1.0, pan=0.0):
    """t in VIDEO seconds"""
    if x.ndim == 1: x = stereo(x, pan)
    i = int(round(t * SR))
    if i >= len(bus): return
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), len(bus) - i)
    bus[i:i + n] += x[:n] * gain


def make_ir(sec, decay, lpf=6000, seed=1):
    r = np.random.default_rng(seed); n = int(sec * SR)
    e = np.exp(-T(n) / decay)
    ir = np.stack([lp(r.standard_normal(n), lpf) * e, lp(r.standard_normal(n), lpf) * e], axis=1)
    ir[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
    return ir / np.sqrt((ir ** 2).sum(axis=0, keepdims=True))


def reverb(x, ir, wet=0.3):
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + y * wet


IR_BIG = make_ir(3.0, 0.75, 5000, 1)
IR_SMALL = make_ir(1.2, 0.25, 7000, 2)

# ----------------------------------------------------------- music grid ----
BPM = 117.26
B = 60 / BPM
DROP1 = 11.68 + OFF                 # video time of first drop
DROP2 = DROP1 + 72 * B              # = vt 48.52
BREAK = DROP1 + 64 * B              # breakdown start
FINAL = DROP2 + 24 * B              # final hit
BAR = 4 * B
CHORDS = [  # (bass root, pad notes)
    (38, [62, 65, 69]),   # Dm
    (34, [62, 65, 70]),   # Bb
    (41, [60, 65, 69]),   # F
    (36, [60, 64, 67]),   # C
]
ARP = [  # pluck chord tones (MIDI)
    [62, 65, 69, 74], [62, 65, 70, 74], [65, 69, 72, 77], [64, 67, 72, 76],
]


def chord_at(t):
    b = int(np.floor((t - DROP1) / BAR + 1e-6))
    return b, CHORDS[b % 4], ARP[b % 4]


music = np.zeros((N, 2))
drums = np.zeros((N, 2))
bass_bus = np.zeros((N, 2))
pad_bus = np.zeros((N, 2))
pl_bus = np.zeros((N, 2))
lead_bus = np.zeros((N, 2))
fx_bus = np.zeros((N, 2))
sfx = np.zeros((N, 2))


# ------------------------------------------------------------ instruments --
def kick(n=0.5, hard=1.0):
    k = int(n * SR); t = T(k)
    f = 44 + 120 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t * 6.5)
    y += lp(noise(k), 3000) * np.exp(-t * 250) * 0.35 * hard
    return np.tanh(y * 1.8) * 0.9


def clap():
    k = int(0.4 * SR); t = T(k); y = np.zeros(k)
    nz = bp(noise(k), 900, 3200)
    for d in (0.0, 0.011, 0.022):
        i = int(d * SR); y[i:] += nz[:k - i] * np.exp(-T(k - i) * 120)
    y += nz * np.exp(-t * 14) * 0.5
    return y * 0.5


def snare(v=1.0):
    k = int(0.3 * SR); t = T(k)
    y = bp(noise(k), 1800, 9000) * np.exp(-t * 18) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
    return y * v


def hat(open_=False):
    k = int((0.3 if open_ else 0.06) * SR); t = T(k)
    return hp(noise(k), 7500, 4) * np.exp(-t * (9 if open_ else 70)) * 0.45


def shaker():
    k = int(0.09 * SR); t = T(k)
    e = np.minimum(t / 0.02, 1) * np.exp(-t * 40)
    return bp(noise(k), 4500, 11000) * e * 0.35


def crash():
    k = int(2.6 * SR); t = T(k)
    y = hp(noise(k), 3500) * np.exp(-t * 1.6) * 0.5
    return y


def tick(hi=True):
    k = int(0.05 * SR); t = T(k)
    f = 2600 if hi else 1900
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 160) + bp(noise(k), 2000, 8000) * np.exp(-t * 400) * 0.4) * 0.5


def pluck(m, n=0.7, bright=1.0):
    k = int(n * SR); t = T(k); f = midi(m); y = np.zeros(k)
    for h in range(1, 14):
        if f * h > 14000: break
        y += np.sin(2 * np.pi * f * h * t + h) * (1 / h ** 1.15) * np.exp(-t * (2.5 + h * 2.2 / bright))
    y *= np.minimum(t / 0.002, 1)
    return y * 0.32


def supersaw(m, n, voices=5, spread=0.18, cut=3000):
    k = int(n * SR); y = np.zeros((k, 2))
    for v in range(voices):
        det = (v - (voices - 1) / 2) / ((voices - 1) / 2) * spread
        s = saw(midi(m + det), k, rng.random())
        pan = (v - (voices - 1) / 2) / ((voices - 1) / 2) * 0.8
        y += stereo(s, pan) / voices
    y[:, 0] = lp(y[:, 0], cut); y[:, 1] = lp(y[:, 1], cut)
    return y


def bass_note(m, n):
    k = int(n * SR); t = T(k); f = midi(m)
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.25 * lp(saw(f, k), 500)
    return np.tanh(y * 1.2) * adsr(k, 0.004, 0.12, 0.75, 0.04) * 0.55


def lead_note(m, n):
    k = int(n * SR); t = T(k); f = midi(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(t / 0.2, 1))
    y = saw(f, k) * 0.6 + np.sign(np.sin(2 * np.pi * np.cumsum(f / 2) / SR)) * 0.2
    y = var_lp(y, lambda tt: 900 + 4000 * np.exp(-tt * 6), block=256)
    return y * adsr(k, 0.006, 0.15, 0.6, 0.06) * 0.4


# --------------------------------------------------------------- arrange ---
def beats(t0, t1, step=1.0, off=0.0):
    k0 = int(np.ceil((t0 - DROP1) / (B * step) - 1e-6))
    out = []
    k = k0
    while True:
        t = DROP1 + (k * step + off) * B
        if t >= t1 - 1e-6: break
        if t >= t0 - 1e-6: out.append((t, k))
        k += 1
    return out


V0 = OFF + 3.40          # intro B start
BUILD = OFF + 8.65
STOP = DROP1 + 19 * B        # beat before the stamp downbeat (bar 5)
voice_end = OFF + 56.05

# intro A/B: clock ticks
for t, k in beats(0.0, V0, 1):
    place(drums, tick(k % 2 == 0), t, 0.55)
for t, k in beats(V0, BUILD + 1.2, 1):
    place(drums, kick(0.35, 0.3), t, 0.35)
    place(drums, tick(k % 2 == 0), t, 0.25)
for t, k in beats(V0, BUILD, 1, 0.5):
    place(drums, shaker(), t, 0.5, pan=0.3)

# build snare roll + riser
roll_start = DROP1 - 2 * BAR + 0.0
t = roll_start
while t < DROP1 - 0.12:
    prog_ = (t - roll_start) / (DROP1 - roll_start)
    step = B if prog_ < 0.35 else B / 2 if prog_ < 0.65 else B / 4 if prog_ < 0.88 else B / 8
    place(drums, snare(0.25 + 0.6 * prog_), t, 0.55, pan=0.0)
    t += step


def riser(t0, t1, gain=1.0):
    n = int((t1 - t0) * SR); tt = T(n); p = tt / tt[-1]
    nz = noise(n)
    y = stft_sweep(nz, lambda s: 300 * (40 ** (s / (t1 - t0))), 1.4) * (0.15 + 0.85 * p ** 2)
    tone = saw(220 * 2 ** (p * 2), n) * 0.06 * p ** 2
    y = y + lp(tone, 4000)
    return np.stack([y, np.roll(y, 300)], axis=1) * gain


place(fx_bus, riser(BUILD + 0.3, DROP1 - 0.05), BUILD + 0.3, 0.6)


def rev_swell(n=1.0):
    k = int(n * SR); x = np.zeros((k, 2)); x[:int(0.05 * SR)] = stereo(noise(int(0.05 * SR)) * 0.5)
    y = reverb(x, IR_BIG, 1.0)
    return y[::-1] * np.linspace(0, 1, k)[:, None] ** 2


# main + drop2 drums
def drum_section(t0, t1, open_hats=False):
    for t, k in beats(t0, t1, 1):
        place(drums, kick(), t, 0.95)
    for t, k in beats(t0, t1, 2, 1):
        place(drums, clap(), t, 0.7)
    for t, k in beats(t0, t1, 0.25):
        acc = [0.5, 0.28, 0.85, 0.28][k % 4]
        place(drums, hat(), t, acc * 0.55, pan=0.25)
    if open_hats:
        for t, k in beats(t0, t1, 1, 0.5):
            place(drums, hat(True), t, 0.35, pan=-0.2)


main_end = BREAK
drum_section(DROP1, STOP)
drum_section(STOP + B, DROP1 + 8 * BAR)
drum_section(DROP1 + 8 * BAR, main_end - B, open_hats=True)
# fills
for i in range(8):
    place(drums, snare(0.3 + i * 0.08), DROP1 + 8 * BAR - B + i * B / 8, 0.45)
place(fx_bus, rev_swell(B * 1.0), STOP, 0.9)
place(drums, crash(), DROP1, 0.55); place(drums, crash(), STOP + B, 0.6); place(drums, crash(), DROP1 + 8 * BAR, 0.45)

# breakdown
for t, k in beats(BREAK, DROP2 - B, 2):
    place(drums, kick(0.6, 0.2), t, 0.55)
t = DROP2 - BAR
while t < DROP2 - 0.1:
    p_ = (t - (DROP2 - BAR)) / BAR
    step = B / 2 if p_ < 0.5 else B / 4 if p_ < 0.8 else B / 8
    place(drums, snare(0.25 + 0.7 * p_), t, 0.6)
    t += step
place(fx_bus, riser(DROP2 - 2 * BAR + 0.2, DROP2 - 0.04), DROP2 - 2 * BAR + 0.2, 0.75)

# drop 2
drum_section(DROP2, FINAL, open_hats=True)
place(drums, crash(), DROP2, 0.7)
place(drums, kick(0.9, 1.2), FINAL, 1.1); place(drums, crash(), FINAL, 0.8)

# bass (8th octave pumps)
def bass_section(t0, t1):
    for t, k in beats(t0, t1, 0.5):
        _, (root, _), _ = chord_at(t)
        m = root + (12 if k % 2 else 0)
        place(bass_bus, bass_note(m, B * 0.48), t, 0.8 if k % 2 == 0 else 0.6)
bass_section(DROP1, STOP)
bass_section(STOP + B, BREAK)
bass_section(DROP2, FINAL)
place(bass_bus, bass_note(CHORDS[0][0], 2.5) * np.exp(-T(int(2.5 * SR)) * 1.2), FINAL, 0.9)
# breakdown sub drone
n = int((DROP2 - BREAK) * SR)
drone = np.sin(2 * np.pi * midi(38) * T(n)) * np.minimum(T(n) / 1.0, 1) * 0.16
place(bass_bus, drone, BREAK, 1.0)

# pads, bar by bar from the start
bar0 = int(np.floor((0 - DROP1) / BAR))
for b in range(bar0, int(np.ceil((FINAL - DROP1) / BAR))):
    t0 = DROP1 + b * BAR
    if t0 >= FINAL: break
    _, (root, notes), _ = chord_at(t0 + 0.01)
    y = sum(supersaw(m, BAR + 0.25, cut=2600) for m in notes) / 3
    k = len(y); e = np.minimum(T(k) / 0.12, 1) * np.minimum((k / SR - T(k)) / 0.25, 1)
    place(pad_bus, y * e[:, None], t0, 0.5)
# final chord ring
y = sum(supersaw(m, 2.2, cut=3500) for m in [62, 65, 69, 74]) / 4
place(pad_bus, y * np.exp(-T(len(y)) * 1.6)[:, None], FINAL, 0.8)


def pad_cut(t):
    if t < V0: return 900
    if t < BUILD: return 1300
    if t < DROP1: return 1300 + 5000 * ((t - BUILD) / (DROP1 - BUILD)) ** 2
    if t < BREAK: return 3200
    if t < DROP2: return 500 + 4000 * ((t - BREAK) / (DROP2 - BREAK)) ** 3
    return 4200


pad_bus[:, 0] = var_lp(pad_bus[:, 0], pad_cut); pad_bus[:, 1] = var_lp(pad_bus[:, 1], pad_cut)

# pluck arps
def arp_section(t0, t1, gain, pattern=(0, 2, 1, 3, 2, 1, 3, 2)):
    for t, k in beats(t0, t1, 0.5):
        _, _, tones = chord_at(t)
        m = tones[pattern[k % len(pattern)]]
        place(pl_bus, pluck(m, 0.6), t, gain * (1.0 if k % 2 == 0 else 0.7), pan=0.35 * np.sin(k))
arp_section(V0, DROP1 - 0.15, 0.5)
arp_section(DROP1, STOP, 0.75)
arp_section(STOP + B, BREAK, 0.75)
arp_section(BREAK, DROP2 - 0.1, 0.35, pattern=(0, 1, 2, 3))
arp_section(DROP2, FINAL, 0.8)

# drop-2 lead melody (quarter=1 beat, eighth=0.5)
MEL = [
    [(69, 1), (74, .5), (76, .5), (77, 1), (76, .5), (74, .5)],
    [(74, 1), (77, .5), (79, .5), (77, 1), (74, 1)],
    [(72, 1), (77, .5), (79, .5), (81, 1), (79, .5), (77, .5)],
    [(76, 1), (79, .5), (77, .5), (76, 1), (72, 1)],
]
for b in range(6):
    t = DROP2 + b * BAR
    for m, d in MEL[b % 4]:
        place(lead_bus, lead_note(m, d * B * 0.95), t, 0.5 if t < voice_end else 0.9, pan=0.0)
        t += d * B
# offbeat stabs in drop 2
for t, k in beats(DROP2, FINAL, 1, 0.5):
    _, (root, notes), _ = chord_at(t)
    y = sum(supersaw(m + 12, B * 0.3, cut=5000) for m in notes) / 3
    place(pad_bus, y * env_exp(len(y), 0.06)[:, None], t, 0.35)

# -------------------------------------------------------------- music mix --
# sidechain from kicks
kenv = np.zeros(N)
for t, k in beats(DROP1, BREAK, 1) + beats(DROP2, FINAL + 0.01, 1):
    i = int(t * SR); m = min(N - i, int(0.4 * SR))
    if m > 0: kenv[i:i + m] = np.maximum(kenv[i:i + m], np.exp(-T(m) / 0.09))
sc = (1 - 0.6 * kenv)[:, None]
pad_bus *= sc; bass_bus *= (1 - 0.45 * kenv)[:, None]; pl_bus *= (1 - 0.3 * kenv)[:, None]


# delay on lead
def delay(x, t, fb=0.35, wet=0.3):
    d = int(t * SR); y = x.copy()
    for i in range(1, 5):
        y[d * i:] += x[:-d * i] * (fb ** i) * wet * (1 if i % 2 else 1) * np.array([1, 0.6] if i % 2 else [0.6, 1])
    return y


lead_bus = delay(lead_bus, B * 0.75)
music = drums * 0.9 + bass_bus * 0.85 + reverb(pad_bus, IR_BIG, 0.35) * 0.55 + reverb(pl_bus, IR_BIG, 0.3) * 0.6 \
    + reverb(lead_bus, IR_BIG, 0.3) * 0.45 + fx_bus * 0.8
music[:, 0] = hp(music[:, 0], 28); music[:, 1] = hp(music[:, 1], 28)
music *= np.minimum(1, (DUR - T(N)) / 0.6)[:, None]   # fade the tail
music *= np.minimum(1, T(N) / 0.05)[:, None]


# ------------------------------------------------------------------ SFX ----
def whoosh(n=0.5, up=True, bright=1.0):
    k = int(n * SR); tt = T(k); p = tt / tt[-1]
    e = np.sin(np.pi * p) ** 2
    y = stft_sweep(noise(k), (lambda s: 400 * (10 ** (s / n)) * bright) if up else (lambda s: 3500 * (0.12 ** (s / n)) * bright), 1.6)
    y = y * e
    pan = np.linspace(-0.7, 0.7, k)
    return np.stack([y * np.cos((pan + 1) * np.pi / 4), y * np.sin((pan + 1) * np.pi / 4)], axis=1) * 1.6


def impact(big=1.0):
    k = int(2.2 * SR); tt = T(k)
    f = 30 + 55 * np.exp(-tt * 4)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.2)
    nz = lp(noise(k), 2500) * np.exp(-tt * 9) * 0.6
    y = np.tanh((sub + nz) * 1.5) * 0.8
    return reverb(stereo(y), IR_BIG, 0.25 * big) * big


def pop(f0=900, f1=320, n=0.07):
    k = int(n * SR); tt = T(k)
    f = f1 + (f0 - f1) * np.exp(-tt * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 45) * 0.6


def ding(f=1568, n=0.9):
    k = int(n * SR); tt = T(k)
    mod = np.sin(2 * np.pi * f * 2 * tt) * 2.2 * np.exp(-tt * 6)
    return np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt * 5) * 0.35


def error_buzz():
    out = np.zeros(int(0.32 * SR))
    for s in (0.0, 0.16):
        k = int(0.12 * SR); tt = T(k)
        y = lp(np.sign(np.sin(2 * np.pi * 185 * tt)), 1800) * np.minimum(tt / 0.005, 1) * np.minimum((0.12 - tt) / 0.01, 1)
        i = int(s * SR); out[i:i + k] += y * 0.35
    return out


def stamp_thud():
    k = int(0.5 * SR); tt = T(k)
    y = np.sin(2 * np.pi * 82 * tt) * np.exp(-tt * 22) * 0.9
    y += bp(noise(k), 250, 1500) * np.exp(-tt * 60) * 0.7
    y += hp(noise(k), 3000) * np.exp(-tt * 140) * 0.3
    return np.tanh(y * 1.4)


def typing(n=1.4):
    k = int(n * SR); y = np.zeros(k); t = 0.02
    while t < n - 0.03:
        i = int(t * SR); m = int(0.012 * SR)
        y[i:i + m] += bp(noise(m), 1800, 6000) * np.exp(-T(m) * 500) * (0.5 + rng.random() * 0.5)
        y[i:i + m] += np.sin(2 * np.pi * 180 * T(m)) * np.exp(-T(m) * 300) * 0.3
        t += 0.07 + rng.random() * 0.09
    return y * 0.6


def click():
    m = int(0.02 * SR); return bp(noise(m), 1500, 7000) * np.exp(-T(m) * 400) * 0.6


def flap_clatter(n=1.4):
    k = int(n * SR); y = np.zeros(k); t = 0.0
    while t < n - 0.02:
        i = int(t * SR); m = int(0.008 * SR)
        y[i:i + m] += bp(noise(m), 1200, 5000) * np.exp(-T(m) * 700) * (0.3 + rng.random() * 0.7)
        t += 0.008 + rng.random() * 0.022 * (1 + 2 * (t / n) ** 2)
    return y * np.minimum(1, (n - T(k)) / 0.3) * 0.5


def chime():
    y = np.zeros(int(2.6 * SR))
    for i, f in enumerate([659.25, 523.25, 392.0]):
        d = ding(f, 1.6) * 1.3
        s = int(i * 0.38 * SR); y[s:s + len(d)] += d
    return y


def shutter():
    k = int(0.25 * SR); y = np.zeros(k)
    for s in (0.0, 0.06):
        m = int(0.01 * SR); i = int(s * SR)
        y[i:i + m] += bp(noise(m), 2000, 9000) * np.exp(-T(m) * 500)
    y += bp(noise(k), 3000, 8000) * np.exp(-T(k) * 25) * 0.12
    return y * 0.8


def shimmer(n=0.9, seed=0):
    r = np.random.default_rng(seed); k = int(n * SR); y = np.zeros(k)
    for _ in range(28):
        f = 3000 + r.random() * 5000; s = int(r.random() * (n - 0.12) * SR); m = int(0.12 * SR)
        y[s:s + m] += np.sin(2 * np.pi * f * T(m)) * np.exp(-T(m) * 40) * (0.1 + r.random() * 0.15)
    return y


def flyby(n=1.2):
    k = int(n * SR); tt = T(k); p = tt / n
    e = np.exp(-((p - 0.55) / 0.22) ** 2)
    y = stft_sweep(noise(k), lambda s: 500 + 2500 * np.exp(-((s / n - 0.55) / 0.2) ** 2), 2.0) * e * 1.6
    y += lp(noise(k), 150) * e * 0.5
    pan = np.linspace(-0.9, 0.9, k)
    return np.stack([y * np.cos((pan + 1) * np.pi / 4), y * np.sin((pan + 1) * np.pi / 4)], axis=1)


def clink():
    k = int(0.4 * SR); tt = T(k)
    return (np.sin(2 * np.pi * 2350 * tt + 1.5 * np.sin(2 * np.pi * 2350 * 2.76 * tt) * np.exp(-tt * 12)) * np.exp(-tt * 14)) * 0.25


def door_hiss():
    k = int(1.0 * SR); tt = T(k)
    y = lp(noise(k), 3500) * np.minimum(tt / 0.05, 1) * np.exp(-tt * 3.2) * 0.35
    th = np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 18) * 0.7
    return y + th


def flutter(n=0.9):
    k = int(n * SR); tt = T(k)
    am = 0.5 + 0.5 * np.sin(2 * np.pi * 13 * tt + 3 * np.sin(2 * np.pi * 1.3 * tt))
    return lp(noise(k), 1800) * am * np.sin(np.pi * tt / n) * 0.35


def paper(n=0.35):
    k = int(n * SR); tt = T(k)
    return bp(noise(k), 2000, 7000) * np.sin(np.pi * tt / n) ** 2 * 0.3


def glitch(n=0.3):
    k = int(n * SR); y = np.zeros(k); s = 0
    while s < k:
        m = int((0.015 + rng.random() * 0.03) * SR)
        f = 200 + rng.random() * 1800
        seg = np.sign(np.sin(2 * np.pi * f * T(m))) * 0.2 if rng.random() > 0.5 else bp(noise(m), 1000, 6000) * 0.5
        y[s:s + m] += seg[:len(y[s:s + m])]; s += m + int(rng.random() * 0.01 * SR)
    return y * np.linspace(1, 0.2, k)


def sfx_at(vt, x, gain, pan=0.0):
    place(sfx, x, vt + OFF, gain, pan)


# hook
sfx_at(0.0, typing(1.45), 0.35, 0.2)
sfx_at(0.55, click(), 0.4); sfx_at(1.0, click(), 0.35)
sfx_at(1.55, error_buzz(), 0.4)
sfx_at(2.18, whoosh(0.3), 0.18); sfx_at(2.28, pop(1200, 500), 0.25)
sfx_at(3.18, whoosh(0.4), 0.3); sfx_at(3.42, impact(0.6), 0.35)
sfx_at(3.62, pop(800, 260), 0.35)
sfx_at(3.62, whoosh(0.25, True, 1.4), 0.15)
sfx_at(5.28, pop(1000, 420), 0.28); sfx_at(5.70, whoosh(0.22, False, 1.5), 0.2)
sfx_at(6.05, ding(1760), 0.32)
sfx_at(7.35, whoosh(0.45), 0.2); sfx_at(7.72, pop(900, 300), 0.3)
# morocco
sfx_at(8.55, whoosh(0.4), 0.32)
sfx_at(8.85, flutter(1.4), 0.25); sfx_at(8.85, shimmer(0.95, 1), 0.35)
sfx_at(9.95, whoosh(0.35, False), 0.35); sfx_at(10.30, impact(0.9), 0.6)
sfx_at(10.42, pop(950, 380), 0.3); sfx_at(10.55, pop(1050, 420), 0.3)
sfx_at(10.80, shimmer(0.5, 2), 0.3)
sfx_at(11.68, impact(1.2), 0.75); sfx_at(11.68, glitch(0.3), 0.25)
# the difference / crew
sfx_at(12.45, whoosh(0.4), 0.3)
sfx_at(13.45, whoosh(0.3, False), 0.2); sfx_at(13.82, clink(), 0.35); sfx_at(14.15, clink(), 0.18)
# map
sfx_at(14.5, whoosh(0.4, True, 0.8), 0.35); sfx_at(14.8, shimmer(1.2, 3), 0.3)
sfx_at(16.15, flyby(1.3), 0.4)
for i, t in enumerate([16.65, 16.83, 17.01]): sfx_at(t, pop(900 + i * 150, 400), 0.25)
for t in (17.45, 18.08, 18.76):
    sfx_at(t - 0.12, whoosh(0.22, True, 1.3), 0.18); sfx_at(t, impact(0.45), 0.28)
# stamp
sfx_at(19.42, whoosh(0.3), 0.3)
sfx_at(21.78, whoosh(0.17, False, 1.6), 0.3); sfx_at(21.95, stamp_thud(), 0.62); sfx_at(21.95, impact(0.5), 0.22)
# documents
sfx_at(23.82, whoosh(0.3, True), 0.3)
for i, t in enumerate([24.17, 24.74, 25.32]): sfx_at(t, ding(1318 * 2 ** (i * 4 / 12), 0.6), 0.25)
# perks
sfx_at(25.8, whoosh(0.45, True, 0.9), 0.16)
for t in (26.9, 27.6, 27.72): sfx_at(t, pop(850, 330), 0.25)
sfx_at(27.2, ding(2093, 0.5), 0.2)
sfx_at(28.6, clink(), 0.2); sfx_at(28.7, clink(), 0.15)
sfx_at(30.75, click(), 0.4); sfx_at(30.8, shimmer(0.6, 4), 0.3)
# board
sfx_at(30.98, whoosh(0.4), 0.3); sfx_at(31.18, chime(), 0.3)
sfx_at(31.35, flap_clatter(1.35), 0.42, -0.2)
# polaroids
sfx_at(33.12, whoosh(0.3), 0.3)
for t in (33.32, 33.95, 34.5, 35.15): sfx_at(t - 0.06, whoosh(0.18, False, 1.4), 0.15); sfx_at(t, shutter(), 0.45)
# service vs tourism
sfx_at(36.15, whoosh(0.35, True, 0.9), 0.3)
sfx_at(36.62, pop(500, 220, 0.12), 0.4)
sfx_at(36.95, whoosh(0.22), 0.15); sfx_at(37.1, whoosh(0.22), 0.15)
sfx_at(38.42, ding(1568), 0.4)
sfx_at(39.36, error_buzz(), 0.26)
# USA
sfx_at(40.22, whoosh(0.3), 0.3); sfx_at(40.35, flutter(1.2), 0.3); sfx_at(40.45, impact(0.5), 0.35)
sfx_at(42.45, paper(0.4), 0.3); sfx_at(43.35, paper(0.25), 0.18)
# question + door
sfx_at(44.30, impact(1.0), 0.55)
sfx_at(45.28, whoosh(0.4, True, 0.8), 0.3)
sfx_at(46.78, door_hiss(), 0.55)
sfx_at(47.4, whoosh(1.1, True, 0.9), 0.35)
# logo
sfx_at(48.52, impact(1.3), 0.6); sfx_at(48.48, flyby(0.8), 0.28)
sfx_at(49.4, shimmer(0.7, 5), 0.3)
sfx_at(50.12, pop(900, 350), 0.25); sfx_at(50.6, pop(1000, 380), 0.25)
sfx_at(51.02, whoosh(0.32), 0.28)
sfx_at(52.5, pop(900, 350), 0.25); sfx_at(53.2, pop(1000, 380), 0.25)
# registration open
sfx_at(54.42, whoosh(0.32, True, 0.8), 0.3)
sfx_at(54.92, impact(0.8), 0.6); sfx_at(55.34, impact(1.1), 0.7); sfx_at(55.34, shimmer(0.9, 6), 0.45)
sfx_at(55.55, typing(0.45), 0.3)
# CTA
sfx_at(56.0, whoosh(0.35), 0.32)
sfx_at(56.45, whoosh(0.2, False, 1.3), 0.25); sfx_at(56.72, pop(420, 160, 0.14), 0.6)
for i, t in enumerate([56.85, 57.0, 57.15, 57.3]): sfx_at(t, pop(800 + i * 120, 350), 0.3)
sfx_at(57.6, ding(1568), 0.35)

sfx = reverb(sfx, IR_SMALL, 0.18)

# ---------------------------------------------------------------- voice ----
sr, v = wavfile.read(VOICE_IN)
v = v.astype(np.float64)
if v.ndim > 1: v = v.mean(axis=1)
v = hp(v, 75)
voice = np.zeros((N, 2))
place(voice, v, OFF, 1.0)

# ducking envelope from the voice
a = np.abs(voice[:, 0])
win = int(0.04 * SR)
envv = np.convolve(a, np.ones(win) / win, mode='same')
envv = envv / (np.percentile(envv[envv > 1e-4], 90) + 1e-9)
act = np.clip(envv * 2.0, 0, 1)
# smooth: fast attack, slow release
sm = np.zeros_like(act); g = 0.0
att, rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR))
for i in range(0, N, 64):
    x = act[i:i + 64].max()
    g = att * g + (1 - att) * x if x > g else rel * g + (1 - rel) * x
    sm[i:i + 64] = g
duck = db(-5.0 * sm)

wavfile.write(f"{OUT}/music.wav", SR, music.astype(np.float32))
wavfile.write(f"{OUT}/sfx.wav", SR, sfx.astype(np.float32))
wavfile.write(f"{OUT}/voice.wav", SR, voice.astype(np.float32))
np.save(f"{OUT}/duck.npy", duck.astype(np.float32))
print("stems written", music.shape, float(np.abs(music).max()), float(np.abs(sfx).max()), float(np.abs(voice).max()))
