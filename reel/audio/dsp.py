"""Small DSP toolkit (numpy + pedalboard) used to synthesise the music and sound effects.
All signals are float32/float64 numpy arrays at SR; stereo arrays are shaped (2, n)."""
import numpy as np
import pedalboard as pb
from scipy import signal

SR = 48000
RNG = np.random.default_rng(1234)


def n_of(dur):
    return max(1, int(round(dur * SR)))


def tt(dur):
    return np.arange(n_of(dur)) / SR


def noise(dur, seed=None):
    r = np.random.default_rng(seed) if seed is not None else RNG
    return r.standard_normal(n_of(dur))


def pink(dur, seed=None):
    w = noise(dur, seed)
    b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w) * 4


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------- oscillators ----------------
def phase_from_freq(freq, n):
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    return np.cumsum(f / SR) % 1.0, f / SR


def saw(freq, dur=None, n=None, phase0=0.0):
    n = n or n_of(dur)
    ph, dt = phase_from_freq(freq, n)
    ph = (ph + phase0) % 1.0
    y = 2 * ph - 1
    # polyBLEP
    m1 = ph < dt
    t1 = ph[m1] / dt[m1]
    y[m1] -= t1 + t1 - t1 * t1 - 1
    m2 = ph > 1 - dt
    t2 = (ph[m2] - 1) / dt[m2]
    y[m2] -= t2 * t2 + t2 + t2 + 1
    return y


def square(freq, dur=None, n=None, pw=0.5):
    n = n or n_of(dur)
    return 0.5 * (saw(freq, n=n) - saw(freq, n=n, phase0=pw))


def sine(freq, dur=None, n=None, phase0=0.0):
    n = n or n_of(dur)
    ph, _ = phase_from_freq(freq, n)
    return np.sin(2 * np.pi * (ph + phase0))


def tri(freq, dur=None, n=None):
    n = n or n_of(dur)
    ph, _ = phase_from_freq(freq, n)
    return 2 * np.abs(2 * ph - 1) - 1


# ---------------- envelopes ----------------
def adsr(n, a=0.005, d=0.1, s=0.7, r=0.2, hold=None):
    """hold = seconds the gate is held (default: until n - r)."""
    a_n, d_n, r_n = n_of(a), n_of(d), n_of(r)
    g_n = n - r_n if hold is None else min(n, n_of(hold))
    e = np.zeros(n)
    x = np.arange(n)
    e = np.where(x < a_n, x / max(a_n, 1), 0)
    dm = (x >= a_n) & (x < a_n + d_n)
    e = np.where(dm, 1 - (1 - s) * (x - a_n) / max(d_n, 1), e)
    e = np.where((x >= a_n + d_n) & (x < g_n), s, e)
    lvl = s if g_n >= a_n + d_n else (np.interp(g_n, [0, a_n, a_n + d_n], [0, 1, s]))
    rm = x >= g_n
    e = np.where(rm, lvl * np.clip(1 - (x - g_n) / max(r_n, 1), 0, 1), e)
    return e


def exp_env(n, tau, a=0.002):
    x = np.arange(n) / SR
    e = np.exp(-x / tau)
    a_n = n_of(a)
    e[:a_n] *= np.linspace(0, 1, a_n, endpoint=False)
    return e


def fade(x, fi=0.002, fo=0.01):
    x = x.copy()
    a, b = n_of(fi), n_of(fo)
    x[..., :a] *= np.linspace(0, 1, a)
    x[..., -b:] *= np.linspace(1, 0, b)
    return x


# ---------------- filters ----------------
def biquad(x, kind, fc, q=0.707, gain_db=0.0):
    fc = float(np.clip(fc, 10, SR * 0.45))
    if kind in ('lp', 'hp', 'bp'):
        b, a = signal.butter(2, fc / (SR / 2), {'lp': 'low', 'hp': 'high', 'bp': 'band'}[kind]) if kind != 'bp' else \
            signal.butter(2, [max(10, fc / (1 + 1 / (2 * q))) / (SR / 2), min(SR * 0.45, fc * (1 + 1 / (2 * q))) / (SR / 2)], 'band')
        return signal.lfilter(b, a, x, axis=-1)
    raise ValueError(kind)


def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc, SR * 0.45) / (SR / 2), 'low')
    return signal.lfilter(b, a, x, axis=-1)


def hp(x, fc, order=2):
    b, a = signal.butter(order, max(fc, 5) / (SR / 2), 'high')
    return signal.lfilter(b, a, x, axis=-1)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [max(lo, 5) / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], 'band')
    return signal.lfilter(b, a, x, axis=-1)


def sweep(x, fc_curve, mode='lp', res=0.25, drive=1.0, block=256):
    """Time-varying ladder filter: fc_curve is an array (Hz) the length of x (or callable of t)."""
    x = np.asarray(x, dtype=np.float32)
    n = x.shape[-1]
    fc = fc_curve(np.arange(n) / SR) if callable(fc_curve) else np.broadcast_to(fc_curve, (n,))
    m = {'lp': pb.LadderFilter.Mode.LPF24, 'hp': pb.LadderFilter.Mode.HPF24, 'bp': pb.LadderFilter.Mode.BPF24,
         'lp12': pb.LadderFilter.Mode.LPF12, 'hp12': pb.LadderFilter.Mode.HPF12, 'bp12': pb.LadderFilter.Mode.BPF12}[mode]
    f = pb.LadderFilter(mode=m, cutoff_hz=float(fc[0]), resonance=res, drive=drive)
    out = np.zeros_like(x)
    for i in range(0, n, block):
        f.cutoff_hz = float(np.clip(fc[min(i + block // 2, n - 1)], 20, 20000))
        out[..., i:i + block] = f.process(x[..., i:i + block], SR, reset=(i == 0))
    return out


# ---------------- stereo / fx ----------------
def pan(x, p=0.0):
    """constant-power pan; x mono -> (2, n). p in [-1, 1] (scalar or array)."""
    th = (np.asarray(p) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


def st(x):
    return x if x.ndim == 2 else np.stack([x, x])


def widen(x, amt=0.3, seed=7, delay_ms=11):
    """Haas-ish widening for mono content."""
    x = st(x)
    d = int(delay_ms * SR / 1000)
    l = x[0]; r = np.concatenate([np.zeros(d), x[1][:-d]]) if d else x[1]
    m = (l + r) / 2; s_ = (l - r) / 2
    return np.stack([m + s_ * (1 + amt), m - s_ * (1 + amt)])


def reverb(x, room=0.6, damp=0.5, wet=0.3, dry=1.0, width=1.0, pre=0.0, tail=1.5):
    x = st(x).astype(np.float32)
    x = np.concatenate([x, np.zeros((2, n_of(tail)), np.float32)], axis=1)
    if pre > 0:
        x = np.concatenate([np.zeros((2, n_of(pre)), np.float32), x], axis=1)[:, :x.shape[1]]
    r = pb.Reverb(room_size=room, damping=damp, wet_level=wet, dry_level=dry, width=width)
    return r.process(x, SR)


def delay(x, t=0.375, fb=0.35, mix=0.3, tail=1.5):
    x = st(x).astype(np.float32)
    x = np.concatenate([x, np.zeros((2, n_of(tail)), np.float32)], axis=1)
    return pb.Delay(delay_seconds=t, feedback=fb, mix=mix).process(x, SR)


def chorus(x, rate=0.6, depth=0.25, mix=0.4):
    return pb.Chorus(rate_hz=rate, depth=depth, centre_delay_ms=8, feedback=0.0, mix=mix).process(st(x).astype(np.float32), SR)


def sat(x, drive=1.5):
    return np.tanh(x * drive) / np.tanh(drive)


def place(buf, x, t, gain=1.0):
    """mix stereo x into stereo buf at time t (seconds)."""
    x = st(x)
    i = int(round(t * SR))
    if i < 0:
        x = x[:, -i:]; i = 0
    j = min(buf.shape[1], i + x.shape[1])
    if j > i:
        buf[:, i:j] += x[:, :j - i] * gain
    return buf


def db(g):
    return 10 ** (g / 20)
