"""Epic cinematic orchestral score, sample-based (MusyngKite GM samples).
120 BPM, bar = 2.0 s, D minor. Sections (bars):
  0-1 hook (huge hit), 2-5 build, 6-19 climax (12 = suspension), 20-21 + tail: D major finale."""
import sys, wave
import numpy as np
from scipy import signal

SFDIR = sys.argv[1]
OUT = sys.argv[2]
SR = 44100
BPM = 120.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
NBARS = 22
TAIL = 3.5
N = int((NBARS * BAR + TAIL) * SR)
rng = np.random.default_rng(3)

NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
INST = {}

def load(name):
    if name not in INST:
        z = np.load(f"{SFDIR}/{name}.npz")
        INST[name] = {k: z[k].astype(np.float32) for k in z.files}
    return INST[name]

def nn(m):
    return f"{NAMES[m % 12]}{m // 12 - 1}"

def M(s):
    """'D4' -> midi; supports '#' and 'b'."""
    s = s.replace("C#", "Db").replace("D#", "Eb").replace("F#", "Gb").replace("G#", "Ab").replace("A#", "Bb")
    name, octv = (s[:2], s[2:]) if len(s) > 2 and s[1] == "b" else (s[:1], s[1:])
    return NAMES.index(name) + (int(octv) + 1) * 12

def extend(x, need):
    """Loop the sustained body of a sample with crossfades to reach `need` samples."""
    if len(x) >= need:
        return x[:need]
    a, b = int(1.0 * SR), min(len(x), int(3.0 * SR)) - int(0.05 * SR)
    xf = int(0.35 * SR)
    out = x[:b].copy()
    while len(out) < need:
        seg = x[a:b]
        fade = np.linspace(0, 1, xf)
        tail = out[-xf:] * np.cos(fade * np.pi / 2) + seg[:xf] * np.sin(fade * np.pi / 2)
        out = np.concatenate([out[:-xf], tail, seg[xf:]])
    return out[:need]

class Bus:
    def __init__(self):
        self.x = np.zeros((N, 2), np.float32)

    def add(self, mono, t, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i >= N or i + len(mono) <= 0:
            return
        j = min(N, i + len(mono))
        l = np.cos((pan + 1) * np.pi / 4) * gain
        r = np.sin((pan + 1) * np.pi / 4) * gain
        self.x[i:j, 0] += mono[: j - i] * l
        self.x[i:j, 1] += mono[: j - i] * r

def note(bus, inst, midi, t, dur, vel=1.0, pan=0.0, offset=0.0, release=0.25, attack=0.0):
    smp = load(inst)[nn(midi)]
    o = int(offset * SR)
    need = int((dur + release) * SR)
    x = extend(smp[o:], need) if o == 0 else smp[o:o + need]
    if len(x) < need:
        x = np.pad(x, (0, need - len(x)))
    env = np.ones(need, np.float32)
    r = int(release * SR)
    env[-r:] = np.linspace(1, 0, r) ** 1.5
    if offset > 0:
        k = int(0.004 * SR)
        env[:k] *= np.linspace(0, 1, k)
    if attack > 0:
        k = int(attack * SR)
        env[:k] *= np.linspace(0, 1, k) ** 1.5
    bus.add(x * env, t, vel, pan)

def chord(bus, inst, notes, t, dur, vel=1.0, spread=0.6, **kw):
    for i, m in enumerate(notes):
        p = (i / max(1, len(notes) - 1) - 0.5) * 2 * spread if len(notes) > 1 else 0
        note(bus, inst, m, t, dur, vel / np.sqrt(len(notes)), pan=p, **kw)

def bt(bar, beat=0.0):
    return bar * BAR + beat * BEAT

# ---------------------------------------------------------------- synth helpers
def boom(level=1.0):
    t = np.arange(int(3.0 * SR)) / SR
    f = 32 + 70 * np.exp(-t * 7)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.3)
    return (np.tanh(1.6 * x) * level).astype(np.float32)

def crash(level=1.0, dur=3.5):
    t = np.arange(int(dur * SR)) / SR
    n = rng.standard_normal(len(t))
    n = signal.sosfilt(signal.butter(2, 3500, "high", fs=SR, output="sos"), n)
    n = signal.sosfilt(signal.butter(2, 12000, "low", fs=SR, output="sos"), n)
    return (n * np.exp(-t * 1.2) * 0.12 * level).astype(np.float32)

def swell(dur, level=1.0):
    """reverse-cymbal style swell (noise) that peaks at its end."""
    n = int(dur * SR)
    x = rng.standard_normal(n)
    x = signal.sosfilt(signal.butter(2, [2500, 11000], "band", fs=SR, output="sos"), x)
    e = np.linspace(0, 1, n) ** 3
    return (x * e * 0.16 * level).astype(np.float32)

def whoosh(dur=1.3, level=1.0):
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blk = 512
    zi = None
    for s in range(0, n, blk):
        fc = 300 + 3500 * np.sin(np.pi * u[s]) ** 2
        sos = signal.butter(2, fc, "low", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[s:s + blk], zi = signal.sosfilt(sos, x[s:s + blk], zi=zi)
    amp = np.sin(np.pi * u) ** 2
    return (out * amp * 0.25 * level).astype(np.float32), u

# ---------------------------------------------------------------- harmony
CH = {
    "Dm": ["D", "F", "A"], "Bb": ["Bb", "D", "F"], "F": ["F", "A", "C"], "C": ["C", "E", "G"],
    "Gm": ["G", "Bb", "D"], "A": ["A", "C#", "E"], "D": ["D", "F#", "A"],
}
ROOT = {"Dm": "D", "Bb": "Bb", "F": "F", "C": "C", "Gm": "G", "A": "A", "D": "D"}
PROG = {0: "Dm", 1: "Bb", 2: "Dm", 3: "Bb", 4: "F", 5: "C",
        6: "Dm", 7: "Bb", 8: "F", 9: "C", 10: "Dm", 11: "Bb", 12: "A",
        13: "Dm", 14: "Bb", 15: "F", 16: "C", 17: "Gm", 18: "Bb", 19: "A", 20: "D", 21: "D"}

def tones(ch, octv):
    """close voicing starting at the root in octave `octv`."""
    r = M(ROOT[ch] + str(octv))
    out = []
    for nm in CH[ch]:
        m = M(nm + str(octv))
        while m < r:
            m += 12
        out.append(m)
    return out

def root(ch, octv):
    return M(ROOT[ch] + str(octv))

THEME_A = [  # (bar offset, beat, note, beats)
    (0, 0, "A4", 2), (0, 2, "D5", 1), (0, 3, "E5", 1),
    (1, 0, "F5", 3), (1, 3, "E5", 0.5), (1, 3.5, "D5", 0.5),
    (2, 0, "C5", 2), (2, 2, "F5", 1), (2, 3, "G5", 1),
    (3, 0, "E5", 4),
    (4, 0, "A4", 2), (4, 2, "D5", 1), (4, 3, "E5", 1),
    (5, 0, "F5", 2), (5, 2, "G5", 1), (5, 3, "A5", 1),
]
THEME_B = [
    (0, 0, "A4", 2), (0, 2, "D5", 1), (0, 3, "E5", 1),
    (1, 0, "F5", 3), (1, 3, "E5", 0.5), (1, 3.5, "D5", 0.5),
    (2, 0, "C5", 2), (2, 2, "F5", 1), (2, 3, "G5", 1),
    (3, 0, "E5", 2), (3, 2, "G5", 2),
    (4, 0, "G5", 2), (4, 2, "F5", 1), (4, 3, "D5", 1),
    (5, 0, "F5", 2), (5, 2, "D5", 1), (5, 3, "F5", 1),
    (6, 0, "E5", 2), (6, 2, "C#5", 1), (6, 3, "E5", 1),
]

strings = Bus(); low = Bus(); brass = Bus(); choir = Bus(); perc = Bus(); fx = Bus(); trem = Bus()

def ostinato(bar, vel):
    ch = PROG[bar]
    r = root(ch, 2)
    pat = [0, 0, 12, 0, 0, 12, 0, 7] if ch not in ("A",) else [0, 0, 12, 0, 0, 12, 0, 12]
    for e, iv in enumerate(pat):
        accent = 1.0 if e in (0, 3, 6) else 0.7
        t = bt(bar, e * 0.5)
        note(low, "cello", r + 12 + iv, t, 0.22, vel * accent, pan=-0.3, offset=0.06, release=0.08)
        note(low, "string_ensemble_1", r + 12 + iv, t, 0.22, vel * accent * 0.8, pan=0.3, offset=0.08, release=0.08)
        if e % 2 == 0:
            note(low, "contrabass", r + iv * 0, t, 0.45, vel * accent * 0.9, offset=0.05, release=0.1)

def taiko_groove(bar, vel, fill=False):
    hits = [(0, 1.0), (1.5, 0.7), (2, 0.9), (3, 0.75), (3.5, 0.6)]
    if fill:
        hits = [(0, 1.0), (1, 0.6), (1.5, 0.7), (2, 0.9)] + [(2 + k * 0.25, 0.5 + 0.06 * k) for k in range(8)]
    for b, v in hits:
        note(perc, "taiko_drum", M("C3"), bt(bar, b), 1.2, vel * v, pan=rng.uniform(-0.15, 0.15), release=0.3)
        note(perc, "taiko_drum", M("G2"), bt(bar, b), 1.2, vel * v * 0.7, pan=0.0, release=0.3)
    note(perc, "timpani", root(PROG[bar], 2), bt(bar, 0), 1.6, vel * 0.9, release=0.4)

def big_hit(bar, ch, vel=1.0):
    t = bt(bar)
    chord(brass, "brass_section", [root(ch, 2), root(ch, 3)] + tones(ch, 3), t, 1.2, vel * 1.3, release=0.8)
    note(perc, "timpani", root(ch, 2), t, 2.5, vel * 1.3, release=0.5)
    note(perc, "taiko_drum", M("C3"), t, 2.0, vel * 1.3, release=0.5)
    note(perc, "taiko_drum", M("G2"), t, 2.0, vel * 1.2, release=0.5)
    note(perc, "orchestra_hit", root(ch, 3), t, 1.0, vel * 0.6, release=0.5)
    fx.add(boom(0.55 * vel), t)
    fx.add(crash(vel), t, 1.0, 0.2)
    fx.add(crash(vel * 0.8), t, 1.0, -0.3)

# ---------------- hook (bars 0-1)
big_hit(0, "Dm", 1.0)
chord(choir, "choir_aahs", tones("Dm", 4) + [M("D5")], bt(0), 3.6, 1.0, attack=0.05, release=0.6)
chord(trem, "tremolo_strings", tones("Dm", 4) + tones("Dm", 5), bt(0), 3.8, 1.0, release=0.5)
chord(strings, "string_ensemble_1", [M("D3"), M("A3")] + tones("Dm", 4), bt(0), 2.0, 1.0, release=0.4)
chord(strings, "string_ensemble_1", [M("Bb2"), M("F3")] + tones("Bb", 4), bt(1), 2.0, 0.9, release=0.9)
note(brass, "french_horn", M("A4"), bt(0, 1), 1.0, 0.9); note(brass, "french_horn", M("D5"), bt(0, 2), 2.0, 1.0)
note(brass, "french_horn", M("F5"), bt(1, 0), 1.5, 0.9, release=0.8); note(brass, "french_horn", M("D5"), bt(1, 2), 1.4, 0.8, release=1.0)
note(brass, "trombone", M("D3"), bt(0, 1), 3.0, 0.9, release=1.0)
for b in (2, 3):
    note(perc, "taiko_drum", M("C3"), bt(1, b), 1.0, 0.6, release=0.3)

# ---------------- build (bars 2-5)
for k, bar in enumerate(range(2, 6)):
    ch = PROG[bar]
    v = 0.45 + 0.15 * k
    ostinato(bar, v)
    chord(strings, "string_ensemble_1", tones(ch, 3) + [root(ch, 4) + 0], bt(bar), BAR, 0.45 + 0.15 * k, attack=0.15, release=0.3)
    if bar >= 3:
        chord(brass, "french_horn", tones(ch, 3), bt(bar), BAR, 0.35 + 0.15 * k, attack=0.2, release=0.3)
    if bar >= 4:
        chord(choir, "choir_aahs", tones(ch, 4), bt(bar), BAR, 0.5 + 0.2 * (k - 2), attack=0.3, release=0.3)
note(perc, "taiko_drum", M("C3"), bt(2), 1.2, 0.8)
for b in (0, 2):
    note(perc, "taiko_drum", M("C3"), bt(3, b), 1.0, 0.5)
for b in range(4):
    note(perc, "taiko_drum", M("C3"), bt(4, b), 1.0, 0.55 + 0.05 * b)
    note(perc, "taiko_drum", M("G2"), bt(4, b + 0.5), 1.0, 0.35)
for k in range(14):  # bar 5: accelerating taiko + timpani roll, stop on last 8th
    note(perc, "taiko_drum", M("C3"), bt(5, k * 0.25), 0.8, 0.45 + 0.04 * k)
for k in range(28):
    note(perc, "timpani", M("A2"), bt(5, 0.5 + k * 0.125), 0.3, 0.15 + 0.025 * k, release=0.2)
fx.add(swell(BAR * 1.0 - BEAT * 0.5, 1.2), bt(5, 0.5), 1.0, 0.0)
note(trem, "tremolo_strings", M("A4"), bt(5), BAR - BEAT * 0.5, 0.6, attack=1.5, release=0.1)
note(trem, "tremolo_strings", M("E5"), bt(5), BAR - BEAT * 0.5, 0.5, attack=1.5, release=0.1)

# ---------------- climax (bars 6-19)
def climax_bar(bar, intensity=1.0):
    ch = PROG[bar]
    ostinato(bar, 0.85 * intensity)
    chord(strings, "string_ensemble_1", tones(ch, 4) + [root(ch, 5)], bt(bar), BAR, 0.9 * intensity, release=0.3)
    chord(strings, "string_ensemble_1", [root(ch, 2), root(ch, 3)], bt(bar), BAR, 0.7 * intensity, release=0.3)
    chord(choir, "choir_aahs", tones(ch, 4) + [root(ch, 5)], bt(bar), BAR, 0.9 * intensity, attack=0.05, release=0.3)
    chord(brass, "brass_section", tones(ch, 3), bt(bar), BEAT * 1.5, 0.75 * intensity, release=0.3)
    note(brass, "tuba", root(ch, 1), bt(bar), BAR, 0.6 * intensity, release=0.3)
    taiko_groove(bar, 0.95 * intensity, fill=(bar in (11, 18)))

def play_theme(theme, start_bar, vel=1.0, octave_double=False):
    for bo, b, nm, beats in theme:
        m = M(nm)
        t, d = bt(start_bar + bo, b), beats * BEAT
        note(brass, "french_horn", m, t, d, vel, pan=-0.1, release=0.25)
        note(brass, "trombone", m - 12, t, d, vel * 0.8, pan=0.15, release=0.25)
        if octave_double:
            note(brass, "brass_section", m, t, d, vel * 0.55, pan=0.1, release=0.25)
            note(strings, "string_ensemble_1", m + 12, t, d, vel * 0.5, pan=0.2, release=0.25)

for bar in range(6, 12):
    climax_bar(bar, 1.0)
big_hit(6, "Dm", 1.0)
play_theme(THEME_A, 6, 1.0)

# bar 12: suspension on A (no drums), tremolo + choir, timpani roll swell
chord(trem, "tremolo_strings", tones("A", 4) + tones("A", 5), bt(12), BAR, 1.0, release=0.1)
chord(choir, "choir_aahs", tones("A", 4) + [M("A5")], bt(12), BAR, 1.0, attack=0.1, release=0.1)
note(low, "contrabass", M("A1"), bt(12), BAR, 0.9, release=0.1)
note(brass, "french_horn", M("E5"), bt(12), BAR - 0.1, 0.9, release=0.1)
note(brass, "brass_section", M("A3"), bt(12), BAR - 0.1, 0.6, attack=1.2, release=0.1)
for k in range(32):
    note(perc, "timpani", M("A2"), bt(12, k * 0.125), 0.3, 0.1 + 0.03 * k, release=0.2)
fx.add(swell(BAR, 1.4), bt(12), 1.0, 0.0)

for bar in range(13, 20):
    climax_bar(bar, 1.1)
big_hit(13, "Dm", 1.15)
play_theme(THEME_B, 13, 1.1, octave_double=True)
for b in (16,):
    fx.add(crash(0.7), bt(b), 1.0, 0.0)
fx.add(swell(BAR * 0.75, 1.0), bt(19, 1))

# ---------------- finale (bars 20-21 + tail): D major
END = NBARS * BAR + TAIL - bt(20)
big_hit(20, "D", 1.15)
chord(strings, "string_ensemble_1", [M("D2"), M("D3"), M("A3")] + tones("D", 4) + [M("D5"), M("F#5")], bt(20), END - 1.2, 1.2, release=1.2)
chord(choir, "choir_aahs", tones("D", 4) + [M("D5"), M("A5")], bt(20), END - 1.2, 1.1, attack=0.05, release=1.2)
chord(brass, "french_horn", [M("A3"), M("D4"), M("F#4"), M("A4")], bt(20), END - 1.5, 1.0, release=1.4)
note(brass, "french_horn", M("F#5"), bt(20), END - 1.5, 0.9, release=1.4)
note(brass, "tuba", M("D1"), bt(20), END - 1.5, 0.8, release=1.4)
note(perc, "taiko_drum", M("C3"), bt(21), 1.5, 0.7)
note(perc, "timpani", M("D2"), bt(21), 2.0, 0.6)

# whooshes (jet fly-bys) on some cuts
for at in (bt(2) - 0.6, bt(8) - 0.6, bt(10) - 0.6, bt(16) - 0.6, bt(18) - 0.6):
    w, u = whoosh(1.2, 0.8)
    fx.x[int(at * SR):int(at * SR) + len(w), 0] += w * (1 - u) * 1.2
    fx.x[int(at * SR):int(at * SR) + len(w), 1] += w * u * 1.2

# ---------------------------------------------------------------- mix
def rms(x):
    return float(np.sqrt((x ** 2).mean()) + 1e-9)

def hall(sec=2.8, pre=0.02):
    n = int(sec * SR)
    ir = rng.standard_normal((n, 2)).astype(np.float32)
    t = np.arange(n) / SR
    ir *= np.exp(-t * 6.9 / sec)[:, None]
    ir = signal.sosfilt(signal.butter(1, 5000, "low", fs=SR, output="sos"), ir, axis=0)
    ir = np.concatenate([np.zeros((int(pre * SR), 2), np.float32), ir])
    return ir / np.sqrt((ir ** 2).sum(0))

IR = hall()
def verb(x):
    return np.stack([signal.fftconvolve(x[:, c], IR[:, c])[:N] for c in range(2)], 1)

TARGET = {"strings": 1.0, "low": 0.9, "brass": 1.0, "choir": 0.6, "perc": 1.25, "fx": 0.5, "trem": 0.5}
WET = {"strings": 0.35, "low": 0.18, "brass": 0.3, "choir": 0.45, "perc": 0.2, "fx": 0.15, "trem": 0.4}
buses = {"strings": strings, "low": low, "brass": brass, "choir": choir, "perc": perc, "fx": fx, "trem": trem}
ref = rms(strings.x)
mix = np.zeros((N, 2), np.float32)
send = np.zeros((N, 2), np.float32)
for k, b in buses.items():
    g = TARGET[k] * ref / rms(b.x)
    x = b.x * g
    mix += x
    send += x * WET[k]
mix = mix + verb(send) * 0.9
# low-mid cleanup, gentle air
mix = signal.sosfilt(signal.butter(2, 28, "high", fs=SR, output="sos"), mix, axis=0)
# glue compression (smoothed RMS)
lvl = np.sqrt(signal.sosfilt(signal.butter(1, 4, "low", fs=SR, output="sos"), (mix ** 2).mean(1)).clip(1e-9))
thr = np.percentile(lvl, 60)
gain = np.where(lvl > thr, (lvl / thr) ** (-0.35), 1.0)
mix *= gain[:, None]
fe = N
fs = int((NBARS * BAR + TAIL - 2.5) * SR)
mix[fs:fe] *= (np.linspace(1, 0, fe - fs) ** 1.3)[:, None]
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.3) / np.tanh(1.3) * 0.95
pcm = (mix * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", OUT, N / SR)
