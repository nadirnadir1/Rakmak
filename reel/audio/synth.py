"""Small numpy DSP + instrument toolkit used to compose the reel's music and sound effects.

Everything is rendered offline at 48 kHz, stereo arrays shaped (n, 2).
"""
import numpy as np
from scipy import signal

SR = 48000
RNG = np.random.default_rng(7)


def secs(n):
    return n / SR


def n_of(t):
    return int(round(t * SR))


def tarr(dur):
    return np.arange(n_of(dur)) / SR


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def db(x):
    return 10 ** (x / 20)


def stereo(mono, pan=0.0):
    """Equal-power pan, pan in [-1, 1]."""
    a = (pan + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1)


def noise(n, rng=RNG):
    return rng.standard_normal(n)


# ---------------------------------------------------------------- filters
def _sos(kind, f, order=2, q=None):
    nyq = SR / 2
    if kind == "bp":
        lo, hi = f
        return signal.butter(order, [max(10, lo) / nyq, min(hi, nyq * 0.98) / nyq], btype="band", output="sos")
    f = min(max(f, 10), nyq * 0.98)
    return signal.butter(order, f / nyq, btype=kind, output="sos")


def lp(x, f, order=2):
    return signal.sosfilt(_sos("low", f, order), x, axis=0)


def hp(x, f, order=2):
    return signal.sosfilt(_sos("high", f, order), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos("bp", (lo, hi), order), x, axis=0)


def peq(x, f, gain_db, q=1.0):
    """RBJ peaking EQ."""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f / SR
    alpha = np.sin(w0) / (2 * q)
    b = [1 + alpha * A, -2 * np.cos(w0), 1 - alpha * A]
    a = [1 + alpha / A, -2 * np.cos(w0), 1 - alpha / A]
    return signal.lfilter(b, a, x, axis=0)


def shelf(x, f, gain_db, kind="high"):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f / SR
    alpha = np.sin(w0) / 2 * np.sqrt(2)
    c = np.cos(w0)
    if kind == "high":
        b = [A * ((A + 1) + (A - 1) * c + 2 * np.sqrt(A) * alpha), -2 * A * ((A - 1) + (A + 1) * c),
             A * ((A + 1) + (A - 1) * c - 2 * np.sqrt(A) * alpha)]
        a = [(A + 1) - (A - 1) * c + 2 * np.sqrt(A) * alpha, 2 * ((A - 1) - (A + 1) * c),
             (A + 1) - (A - 1) * c - 2 * np.sqrt(A) * alpha]
    else:
        b = [A * ((A + 1) - (A - 1) * c + 2 * np.sqrt(A) * alpha), 2 * A * ((A - 1) - (A + 1) * c),
             A * ((A + 1) - (A - 1) * c - 2 * np.sqrt(A) * alpha)]
        a = [(A + 1) + (A - 1) * c + 2 * np.sqrt(A) * alpha, -2 * ((A - 1) + (A + 1) * c),
             (A + 1) + (A - 1) * c - 2 * np.sqrt(A) * alpha]
    return signal.lfilter(b, a, x, axis=0)


def sweep_filter(x, centers, width_oct=1.0, kind="bp", nfft=1024, hop=256):
    """Time-varying filter in the STFT domain.

    centers: array of center/cutoff frequencies sampled per STFT frame (or callable of time).
    kind: 'bp' (log-gaussian band), 'lp' (soft lowpass) or 'hp'.
    """
    mono = x.ndim == 1
    X = x[:, None] if mono else x
    out = np.zeros_like(X)
    for ch in range(X.shape[1]):
        f, tt, Z = signal.stft(X[:, ch], fs=SR, nperseg=nfft, noverlap=nfft - hop, boundary="even")
        if callable(centers):
            c = np.array([centers(t) for t in tt])
        else:
            c = np.interp(np.linspace(0, 1, len(tt)), np.linspace(0, 1, len(centers)), centers)
        F = np.maximum(f[:, None], 1.0)
        C = np.maximum(c[None, :], 1.0)
        r = np.log2(F / C)
        if kind == "bp":
            m = np.exp(-0.5 * (r / (width_oct / 2.355)) ** 2)
        elif kind == "lp":
            m = 1 / (1 + (F / C) ** 4)
        else:
            m = 1 / (1 + (C / F) ** 4)
        _, y = signal.istft(Z * m, fs=SR, nperseg=nfft, noverlap=nfft - hop, boundary=True)
        y = y[: len(X)]
        out[: len(y), ch] = y
    return out[:, 0] if mono else out


# ---------------------------------------------------------------- envelopes
def adsr(n, a=0.005, d=0.1, s=0.7, r=0.2, hold=None):
    """ADSR where note length = n samples (release appended inside n)."""
    env = np.zeros(n)
    na, nd, nr = n_of(a), n_of(d), n_of(r)
    nh = n - nr if hold is None else min(n - nr, n_of(hold))
    nh = max(nh, 1)
    idx = np.arange(n)
    env = np.where(idx < na, idx / max(na, 1), 0.0)
    dec = (idx >= na) & (idx < na + nd)
    env = np.where(dec, 1 - (1 - s) * (idx - na) / max(nd, 1), env)
    sus = (idx >= na + nd) & (idx < nh)
    env = np.where(sus, s, env)
    level_at_release = env[nh - 1] if nh - 1 < n else s
    rel = idx >= nh
    env = np.where(rel, level_at_release * np.clip(1 - (idx - nh) / max(nr, 1), 0, 1), env)
    return env


def expdec(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


# ---------------------------------------------------------------- oscillators
def saw_blep(freq, n, phase0=0.0):
    """Band-limited sawtooth (PolyBLEP); freq scalar or array."""
    dt = np.broadcast_to(np.asarray(freq, float) / SR, (n,))
    phase = (phase0 + np.cumsum(dt) - dt[0]) % 1.0
    y = 2 * phase - 1
    m1 = phase < dt
    t1 = phase[m1] / dt[m1]
    y[m1] -= t1 + t1 - t1 * t1 - 1
    m2 = phase > 1 - dt
    t2 = (phase[m2] - 1) / dt[m2]
    y[m2] -= t2 * t2 + t2 + t2 + 1
    return y


def sine(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    ph = 2 * np.pi * (np.cumsum(f) / SR) + phase0
    return np.sin(ph)


def supersaw(freq, n, voices=7, detune_cents=18, rng=RNG):
    """Stereo supersaw: detuned saws spread across the field."""
    out = np.zeros((n, 2))
    offs = np.linspace(-1, 1, voices)
    for i, o in enumerate(offs):
        cents = o * detune_cents
        f = freq * 2 ** (cents / 1200)
        y = saw_blep(f, n, rng.random())
        pan = o * 0.85
        amp = 1.0 if abs(o) < 1e-6 else 0.75
        out += stereo(y * amp, pan)
    return out / voices * 1.6


def additive_pluck(freq, dur, bright=1.0, decay=5.0, odd_boost=0.35, rng=RNG):
    """Plucked synth: harmonics decaying faster as they go up."""
    n = n_of(dur)
    t = np.arange(n) / SR
    y = np.zeros(n)
    nh = int(min(48, 15000 / freq))
    for k in range(1, nh + 1):
        amp = (1.0 / k) * (1 + (odd_boost if k % 2 else 0))
        dk = decay + 2.6 * k * bright
        y += amp * np.sin(2 * np.pi * freq * k * t + rng.random() * 0.3) * np.exp(-dk * t)
    att = np.minimum(1, t / 0.002)
    return y * att * 0.5


def bell(freq, dur, partials=((1, 1, 1.0), (2.0, 0.5, 0.6), (2.76, 0.35, 0.45), (5.4, 0.12, 0.25), (8.93, 0.05, 0.15)),
         rng=RNG):
    """Inharmonic bell: (ratio, amp, decay-seconds multiplier)."""
    n = n_of(dur)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for r, a, dm in partials:
        y += a * np.sin(2 * np.pi * freq * r * t + rng.random()) * np.exp(-t / (dur * 0.35 * dm))
    att = np.minimum(1, t / 0.003)
    return y * att


# ---------------------------------------------------------------- effects
def make_ir(rt60=2.2, pre=0.02, damp=5000, width=1.0, rng=RNG):
    n = n_of(rt60 * 1.1)
    t = np.arange(n) / SR
    env = np.exp(-6.91 * t / rt60)
    ir = np.stack([noise(n, rng), noise(n, rng)], axis=1) * env[:, None]
    # darker tail: crossfade towards low-passed version over time
    dark = lp(ir, damp * 0.35, 2)
    w = np.clip(t / rt60, 0, 1)[:, None]
    ir = ir * (1 - w) + dark * w
    ir = lp(ir, damp, 2)
    mid = ir.mean(axis=1, keepdims=True)
    ir = mid + (ir - mid) * width
    pad = np.zeros((n_of(pre), 2))
    ir = np.concatenate([pad, ir])
    return ir / np.sqrt((ir ** 2).sum() / 2)


def reverb(x, ir, wet=0.25):
    if x.ndim == 1:
        x = stereo(x)
    yl = signal.fftconvolve(x[:, 0], ir[:, 0])[: len(x)]
    yr = signal.fftconvolve(x[:, 1], ir[:, 1])[: len(x)]
    return np.stack([yl, yr], axis=1) * wet


def delay(x, time, fb=0.35, taps=6, pingpong=True, tone=4000):
    if x.ndim == 1:
        x = stereo(x)
    out = np.zeros_like(x)
    d = n_of(time)
    src = x
    for k in range(1, taps + 1):
        src = lp(src, tone, 1) * fb
        shift = d * k
        if shift >= len(x):
            break
        tap = np.zeros_like(x)
        tap[shift:] = src[: len(x) - shift]
        if pingpong and k % 2 == 1:
            tap = tap[:, ::-1]
        out += tap
    return out


def place(buf, clip, t, gain=1.0):
    """Mix clip (n,2) or (n,) into buf (N,2) at time t (seconds)."""
    if clip.ndim == 1:
        clip = stereo(clip)
    i = n_of(t)
    if i >= len(buf):
        return
    j0 = 0
    if i < 0:
        j0 = -i
        i = 0
    m = min(len(clip) - j0, len(buf) - i)
    if m > 0:
        buf[i: i + m] += clip[j0: j0 + m] * gain


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


def limiter(x, ceiling_db=-1.0, attack=0.002, release=0.08, lookahead=0.004):
    ceiling = db(ceiling_db)
    peak = np.abs(x).max(axis=1)
    la = n_of(lookahead)
    # look-ahead max
    pk = np.maximum.reduce([np.roll(peak, -k) for k in range(0, la + 1, max(1, la // 6))])
    g = np.minimum(1.0, ceiling / np.maximum(pk, 1e-9))
    # smooth: fast attack (min filter already), slow release
    a_r = np.exp(-1 / (release * SR))
    a_a = np.exp(-1 / (attack * SR))
    out = np.empty_like(g)
    cur = 1.0
    gl = g.tolist()
    for i, v in enumerate(gl):
        if v < cur:
            cur = a_a * cur + (1 - a_a) * v
            cur = min(cur, v) if v < cur * 0.999 else cur
        else:
            cur = a_r * cur + (1 - a_r) * v
        out[i] = cur
    return x * out[:, None]


def env_follow(x, attack=0.01, release=0.2):
    a = np.abs(x if x.ndim == 1 else x.mean(axis=1))
    # one-pole smoothing via lfilter (approximate symmetric) then peak-hold
    b_r = [1 - np.exp(-1 / (release * SR))]
    env = signal.lfilter(b_r, [1, -(1 - b_r[0])], a)
    b_a = [1 - np.exp(-1 / (attack * SR))]
    env2 = signal.lfilter(b_a, [1, -(1 - b_a[0])], a)
    return np.maximum(env, env2)
