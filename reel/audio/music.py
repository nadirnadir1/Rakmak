"""Original background track for the EFH reel (C major / A minor, 116.79 BPM).

The bar grid is anchored on the voiceover so that section changes land in the
voiceover's pauses:
  bar 6  -> "الفرق؟ ... التاني خدام مضيف طيران" reveal (major lift)
  bar 22 -> the drop right after "وهنا السؤال"
A second grid starts on "التسجيل مفتوح" for the final two bars + ending hit.
"""
import numpy as np
from synth import (SR, RNG, n_of, tarr, midi_hz, db, stereo, noise, lp, hp, bp, peq, shelf, sweep_filter,
                   adsr, expdec, saw_blep, sine, supersaw, additive_pluck, bell, make_ir, reverb, delay, place,
                   soft_clip)

BPM = 116.79
BEAT = 60.0 / BPM
BAR = 4 * BEAT
S16 = BEAT / 4

# chord voicings (MIDI)
PAD = {"C": [55, 60, 64, 67], "G": [55, 59, 62, 67], "Am": [57, 60, 64, 69], "F": [57, 60, 65, 69]}
ROOT = {"C": 36, "G": 43, "Am": 45, "F": 41}
ARP = {"C": [72, 76, 79, 84], "G": [71, 74, 79, 83], "Am": [72, 76, 81, 84], "F": [72, 77, 81, 84]}
ARP_PAT = [0, 2, 1, 3, 2, 1, 3, 2, 0, 2, 1, 3, 2, 3, 1, 2]
LEAD = {  # (16th position, midi) per chord, used in the drop
    "C": [(0, 79), (3, 76), (6, 79), (8, 84), (11, 83), (14, 79)],
    "G": [(0, 79), (3, 74), (6, 79), (8, 83), (11, 81), (14, 79)],
    "Am": [(0, 81), (3, 76), (6, 81), (8, 84), (11, 83), (14, 81)],
    "F": [(0, 81), (3, 77), (6, 81), (8, 84), (11, 86), (14, 84)],
}


# ------------------------------------------------------------------ drums
def kick(vel=1.0):
    t = tarr(0.5)
    f = 46 + 120 * np.exp(-t / 0.032)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.30)
    click = hp(noise(len(t)), 2500) * np.exp(-t / 0.0035) * 0.35
    y = np.tanh(1.8 * (body + click)) * vel
    return y


def clap(vel=1.0):
    t = tarr(0.45)
    n = noise(len(t))
    env = np.zeros(len(t))
    for k, off in enumerate((0.0, 0.0105, 0.021)):
        tt = np.clip(t - off, 0, None)
        env += (t >= off) * np.exp(-tt / 0.0065) * (0.8 if k < 2 else 1.0)
    tail = np.exp(-np.clip(t - 0.021, 0, None) / 0.11) * (t >= 0.021) * 0.55
    y = bp(n, 900, 3200, 2) * (env + tail)
    return y * vel * 1.2


def snap(vel=1.0):
    t = tarr(0.2)
    y = bp(noise(len(t)), 1800, 5200, 2) * np.exp(-t / 0.018) + 0.25 * np.sin(2 * np.pi * 1450 * t) * np.exp(-t / 0.01)
    return y * vel


def snare(vel=1.0):
    t = tarr(0.3)
    tone = np.sin(2 * np.pi * (185 + 40 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.06)
    nz = bp(noise(len(t)), 1500, 9000, 2) * np.exp(-t / 0.09)
    return (0.55 * tone + 0.9 * nz) * vel


HAT_FREQS = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0]


def hat(open_=False, vel=1.0):
    dur = 0.45 if open_ else 0.09
    t = tarr(dur)
    metal = sum(np.sign(np.sin(2 * np.pi * f * 9.4 * t + RNG.random())) for f in HAT_FREQS)
    y = 0.55 * metal / 6 + noise(len(t)) * 0.8
    y = hp(bp(y, 6500, 16000, 2), 7000, 2)
    y *= np.exp(-t / (0.16 if open_ else 0.028))
    return y * vel * 0.9


def shaker(vel=1.0):
    t = tarr(0.12)
    env = np.minimum(1, t / 0.012) * np.exp(-t / 0.035)
    return bp(noise(len(t)), 4500, 11000, 2) * env * vel * 0.7


def crash(vel=1.0, dur=2.6):
    t = tarr(dur)
    metal = sum(np.sign(np.sin(2 * np.pi * f * 6.1 * t + RNG.random())) for f in HAT_FREQS)
    y = hp(noise(len(t)) * 0.9 + 0.35 * metal / 6, 3500, 2)
    y = lp(y, 14000, 2)
    env = np.exp(-t / (dur * 0.33)) * np.minimum(1, t / 0.002)
    l = y * env
    r = np.roll(y, 37) * env
    return np.stack([l, r], axis=1) * vel * 0.55


def reverse_swell(dur=1.6, vel=1.0):
    c = crash(1.0, dur + 0.4)[::-1]
    c = c[-n_of(dur):]
    return c * vel


def doum(vel=1.0):
    t = tarr(0.4)
    f = 78 + 40 * np.exp(-t / 0.02)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)
    y += 0.25 * np.sin(2 * np.pi * np.cumsum(f * 2.3) / SR) * np.exp(-t / 0.06)
    y += 0.15 * lp(noise(len(t)), 900) * np.exp(-t / 0.01)
    return np.tanh(1.3 * y) * vel


def tek(vel=1.0):
    t = tarr(0.12)
    y = bp(noise(len(t)), 2200, 7000, 2) * np.exp(-t / 0.012)
    y += 0.5 * np.sin(2 * np.pi * 620 * t) * np.exp(-t / 0.02)
    y += 0.3 * np.sin(2 * np.pi * 1310 * t) * np.exp(-t / 0.012)
    return y * vel


# ------------------------------------------------------------------ tonal
def pad_chord(name, dur, cutoff=2400, vel=1.0):
    n = n_of(dur + 0.6)
    out = np.zeros((n, 2))
    for m in PAD[name]:
        out += supersaw(midi_hz(m), n, voices=7, detune_cents=16)
    out += 0.35 * supersaw(midi_hz(PAD[name][0] - 12), n, voices=3, detune_cents=8)
    env = adsr(n, a=0.06, d=0.4, s=0.8, r=0.55, hold=dur)
    out *= env[:, None]
    out = hp(lp(out, cutoff, 2), 160, 2)
    return out * vel * 0.16


def bass_note(name, dur, vel=1.0, octave=0):
    f = midi_hz(ROOT[name] + 12 * octave)
    n = n_of(dur + 0.08)
    s = sine(f, n) + 0.32 * sine(2 * f, n) + 0.12 * sine(3 * f, n)
    saw = lp(saw_blep(f, n), 420, 2) * 0.35
    y = np.tanh(1.6 * (s + saw))
    env = adsr(n, a=0.004, d=0.08, s=0.85, r=0.06, hold=dur)
    return y * env * vel * 0.5


def pluck_note(m, vel=1.0, dur=0.42, bright=1.0):
    return additive_pluck(midi_hz(m), dur, bright=bright, decay=7.5) * vel


def lead_note(m, vel=1.0, dur=0.5):
    y = additive_pluck(midi_hz(m), dur, bright=0.55, decay=4.5) + 0.4 * bell(midi_hz(m) * 2, dur) * 0.3
    return y * vel


# ------------------------------------------------------------------ arrangement
def build(total, off, verbose=False):
    """Return dict of stereo stems, each shaped (N, 2)."""
    N = n_of(total)
    stems = {k: np.zeros((N, 2)) for k in ("drums", "perc", "bass", "pads", "plucks", "lead", "fx")}
    g1 = off + 0.18  # bar 0 downbeat
    bar_t = lambda b: g1 + b * BAR

    T_STOP1 = off + 11.64     # "الفرق؟" stop
    T_B = bar_t(6)            # reveal
    T_BUT = off + 36.51       # "ولكن" tape stop
    T_C = bar_t(18)           # breakdown
    T_DROP = bar_t(22)        # drop
    T_STOP2 = off + 54.60     # silence before "التسجيل مفتوح"
    T_E = off + 54.92         # final section grid
    T_END_HIT = T_E + 2 * BAR

    chords = {}
    seqA = ["Am", "F", "C", "G", "Am", "F"]
    seqB = ["C", "G", "Am", "F"] * 3
    seqC = ["Am", "F", "C", "G"]
    seqD = ["C", "G", "Am", "F", "C"]
    for i, c in enumerate(seqA + seqB + seqC + seqD):
        chords[i] = c

    kicks = []
    GAPS = [(T_STOP1, T_B), (T_BUT, T_C), (T_DROP - 0.16, T_DROP), (T_STOP2, T_E)]

    def clip_dur(t, dur):
        for a, b in GAPS:
            if t < a < t + dur:
                return a - t
        return dur

    def gate(t):
        """True when music is allowed to sound at time t (stops/gaps)."""
        if T_STOP1 <= t < T_B:
            return False
        if T_BUT <= t < T_C:
            return False
        if T_DROP - 0.16 <= t < T_DROP:
            return False
        if T_STOP2 <= t < T_E:
            return False
        return True

    # ---- grid 1: bars 0..26
    for b in range(27):
        bt = bar_t(b)
        c = chords[b]
        sec = "A" if b < 6 else "B" if b < 18 else "C" if b < 22 else "D"
        for s in range(16):
            t = bt + s * S16
            if t >= T_STOP2:
                break
            if not gate(t):
                continue
            beat = s // 4
            on_beat = s % 4 == 0
            # kick
            if sec == "A" and on_beat and beat in (0, 2):
                place(stems["drums"], kick(0.8), t); kicks.append(t)
            if sec in ("B", "D") and on_beat:
                place(stems["drums"], kick(1.0), t); kicks.append(t)
            if sec == "C" and b == 20 and on_beat and beat == 0:
                place(stems["drums"], kick(0.7), t); kicks.append(t)
            if sec == "C" and b == 21 and on_beat:
                place(stems["drums"], kick(0.75), t); kicks.append(t)
            # backbeat
            if on_beat and beat in (1, 3):
                if sec == "A":
                    place(stems["drums"], snap(0.55), t)
                elif sec in ("B", "D"):
                    place(stems["drums"], clap(0.8 if sec == "B" else 0.95), t)
            # hats
            if sec == "A" and s % 2 == 0:
                place(stems["drums"], hat(False, 0.35 if s % 4 else 0.22), t)
            if sec in ("B", "D"):
                if s % 4 == 2:
                    place(stems["drums"], hat(True, 0.42 if sec == "B" else 0.5), t)
                place(stems["perc"], shaker(0.28 + 0.18 * (s % 2 == 0) + 0.1 * (s % 4 == 2)), t)
            if sec == "C" and b >= 19 and s % 2 == 0:
                place(stems["drums"], hat(False, 0.2), t)
            # darbuka (maqsum-ish) in B and D, light
            if sec in ("B", "D"):
                pat = {0: "D", 2: "T", 6: "T", 8: "D", 12: "T", 14: "k", 15: "k"}
                p = pat.get(s)
                if p == "D":
                    place(stems["perc"], doum(0.42), t, 1.0)
                elif p == "T":
                    place(stems["perc"], tek(0.32), t)
                elif p == "k":
                    place(stems["perc"], tek(0.14), t)
            # plucks / arp
            if sec in ("A", "B", "D") or (sec == "C" and b >= 19):
                m = ARP[c][ARP_PAT[s]]
                vel = 0.55 if s % 4 == 0 else 0.38
                if sec == "A":
                    vel *= 0.9
                place(stems["plucks"], pluck_note(m, vel, bright=0.85 if sec != "C" else 0.6), t)
            # lead in the drop
            if sec == "D":
                for pos, m in LEAD[c]:
                    if pos == s:
                        place(stems["lead"], lead_note(m, 0.42), t)
        # chord pads + bass (per bar)
        if bt < T_STOP2:
            dur = clip_dur(bt, BAR)
            cutoff = {"A": 1900, "B": 2800, "C": 2000, "D": 3600}[sec]
            vel = {"A": 0.95, "B": 1.0, "C": 1.0, "D": 1.1}[sec]
            place(stems["pads"], pad_chord(c, dur, cutoff, vel), bt)
            if sec in ("B", "D"):
                for k in range(4):  # off-beat pumping bass + sub on the beat
                    tb = bt + k * BEAT
                    if tb >= T_STOP2:
                        break
                    if gate(tb):
                        place(stems["bass"], bass_note(c, BEAT * 0.9, 0.7, 0), tb)
                    to = tb + BEAT / 2
                    if gate(to) and to < T_STOP2:
                        place(stems["bass"], bass_note(c, BEAT * 0.42, 0.55, 1), to)
            elif sec == "A" and b >= 1:
                place(stems["bass"], bass_note(c, clip_dur(bt, BAR * 0.95), 0.55, 0), bt)
            elif sec == "C":
                place(stems["bass"], bass_note(c, clip_dur(bt, BAR * 0.95), 0.5, 0), bt)

    # snare build before the drop (bar 21)
    b21 = bar_t(21)
    for s in range(16):
        t = b21 + s * S16
        if t >= T_DROP - 0.16:
            break
        step = 4 if s < 8 else 2 if s < 12 else 1
        if s % step == 0:
            place(stems["drums"], snare(0.25 + 0.6 * s / 16), t)
    for s in range(8):  # final 32nds
        t = b21 + 12 * S16 + s * S16 / 2
        if t < T_DROP - 0.16:
            place(stems["drums"], snare(0.55 + 0.05 * s), t)

    # ---- grid 2 (final): 2 bars F, G then the C hit
    for b, c in enumerate(["F", "G"]):
        bt = T_E + b * BAR
        place(stems["pads"], pad_chord(c, BAR, 3600, 1.15), bt)
        for s in range(16):
            t = bt + s * S16
            on_beat = s % 4 == 0
            if on_beat:
                place(stems["drums"], kick(1.0), t); kicks.append(t)
                if (s // 4) in (1, 3):
                    place(stems["drums"], clap(0.95), t)
                place(stems["bass"], bass_note(c, BEAT * 0.9, 0.7), t)
                place(stems["bass"], bass_note(c, BEAT * 0.42, 0.55, 1), t + BEAT / 2)
            if s % 4 == 2:
                place(stems["drums"], hat(True, 0.5), t)
            place(stems["perc"], shaker(0.3 + 0.15 * (s % 2 == 0)), t)
            m = ARP[c][ARP_PAT[s]]
            place(stems["plucks"], pluck_note(m, 0.5 if on_beat else 0.36), t)
            for pos, mm in LEAD[c]:
                if pos == s:
                    place(stems["lead"], lead_note(mm, 0.42), t)
        if b == 1:  # fill into the end hit
            for s in range(12, 16):
                place(stems["drums"], snare(0.5 + 0.1 * (s - 12)), bt + s * S16)
    # end hit: big C chord with long tail
    place(stems["pads"], pad_chord("C", 0.15, 5000, 1.3), T_END_HIT)
    place(stems["drums"], kick(1.1), T_END_HIT); kicks.append(T_END_HIT)
    place(stems["fx"], crash(1.0, 3.0), T_END_HIT)
    place(stems["bass"], bass_note("C", 1.2, 0.8), T_END_HIT)
    for m in (72, 76, 79, 84):
        place(stems["lead"], lead_note(m, 0.32, 1.6), T_END_HIT)

    # ---- crashes & swells
    for t in (T_B, T_DROP, T_E):
        place(stems["fx"], crash(0.9), t)
    place(stems["fx"], reverse_swell(1.2, 0.55), T_B - 1.2 + 0.0)
    place(stems["fx"], reverse_swell(1.9, 0.6), T_DROP - 0.16 - 1.9)
    place(stems["fx"], reverse_swell(0.9, 0.5), T_E - 0.9 - 0.05)

    # ---- hard gaps on the dry stems (fx keeps its swells); reverb tails stay natural
    N = len(stems["pads"])
    gmask = np.ones(N)
    for a, b in GAPS:
        if a == T_BUT:
            continue  # handled by the tape stop on the mix
        i0, i1 = n_of(a), n_of(b)
        f = n_of(0.012)
        gmask[i0:i1] = 0
        gmask[max(0, i0 - f):i0] = np.linspace(1, 0, min(f, i0))
    for k in stems:
        if k != "fx":
            stems[k] *= gmask[:, None]

    # ---- sidechain (kick) on pads, bass, plucks
    N = len(stems["pads"])
    sc = np.ones(N)
    tt = np.arange(N) / SR
    for t in kicks:
        i0 = n_of(t)
        if i0 >= N:
            continue
        i1 = min(N, i0 + n_of(0.42))
        seg = tt[i0:i1] - t
        g = 1 - 0.62 * np.exp(-seg / 0.11) * np.minimum(1, seg / 0.004 + 0.2)
        sc[i0:i1] = np.minimum(sc[i0:i1], g)
    for k, amt in (("pads", 1.0), ("bass", 0.6), ("plucks", 0.35)):
        g = 1 - (1 - sc) * amt
        stems[k] *= g[:, None]

    # ---- spaces: reverb/delay sends
    ir_big = make_ir(2.6, 0.025, 6500)
    ir_room = make_ir(0.9, 0.01, 7000)
    stems["plucks"] = stems["plucks"] + delay(stems["plucks"], BEAT * 0.75, 0.32, 5) * 0.45
    stems["plucks"] = stems["plucks"] + reverb(stems["plucks"], ir_big, 0.28)
    stems["lead"] = stems["lead"] + delay(stems["lead"], BEAT * 0.75, 0.3, 4) * 0.4 + reverb(stems["lead"], ir_big, 0.35)
    stems["pads"] = stems["pads"] + reverb(stems["pads"], ir_big, 0.3)
    stems["drums"] = stems["drums"] + reverb(stems["drums"], ir_room, 0.12)
    stems["perc"] = stems["perc"] + reverb(stems["perc"], ir_room, 0.18)

    meta = dict(T_STOP1=T_STOP1, T_B=T_B, T_BUT=T_BUT, T_C=T_C, T_DROP=T_DROP, T_STOP2=T_STOP2, T_E=T_E,
                T_END_HIT=T_END_HIT, BAR=BAR, BEAT=BEAT, g1=g1)
    return stems, meta


def tape_stop(x, t0, dur=0.55):
    """Slow the audio to a halt starting at t0 (in place)."""
    i0 = n_of(t0)
    n = n_of(dur)
    if i0 + n >= len(x):
        return x
    k = np.arange(n) / SR
    pos = k - k * k / (2 * dur)  # speed 1 -> 0
    src = i0 + pos * SR
    idx = np.floor(src).astype(int)
    fr = src - idx
    y = x[idx] * (1 - fr[:, None]) + x[np.minimum(idx + 1, len(x) - 1)] * fr[:, None]
    fade = np.cos(np.linspace(0, np.pi / 2, n)) ** 1.5
    x[i0:i0 + n] = y * fade[:, None]
    x[i0 + n: n_of(t0 + dur + 0.05)] = 0
    return x


def render_music(total, off):
    stems, meta = build(total, off)
    levels = {"drums": -4.5, "perc": -8.0, "bass": -6.0, "pads": -5.5, "plucks": -8.0, "lead": -9.5, "fx": -9.0}
    mix = np.zeros_like(stems["drums"])
    for k, v in stems.items():
        mix += v * db(levels[k])
    mix = hp(mix, 28, 2)
    mix = tape_stop(mix, meta["T_BUT"], 0.55)
    i0, i1 = n_of(meta["T_BUT"] + 0.55), n_of(meta["T_C"])
    mix[i0:i1] = 0
    # carve room for the voice (presence region) - the voice ducking happens in the mixer
    mix = peq(mix, 2600, -3.5, 0.8)
    mix = peq(mix, 320, -1.5, 0.9)
    peak = np.abs(mix).max()
    mix = soft_clip(mix / peak * 1.2, 1.3) * 0.85
    return mix, meta
