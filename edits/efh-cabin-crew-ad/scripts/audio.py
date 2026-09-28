"""Synthesize an uplifting music bed + SFX aligned to the edit timeline."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import wave
from timeline import *

SR = 48000
N = int((TOTAL + 0.5) * SR)
rng = np.random.default_rng(7)


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)


def add(buf, x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    if x.ndim == 1:
        l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
        x = np.stack([x * l, x * r], 1) * np.sqrt(2)
    j = min(N, i + len(x))
    if i < 0:
        x, i = x[-i:], 0
        j = min(N, len(x))
    buf[i:j] += x[: j - i] * gain


def reverb_ir(d=2.2, decay=3.0):
    t = tt(d)
    env = np.exp(-decay * t)
    ir = np.stack([rng.standard_normal(len(t)) * env, rng.standard_normal(len(t)) * env], 1)
    ir[:, 0] = lp(ir[:, 0], 6000); ir[:, 1] = lp(ir[:, 1], 6000)
    return ir / np.abs(ir).sum(0).max() * 6


IR = reverb_ir()


def verb(x, wet=0.25):
    out = np.stack([fftconvolve(x[:, c], IR[:, c])[: len(x)] for c in range(2)], 1)
    return x + out * wet


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def saw(f, t, phase=0):
    return 2 * ((f * t + phase) % 1) - 1


# ---------------- music ----------------
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
# anchor: a downbeat exactly at the main-section drop
bars_before = int(np.ceil(T_MAIN / BAR))
T0 = T_MAIN - bars_before * BAR
# C  G  Am  F   (I V vi IV)
CHORDS = [[48, 55, 60, 64], [43, 55, 59, 62], [45, 57, 60, 64], [41, 57, 60, 65]]

pad = np.zeros((N, 2)); arp = np.zeros((N, 2)); bass = np.zeros((N, 2))
drums = np.zeros((N, 2)); fx = np.zeros((N, 2))

nbars = int((TOTAL - T0) / BAR) + 2
for b in range(nbars):
    t0 = T0 + b * BAR
    ch = CHORDS[b % 4]
    # pad: detuned saws
    t = tt(BAR + 0.3)
    env = np.minimum(1, t / 0.25) * np.minimum(1, np.maximum(0, (BAR + 0.3 - t) / 0.3))
    for k, n in enumerate(ch[1:]):
        for det, pn in ((-0.12, -0.6), (0.0, 0.0), (0.12, 0.6)):
            v = saw(midi(n + 12 + det), t, rng.random()) * env * 0.05
            add(pad, v, t0, pan=pn * 0.8)
    # sub bass: root, 8ths
    for e in range(8):
        tb = tt(BEAT / 2)
        f = midi(ch[0] - 12 + 12)
        v = np.sin(2 * np.pi * f * tb) * np.exp(-tb * 3) * np.minimum(1, (BEAT / 2 - tb) / 0.02)
        add(bass, v * (0.5 if e % 2 else 0.7), t0 + e * BEAT / 2)
    # pluck arpeggio 16ths
    seq = [ch[1] + 24, ch[2] + 24, ch[3] + 24, ch[2] + 24 + 12]
    for s in range(16):
        tp = tt(0.35)
        n = seq[(s * 3) % 4] if s % 4 else seq[0]
        v = (saw(midi(n), tp) * 0.5 + np.sin(2 * np.pi * midi(n) * tp)) * np.exp(-tp * 14)
        add(arp, v * 0.07 * (1.0 if s % 2 == 0 else 0.7), t0 + s * BEAT / 4, pan=0.35 * np.sin(s))
    # drums
    for q in range(4):
        tb = t0 + q * BEAT
        tk = tt(0.45)
        fk = 45 + 90 * np.exp(-tk * 30)
        kick = np.sin(2 * np.pi * np.cumsum(fk) / SR) * np.exp(-tk * 7)
        kick[:60] += rng.standard_normal(60) * 0.3
        add(drums, kick * 0.9, tb)
        if q in (1, 3):
            tc = tt(0.3)
            clap = np.zeros(len(tc))
            for off in (0, 0.012, 0.024):
                i = int(off * SR)
                clap[i:] += rng.standard_normal(len(tc) - i) * np.exp(-tc[: len(tc) - i] * 30)
            add(drums, bp(clap, 900, 3500) * 0.35, tb)
        for h in (0.5,):
            th = tt(0.06)
            hat = hp(rng.standard_normal(len(th)), 7000) * np.exp(-th * 70)
            add(drums, hat * 0.18, tb + h * BEAT, pan=0.3)
        th = tt(0.03)
        add(drums, hp(rng.standard_normal(len(th)), 9000) * np.exp(-th * 120) * 0.07, tb, pan=-0.3)

pad[:, 0] = lp(pad[:, 0], 2200); pad[:, 1] = lp(pad[:, 1], 2200)
arp[:, 0] = lp(arp[:, 0], 5000); arp[:, 1] = lp(arp[:, 1], 5000)
# ping-pong delay on arp (dotted 8th)
d = int(0.75 * BEAT * SR)
dl = np.zeros_like(arp)
dl[d:, 1] += arp[:-d, 0] * 0.35; dl[2 * d:, 0] += arp[:-2 * d, 1] * 0.2
arp = arp + dl

tm = np.arange(N) / SR
# sidechain pump on pad/bass from the kick grid
ph = ((tm - T0) % BEAT) / BEAT
pump = 0.45 + 0.55 * np.clip(ph / 0.45, 0, 1) ** 0.7
# section automation
hook = tm < T_MAIN
endc = tm >= T_END
drum_g = np.where(hook, 0.0, 1.0)
arp_g = np.where(hook, 0.55, 1.0)
bass_g = np.where(hook, 0.0, 1.0)
# filter sweep feel in hook: pad lowpassed more
pad_h = np.stack([lp(pad[:, c], 700) for c in range(2)], 1)
pad = np.where(hook[:, None], pad_h * 1.6, pad)

music = (pad * pump[:, None] * 1.0 + arp * arp_g[:, None] + bass * (bass_g * pump)[:, None] * 0.9
         + drums * drum_g[:, None])
music = verb(music, 0.18)
# fade out tail
fo = np.clip((TOTAL - tm) / 1.2, 0, 1)
fi = np.clip(tm / 0.05, 0, 1)
music *= (fo * fi)[:, None]

# ---------------- sfx ----------------
sfx = np.zeros((N, 2))


def whoosh(d=0.55):
    t = tt(d)
    x = rng.standard_normal(len(t))
    out = np.zeros(len(t)); blk = 512
    for i in range(0, len(t), blk):
        u = i / len(t)
        fc = 400 + 5000 * np.sin(np.pi * u) ** 2
        seg = x[max(0, i - 2048): i + blk]
        y = bp(seg, fc * 0.6, min(fc * 1.6, 20000))[-(min(blk, len(t) - i)):]
        out[i:i + len(y)] = y
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return out * env * 0.9


def impact():
    t = tt(1.6)
    f = 30 + 70 * np.exp(-t * 6)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    noise = lp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 9) * 0.6
    return (boom + noise) * 0.9


def riser(d):
    t = tt(d)
    x = rng.standard_normal(len(t))
    out = np.zeros(len(t)); blk = 1024
    for i in range(0, len(t), blk):
        fc = 300 * (40 ** (i / len(t)))
        seg = x[max(0, i - 4096): i + blk]
        y = bp(seg, fc * 0.7, min(fc * 1.4, 20000))[-(min(blk, len(t) - i)):]
        out[i:i + len(y)] = y
    f = 150 * 2 ** (3 * t / d)
    tone = saw(1, np.cumsum(f) / SR) * 0.08
    return (out * 0.8 + lp(tone, 3000)) * (t / d) ** 2


def ding():
    t = tt(1.4)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * dcy)
            for f, a, dcy in ((1318.5, 0.5, 3), (2637, 0.25, 5), (1975.5, 0.2, 4), (3951, 0.1, 8)))
    return x * 0.5


def pop():
    t = tt(0.09)
    f = 500 + 700 * t / 0.09
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * 0.5


def stereo_verb(x, wet=0.3):
    return verb(np.stack([x, x], 1), wet)


add(sfx, stereo_verb(impact(), 0.3), 0.0, 0.8)                 # hook slam
add(sfx, stereo_verb(pop(), 0.2), 0.05, 0.6)
add(sfx, stereo_verb(riser(T_MAIN - 0.3), 0.2), 0.3, 0.35)      # build to drop
add(sfx, stereo_verb(whoosh(0.5), 0.2), T_MAIN - 0.3, 0.8)
add(sfx, stereo_verb(impact(), 0.3), T_MAIN, 0.55)
for w in WIPES:
    add(sfx, stereo_verb(whoosh(0.5), 0.2), src2out(w) - 0.2, 0.45, )
for s in DING:
    add(sfx, stereo_verb(ding(), 0.35), src2out(s), 0.35)
# end card
add(sfx, stereo_verb(whoosh(0.5), 0.2), T_END - 0.3, 0.7)
add(sfx, stereo_verb(impact(), 0.35), T_END, 0.7)
for k in range(4):
    add(sfx, stereo_verb(pop(), 0.2), T_END + 0.25 + k * 0.22, 0.35)
add(sfx, stereo_verb(ding(), 0.4), T_END + 1.25, 0.25)


def write(path, x, peak=0.9):
    x = x / (np.abs(x).max() + 1e-9) * peak
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


write('music.wav', music)
write('sfx.wav', sfx)
print('T_MAIN', T_MAIN, 'T_END', T_END, 'TOTAL', TOTAL)
