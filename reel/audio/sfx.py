"""Synthesised sound effects. Every function returns a stereo array (2, n) peaking near 1.0;
the cue gain sets the final level. All designs are original (no samples)."""
import numpy as np
from dsp import (SR, n_of, tt, noise, pink, sine, saw, square, tri, exp_env, adsr, fade, lp, hp, bp,
                 sweep, pan, st, reverb, delay, sat, place, midi_hz, widen)


def norm(x, peak=0.95):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


def curve(a, b, n, shape=1.0):
    x = np.linspace(0, 1, n) ** shape
    return a * (b / a) ** x if a > 0 and b > 0 else a + (b - a) * x


# ---------------- whooshes ----------------
def _whoosh(dur=0.5, f0=250, f1=3500, f2=None, peak=0.55, res=0.35, pan0=-0.7, pan1=0.7, seed=1, sub=0.0, rev=0.25, color='pink'):
    n = n_of(dur)
    src = pink(dur, seed) if color == 'pink' else noise(dur, seed)
    x = np.linspace(0, 1, n)
    if f2 is None:
        fc = f0 * (f1 / f0) ** x
    else:  # up then down
        fc = np.where(x < peak, f0 * (f1 / f0) ** (x / peak), f1 * (f2 / f1) ** ((x - peak) / (1 - peak)))
    y = sweep(src * 0.5, fc, 'bp12', res=res)
    env = np.where(x < peak, (x / peak) ** 2.2, ((1 - x) / (1 - peak)) ** 1.6)
    y = y * env
    if sub > 0:
        y = y + sub * sine(curve(70, 40, n), n=n) * env ** 1.5
    out = pan(y, np.linspace(pan0, pan1, n))
    out = reverb(out, room=0.55, wet=rev, dry=1.0, tail=0.6)
    return norm(out)


def whoosh(**k): return _whoosh(0.45, 300, 4200, 900, peak=0.62, seed=11)
def whoosh_small(**k): return _whoosh(0.32, 600, 5000, 1500, peak=0.6, seed=12, rev=0.15)
def whoosh_big(**k): return _whoosh(0.62, 160, 3200, 400, peak=0.7, seed=13, sub=0.6, rev=0.35)
def whoosh_deep(**k): return _whoosh(0.9, 70, 900, 200, peak=0.45, seed=14, sub=0.9, rev=0.45, pan0=0.4, pan1=-0.4)
def whoosh_logo(**k): return _whoosh(0.8, 200, 6000, 1200, peak=0.35, seed=15, sub=0.4, rev=0.5, pan0=-0.3, pan1=0.3)
def swoosh_up(**k): return _whoosh(0.4, 400, 7000, None, peak=0.85, seed=16, rev=0.2, pan0=0, pan1=0.2)
def whoosh_up(**k): return _whoosh(0.5, 250, 6500, None, peak=0.8, seed=17, rev=0.25, pan0=0, pan1=0)
def whoosh_down(**k): return _whoosh(0.55, 5000, 180, None, peak=0.25, seed=18, sub=0.5, rev=0.3, pan0=0, pan1=0)
def swipe(**k): return _whoosh(0.2, 1500, 7000, 3000, peak=0.5, seed=19, rev=0.1, pan0=0.3, pan1=-0.3, color='white')
def swish_text(**k): return _whoosh(0.25, 2000, 9000, 4000, peak=0.4, seed=20, rev=0.15, pan0=-0.5, pan1=0.5, color='white')


def whoosh_rev(**k):
    y = _whoosh(0.42, 300, 5000, 2500, peak=0.8, seed=21, rev=0.3)[:, :n_of(0.75)]
    return y[:, ::-1].copy()


def whoosh_double(**k):
    a = _whoosh(0.35, 400, 5000, 1200, peak=0.6, seed=22, pan0=-0.9, pan1=-0.2)
    b = _whoosh(0.35, 380, 4800, 1100, peak=0.6, seed=23, pan0=0.9, pan1=0.2)
    out = np.zeros((2, a.shape[1] + n_of(0.07)))
    place(out, a, 0); place(out, b, 0.07)
    return norm(out)


def plane_zip(**k):
    n = n_of(0.55)
    x = np.linspace(0, 1, n)
    whine = sine(1500 * (1.15 - 0.3 * x), n=n) * np.sin(np.pi * x) ** 2
    y = _whoosh(0.55, 500, 6000, 1500, peak=0.5, seed=24, rev=0.2, pan0=-0.8, pan1=0.6)
    w = pan(whine * 0.25, np.linspace(-0.8, 0.6, n))
    out = np.zeros((2, max(y.shape[1], n))); place(out, y, 0); place(out, w, 0)
    return norm(out)


# ---------------- impacts ----------------
def _boom(dur=1.4, f0=58, f1=30, tau=0.45, level=1.0):
    n = n_of(dur)
    return sine(curve(f0, f1, n, 0.5), n=n) * exp_env(n, tau, 0.004) * level


def _kick(f0=150, f1=45, tau=0.18, click=0.4, seed=1):
    n = n_of(0.5)
    body = sine(curve(f0, f1, n, 0.35), n=n) * exp_env(n, tau, 0.001)
    c = hp(noise(0.012, seed), 1500) * exp_env(n_of(0.012), 0.003)
    body[:len(c)] += c * click
    return sat(body, 1.8)


def impact_big(**k):
    n = n_of(2.4)
    y = np.zeros(n)
    y[:n_of(1.6)] += _boom(1.6, 62, 28, 0.6)
    k_ = _kick(170, 42, 0.22, 0.5, seed=31); y[:len(k_)] += k_ * 0.9
    crack = bp(noise(0.08, 32), 800, 7000) * exp_env(n_of(0.08), 0.018)
    y[:len(crack)] += crack * 0.2
    out = reverb(pan(y * 0.8, 0), room=0.85, damp=0.4, wet=0.28, dry=1.0, tail=1.2)
    wash = hp(pink(2.2, 33), 3000) * exp_env(n_of(2.2), 0.6) * 0.05
    out[:, :len(wash)] += widen(wash, 0.5)[:, :len(wash)]
    return norm(out)


def impact(**k):
    n = n_of(1.4)
    y = np.zeros(n)
    y[:n_of(1.0)] += _boom(1.0, 70, 34, 0.35, 0.8)
    k_ = _kick(160, 48, 0.16, 0.4, seed=34); y[:len(k_)] += k_
    out = reverb(pan(y, 0), room=0.7, wet=0.22, tail=0.8)
    return norm(out)


def impact_small(**k):
    k_ = _kick(180, 55, 0.12, 0.6, seed=35)
    crack = bp(noise(0.03, 36), 1500, 8000) * exp_env(n_of(0.03), 0.008) * 0.3
    k_[:len(crack)] += crack
    return norm(reverb(pan(k_, 0), room=0.5, wet=0.15, tail=0.5))


def thud(**k):
    p = k.get('pitch', 1.0)
    n = n_of(0.35)
    y = sine(curve(140 * p, 60 * p, n, 0.4), n=n) * exp_env(n, 0.07)
    cl = lp(noise(0.02, 37), 3000) * exp_env(n_of(0.02), 0.005) * 0.3
    y[:len(cl)] += cl
    return norm(reverb(pan(sat(y, 1.5), 0), room=0.4, wet=0.12, tail=0.4))


def stamp(**k):
    n = n_of(0.5)
    y = sine(curve(170, 70, n, 0.4), n=n) * exp_env(n, 0.06) * 0.9
    slap = bp(noise(0.06, 38), 300, 4500) * exp_env(n_of(0.06), 0.012)
    y[:len(slap)] += slap * 0.8
    rattle = bp(noise(0.12, 39), 1500, 5000) * exp_env(n_of(0.12), 0.03) * 0.12
    y[n_of(0.03):n_of(0.03) + len(rattle)] += rattle
    return norm(reverb(pan(sat(y, 2.0), 0.05), room=0.45, wet=0.14, tail=0.5))


def final_hit(**k):
    a = impact_big()
    n = n_of(3.2)
    t = tt(3.2)
    # bright major chord stab (C major) ringing out
    chord = sum(saw(midi_hz(m) * (1 + d), n=n) for m in (60, 64, 67, 72, 76) for d in (-0.004, 0.004)) / 10
    chord = lp(chord, 3500) * exp_env(n, 0.9, 0.003)
    out = np.zeros((2, max(a.shape[1], n) + n_of(1.5)))
    place(out, a, 0)
    place(out, reverb(widen(chord * 0.5, 0.4), room=0.9, wet=0.45, tail=1.5), 0)
    return norm(out)


# ---------------- UI / bells ----------------
def _bell(f, dur=1.2, partials=((1, 1, 1.0), (2.76, 0.5, 0.45), (5.4, 0.25, 0.3), (8.93, 0.12, 0.2)), tau=0.5):
    n = n_of(dur)
    y = np.zeros(n)
    for ratio, amp, tf in partials:
        y += amp * sine(f * ratio, n=n) * exp_env(n, tau * tf, 0.001)
    return y


def pop(**k):
    p = k.get('pitch', 1.0)
    n = n_of(0.16)
    y = sine(curve(900 * p, 380 * p, n, 0.6), n=n) * exp_env(n, 0.04, 0.001)
    cl = hp(noise(0.006, 41), 2000) * 0.25
    y[:len(cl)] += cl
    return norm(reverb(pan(y, 0), room=0.3, wet=0.12, tail=0.3))


def like_pop(**k):
    a = pop(pitch=1.25)
    sp = sparkle(dur=0.6)
    out = np.zeros((2, max(a.shape[1], sp.shape[1])))
    place(out, a, 0); place(out, sp * 0.5, 0.03)
    return norm(out)


def tick(**k):
    n = n_of(0.05)
    y = bp(noise(0.05, 42), 2500, 9000) * exp_env(n, 0.004) + sine(2200, n=n) * exp_env(n, 0.006) * 0.3
    return norm(pan(y, 0.1))


def type_(**k):
    n = n_of(0.08)
    y = bp(noise(0.08, 43), 1500, 7000) * exp_env(n, 0.008) * 0.8 + sine(320, n=n) * exp_env(n, 0.015) * 0.5
    return norm(pan(y, 0))


def card(**k):
    p = k.get('pitch', 1.0)
    w = _whoosh(0.22, 400, 3000, 900, peak=0.7, seed=44, rev=0.1, pan0=-0.2, pan1=0.2)
    b = _bell(midi_hz(79) * p, 0.8, tau=0.25) * 0.6
    out = np.zeros((2, max(w.shape[1], n_of(1.1))))
    place(out, w * 0.6, 0)
    place(out, reverb(pan(b, 0), room=0.6, wet=0.3, tail=0.6), 0.1)
    return norm(out)


def step(**k):
    p = k.get('pitch', 1.0)
    f = midi_hz(72) * p
    n = n_of(0.9)
    y = (sine(f, n=n) * exp_env(n, 0.35) + 0.4 * sine(f * 4, n=n) * exp_env(n, 0.06) + 0.15 * sine(f * 10, n=n) * exp_env(n, 0.02))
    return norm(delay(reverb(pan(y, 0), room=0.6, wet=0.25, tail=0.6), 0.25, 0.25, 0.2, tail=0.6))


def ding(**k):
    y = _bell(midi_hz(91), 1.6, tau=0.7)
    return norm(reverb(pan(y, 0.1), room=0.7, wet=0.35, tail=1.0))


def _two_tone(f1, f2, gap=0.12, dur=1.0, tau=0.35):
    n = n_of(dur + gap)
    y = np.zeros(n)
    a = _bell(f1, dur, tau=tau); y[:len(a)] += a
    b = _bell(f2, dur, tau=tau); y[n_of(gap):n_of(gap) + len(b)] += b[:n - n_of(gap)]
    return y


def notif(**k):
    y = _two_tone(midi_hz(88), midi_hz(93), 0.1, 0.9, 0.3)
    return norm(reverb(pan(y, -0.1), room=0.5, wet=0.25, tail=0.6))


def notif2(**k):
    y = _two_tone(midi_hz(86), midi_hz(91), 0.09, 0.9, 0.3)
    return norm(reverb(pan(y, 0.1), room=0.5, wet=0.25, tail=0.6))


def cabin_chime(**k):
    """The classic aircraft PA 'bing-bong' (high then low), soft and warm."""
    partials = ((1, 1, 1.0), (2.0, 0.25, 0.6), (3.0, 0.08, 0.4))
    a = _bell(midi_hz(81), 1.6, partials, tau=0.8)
    b = _bell(midi_hz(77), 2.0, partials, tau=1.0)
    n = n_of(2.6)
    y = np.zeros(n)
    y[:len(a)] += a
    o = n_of(0.55); y[o:o + len(b)] += b[:n - o]
    return norm(reverb(pan(y * 0.9, 0), room=0.75, wet=0.3, tail=1.0))


def alert(**k):
    return cabin_chime()


def pin(**k):
    n = n_of(0.35)
    y = sine(curve(420, 980, n, 0.5), n=n) * exp_env(n, 0.09, 0.002)
    b = _bell(midi_hz(84), 0.8, tau=0.25) * 0.5
    out = np.zeros(max(n, len(b)) + n_of(0.05))
    out[:n] += y; out[n_of(0.05):n_of(0.05) + len(b)] += b
    return norm(reverb(pan(out, 0), room=0.55, wet=0.25, tail=0.6))


def pin_drop(**k):
    out = np.zeros(n_of(1.2))
    n = n_of(0.16)
    fall = sine(curve(1400, 350, n, 0.8), n=n) * np.linspace(0.3, 1, n) ** 2 * 0.35
    out[:n] += fall
    for i, (t, g) in enumerate([(0.16, 1.0), (0.36, 0.35), (0.5, 0.15)]):
        th = sine(curve(190, 70, n_of(0.25), 0.4), n=n_of(0.25)) * exp_env(n_of(0.25), 0.06) * g
        j = n_of(t); out[j:j + len(th)] += th
    return norm(reverb(pan(sat(out, 1.4), 0), room=0.45, wet=0.18, tail=0.5))


def sparkle(dur=0.7, seed=45, up=False, **k):
    r = np.random.default_rng(seed)
    out = np.zeros((2, n_of(dur + 0.8)))
    m = 14
    for i in range(m):
        t = (i / m) * dur * 0.8 + r.random() * 0.04
        f = (2600 + r.random() * 4500) * ((1 + i / m * 0.8) if up else 1)
        b = _bell(f, 0.5, ((1, 1, 1), (2.4, 0.3, 0.5)), tau=0.12) * (0.4 + 0.6 * r.random())
        place(out, pan(b, r.uniform(-0.8, 0.8)), t)
    return norm(reverb(out, room=0.75, wet=0.4, tail=0.8))


def shimmer(**k):
    return sparkle(0.6, 46, up=True)


def logo_sting(**k):
    n = n_of(2.4)
    chord = sum(_bell(midi_hz(m), 2.4, ((1, 1, 1), (2, 0.3, 0.5), (3, 0.1, 0.3)), tau=0.9) for m in (72, 76, 79, 84)) / 4
    sw = whoosh_rev()[:, :n_of(0.55)]
    out = np.zeros((2, n + n_of(1.0)))
    place(out, sw * 0.5, 0)
    place(out, reverb(widen(chord, 0.4), room=0.8, wet=0.4, tail=1.0), 0.35)
    return norm(out)


# ---------------- mechanical / foley ----------------
def page_flip(**k):
    n = n_of(0.22)
    x = np.linspace(0, 1, n)
    y = bp(noise(0.22, 47), 900, 6000) * (np.exp(-((x - 0.25) / 0.12) ** 2) + 0.6 * np.exp(-((x - 0.55) / 0.08) ** 2))
    y += lp(noise(0.22, 48), 400) * np.exp(-((x - 0.3) / 0.15) ** 2) * 0.6
    return norm(reverb(pan(y, 0.2), room=0.3, wet=0.1, tail=0.3))


def _clink(f, seed, dur=0.25):
    n = n_of(dur)
    y = sum(a * sine(f * r_, n=n) * exp_env(n, tau) for r_, a, tau in ((1, 1, 0.08), (1.47, 0.6, 0.05), (2.09, 0.4, 0.03), (2.81, 0.25, 0.02)))
    y[:n_of(0.004)] += hp(noise(0.004, seed), 3000) * 0.4
    return y


def coins_stream(dur=1.5, **k):
    r = np.random.default_rng(49)
    out = np.zeros((2, n_of(dur + 0.4)))
    t = 0.0
    while t < dur:
        f = r.uniform(2400, 5200)
        place(out, pan(_clink(f, int(t * 1000)), r.uniform(-0.6, 0.6)) * r.uniform(0.3, 1.0), t)
        t += r.exponential(0.035)
    return norm(reverb(out, room=0.35, wet=0.12, tail=0.3))


def cash(**k):
    out = np.zeros((2, n_of(1.6)))
    b = _bell(midi_hz(93), 1.2, tau=0.4) + _bell(midi_hz(100), 1.2, tau=0.35) * 0.6
    place(out, pan(b * 0.6, 0), 0.0)
    place(out, coins_stream(0.5) * 0.7, 0.05)
    return norm(reverb(out, room=0.5, wet=0.2, tail=0.5))


def flaps(dur=0.9, **k):
    r = np.random.default_rng(50)
    out = np.zeros((2, n_of(dur + 0.3)))
    t = 0.0
    while t < dur:
        n = n_of(0.03)
        c = hp(noise(0.03, int(t * 1e4) % 100000), 1800) * exp_env(n, 0.004) + sine(r.uniform(900, 1500), n=n) * exp_env(n, 0.006) * 0.4
        dens = 1 - t / dur
        place(out, pan(c, r.uniform(-0.7, 0.7)) * r.uniform(0.4, 1.0) * (0.4 + 0.6 * dens), t)
        t += r.exponential(0.012 + 0.03 * (t / dur))
    return norm(reverb(out, room=0.35, wet=0.12, tail=0.3))


def shutter(**k):
    out = np.zeros((2, n_of(0.35)))
    for i, (t, f) in enumerate([(0.0, 2500), (0.07, 1800)]):
        n = n_of(0.04)
        c = bp(noise(0.04, 51 + i), f * 0.5, f * 3) * exp_env(n, 0.006) + sine(f * 0.3, n=n) * exp_env(n, 0.01) * 0.4
        place(out, pan(c, 0), t)
    return norm(reverb(out, room=0.3, wet=0.1, tail=0.25))


def printer(dur=0.7, **k):
    n = n_of(dur)
    x = np.linspace(0, 1, n)
    buzz = saw(118, n=n) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 28 * x * dur))) * 0.5
    buzz = bp(buzz, 150, 2500)
    paper = bp(noise(dur, 52), 2000, 8000) * 0.25
    y = (buzz + paper) * np.minimum(1, np.minimum(x / 0.05, (1 - x) / 0.08))
    return norm(reverb(pan(y, 0), room=0.3, wet=0.1, tail=0.25))


def seats_fill(dur=1.0, **k):
    r = np.random.default_rng(53)
    out = np.zeros((2, n_of(dur + 0.3)))
    t = 0.0
    k_ = 0
    while t < dur:
        n = n_of(0.06)
        f = 500 + 900 * (t / dur) + r.uniform(-40, 40)
        c = sine(curve(f * 1.6, f, n, 0.5), n=n) * exp_env(n, 0.018)
        place(out, pan(c, r.uniform(-0.5, 0.5)) * 0.8, t)
        t += max(0.022, 0.06 - 0.04 * (t / dur)); k_ += 1
    return norm(reverb(out, room=0.4, wet=0.15, tail=0.3))


def phone_buzz(**k):
    n = n_of(0.75)
    x = np.arange(n) / SR
    gate = ((x % 0.38) < 0.26).astype(float)
    y = square(165, n=n) * gate * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * x))
    y = lp(y, 900)
    return norm(pan(y, 0))


def scratch(**k):
    """vinyl scratch: a pitched noisy source played with a back-and-forth rate."""
    n = n_of(0.42)
    x = np.arange(n) / SR
    rate = 1.0 + 2.6 * np.sin(2 * np.pi * x / 0.42 * 1.5) * np.exp(-x * 2)
    f = 380 * np.abs(rate) + 60
    src = saw(f, n=n) * 0.5 + bp(noise(0.42, 54), 600, 4000) * 0.8
    src = sweep(src, 500 + 2500 * np.abs(np.sin(2 * np.pi * x / 0.42 * 1.5)), 'bp12', res=0.4)
    env = np.minimum(1, x / 0.01) * np.exp(-x * 3.5)
    return norm(reverb(pan(src * env, 0), room=0.35, wet=0.1, tail=0.3))


# ---------------- ambience / tonal ----------------
def jet_flyby(dur=3.2, **k):
    n = n_of(dur)
    x = np.linspace(0, 1, n)
    prox = np.exp(-((x - 0.55) / 0.22) ** 2)
    rumble = sweep(pink(dur, 55), 300 + 2800 * prox, 'lp', res=0.1)
    whine_f = 2300 * (1 + 0.12 * (1 - 2 * x))  # doppler: higher approaching, lower leaving
    whine = sine(whine_f, n=n) * prox ** 1.5 * 0.12
    y = (rumble * (0.15 + 0.85 * prox) + whine)
    out = pan(y, np.linspace(0.8, -0.8, n))
    return norm(reverb(out, room=0.8, wet=0.3, tail=1.0))


def plane_pass(dur=1.3, **k):
    return jet_flyby(dur)


def arcs_launch(**k):
    r = np.random.default_rng(56)
    out = np.zeros((2, n_of(1.8)))
    for i in range(10):
        n = n_of(0.5)
        f0 = r.uniform(500, 900)
        pew = sine(curve(f0, f0 * 2.5, n, 0.7), n=n) * exp_env(n, 0.12) * 0.5
        place(out, pan(pew, r.uniform(-0.8, 0.8)), i * 0.055)
    place(out, _whoosh(1.0, 300, 4000, 1200, peak=0.5, seed=57, rev=0.3) * 0.6, 0)
    return norm(reverb(out, room=0.7, wet=0.3, tail=0.6))


def scan(dur=1.15, **k):
    n = n_of(dur)
    x = np.arange(n) / SR
    tone = sine(1250 + 150 * np.sin(2 * np.pi * 0.8 * x), n=n) * (0.5 + 0.5 * np.sin(2 * np.pi * 36 * x)) * 0.35
    hiss = sweep(noise(dur, 58) * 0.4, 6000 * (1 - 0.7 * x / dur) + 500, 'bp12', res=0.5)
    y = (tone + hiss) * np.minimum(1, np.minimum(x / 0.08, (dur - x) / 0.15))
    return norm(reverb(pan(y, np.sin(2 * np.pi * x / dur) * 0.3), room=0.5, wet=0.25, tail=0.5))


def blueprint_draw(dur=1.2, **k):
    n = n_of(dur)
    r = np.random.default_rng(59)
    amp = np.repeat(r.uniform(0.2, 1, int(dur * 40) + 1), n_of(1 / 40))[:n]
    amp = lp(amp, 30)
    y = bp(noise(dur, 60), 2500, 9000) * amp
    y *= np.minimum(1, np.minimum(np.arange(n) / n_of(0.1), (n - np.arange(n)) / n_of(0.2)))
    return norm(pan(y, 0.2))


def route(dur=1.0, **k):
    n = n_of(dur)
    x = np.linspace(0, 1, n)
    y = sine(curve(400, 900, n, 1.0), n=n) * np.sin(np.pi * x) ** 2 * 0.3
    out = pan(y, 0)
    for i in range(6):
        place(out, tick() * 0.25, i * dur / 6)
    return norm(reverb(out, room=0.5, wet=0.2, tail=0.4))


def riser(dur=1.4, **k):
    n = n_of(dur)
    x = np.linspace(0, 1, n)
    nz = sweep(noise(dur, 61) * 0.6, 300 * (40 ** x), 'bp12', res=0.3)
    tone = sum(saw(curve(110 * m, 880 * m, n, 1.0), n=n) for m in (1, 1.5, 2)) / 3
    tone = sweep(tone * 0.4, 400 * (20 ** x), 'lp', res=0.2)
    env = x ** 2.2
    y = (nz + tone * 0.5) * env
    out = widen(y, 0.4)
    return norm(reverb(out, room=0.6, wet=0.25, tail=0.3))


def riser_short(dur=0.4, **k):
    return riser(dur)


SFX = {k: v for k, v in globals().items() if callable(v) and not k.startswith('_') and k not in
       ('norm', 'curve', 'sine', 'saw', 'square', 'tri', 'noise', 'pink', 'exp_env', 'adsr', 'fade', 'lp', 'hp', 'bp', 'sweep',
        'pan', 'st', 'reverb', 'delay', 'sat', 'place', 'midi_hz', 'widen', 'n_of', 'tt')}
SFX['type'] = type_
