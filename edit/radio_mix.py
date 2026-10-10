"""Radio-only soundtrack: pilot/ATC transmissions through an aircraft VHF-AM chain.
usage: radio_mix.py <vo_dir> <out.wav> <total_seconds>"""
import sys, wave
import numpy as np
import soundfile as sf
from scipy import signal

VODIR, OUT, TOTAL = sys.argv[1], sys.argv[2], float(sys.argv[3])
SR = 44100
N = int(TOTAL * SR)
rng = np.random.default_rng(11)

# (file, start, speaker)
CALLS = [
    ("p0_smoke", 0.5, "pilot"),
    ("p1_ready", 4.2, "pilot"),
    ("t1_cleared", 9.5, "tower"),
    ("p2_readback", 14.7, "pilot"),
    ("p3_loop", 19.6, "pilot"),
    ("p4_roll", 27.0, "pilot"),
    ("p5_pull", 33.0, "pilot"),
    ("p6_complete", 36.6, "pilot"),
    ("t2_land", 39.8, "tower"),
]

def sos(kind, f, order=2):
    return signal.butter(order, f, kind, fs=SR, output="sos")

def peak(f, q, x):
    b, a = signal.iirpeak(f, q, fs=SR)
    return signal.lfilter(b, a, x)

def noise(n, lo, hi):
    return signal.sosfilt(sos("band", [lo, hi]), rng.standard_normal(n))

def cockpit_bed(n):
    """Jet cockpit through an oxygen-mask mic: broadband roar, low rumble, boxy mask resonance."""
    roar = noise(n, 120, 2500) * 0.6
    rumble = signal.sosfilt(sos("low", 180), rng.standard_normal(n)) * 1.2
    mask = peak(1150, 4, rng.standard_normal(n)) * 0.25
    slow = 1 + 0.25 * np.sin(2 * np.pi * 0.7 * np.arange(n) / SR + rng.uniform(0, 6))
    return (roar + rumble + mask) * slow

def transmit(v, speaker):
    pre, post = int(0.12 * SR), int(0.28 * SR)
    v = v / (np.abs(v).max() + 1e-9)
    v = np.concatenate([np.zeros(pre), v, np.zeros(post)])
    n = len(v)
    # mic stage: pilot has the cockpit/mask behind the voice, tower a quiet room
    if speaker == "pilot":
        v = peak(1150, 3, v) * 0.5 + v  # mask "boxiness"
        bed = cockpit_bed(n) * 0.07
    else:
        bed = noise(n, 150, 4000) * 0.02
    x = v + bed
    # radio AGC / heavy compression (makes the noise floor pump between words, like real radio)
    lvl = np.sqrt(signal.sosfilt(sos("low", 25), x ** 2).clip(1e-9))
    g = 0.35 / np.maximum(lvl, 0.06)
    g = signal.sosfilt(sos("low", 12), g)
    x = x * g
    # VHF-AM channel: narrow band, saturated, a little harsh
    x = signal.sosfilt(sos("band", [320, 2600], 4), x)
    x = np.tanh(x * 2.2)
    x = peak(1800, 1.2, x) * 0.35 + x
    x = signal.sosfilt(sos("band", [300, 2800], 2), x)
    # light 8-bit-ish grit + level flutter/fading
    t = np.arange(n) / SR
    x *= 1 + 0.07 * np.sin(2 * np.pi * (5.5 + rng.uniform(0, 2)) * t) + 0.05 * np.sin(2 * np.pi * 0.9 * t)
    x = np.round(x * 180) / 180
    # carrier hiss while keyed, key-up click, squelch tail
    keyed = np.ones(n)
    k_end = n - post + int(0.06 * SR)
    keyed[k_end:] = 0
    hiss = noise(n, 500, 4500) * 0.05
    out = (x * 0.8 + hiss) * keyed
    c = int(0.008 * SR)
    out[:c] += np.hanning(c) * 0.7
    sq = int(0.17 * SR)
    out[k_end:k_end + sq] += noise(sq, 700, 6000) * 0.55 * np.linspace(1, 0, sq) ** 0.6
    # crackles
    for _ in range(rng.integers(1, 4)):
        p = rng.integers(pre, k_end - 200)
        out[p:p + 60] += rng.standard_normal(60) * 0.4
    return out / (np.abs(out).max() + 1e-9) * 0.9

mix = np.zeros(N)
# very faint open-channel static so the track never goes completely dead
mix += noise(N, 400, 5000) * 0.004
for name, at, spk in CALLS:
    a, sr = sf.read(f"{VODIR}/{name}.wav", dtype="float32")
    v = signal.resample_poly(a, SR, sr)
    r = transmit(v, spk)
    i = int(at * SR)
    j = min(N, i + len(r))
    mix[i:j] += r[: j - i]

fade = int(0.5 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
st = np.stack([mix, mix], 1)
pcm = (st * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", OUT)
