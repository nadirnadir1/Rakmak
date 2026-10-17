"""Final mix: clean voice on top, music bed ducked under the voice (band-split, look-ahead),
SFX from the scene cue list, master to -14 LUFS / -1 dBTP.
Usage: python3 mix.py <voice.wav|mp3> <cues.json> <music_dir> <out.wav> [duration]"""
import sys, json
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
import pedalboard as pb
from scipy import signal
from dsp import SR, n_of, lp, hp, place, db
import sfx as SFXLIB

voice_path, cues_path, mdir, out_path = sys.argv[1:5]
DUR = float(sys.argv[5]) if len(sys.argv) > 5 else 48.5
N = n_of(DUR)
meter = pyln.Meter(SR)

# ---------------- voice: light, transparent cleanup ----------------
v, vsr = sf.read(voice_path, always_2d=True)
v = v.mean(1)
if vsr != SR:
    from math import gcd
    g = gcd(SR, vsr)
    v = signal.resample_poly(v, SR // g, vsr // g)
v = v[:N] if len(v) >= N else np.concatenate([v, np.zeros(N - len(v))])
chain = pb.Pedalboard([          # near-transparent: the TTS voice is already clean
    pb.HighpassFilter(cutoff_frequency_hz=70),
    pb.Compressor(threshold_db=-16, ratio=1.4, attack_ms=25, release_ms=200),
])
v = chain(v.astype(np.float32), SR).astype(np.float64)
v *= db(-16.0 - meter.integrated_loudness(v))          # voice at -16 LUFS before mastering
voice = np.stack([v, v])

# ---------------- voice activity -> ducking curve (look-ahead) ----------------
hop = n_of(0.01)
rms = np.sqrt(np.convolve(v ** 2, np.ones(hop) / hop, 'same') + 1e-12)
rms_db = 20 * np.log10(rms)
active = (rms_db > rms_db.max() - 38).astype(float)
# close tiny gaps (< 120 ms) so the bed doesn't pump between words
k = n_of(0.12)
active = np.convolve(active, np.ones(k) / k, 'same') > 0.02
active = active.astype(float)
# look-ahead 70 ms, attack 40 ms, release 320 ms (one-pole smoothing, forward pass)
la = n_of(0.07)
target = np.concatenate([active[la:], np.zeros(la)])
duck = np.zeros(N)
a_att, a_rel = np.exp(-1 / (0.04 * SR)), np.exp(-1 / (0.32 * SR))
# vectorised-enough one-pole with branch: do it in 1 ms blocks for speed
blk = 48
y = 0.0
for i in range(0, N, blk):
    tgt = target[i:i + blk].max()
    a = a_att ** blk if tgt > y else a_rel ** blk
    y = tgt + (y - tgt) * a
    duck[i:i + blk] = y


def band_duck(x, d_low, d_mid, d_high):
    lo = lp(x, 200, order=4)
    hi = hp(x, 5000, order=4)
    mid = x - lo - hi
    gl = db(d_low * duck); gm = db(d_mid * duck); gh = db(d_high * duck)
    return lo * gl + mid * gm + hi * gh


# ---------------- music ----------------
m, msr = sf.read(f'{mdir}/music_bus.wav', always_2d=True)
m = m.T[:, :N]
if m.shape[1] < N: m = np.concatenate([m, np.zeros((2, N - m.shape[1]))], axis=1)
# level: unducked bed at about -16.5 LUFS (measured on the drop sections)
drop = m[:, n_of(33.39):n_of(39.39)]
m *= db(-17.5 - meter.integrated_loudness(drop.T))
# carve room for the voice in the music (instead of EQ-ing the voice itself)
m = pb.Pedalboard([pb.PeakFilter(cutoff_frequency_hz=2500, gain_db=-2.5, q=0.7)])(m.astype(np.float32), SR).astype(np.float64)
m = band_duck(m, -5.0, -14.0, -6.0)
# no voice after 43 s: lift the bed so the ending (map, end card, Instagram) keeps its energy
tt_ = np.arange(N) / SR
ramp = np.clip((tt_ - 43.15) / 0.5, 0, 1)
m *= 1 + (db(2.5) - 1) * (ramp * ramp * (3 - 2 * ramp))
# end fade so the loop back to frame 0 is clean
fo = n_of(0.45)
m[:, N - fo:] *= np.linspace(1, 0, fo) ** 1.5

# ---------------- SFX from the cue sheet ----------------
cues = json.load(open(cues_path))
fx = np.zeros((2, N))
cache = {}
for c in cues:
    name = c['name']
    kw = {kk: c[kk] for kk in ('dur', 'pitch') if kk in c}
    key = (name, tuple(sorted(kw.items())))
    if key not in cache:
        cache[key] = SFXLIB.SFX[name](**kw)
    x = cache[key]
    t = c['t']
    if name.endswith('_rev'):            # reversed sounds peak at their end: land the peak on the cue
        t = t + 0.35 - x.shape[1] / SR
    p = c.get('pan')
    if p:
        th = (p + 1) * np.pi / 4
        x = np.stack([x[0] * np.cos(th) * 1.414, x[1] * np.sin(th) * 1.414])
    place(fx, x, t, c.get('gain', 1.0))
fx *= db(-14.0)
fx = band_duck(fx, -2.0, -8.0, -4.0)

# ---------------- master ----------------
mixb = voice + m + fx
if len(sys.argv) > 6:  # analysis stems (pre-master)
    sf.write(sys.argv[6] + '/pre_voice.wav', voice.T.astype(np.float32), SR, subtype='FLOAT')
    sf.write(sys.argv[6] + '/pre_bed.wav', (m + fx).T.astype(np.float32), SR, subtype='FLOAT')
    sf.write(sys.argv[6] + '/pre_music.wav', m.T.astype(np.float32), SR, subtype='FLOAT')
    sf.write(sys.argv[6] + '/pre_fx.wav', fx.T.astype(np.float32), SR, subtype='FLOAT')
master = pb.Pedalboard([
    pb.Compressor(threshold_db=-14, ratio=1.6, attack_ms=25, release_ms=180),
])
mixb = master(mixb.astype(np.float32), SR).astype(np.float64)


def tp_limiter(x, ceiling_db=-1.2, la_ms=5.0, rel_ms=90.0, blk=24):
    """look-ahead brickwall limiter on 4x-oversampled (true) peaks"""
    from scipy.ndimage import minimum_filter1d
    c = db(ceiling_db)
    up = signal.resample_poly(x, 4, 1, axis=1)
    pk = np.abs(up).max(0)[:x.shape[1] * 4].reshape(-1, 4).max(1)
    g = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    L = n_of(la_ms / 1000)
    g = minimum_filter1d(g, size=2 * L + 1)              # reacts L samples ahead of each peak
    nb = len(g) // blk + 1
    gb = np.ones(nb)
    a_rel = np.exp(-blk / (rel_ms / 1000 * SR))
    y = 1.0
    gmin = np.minimum.reduceat(g, np.arange(0, len(g), blk))
    for i in range(len(gmin)):
        y = min(gmin[i], 1 - (1 - y) * a_rel)
        gb[i] = y
    gs = np.repeat(gb[:len(gmin)], blk)[:len(g)]
    gs = np.minimum(gs, g)                                 # never above the instantaneous need
    k = n_of(0.0015)
    gs = np.convolve(gs, np.ones(k) / k, 'same')           # de-click
    return x * np.minimum(gs, g + 0.02)


for it in range(3):
    mixb = mixb * db(-14.0 - meter.integrated_loudness(mixb.T))
    mixb = tp_limiter(mixb.astype(np.float64))
sf.write(out_path, mixb.T, SR, subtype='FLOAT')
sf.write(out_path.replace('.wav', '_voice_only.wav'), (voice * db(2)).T.astype(np.float32), SR, subtype='FLOAT')
print('integrated LUFS', round(meter.integrated_loudness(mixb.T.astype(np.float64)), 2),
      'sample peak dBFS', round(20 * np.log10(np.abs(mixb).max()), 2))
