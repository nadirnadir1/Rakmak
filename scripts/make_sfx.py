"""Synthesises the reel's sound effects from scratch (no third-party samples, no licensing issues)."""
import numpy as np, wave, os
SR = 48000
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sfx')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

def save(name, x, gain_db=-3.0):
    x = np.asarray(x, dtype=float)
    if x.ndim == 1: x = np.stack([x, x], 1)
    x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (gain_db / 20)
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def t(d): return np.arange(int(d * SR)) / SR

def onepole_lp(x, fc):  # time-varying one-pole low-pass, fc array or scalar
    fc = np.broadcast_to(fc, x.shape)
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y

def env(n, att, rel):
    e = np.ones(n); a = int(att * SR); r = int(rel * SR)
    e[:a] = np.linspace(0, 1, a) ** 2; e[-r:] = np.linspace(1, 0, r) ** 2
    return e

# Whoosh: band-swept noise with stereo movement
d = 0.7; n = int(d * SR); tt = t(d)
sweep = 300 + 5000 * np.sin(np.pi * tt / d) ** 2
no = rng.standard_normal(n)
w = onepole_lp(no, sweep) - onepole_lp(no, sweep * 0.25)
e = np.sin(np.pi * tt / d) ** 3
pan = tt / d
save('whoosh.wav', np.stack([w * e * (1 - 0.6 * pan), w * e * (0.4 + 0.6 * pan)], 1), -4)

# Impact: sub drop + transient + short tail
d = 1.4; tt = t(d)
sub = np.sin(2 * np.pi * (55 * tt + 40 * (1 - np.exp(-tt * 18)) / 18)) * np.exp(-tt * 3.2)
click = onepole_lp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt * 45)
tail = onepole_lp(rng.standard_normal(len(tt)), 900) * np.exp(-tt * 4) * 0.25
save('impact.wav', sub * 1.0 + click * 0.6 + tail, -2)

# Riser: rising filtered noise + pitch sweep into the cut
d = 1.0; tt = t(d)
nr = onepole_lp(rng.standard_normal(len(tt)), 400 + 7000 * (tt / d) ** 2)
tone = np.sin(2 * np.pi * (200 * tt + 600 * tt ** 2 / d)) * 0.15
save('riser.wav', (nr + tone) * (tt / d) ** 2.2 * env(len(tt), 0.01, 0.03), -6)

# Cabin chime ("ding-dong" two-tone, like an aircraft PA chime)
def bell(f, d, decay):
    tt = t(d)
    return sum(a * np.sin(2 * np.pi * f * m * tt) for m, a in [(1, 1), (2.01, 0.35), (3.0, 0.12), (4.2, 0.05)]) * np.exp(-tt * decay) * env(len(tt), 0.004, 0.05)
hi = bell(1318.5, 1.6, 2.6); lo = bell(1046.5, 1.9, 2.2)
ch = np.zeros(int(2.4 * SR)); ch[:len(hi)] += hi; o = int(0.42 * SR); ch[o:o + len(lo)] += lo
save('chime.wav', ch, -5)

# Tick: small UI click for counters / accents
d = 0.06; tt = t(d)
save('tick.wav', np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 90) + onepole_lp(rng.standard_normal(len(tt)), 6000) * np.exp(-tt * 140) * 0.4, -10)

# Shimmer: airy sparkle for light sweeps
d = 0.9; tt = t(d)
sp = sum(np.sin(2 * np.pi * f * tt + p) for f, p in [(2637, 0), (3136, 1), (3951, 2), (5274, 3)])
sh = sp * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * tt)) + (rng.standard_normal(len(tt)) - onepole_lp(rng.standard_normal(len(tt)), 5000)) * 0.5
save('shimmer.wav', sh * np.sin(np.pi * tt / d) ** 2, -12)

# Brand sting for the end card: soft major pad + chime
d = 2.6; tt = t(d)
pad = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2 * tt) for f in [261.6, 329.6, 392.0, 523.3]) * env(len(tt), 0.35, 1.2)
br = pad * 0.25; br[:len(hi)] += hi * 0.8
save('brand.wav', br, -6)
print('sfx:', sorted(os.listdir(OUT)))

# ---- aviation atmospheres for the hooks ----
def bandnoise(n, lo, hi):
    x = rng.standard_normal(n)
    return onepole_lp(x, hi) - onepole_lp(x, lo)

# Jet fly-past: turbine whine with doppler drop + broadband roar, panned left -> right
d = 2.6; tt = t(d); n = len(tt); c = 1.1  # closest approach at 1.1 s
dist = np.sqrt(((tt - c) * 1.0) ** 2 + 0.12 ** 2)
amp = 0.12 / dist
dop = 1 + 0.12 * np.tanh(-(tt - c) * 3)  # pitch high on approach, low after
whine = np.sin(2 * np.pi * np.cumsum(2400 * dop) / SR) * 0.25 + np.sin(2 * np.pi * np.cumsum(3900 * dop) / SR) * 0.1
roar = bandnoise(n, 60, 900 + 2500 * np.clip(amp, 0, 1))
sig = (roar * 1.0 + whine) * amp * env(n, 0.05, 0.6)
pan = 1 / (1 + np.exp(-(tt - c) * 4))
save('jet_flyby.wav', np.stack([sig * (1.1 - pan), sig * (0.1 + pan)], 1), -3)

# Engine approach: rising turbine + roar that builds straight at camera (cut hard in the edit)
d = 1.4; tt = t(d); n = len(tt)
g = (tt / d) ** 2.5
whine = np.sin(2 * np.pi * np.cumsum(1800 + 1400 * tt / d) / SR) * 0.2
roar = bandnoise(n, 50, 400 + 6000 * g)
save('jet_approach.wav', (roar + whine) * g * env(n, 0.02, 0.01), -2)

# Cabin ambience: steady low air-conditioning / engine drone (brown-ish noise + faint hum)
d = 4.0; tt = t(d); n = len(tt)
br = onepole_lp(rng.standard_normal(n), 180) * 6 + bandnoise(n, 300, 1200) * 0.25
hum = np.sin(2 * np.pi * 118 * tt) * 0.05 + np.sin(2 * np.pi * 236 * tt) * 0.02
save('cabin_amb.wav', (br + hum) * env(n, 0.5, 0.8), -14)

# Warm swell: soft string-like pad rising into the reveal
d = 2.6; tt = t(d)
notes = [146.8, 220.0, 293.7, 370.0]
pad = sum(np.sin(2 * np.pi * f0 * tt + 0.3 * np.sin(2 * np.pi * 5 * tt)) + 0.4 * np.sin(2 * np.pi * f0 * 2.003 * tt) for f0 in notes)
save('swell.wav', pad * (tt / d) ** 1.6 * env(len(tt), 0.05, 0.15), -8)
print('hook sfx ok')
