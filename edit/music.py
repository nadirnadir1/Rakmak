"""Fighter-pilot anthem (80s synth-rock) with ATC radio chatter, sample-based.
120 BPM, bar = 2.0 s, E minor. Sections (bars):
  0-1 hook, 2-5 build (radio), 6-19 main (12 = break), 20-21 + tail: E major finale."""
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

VODIR = sys.argv[3]

# ---------------------------------------------------------------- drums (80s style)
def kick(level=1.0):
    t = np.arange(int(0.4 * SR)) / SR
    f = 48 + 95 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    click = signal.sosfilt(signal.butter(2, 3000, "high", fs=SR, output="sos"), rng.standard_normal(len(t))) * np.exp(-t * 400) * 0.25
    return (np.tanh(1.8 * (body + click)) * 0.9 * level).astype(np.float32)

def snare(level=1.0):
    """Gated-reverb 80s snare."""
    t = np.arange(int(0.42 * SR)) / SR
    n = signal.sosfilt(signal.butter(2, [700, 9000], "band", fs=SR, output="sos"), rng.standard_normal(len(t)))
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25) * 0.7 + np.sin(2 * np.pi * 330 * t) * np.exp(-t * 35) * 0.3
    hitn = n * np.exp(-t * 28)
    room = n * 0.35 * np.exp(-t * 2.5)                    # dense "reverb" body
    gate = np.where(t < 0.3, 1.0, np.exp(-(t - 0.3) * 60))  # gated
    return ((tone + hitn * 0.9 + room) * gate * 0.75 * level).astype(np.float32)

def hat(level=1.0, open_=False):
    t = np.arange(int((0.25 if open_ else 0.05) * SR)) / SR
    n = signal.sosfilt(signal.butter(2, 8000, "high", fs=SR, output="sos"), rng.standard_normal(len(t)))
    return (n * np.exp(-t * (12 if open_ else 80)) * 0.18 * level).astype(np.float32)

PERC_PAN = {"kick": 0.0, "snare": 0.0}

# ---------------------------------------------------------------- harmony
CH = {"Em": ["E", "G", "B"], "C": ["C", "E", "G"], "G": ["G", "B", "D"], "D": ["D", "F#", "A"],
      "Am": ["A", "C", "E"], "B": ["B", "D#", "F#"], "E": ["E", "G#", "B"]}
ROOT = {k: v[0] for k, v in CH.items()}
PROG = {0: "Em", 1: "C", 2: "Em", 3: "C", 4: "G", 5: "D",
        6: "Em", 7: "C", 8: "G", 9: "D", 10: "Em", 11: "C", 12: "B",
        13: "Em", 14: "C", 15: "G", 16: "D", 17: "Am", 18: "C", 19: "B", 20: "E", 21: "E"}

def root(ch, octv):
    return M(ROOT[ch] + str(octv))

def tones(ch, octv):
    r = root(ch, octv)
    out = []
    for nm in CH[ch]:
        m = M(nm + str(octv))
        while m < r:
            m += 12
        out.append(m)
    return out

def power(ch, octv=2):
    r = root(ch, octv)
    if r < M("E2"):
        r += 12
    return [r, r + 7, r + 12]

THEME_A = [(0, 0, "B4", 2), (0, 2, "E5", 1), (0, 3, "F#5", 1),
           (1, 0, "G5", 3), (1, 3, "F#5", 0.5), (1, 3.5, "E5", 0.5),
           (2, 0, "D5", 2), (2, 2, "G5", 1), (2, 3, "A5", 1),
           (3, 0, "F#5", 4),
           (4, 0, "B4", 2), (4, 2, "E5", 1), (4, 3, "F#5", 1),
           (5, 0, "G5", 2), (5, 2, "A5", 1), (5, 3, "B5", 1)]
THEME_B = [(0, 0, "B4", 2), (0, 2, "E5", 1), (0, 3, "F#5", 1),
           (1, 0, "G5", 3), (1, 3, "F#5", 0.5), (1, 3.5, "E5", 0.5),
           (2, 0, "D5", 2), (2, 2, "G5", 1), (2, 3, "A5", 1),
           (3, 0, "F#5", 2), (3, 2, "A5", 2),
           (4, 0, "C6", 2), (4, 2, "B5", 1), (4, 3, "A5", 1),
           (5, 0, "G5", 2), (5, 2, "E5", 1), (5, 3, "G5", 1),
           (6, 0, "F#5", 2), (6, 2, "D#5", 1), (6, 3, "F#5", 1)]

drums = Bus(); bass = Bus(); gtr = Bus(); synth = Bus(); lead = Bus(); fx = Bus()

def beat_main(bar, vel=1.0, fill=False):
    for b in range(4):
        if b in (0, 2):
            drums.add(kick(vel), bt(bar, b))
        if b in (1, 3) and not (fill and b == 3):
            drums.add(snare(vel), bt(bar, b))
    drums.add(kick(vel * 0.7), bt(bar, 2.5 if bar % 2 else 1.5))
    for e in range(8):
        drums.add(hat(vel * (1.0 if e % 2 else 0.6)), bt(bar, e * 0.5), 1.0, 0.25)
    if fill:
        for k, nmn in enumerate(["A3", "F3", "D3", "A2"]):
            note(drums, "melodic_tom", M(nmn), bt(bar, 3 + k * 0.25), 0.4, vel * 1.2, pan=0.4 - k * 0.25)

def bass_8ths(bar, vel=1.0):
    r = root(PROG[bar], 1)
    if r < M("D1"):
        r += 12
    for e in range(8):
        note(bass, "synth_bass_1", r, bt(bar, e * 0.5), 0.22, vel * (1.0 if e % 2 == 0 else 0.8), release=0.05)
        note(bass, "electric_bass_pick", r + 12, bt(bar, e * 0.5), 0.22, vel * 0.7, release=0.05)

def chugs(bar, vel=1.0):
    pw = power(PROG[bar], 2)[:2]
    for e in range(8):
        for i, m in enumerate(pw):
            note(gtr, "electric_guitar_muted", m, bt(bar, e * 0.5), 0.2, vel * 0.8, pan=-0.6 if i == 0 else 0.6, release=0.05)

def power_chord(bar, dur=BAR, vel=1.0):
    pw = power(PROG[bar], 2)
    for i, m in enumerate(pw):
        note(gtr, "distortion_guitar", m, bt(bar), dur, vel * 0.8, pan=-0.7, release=0.25)
        note(gtr, "distortion_guitar", m, bt(bar) + 0.012, dur, vel * 0.8, pan=0.7, release=0.25)

def pad(bar, vel=1.0, dur=BAR):
    chord(synth, "pad_3_polysynth", tones(PROG[bar], 3) + [root(PROG[bar], 4)], bt(bar), dur, vel, attack=0.2, release=0.4)

def brass(bar, vel=1.0):
    ch = PROG[bar]
    chord(synth, "synth_brass_1", tones(ch, 4), bt(bar), BEAT * 1.4, vel, release=0.2)
    chord(synth, "synth_brass_1", tones(ch, 4), bt(bar, 2.5), BEAT * 1.4, vel * 0.8, release=0.2)

def play_theme(theme, start_bar, vel=1.0):
    for bo, b, nm, beats in theme:
        m = M(nm)
        t, d = bt(start_bar + bo, b), beats * BEAT
        note(lead, "overdriven_guitar", m, t, d, vel, pan=0.0, release=0.3)
        note(lead, "lead_2_sawtooth", m - 12, t, d, vel * 0.35, pan=0.1, release=0.2)
        note(lead, "synth_brass_2", m, t, d, vel * 0.3, pan=-0.1, release=0.2)

def impact(bar, vel=1.0):
    t = bt(bar)
    fx.add(boom(0.6 * vel), t)
    fx.add(crash(vel * 1.2), t, 1.0, 0.25)
    fx.add(crash(vel), t, 1.0, -0.25)
    drums.add(kick(vel * 1.1), t)
    drums.add(snare(vel), t)

# ---------------- hook (bars 0-1)
impact(0, 1.0)
power_chord(0, BAR * 2 - 0.1, 1.0)
chord(synth, "synth_brass_1", tones("Em", 4), bt(0), BAR, 0.9, release=0.6)
pad(0, 0.9, BAR * 2)
note(lead, "overdriven_guitar", M("B4"), bt(0, 0.5), BEAT * 1.5, 0.9, release=0.2)
note(lead, "overdriven_guitar", M("E5"), bt(0, 2), BEAT * 2, 1.0, release=0.2)
note(lead, "overdriven_guitar", M("G5"), bt(1, 0), BEAT * 2.5, 0.9, release=0.6)
note(lead, "overdriven_guitar", M("F#5"), bt(1, 2.5), BEAT * 1.5, 0.8, release=0.8)
for e in range(16):
    note(bass, "synth_bass_1", M("E1") + (0 if e < 8 else -4), bt(0, e * 0.5), 0.22, 0.8, release=0.05)
for e in range(8):
    drums.add(hat(0.7), bt(1, e * 0.5), 1.0, 0.25)

# ---------------- build (bars 2-5): sparse under the radio
for k, bar in enumerate(range(2, 6)):
    pad(bar, 0.45 + 0.12 * k)
    for e in range(8):
        note(bass, "synth_bass_1", root(PROG[bar], 1) + (12 if root(PROG[bar], 1) < M("D1") else 0),
             bt(bar, e * 0.5), 0.2, 0.4 + 0.12 * k, release=0.05)
    if bar >= 3:
        for e in range(8):
            drums.add(hat(0.4 + 0.1 * k), bt(bar, e * 0.5), 1.0, 0.25)
    if bar >= 4:
        chugs(bar, 0.45 + 0.15 * (k - 2))
        for b in range(4):
            drums.add(kick(0.55 + 0.1 * (k - 2)), bt(bar, b))
for k in range(14):
    drums.add(snare(0.25 + 0.045 * k), bt(5, k * 0.25))
fx.add(swell(BAR - BEAT * 0.5, 1.2), bt(5))

# ---------------- main (bars 6-19)
for bar in list(range(6, 12)) + list(range(13, 20)):
    beat_main(bar, 1.0, fill=(bar in (11, 19, 9, 16)))
    bass_8ths(bar, 1.0)
    chugs(bar, 0.75)
    power_chord(bar, BAR - 0.05, 0.75)
    pad(bar, 0.55)
    if bar >= 13:
        brass(bar, 0.7)
impact(6, 1.0)
play_theme(THEME_A, 6, 1.0)

# bar 12: break on B with tom build and riser
pad(12, 0.9)
power_chord(12, BAR - 0.05, 0.9)
note(bass, "synth_bass_1", M("B1"), bt(12), BAR - 0.1, 0.9, release=0.1)
chord(synth, "synth_strings_1", tones("B", 4) + [M("B5")], bt(12), BAR, 0.9, attack=0.4, release=0.1)
for k in range(16):
    note(drums, "melodic_tom", M(["A3", "F3", "D3", "A2"][k // 4]), bt(12, k * 0.25), 0.3, 0.4 + 0.04 * k, pan=0.3 - (k // 4) * 0.2)
fx.add(swell(BAR, 1.3), bt(12))

impact(13, 1.15)
play_theme(THEME_B, 13, 1.05)
fx.add(crash(0.8), bt(16), 1.0, 0.0)

# ---------------- finale (bars 20-21 + tail): E major
END = NBARS * BAR + TAIL - bt(20)
impact(20, 1.15)
for i, m in enumerate(power("E", 2) + [M("G#3")]):
    note(gtr, "distortion_guitar", m, bt(20), END - 1.5, 0.75, pan=-0.6 if i % 2 else 0.6, release=1.4)
chord(synth, "synth_brass_1", tones("E", 4), bt(20), END - 1.5, 0.9, release=1.4)
chord(synth, "pad_3_polysynth", tones("E", 3) + tones("E", 4), bt(20), END - 1.2, 0.9, release=1.2)
note(lead, "overdriven_guitar", M("G#5"), bt(20), END - 1.8, 0.9, release=1.5)
note(bass, "synth_bass_1", M("E1"), bt(20), END - 1.5, 0.9, release=1.4)
drums.add(kick(0.7), bt(21))

# fly-by whooshes on some cuts
for at in (bt(2) - 0.6, bt(8) - 0.6, bt(10) - 0.6, bt(16) - 0.6, bt(18) - 0.6):
    w, u = whoosh(1.2, 0.8)
    i = int(at * SR)
    fx.x[i:i + len(w), 0] += w * (1 - u) * 1.2
    fx.x[i:i + len(w), 1] += w * u * 1.2

# ---------------------------------------------------------------- radio
RADIO = [  # (file, start time)
    ("r0_smoke", 0.55),
    ("r1_ready", 4.35),
    ("r2_cleared", 8.45),
    ("r4_loop", 18.25),
    ("r5_break", 26.0 - 1.94 + 0.05),   # "now!" lands on the bar-13 hit
    ("r6_complete", 37.0),
    ("r7_land", 40.7),
]

def load_vo(name):
    import soundfile as sf
    a, sr = sf.read(f"{VODIR}/{name}.wav", dtype="float32")
    return signal.resample_poly(a, SR, sr).astype(np.float32)

def radio_fx(v):
    """Aircraft VHF radio: band-limited, saturated, with hiss, PTT click and squelch tail."""
    pre = int(0.09 * SR)
    post = int(0.22 * SR)
    v = np.concatenate([np.zeros(pre, np.float32), v, np.zeros(post, np.float32)])
    v = v / (np.abs(v).max() + 1e-9)
    v = signal.sosfilt(signal.butter(4, [380, 2900], "band", fs=SR, output="sos"), v)
    v = np.tanh(v * 5.0) / np.tanh(5.0)
    v = signal.sosfilt(signal.butter(2, [450, 3200], "band", fs=SR, output="sos"), v)
    t = np.arange(len(v)) / SR
    v *= 1 + 0.08 * np.sin(2 * np.pi * 7 * t)            # slight carrier flutter
    hiss = signal.sosfilt(signal.butter(2, [600, 4500], "band", fs=SR, output="sos"), rng.standard_normal(len(v)))
    hiss *= 0.06
    sq = np.zeros(len(v))
    k = int(0.16 * SR)
    sq[-post:-post + k] = signal.sosfilt(signal.butter(2, [800, 6000], "band", fs=SR, output="sos"),
                                         rng.standard_normal(k)) * np.linspace(0.5, 0, k) ** 0.7
    click = np.zeros(len(v))
    c = int(0.006 * SR)
    click[:c] = np.hanning(c) * 0.6
    gate = np.ones(len(v))
    gate[-post + k:] = 0
    out = (v + hiss) * gate + sq + click
    return (out / np.abs(out).max() * 0.9).astype(np.float32)

radio = np.zeros((N, 2), np.float32)
duck = np.zeros(N, np.float32)
for name, at in RADIO:
    r = radio_fx(load_vo(name))
    i = int(at * SR)
    j = min(N, i + len(r))
    radio[i:j, 0] += r[: j - i]
    radio[i:j, 1] += r[: j - i]
    duck[i:j] = 1.0
duck = signal.sosfiltfilt(signal.butter(1, 3, "low", fs=SR, output="sos"), duck).clip(0, 1)

# ---------------------------------------------------------------- mix
def rms(x):
    return float(np.sqrt((x ** 2).mean()) + 1e-9)

def hall(sec=2.0, pre=0.015):
    n = int(sec * SR)
    ir = rng.standard_normal((n, 2)).astype(np.float32)
    t = np.arange(n) / SR
    ir *= np.exp(-t * 6.9 / sec)[:, None]
    ir = signal.sosfilt(signal.butter(1, 6000, "low", fs=SR, output="sos"), ir, axis=0)
    ir = np.concatenate([np.zeros((int(pre * SR), 2), np.float32), ir])
    return ir / np.sqrt((ir ** 2).sum(0))

IR = hall()
def verb(x):
    return np.stack([signal.fftconvolve(x[:, c], IR[:, c])[:N] for c in range(2)], 1)

# lead: dotted-8th stereo delay
dl = int(BEAT * 0.75 * SR)
ld = np.zeros_like(lead.x)
ld[dl:, 1] += lead.x[:-dl, 0] * 0.3
ld[2 * dl:, 0] += lead.x[:-2 * dl, 1] * 0.18
lead.x += ld

TARGET = {"drums": 1.25, "bass": 0.85, "gtr": 0.85, "synth": 0.7, "lead": 0.95, "fx": 0.45}
WET = {"drums": 0.12, "bass": 0.0, "gtr": 0.12, "synth": 0.35, "lead": 0.3, "fx": 0.15}
buses = {"drums": drums, "bass": bass, "gtr": gtr, "synth": synth, "lead": lead, "fx": fx}
ref = rms(synth.x)
mix = np.zeros((N, 2), np.float32)
send = np.zeros((N, 2), np.float32)
for k, b in buses.items():
    x = b.x * (TARGET[k] * ref / rms(b.x))
    mix += x
    send += x * WET[k]
mix = mix + verb(send) * 0.8
mix = signal.sosfilt(signal.butter(2, 30, "high", fs=SR, output="sos"), mix, axis=0)
lvl = np.sqrt(signal.sosfilt(signal.butter(1, 4, "low", fs=SR, output="sos"), (mix ** 2).mean(1)).clip(1e-9))
thr = np.percentile(lvl, 60)
mix *= np.where(lvl > thr, (lvl / thr) ** (-0.3), 1.0)[:, None]
mix /= np.abs(mix).max() + 1e-9
# duck music ~9 dB under radio, then add the radio on top
mix *= (1 - 0.65 * duck)[:, None]
mix += radio * 0.42
fs = int((NBARS * BAR + TAIL - 2.5) * SR)
mix[fs:] *= (np.linspace(1, 0, N - fs) ** 1.3)[:, None]
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.25) / np.tanh(1.25) * 0.95
pcm = (mix * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", OUT, N / SR)
