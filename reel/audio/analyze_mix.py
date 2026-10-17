"""Voice-to-background ratio during speech (momentary 400 ms windows), full band and 1-4 kHz."""
import sys, numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy import signal
d = sys.argv[1]
v, sr = sf.read(d + '/pre_voice.wav'); b, _ = sf.read(d + '/pre_bed.wav')
v = v.mean(1); b = b.mean(1)
meter = pyln.Meter(sr, block_size=0.4)
win, hop = int(0.4 * sr), int(0.1 * sr)
bpf = signal.butter(4, [1000 / (sr / 2), 4000 / (sr / 2)], 'band', output='sos')
vb, bb = signal.sosfilt(bpf, v), signal.sosfilt(bpf, b)
rows = []
for i in range(0, len(v) - win, hop):
    vs, bs = v[i:i + win], b[i:i + win]
    ev = 10 * np.log10(np.mean(vs ** 2) + 1e-12)
    if ev < -40: continue  # speech windows only
    eb = 10 * np.log10(np.mean(bs ** 2) + 1e-12)
    ev2 = 10 * np.log10(np.mean(vb[i:i + win] ** 2) + 1e-12); eb2 = 10 * np.log10(np.mean(bb[i:i + win] ** 2) + 1e-12)
    rows.append((i / sr, ev - eb, ev2 - eb2))
r = np.array(rows)
# keep real speech: windows whose voice energy is within 10 dB of the median speech window
ve = np.array([10 * np.log10(np.mean(v[int(t * sr):int(t * sr) + win] ** 2) + 1e-12) for t in r[:, 0]])
r = r[ve > np.median(ve) - 10]
print(f"speech windows: {len(r)}")
for nm, col in (('full-band', 1), ('1-4 kHz', 2)):
    print(f"{nm:10s} voice-over-bed  median {np.median(r[:, col]):5.1f} dB   p10 {np.percentile(r[:, col], 10):5.1f} dB   min {r[:, col].min():5.1f} dB")
worst = r[np.argsort(r[:, 1])[:6]]
print('worst windows (t, full, 1-4k):', [(round(a, 1), round(b_, 1), round(c, 1)) for a, b_, c in worst])
