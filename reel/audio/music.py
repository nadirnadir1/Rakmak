"""Original music bed for the EFH reel, synthesised from scratch (no samples, no loops).
120 BPM, A minor / C major. Two bar grids locked to the edit:
  grid A: downbeat at 16.07 s ("كابين" title drop)  -> bars at 0.07 + 2k
  grid B: downbeat at 33.39 s (logo drop)            -> bars at 23.39 + 2k
Writes stems + a music bus (before voice ducking) as float WAVs."""
import os
import numpy as np
import soundfile as sf
from dsp import (SR, n_of, noise, pink, sine, saw, square, exp_env, adsr, lp, hp, bp, sweep, pan, st, reverb, delay,
                 chorus, sat, place, midi_hz, widen, db)

DUR = 56.0
N = n_of(DUR)
BEAT = 0.5
A0, B0 = 0.07, 23.39            # grid origins (bar 0)
STOP = 22.27                    # "لا!" -> tape stop
A_BAR = lambda k: A0 + 2 * k
B_BAR = lambda k: B0 + 2 * k

stems = {k: np.zeros((2, N)) for k in ('kick', 'clap', 'hats', 'perc', 'sub', 'bass', 'pad', 'pluck', 'lead', 'bell', 'fx')}

CH = {  # chord -> (bass root midi, upper voicing)
    'Am': (45, [64, 69, 72]), 'F': (41, [65, 69, 72]), 'C': (36, [64, 67, 72]), 'G': (43, [62, 67, 71]),
    'E': (40, [64, 68, 71]), 'Dm': (38, [62, 65, 69]), 'Fmaj7': (41, [64, 69, 72]), 'Em': (40, [64, 67, 71]),
}
# (start, chord, beats)
CHORDS = []
for k, c in enumerate(['Am', 'F', 'C', 'G', 'Fmaj7', 'C', 'G', 'G', 'Am', 'F', 'C', 'G']):
    CHORDS.append((A_BAR(k), c, 4))
CHORDS += [(B_BAR(0), 'Am', 4), (B_BAR(1), 'F', 4), (B_BAR(2), 'E', 2), (B_BAR(2) + 1.0, 'C', 2),
           (B_BAR(3), 'Am', 2), (B_BAR(3) + 1.0, 'F', 2), (B_BAR(4), 'G', 4),
           (B_BAR(5), 'C', 4), (B_BAR(6), 'G', 4), (B_BAR(7), 'Am', 4), (B_BAR(8), 'F', 4), (B_BAR(9), 'G', 4),
           (B_BAR(10), 'C', 4), (B_BAR(11), 'F', 2), (B_BAR(11) + 1.0, 'G', 2),
           (B_BAR(12), 'Am', 4), (B_BAR(13), 'F', 2), (B_BAR(13) + 1.0, 'G', 2), (B_BAR(14), 'C', 8)]


def chord_at(t):
    cur = CHORDS[0]
    for c in CHORDS:
        if c[0] <= t + 1e-6: cur = c
    return cur[1]


def in_section(t):
    """energy sections"""
    if t < A_BAR(4): return 'intro'
    if t < A_BAR(7): return 'imagine'
    if t < A_BAR(8): return 'build1'
    if t < STOP: return 'drop1'
    if t < B_BAR(0): return 'gap'
    if t < B_BAR(2) + 1.0: return 'dark'
    if t < B_BAR(4): return 'lift'
    if t < B_BAR(5): return 'build2'
    if t < B_BAR(8): return 'drop2'
    if t < B_BAR(10): return 'cta'
    if t < B_BAR(14): return 'outro'
    return 'end'


# ---------------- drum voices ----------------
def kick_hit(tone=1.0):
    n = n_of(0.45)
    x = np.arange(n) / SR
    f = 48 + (160 - 48) * np.exp(-x / 0.035)
    y = sine(f * tone, n=n) * exp_env(n, 0.26, 0.0015)
    y[:n_of(0.008)] += hp(noise(0.008, 3), 2500) * exp_env(n_of(0.008), 0.002) * 0.35
    return sat(y, 2.2) * 0.9


def clap_hit(seed=5):
    n = n_of(0.35)
    y = np.zeros(n)
    for i, o in enumerate((0.0, 0.009, 0.019)):
        b = bp(noise(0.03, seed + i), 900, 3200) * exp_env(n_of(0.03), 0.005)
        j = n_of(o); y[j:j + len(b)] += b
    tail = bp(noise(0.3, seed + 9), 900, 4000) * exp_env(n_of(0.3), 0.07)
    y[n_of(0.025):n_of(0.025) + len(tail)] += tail[:n - n_of(0.025)] * 0.7
    return y


def hat_hit(open_=False, seed=7):
    d = 0.16 if open_ else 0.05
    n = n_of(d)
    y = hp(bp(noise(d, seed), 6500, 14000), 7000) * exp_env(n, 0.06 if open_ else 0.012)
    return y


def snare_hit(seed=9, pitch=1.0):
    n = n_of(0.25)
    y = bp(noise(0.25, seed), 1400, 7000) * exp_env(n, 0.07) + sine(190 * pitch, n=n) * exp_env(n, 0.05) * 0.6
    return y


def crash(dur=2.2, seed=11):
    n = n_of(dur)
    y = hp(noise(dur, seed), 4500) * exp_env(n, 0.55, 0.002) + bp(noise(dur, seed + 1), 6000, 12000) * exp_env(n, 0.3) * 0.5
    return widen(y, 0.6)


KICK, CLAP = kick_hit(), clap_hit()
HAT_C, HAT_O = hat_hit(False), hat_hit(True)


def beats(t0, t1, step=BEAT, off=0.0):
    t = t0 + off
    while t < t1 - 1e-6:
        yield t
        t += step


# ---------------- drums arrangement ----------------
def drums():
    K, C, H, P = stems['kick'], stems['clap'], stems['hats'], stems['perc']
    # intro: four-on-the-floor + claps + offbeat hats, from the first frame
    for t in beats(A0, A_BAR(4)):
        place(K, pan(KICK, 0), t)
    for t in beats(A0, A_BAR(4), 1.0, 0.5):
        place(C, pan(CLAP, 0.05), t)
    for t in beats(A0, A_BAR(4), 0.5, 0.25):
        place(H, pan(HAT_O, 0.25), t, 0.55)
    # imagine: half-time kick, softer hats, shaker 16ths
    for t in beats(A_BAR(4), A_BAR(7), 1.0):
        place(K, pan(KICK, 0), t, 0.8)
    for t in beats(A_BAR(4), A_BAR(7), 2.0, 1.0):
        place(C, pan(CLAP, 0), t, 0.7)
    for i, t in enumerate(beats(A_BAR(4), A_BAR(7), 0.125)):
        place(P, pan(hat_hit(False, 100 + i % 7), -0.3), t, 0.25 if i % 2 else 0.4)
    # build 1 (bar 7): snare roll accelerating, kick on 1-2 only
    for t in beats(A_BAR(7), A_BAR(7) + 1.0):
        place(K, pan(KICK, 0), t, 0.85)
    t, k = A_BAR(7), 0
    while t < A_BAR(8) - 0.05:
        p = (t - A_BAR(7)) / 2.0
        step = 0.25 if p < 0.5 else (0.125 if p < 0.8 else 0.0625)
        place(P, pan(snare_hit(200 + k, 1 + p * 0.6), 0), t, 0.25 + 0.75 * p)
        t += step; k += 1
    # drop 1
    for t in beats(A_BAR(8), STOP):
        place(K, pan(KICK, 0), t)
    for t in beats(A_BAR(8), STOP, 1.0, 0.5):
        place(C, pan(CLAP, 0.05), t)
    for t in beats(A_BAR(8), STOP, 0.5, 0.25):
        place(H, pan(HAT_O, 0.2), t, 0.7)
    for i, t in enumerate(beats(A_BAR(8), STOP, 0.125)):
        if i % 2: place(H, pan(HAT_C, -0.25), t, 0.35)
    place(stems['fx'], crash(), A_BAR(8), 0.55)
    # dark: half-time kick, ticking 16th hats
    for t in beats(B_BAR(0), B_BAR(2) + 1.0, 1.0):
        place(K, pan(KICK, 0), t, 0.75)
    for i, t in enumerate(beats(B_BAR(0), B_BAR(2) + 1.0, 0.125)):
        place(H, pan(HAT_C, 0.3 if i % 2 else -0.3), t, 0.45 if i % 4 == 2 else 0.22)
    for t in beats(B_BAR(1), B_BAR(2) + 1.0, 2.0, 1.0):
        place(C, pan(CLAP, 0), t, 0.6)
    # lift: four-on-floor returns lightly, claps, open hats
    for t in beats(B_BAR(2) + 1.0, B_BAR(4)):
        place(K, pan(KICK, 0), t, 0.8)
    for t in beats(B_BAR(2) + 1.0, B_BAR(4), 1.0, 0.5):
        place(C, pan(CLAP, 0.05), t, 0.8)
    for t in beats(B_BAR(2) + 1.0, B_BAR(4), 0.5, 0.25):
        place(H, pan(HAT_O, 0.25), t, 0.5)
    place(stems['fx'], crash(1.6, 13), B_BAR(2) + 1.0, 0.35)
    # build 2 (bar B4)
    for t in beats(B_BAR(4), B_BAR(4) + 1.0):
        place(K, pan(KICK, 0), t, 0.85)
    t, k = B_BAR(4), 0
    while t < B_BAR(5) - 0.05:
        p = (t - B_BAR(4)) / 2.0
        step = 0.25 if p < 0.5 else (0.125 if p < 0.8 else 0.0625)
        place(P, pan(snare_hit(300 + k, 1 + p * 0.6), 0), t, 0.25 + 0.75 * p)
        t += step; k += 1
    # drop 2 + cta + outro
    for t in beats(B_BAR(5), B_BAR(14)):
        place(K, pan(KICK, 0), t, 0.9 if B_BAR(8) <= t < B_BAR(10) else 1.0)
    for t in beats(B_BAR(5), B_BAR(14), 1.0, 0.5):
        place(C, pan(CLAP, 0.05), t)
    for t in beats(B_BAR(5), B_BAR(14), 0.5, 0.25):
        place(H, pan(HAT_O, 0.2), t, 0.7)
    for i, t in enumerate(beats(B_BAR(5), B_BAR(14), 0.125)):
        if i % 2: place(H, pan(HAT_C, -0.25), t, 0.35)
    for tb in (B_BAR(5), B_BAR(10), B_BAR(12)):
        place(stems['fx'], crash(), tb, 0.55)
    # final hit
    place(K, pan(KICK, 0), B_BAR(14), 1.1)
    place(stems['fx'], crash(3.0, 17), B_BAR(14), 0.7)


# ---------------- tonal voices ----------------
def supersaw(freq, n, voices=7, spread=18.0, seed=0):
    r = np.random.default_rng(seed)
    L = np.zeros(n); Rr = np.zeros(n)
    for i in range(voices):
        c = spread * (i - (voices - 1) / 2) / ((voices - 1) / 2)
        y = saw(freq * 2 ** (c / 1200), n=n, phase0=r.random())
        p = (i / (voices - 1)) * 2 - 1
        L += y * np.cos((p + 1) * np.pi / 4); Rr += y * np.sin((p + 1) * np.pi / 4)
    return np.stack([L, Rr]) / voices


def sidechain_env(t0, n, depth=0.6, rel=0.18):
    """gain curve (n samples from t0) pumping with the kick on every beat"""
    x = np.arange(n) / SR
    ph = ((t0 + x - (A0 if t0 < B0 - 1 else B0)) % BEAT)
    return 1 - depth * np.exp(-ph / rel) * (ph < BEAT)


def pads():
    P = stems['pad']
    for i, (t0, ch, nb) in enumerate(CHORDS):
        if STOP <= t0 < B_BAR(0): continue
        dur = nb * BEAT
        sec = in_section(t0)
        if sec in ('intro',):
            a, rel, cut, lvl, sc = 0.02, 0.3, 2600, 0.55, 0.45
        elif sec == 'imagine':
            a, rel, cut, lvl, sc = 0.35, 0.8, 2000, 0.75, 0.0
        elif sec in ('build1', 'build2'):
            a, rel, cut, lvl, sc = 0.1, 0.3, 1400, 0.6, 0.0
        elif sec == 'dark':
            a, rel, cut, lvl, sc = 0.25, 0.6, 1300, 0.95, 0.0
        elif sec == 'lift':
            a, rel, cut, lvl, sc = 0.05, 0.5, 3000, 0.7, 0.3
        elif sec == 'end':
            a, rel, cut, lvl, sc = 0.005, 2.5, 5000, 1.0, 0.0
        else:  # drops, cta, outro
            a, rel, cut, lvl, sc = 0.01, 0.25, 3600 if sec != 'cta' else 2800, 0.8, 0.6
        n = n_of(dur + rel)
        _, ups = CH[ch]
        notes = ups + [ups[0] + 12] if sec in ('drop1', 'drop2', 'outro', 'end') else ups
        sig = sum(supersaw(midi_hz(m), n, 7, 16, seed=i * 7 + m) for m in notes) / len(notes)
        env = adsr(n, a, 0.3, 0.85, rel, hold=dur)
        sig = sig * env
        fc = np.full(n, cut)
        if sec in ('build1', 'build2'):
            fc = np.linspace(cut, 7000, n)
        sig = sweep(sig, fc, 'lp', res=0.15)
        if sc > 0:
            sig = sig * sidechain_env(t0, n, sc)[None, :]
        place(P, sig, t0, lvl)


def basses():
    S, B = stems['sub'], stems['bass']
    for t0, ch, nb in CHORDS:
        if STOP <= t0 < B_BAR(0): continue
        sec = in_section(t0)
        root = CH[ch][0]
        f = midi_hz(root - 12)  # sub octave (A=55Hz, F=43.6Hz...)
        if sec in ('intro', 'drop1', 'drop2', 'cta', 'outro', 'lift'):
            # pumping offbeat 8ths + sustained sub
            for t in beats(t0, t0 + nb * BEAT, 0.5, 0.25):
                n = n_of(0.22)
                y = sine(f * 2, n=n) * adsr(n, 0.004, 0.05, 0.8, 0.04)
                y += 0.25 * sine(f * 4, n=n) * adsr(n, 0.004, 0.05, 0.8, 0.04)
                place(S, pan(y, 0), t, 0.7)
                if sec != 'intro':
                    m = saw(f * 4 * 2 ** (8 / 1200), n=n) + saw(f * 4 * 2 ** (-8 / 1200), n=n)
                    m = lp(m * adsr(n, 0.004, 0.08, 0.6, 0.04), 650)
                    place(B, pan(sat(m, 1.8), 0), t, 0.32)
            for t in beats(t0, t0 + nb * BEAT, 1.0):
                n = n_of(0.24)
                y = sine(f, n=n) * adsr(n, 0.01, 0.1, 0.7, 0.08)
                place(S, pan(y, 0), t + 0.02, 0.6)
        elif sec == 'dark':
            for t in beats(t0, t0 + nb * BEAT, 0.25):
                n = n_of(0.2)
                y = sine(f * 2, n=n) * adsr(n, 0.003, 0.06, 0.5, 0.05)
                m = lp(saw(f * 2, n=n) * adsr(n, 0.003, 0.06, 0.4, 0.05), 380)
                place(S, pan(y, 0), t, 0.55)
                place(B, pan(m, 0), t, 0.35)
        elif sec in ('imagine', 'build1', 'build2', 'end'):
            n = n_of(nb * BEAT + 0.3)
            y = sine(f * 2, n=n) * adsr(n, 0.05, 0.3, 0.8, 0.3, hold=nb * BEAT)
            place(S, pan(y, 0), t0, 0.7)


def plucks():
    """16th-note arpeggio, filtered pluck with ping-pong delay"""
    Pk = stems['pluck']
    pat = [0, 1, 2, 3, 2, 1, 0, 2, 1, 3, 2, 1, 0, 1, 3, 2]
    spans = [(A0, A_BAR(4), 0.7), (A_BAR(4), A_BAR(7), 0.55), (B_BAR(2) + 1.0, B_BAR(4), 0.75),
             (B_BAR(5), B_BAR(8), 0.5), (B_BAR(10), B_BAR(14), 0.6)]
    for s0, s1, lvl in spans:
        for i, t in enumerate(beats(s0, s1, 0.125)):
            ch = chord_at(t)
            ups = CH[ch][1]
            tones = [ups[0] + 12, ups[1] + 12, ups[2] + 12, ups[0] + 24]
            m = tones[pat[i % 16]]
            n = n_of(0.3)
            y = 0.6 * saw(midi_hz(m), n=n) + 0.4 * square(midi_hz(m) * 1.002, n=n)
            fc = 400 + 4200 * np.exp(-np.arange(n) / SR / 0.05)
            y = sweep(y * exp_env(n, 0.11, 0.002), fc, 'lp', res=0.2)
            acc = 1.0 if i % 4 == 0 else 0.7
            place(Pk, pan(y, 0.35 if i % 2 else -0.35), t, lvl * acc)


def bells():
    """soft glockenspiel line for the 'imagine' section and the uplift"""
    Bl = stems['bell']
    mel = [(0, 81), (0.75, 79), (1.5, 76), (2.0, 84), (2.75, 83), (3.5, 79)]
    for bar0 in (A_BAR(4), A_BAR(5), A_BAR(6)):
        for o, m in mel:
            n = n_of(1.2)
            y = sine(midi_hz(m), n=n) * exp_env(n, 0.45) + 0.12 * sine(midi_hz(m) * 2.0, n=n) * exp_env(n, 0.1)
            place(Bl, pan(y, 0.2), bar0 + o, 0.22)


def lead():
    """outro hook (no voice under it)"""
    Ld = stems['lead']
    motif = [(0.0, 76, 0.5), (0.5, 79, 0.25), (0.75, 81, 0.5), (1.25, 79, 0.25), (1.5, 76, 0.5),
             (2.0, 74, 0.5), (2.5, 76, 0.25), (2.75, 79, 0.5), (3.25, 76, 0.25), (3.5, 74, 0.25), (3.75, 72, 0.25)]
    for bar0 in (B_BAR(10), B_BAR(11), B_BAR(12), B_BAR(13)):
        for o, m, d in motif:
            n = n_of(d + 0.15)
            x = np.arange(n) / SR
            vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * x) * np.clip((x - 0.12) / 0.1, 0, 1)
            f = midi_hz(m) * vib
            y = supersaw(f, n, 5, 10, seed=m)
            y = y * adsr(n, 0.008, 0.1, 0.75, 0.12, hold=d)[None, :]
            y = sweep(y, 5200, 'lp', res=0.1)
            place(Ld, y, bar0 + o, 0.55)


def fx():
    F = stems['fx']
    import sfx
    # risers into both drops
    place(F, sfx.riser(2.0) * 0.45, A_BAR(7))
    place(F, sfx.riser(2.0) * 0.45, B_BAR(4))
    # reverse crash into drop 2 / outro
    for tb in (B_BAR(5), B_BAR(10)):
        rc = crash(1.0, 19)[:, ::-1]
        place(F, rc * 0.35, tb - rc.shape[1] / SR)
    # sub drop after drop 1 & gap swell into section B
    place(F, sfx.whoosh_rev() * 0.4, B_BAR(0) - 1.0)


def tape_stop(x, t, dur=0.38):
    """slow the music to a halt from time t (playback rate 1 -> 0), silence afterwards"""
    i0 = n_of(t)
    seg_n = n_of(dur)
    rate = np.linspace(1, 0, seg_n) ** 1.3
    pos = np.cumsum(rate)
    out = x.copy()
    for c in range(2):
        out[c, i0:i0 + seg_n] = np.interp(i0 + pos, np.arange(x.shape[1]), x[c]) * np.linspace(1, 0.2, seg_n)
    out[:, i0 + seg_n:n_of(B0) - 1] = 0  # silence every tail until section B
    return out


def build(outdir):
    drums(); pads(); basses(); plucks(); bells(); lead(); fx()
    # per-stem processing
    stems['clap'] = reverb(stems['clap'], room=0.55, wet=0.18, tail=0)[:, :N]
    stems['pad'] = chorus(reverb(stems['pad'], room=0.75, wet=0.28, tail=0)[:, :N], 0.4, 0.2, 0.3)[:, :N]
    stems['pluck'] = reverb(delay(stems['pluck'], 0.375, 0.32, 0.28, tail=0)[:, :N], room=0.6, wet=0.2, tail=0)[:, :N]
    stems['bell'] = reverb(delay(stems['bell'], 0.375, 0.3, 0.3, tail=0)[:, :N], room=0.8, wet=0.35, tail=0)[:, :N]
    stems['lead'] = reverb(delay(stems['lead'], 0.375, 0.28, 0.22, tail=0)[:, :N], room=0.7, wet=0.25, tail=0)[:, :N]
    stems['bass'] = lp(stems['bass'], 900)
    stems['hats'] = lp(stems['hats'], 13000)
    stems['sub'] = lp(stems['sub'], 220)
    lv = {'kick': -8.0, 'clap': -8.0, 'hats': -11.0, 'perc': -12.0, 'sub': -9.5, 'bass': -1.0,
          'pad': 0.0, 'pluck': -6.0, 'lead': -6.0, 'bell': -9.0, 'fx': -15.0}
    bus = np.zeros((2, N))
    os.makedirs(outdir, exist_ok=True)
    for k, v in stems.items():
        v = v * db(lv[k])
        if k not in ('fx',):
            v = tape_stop(v, STOP)
        sf.write(f'{outdir}/stem_{k}.wav', v.T.astype(np.float32), SR, subtype='FLOAT')
        bus += v
    sf.write(f'{outdir}/music_bus.wav', bus.T.astype(np.float32), SR, subtype='FLOAT')
    print('music bus peak', np.abs(bus).max())


if __name__ == '__main__':
    import sys, time
    t0 = time.time()
    build(sys.argv[1] if len(sys.argv) > 1 else 'build')
    print(f'music built in {time.time() - t0:.1f}s')
