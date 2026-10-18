"""Mix stems -> mix.wav and print a voice-clarity report.
usage: python mix.py <stem_dir> [music_db] [sfx_db]
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

D = sys.argv[1]
MUSIC_DB = float(sys.argv[2]) if len(sys.argv) > 2 else -18.5
SFX_DB = float(sys.argv[3]) if len(sys.argv) > 3 else -6.0
SR = 48000
OFF = 0.20


def rd(n):
    return wavfile.read(f"{D}/{n}.wav")[1].astype(np.float64)


v, m, s = rd("voice"), rd("music"), rd("sfx")
duck = np.load(f"{D}/duck.npy").astype(np.float64)[:, None]
N = len(v)
t = np.arange(N) / SR
# lift the music where nobody speaks (outro after the last word)
lift = np.clip((t - (56.1 + OFF)) / 0.6, 0, 1) * 4.0
mg = 10 ** ((MUSIC_DB + lift) / 20)[:, None]


def peq(x, f0, gdb, q):
    A = 10 ** (gdb / 40); w0 = 2 * np.pi * f0 / SR; al = np.sin(w0) / (2 * q); c = np.cos(w0)
    b = np.array([1 + al * A, -2 * c, 1 - al * A]); a = np.array([1 + al / A, -2 * c, 1 - al / A])
    return signal.lfilter(b / a[0], a / a[0], x, axis=0)


# carve room for the voice: less mud, less presence-range masking, tamer sub
m = peq(m, 2200, -4.5, 0.9)
m = peq(m, 420, -2.5, 1.0)
m = peq(m, 55, -2.0, 0.8)
music = m * mg * duck
sfx = s * 10 ** (SFX_DB / 20)
mix = v + music + sfx

# gentle glue: soft-knee peak limiter with 3 ms lookahead
look = int(0.003 * SR)
peak = np.max(np.abs(mix), axis=1)
win = np.lib.stride_tricks.sliding_window_view(np.pad(peak, (0, look)), look + 1).max(axis=1)[:N]
thr = 0.89
g = np.minimum(1.0, thr / np.maximum(win, 1e-9))
# smooth gain (release 80 ms)
sm = np.empty_like(g); cur = 1.0; rel = np.exp(-1 / (0.08 * SR))
for i in range(N):
    x = g[i]
    cur = x if x < cur else rel * cur + (1 - rel) * x
    sm[i] = cur
mix = mix * sm[:, None]
wavfile.write(f"{D}/mix.wav", SR, mix.astype(np.float32))


# clarity report: K-ish weighted RMS per 0.4 s while the voice is active
def kw(x):
    sos = signal.butter(2, 120, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x.mean(axis=1))


vv, bb = kw(v), kw(music + sfx)
w = int(0.4 * SR)
rows = []
for i in range(0, N - w, w):
    ve = np.sqrt(np.mean(vv[i:i + w] ** 2)) + 1e-9
    be = np.sqrt(np.mean(bb[i:i + w] ** 2)) + 1e-9
    rows.append((i / SR, 20 * np.log10(ve), 20 * np.log10(be)))
act = [r for r in rows if r[1] > -40]
diff = np.array([r[1] - r[2] for r in act])
print(f"voice-over-background during speech: median {np.median(diff):.1f} dB, min {diff.min():.1f} dB")
worst = sorted(act, key=lambda r: r[1] - r[2])[:6]
for tt, a, b in worst:
    print(f"  t={tt:5.1f}s voice {a:.1f} dB  bg {b:.1f} dB  diff {a - b:.1f}")
print("gain reduction max dB:", round(20 * np.log10(sm.min()), 2))
