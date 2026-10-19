"""Synthesized sound-effects library (all original, no samples)."""
import numpy as np
from synth import (SR, RNG, n_of, tarr, midi_hz, db, stereo, noise, lp, hp, bp, peq, sweep_filter, expdec,
                   sine, saw_blep, bell, make_ir, reverb, delay, soft_clip)

_IR = None


def ir():
    global _IR
    if _IR is None:
        _IR = make_ir(1.8, 0.015, 7000)
    return _IR


def _norm(x, peak=0.9):
    m = np.abs(x).max()
    return x / m * peak if m > 0 else x


def whoosh(dur=0.55, f0=300, f1=4500, peak_at=0.6, width=1.6, pan_from=-0.6, pan_to=0.6, brightness=1.0):
    """Air whoosh: band-passed noise sweeping in frequency with a swelling envelope + stereo motion."""
    n = n_of(dur)
    t = np.arange(n) / SR
    x = noise(n)
    k = np.linspace(0, 1, 256)
    centers = f0 * (f1 / f0) ** (k ** 0.8)
    y = sweep_filter(x, centers, width_oct=width, kind="bp")
    u = t / dur
    env = np.where(u < peak_at, (u / peak_at) ** 2.2, np.exp(-(u - peak_at) / (1 - peak_at) * 4.0))
    y = y * env
    pan = pan_from + (pan_to - pan_from) * np.clip(u, 0, 1)
    a = (pan + 1) * np.pi / 4
    out = np.stack([y * np.cos(a), y * np.sin(a)], axis=1)
    out = out + reverb(out, ir(), 0.18)
    if brightness != 1.0:
        out = lp(out, 9000 * brightness)
    return _norm(out, 0.8)


def swish(dur=0.22):
    return whoosh(dur, 1200, 7000, 0.45, 1.2, -0.3, 0.3)


def impact(dur=2.4, sub=1.0, tone_hz=48):
    """Cinematic hit: sub drop + noise crack + roomy tail."""
    n = n_of(dur)
    t = np.arange(n) / SR
    f = tone_hz + 70 * np.exp(-t / 0.05)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55) * sub
    crack = hp(noise(n), 900) * np.exp(-t / 0.035)
    body = bp(noise(n), 120, 900) * np.exp(-t / 0.16) * 0.6
    y = np.tanh(1.5 * (boom + 0.55 * crack + body))
    out = stereo(y)
    out = out + reverb(out, make_ir(2.8, 0.02, 4500), 0.45)
    return _norm(out, 0.95)


def hit_small(dur=0.6):
    n = n_of(dur)
    t = np.arange(n) / SR
    f = 70 + 120 * np.exp(-t / 0.02)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) + 0.5 * hp(noise(n), 1500) * np.exp(-t / 0.02)
    out = stereo(np.tanh(1.4 * y))
    return _norm(out + reverb(out, ir(), 0.2), 0.8)


def riser(dur=2.0, f0=200, f1=2400):
    n = n_of(dur)
    t = np.arange(n) / SR
    u = t / dur
    k = np.linspace(0, 1, 256)
    nz = sweep_filter(noise(n), f0 * 2 + (f1 * 4 - f0 * 2) * k ** 2, width_oct=2.0, kind="bp")
    f = f0 * (f1 / f0) ** (u ** 1.6)
    tone = saw_blep(f, n) * 0.25 + saw_blep(f * 1.005, n) * 0.25
    tone = lp(tone, 5000)
    y = (nz * 1.2 + tone * 0.6) * (u ** 2.2)
    out = np.stack([y, np.roll(y, 41)], axis=1)
    return _norm(out + reverb(out, ir(), 0.25), 0.8)


def downlifter(dur=1.2):
    return riser(dur, 2400, 200)[::-1] * 0.8


def pop(f=900, dur=0.09):
    t = tarr(dur)
    fr = f * (1.6 - 0.6 * np.exp(-t / 0.012))
    y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.025) * np.minimum(1, t / 0.0015)
    return _norm(stereo(y), 0.7)


def click(dur=0.03):
    t = tarr(dur)
    y = bp(noise(len(t)), 2000, 9000) * np.exp(-t / 0.004) + 0.4 * np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.003)
    return _norm(stereo(y), 0.6)


def chime_ding(f=1046.5, dur=2.2):
    """Single cabin 'ding' (seatbelt sign style)."""
    y = bell(f, dur, partials=((1, 1, 1.0), (2.0, 0.28, 0.6), (3.01, 0.12, 0.4), (4.17, 0.05, 0.25)))
    out = stereo(y)
    return _norm(out + reverb(out, ir(), 0.3), 0.8)


def chime_dingdong(f_hi=987.8, f_lo=784.0, gap=0.42, dur=2.6):
    """Two-tone PA chime (high -> low)."""
    a = chime_ding(f_hi, dur)
    b = chime_ding(f_lo, dur)
    n = len(a) + n_of(gap)
    out = np.zeros((n, 2))
    out[: len(a)] += a
    out[n_of(gap): n_of(gap) + len(b)] += b * 0.95
    return _norm(out, 0.8)


def stamp(dur=0.5):
    n = n_of(dur)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * (60 + 90 * np.exp(-t / 0.012)) * t) * np.exp(-t / 0.07)
    slap = bp(noise(n), 600, 5000) * np.exp(-t / 0.012)
    rattle = bp(noise(n), 2500, 8000) * np.exp(-np.clip(t - 0.03, 0, None) / 0.02) * (t > 0.03) * 0.25
    out = stereo(np.tanh(1.8 * (thud + 0.8 * slap + rattle)))
    return _norm(out + reverb(out, make_ir(0.6, 0.005, 6000), 0.15), 0.9)


def typing(n_keys=10, rate=13.0, dur=None, seed=3):
    rng = np.random.default_rng(seed)
    dur = dur or n_keys / rate + 0.2
    out = np.zeros((n_of(dur), 2))
    t = 0.0
    for k in range(n_keys):
        kd = 0.04
        tt = tarr(kd)
        f1 = rng.uniform(1800, 3200)
        y = bp(noise(len(tt), rng), f1, f1 * 2.2) * np.exp(-tt / 0.006) + 0.3 * np.sin(2 * np.pi * rng.uniform(250, 420) * tt) * np.exp(-tt / 0.008)
        i = n_of(t)
        seg = stereo(y * rng.uniform(0.6, 1.0), rng.uniform(-0.3, 0.3))
        m = min(len(seg), len(out) - i)
        if m > 0:
            out[i:i + m] += seg[:m]
        t += 1 / rate * rng.uniform(0.7, 1.3)
    return _norm(out, 0.6)


def glitch(dur=0.35, seed=5):
    rng = np.random.default_rng(seed)
    n = n_of(dur)
    y = np.zeros(n)
    i = 0
    while i < n:
        L = int(rng.uniform(0.008, 0.04) * SR)
        f = rng.choice([220, 440, 880, 1320, 3000, 60])
        tt = np.arange(L) / SR
        kind = rng.integers(0, 3)
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * f * tt))
        elif kind == 1:
            s = rng.standard_normal(L)
        else:
            s = np.zeros(L)
        y[i:i + L] = s[: max(0, min(L, n - i))] * rng.uniform(0.3, 1.0)
        i += L
    y = bp(y, 300, 9000)
    return _norm(stereo(y, 0.0), 0.5)


def error_buzz(dur=0.42):
    t = tarr(dur)
    y = (np.sign(np.sin(2 * np.pi * 180 * t)) * 0.5 + np.sin(2 * np.pi * 360 * t) * 0.5)
    env = np.minimum(1, t / 0.005) * ((t < 0.16) | ((t > 0.22) & (t < 0.38))).astype(float)
    y = lp(y * env, 2500)
    return _norm(stereo(y), 0.5)


def success(dur=1.2):
    out = np.zeros((n_of(dur), 2))
    for k, (m, at) in enumerate(((76, 0.0), (83, 0.09), (88, 0.18))):
        b = stereo(bell(midi_hz(m), 0.9, partials=((1, 1, 1.0), (2.0, 0.3, 0.5), (3.0, 0.1, 0.3))))
        i = n_of(at)
        out[i:i + len(b)] += b[: len(out) - i] * (0.8 + 0.1 * k)
    return _norm(out + reverb(out, ir(), 0.3), 0.7)


def flap_flutter(dur=1.2, rate=28.0, seed=9):
    """Split-flap board: many tiny clacks."""
    rng = np.random.default_rng(seed)
    out = np.zeros((n_of(dur + 0.1), 2))
    t = 0.0
    while t < dur:
        tt = tarr(0.02)
        f = rng.uniform(2500, 5000)
        y = bp(noise(len(tt), rng), f * 0.6, f * 1.6) * np.exp(-tt / 0.003)
        i = n_of(t)
        seg = stereo(y * rng.uniform(0.4, 1.0), rng.uniform(-0.6, 0.6))
        m = min(len(seg), len(out) - i)
        out[i:i + m] += seg[:m]
        t += rng.exponential(1 / rate)
    env = np.ones(len(out))
    return _norm(out, 0.55)


def paper(dur=0.35):
    n = n_of(dur)
    t = np.arange(n) / SR
    y = bp(noise(n), 1200, 7000) * (np.minimum(1, t / 0.02) * np.exp(-t / 0.09))
    y *= 1 + 0.6 * np.sin(2 * np.pi * 37 * t)
    return _norm(stereo(y), 0.5)


def pin_drop(dur=0.7):
    out = np.zeros((n_of(dur), 2))
    p = pop(700, 0.1)
    out[: len(p)] += p
    for k, (at, a) in enumerate(((0.16, 0.45), (0.27, 0.22))):
        q = pop(560, 0.08) * a
        i = n_of(at)
        out[i:i + len(q)] += q
    return _norm(out, 0.7)


def shutter(dur=0.25):
    out = np.zeros((n_of(dur), 2))
    for at in (0.0, 0.07):
        c = click(0.05)
        i = n_of(at)
        out[i:i + len(c)] += c
    return _norm(out, 0.6)


def plane_flyby(dur=3.2, pan_from=-1, pan_to=1):
    """Jet pass-by: filtered noise + whine with doppler pitch drop."""
    n = n_of(dur)
    t = np.arange(n) / SR
    u = t / dur
    closeness = np.exp(-((u - 0.5) / 0.22) ** 2)
    rumble = lp(noise(n), 400) * 0.9
    k = np.linspace(0, 1, 256)
    hiss = sweep_filter(noise(n), 2500 - 1300 * np.tanh((k - 0.5) * 6), width_oct=2.2, kind="bp")
    whine_f = 1900 * (1 + 0.12 * np.tanh(-(u - 0.5) * 8))
    whine = sine(whine_f, n) * 0.08
    y = (rumble + hiss + whine) * (0.15 + closeness)
    pan = pan_from + (pan_to - pan_from) * (0.5 + 0.5 * np.tanh((u - 0.5) * 4))
    a = (pan + 1) * np.pi / 4
    out = np.stack([y * np.cos(a), y * np.sin(a)], axis=1)
    out = out * (np.minimum(1, u / 0.15) * np.minimum(1, (1 - u) / 0.25))[:, None]
    return _norm(out + reverb(out, make_ir(2.5, 0.03, 4000), 0.3), 0.8)


def sparkle(dur=1.4, seed=11):
    rng = np.random.default_rng(seed)
    out = np.zeros((n_of(dur), 2))
    for k in range(14):
        m = rng.choice([84, 88, 91, 96, 100, 103])
        b = stereo(bell(midi_hz(m), 0.5, partials=((1, 1, 1.0), (2.76, 0.2, 0.4))), rng.uniform(-0.8, 0.8))
        i = n_of(k * dur / 18)
        out[i:i + len(b)] += b[: len(out) - i] * (1 - k / 16) * 0.6
    return _norm(out + reverb(out, ir(), 0.35), 0.5)


def bass_drop(dur=1.8):
    n = n_of(dur)
    t = np.arange(n) / SR
    f = 30 + 90 * np.exp(-t / 0.35)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9)
    return _norm(stereo(np.tanh(1.3 * y)), 0.9)


def heartbeat(dur=0.8):
    out = np.zeros((n_of(dur), 2))
    for at, a in ((0.0, 1.0), (0.22, 0.7)):
        n = n_of(0.25)
        t = np.arange(n) / SR
        y = np.sin(2 * np.pi * (45 + 30 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.07)
        i = n_of(at)
        out[i:i + n] += stereo(y * a)
    return _norm(out, 0.9)


LIB = {
    "whoosh": lambda: whoosh(0.55),
    "whoosh_long": lambda: whoosh(0.95, 200, 5000, 0.62, 1.8, -0.8, 0.8),
    "whoosh_rev": lambda: whoosh(0.55, 4500, 300, 0.6, 1.6, 0.6, -0.6),
    "swish": swish,
    "impact": impact,
    "hit": hit_small,
    "riser": lambda: riser(2.0),
    "riser_short": lambda: riser(1.1, 300, 2600),
    "downlifter": downlifter,
    "pop": lambda: pop(900),
    "pop_hi": lambda: pop(1400, 0.07),
    "pop_lo": lambda: pop(620, 0.1),
    "click": click,
    "ding": chime_ding,
    "dingdong": chime_dingdong,
    "stamp": stamp,
    "typing": lambda: typing(12),
    "typing_short": lambda: typing(6),
    "glitch": glitch,
    "error": error_buzz,
    "success": success,
    "flap": lambda: flap_flutter(1.1),
    "flap_long": lambda: flap_flutter(1.8),
    "paper": paper,
    "pin": pin_drop,
    "shutter": shutter,
    "flyby": plane_flyby,
    "sparkle": sparkle,
    "bassdrop": bass_drop,
    "heartbeat": heartbeat,
}
