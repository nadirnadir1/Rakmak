"""Build the soundtrack: original voice-over + original music bed + subtle ambience.

The music is synthesized here (no third-party samples), so it is free to use
commercially. Output: build/mix.wav (48 kHz stereo, before loudness normalization).
"""
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve

from timeline import DURATION, S

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
N = int(DURATION * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)


def db(x):
    return 10 ** (x / 20)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def filt(x, kind, f):
    sos = butter(2 if kind != "band" else 2, f, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, x)


def ramp(a, b, fade=0.4):
    """0..1 envelope that is 1 between a and b with smooth fades."""
    up = np.clip((t - a) / fade, 0, 1)
    down = np.clip((b - t) / fade, 0, 1)
    e = np.minimum(up, down)
    return e * e * (3 - 2 * e)


def rms(x):
    return np.sqrt(np.mean(x ** 2) + 1e-12)


# ---------------------------------------------------------------- music ----
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
T0 = S[1]                      # first downbeat lands on the reveal cut
CHORDS = {                     # pad voicing, bass note
    "D": ([50, 57, 62, 66, 69], 38),
    "Bm": ([47, 54, 59, 62, 66], 35),
    "G": ([43, 50, 55, 59, 62], 31),
    "A": ([45, 52, 57, 61, 64], 33),
}
PROG = ["D", "Bm", "G", "A"]


def chord_at(time):
    if time < T0:
        return "Bm"
    if time >= S[6]:
        return "D"
    return PROG[int((time - T0) // BAR) % 4]


def pad_layer(bright):
    out = np.zeros(N)
    step = int(0.05 * SR)
    # render per bar segment with crossfades so chord changes are smooth
    bounds = [0.0, T0] + list(np.arange(T0 + BAR, S[6], BAR)) + [S[6], DURATION]
    for a, b in zip(bounds[:-1], bounds[1:]):
        name = chord_at((a + b) / 2)
        notes, _ = CHORDS[name]
        seg = ramp(a - 0.15, b + 0.15, 0.3)
        sig = np.zeros(N)
        idx = seg > 0
        tt = t[idx]
        for m in notes:
            for det in (-0.07, 0.07):
                f = hz(m + det)
                for h in range(1, 7 if bright else 4):
                    sig[idx] += np.sin(2 * np.pi * f * h * tt + h) / h ** 1.3
        out += sig * seg
    return out


def pluck_track(start, end, level_env):
    out = np.zeros(N)
    pattern = [0, 2, 3, 4, 3, 2, 4, 3]
    n = 0
    time = start
    while time < end:
        notes, _ = CHORDS[chord_at(time + 0.01)]
        m = notes[pattern[n % 8]] + 12
        i0 = int(time * SR)
        L = int(0.9 * SR)
        tt = np.arange(min(L, N - i0)) / SR
        env = np.exp(-tt / 0.28) * np.clip(tt / 0.004, 0, 1)
        f = hz(m)
        out[i0:i0 + len(tt)] += env * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt))
        n += 1
        time += BEAT / 2
    return out * level_env


def kick(at, gain=1.0):
    out = np.zeros(N)
    i0 = int(at * SR)
    tt = np.arange(min(int(0.5 * SR), N - i0)) / SR
    f = 45 + 55 * np.exp(-tt / 0.04)
    ph = 2 * np.pi * np.cumsum(f) / SR
    out[i0:i0 + len(tt)] = np.sin(ph) * np.exp(-tt / 0.22) * gain
    return out


def noise_burst(at, dur, hp, gain):
    out = np.zeros(N)
    i0 = int(at * SR)
    L = min(int(dur * SR), N - i0)
    tt = np.arange(L) / SR
    out[i0:i0 + L] = rng.standard_normal(L) * np.exp(-tt / (dur / 4)) * gain
    return filt(out, "highpass", hp)


def build_music():
    dark = filt(pad_layer(False), "lowpass", 900)
    bright = filt(pad_layer(True), "lowpass", 4200)
    # brightness opens up as the story builds
    openness = np.interp(t, [0, S[1], S[3], S[5], S[6], DURATION], [0.0, 0.15, 0.35, 0.7, 1.0, 0.9])
    pad = filt(dark * (1 - openness) + bright * openness, "highpass", 90)
    pad_level = np.interp(t, [0, S[1], S[3], S[5], S[6] - 0.2, S[6], DURATION - 1.2, DURATION],
                          [0.55, 0.7, 0.8, 0.9, 1.0, 1.0, 0.8, 0.0])
    pad *= pad_level

    # intrigue shimmer for the hook
    shimmer = np.sin(2 * np.pi * hz(78) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.2 * t)) * ramp(0.0, S[1] + 0.3, 0.6) * 0.25

    plucks = pluck_track(T0, S[6], np.interp(t, [T0, S[2], S[4], S[5], S[6]], [0.25, 0.45, 0.6, 0.8, 0.9]))

    drums = np.zeros(N)
    bass = np.zeros(N)
    beat = T0
    while beat < S[6] - 0.05:
        if beat >= S[3] - 0.01:
            drums += kick(beat, 0.55 if beat < S[5] else 0.8)
        if beat >= S[4] - 0.01:
            drums += noise_burst(beat + BEAT / 2, 0.08, 7000, 0.10 if beat < S[5] else 0.16)
        if beat >= S[3] - 0.01 and int(round((beat - T0) / BEAT)) % 2 == 0:
            _, b = CHORDS[chord_at(beat + 0.01)]
            i0 = int(beat * SR)
            L = min(int(BEAT * 2 * SR), N - i0)
            tt = np.arange(L) / SR
            bass[i0:i0 + L] += np.sin(2 * np.pi * hz(b + 12) * tt) * np.clip(tt / 0.01, 0, 1) * np.exp(-tt / 0.9)
        beat += BEAT

    # final resolution: impact + sustained D major on the brand reveal
    final = np.zeros(N)
    i0 = int(S[6] * SR)
    tt = np.arange(N - i0) / SR
    for m in [38, 50, 57, 62, 66, 69, 74]:
        final[i0:] += np.sin(2 * np.pi * hz(m) * tt) * np.exp(-tt / 3.5) * (0.5 if m < 50 else 0.3)
    final += kick(S[6], 1.0)

    # riser into the brand reveal, soft swell into the reveal cut
    riser = rng.standard_normal(N)
    riser = filt(riser, "bandpass", [1500, 6000]) * (ramp(S[6] - 2.2, S[6], 2.0) * (t < S[6])) * 0.35
    swell = filt(rng.standard_normal(N), "bandpass", [800, 5000]) * ramp(S[1] - 0.8, S[1], 0.75) * (t < S[1]) * 0.25

    dry = 0.35 * pad + shimmer + 0.22 * plucks + 0.9 * drums + 0.5 * bass + 0.5 * final + riser + swell
    # simple stereo reverb
    ir_t = np.arange(int(2.4 * SR)) / SR
    left = dry + 0.25 * fftconvolve(dry, rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.55) * 0.02)[:N]
    right = dry + 0.25 * fftconvolve(dry, rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.55) * 0.02)[:N]
    return np.stack([left, right], 1)


# ------------------------------------------------------------- ambience ----
def build_ambience():
    pink = filt(np.cumsum(rng.standard_normal(N)) * 0.02, "highpass", 60)
    room = filt(pink, "lowpass", 1400)
    room = room / rms(room) * db(-46)
    murmur = filt(rng.standard_normal(N), "bandpass", [300, 2500])
    murmur *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.37 * t) * np.sin(2 * np.pi * 0.11 * t + 1)
    murmur = murmur / rms(murmur) * db(-50)
    airport = (room + murmur) * (ramp(-1, S[2] + 0.3) + ramp(S[2] - 0.3, S[3] + 0.3) * 0.9 +
                                  ramp(S[5] - 0.3, DURATION + 1) * 0.9)

    wheels = filt(rng.standard_normal(N), "bandpass", [150, 700])
    clicks = (np.sin(2 * np.pi * 6.5 * t) > 0.92).astype(float)
    clicks = filt(clicks, "lowpass", 400)
    wheels = (wheels * 0.7 + clicks * 2.0)
    wheels = wheels / rms(wheels) * db(-41) * ramp(S[1], S[2] - 0.5, 0.6)

    cabin = filt(np.cumsum(rng.standard_normal(N)) * 0.02, "lowpass", 380)
    cabin = cabin / rms(cabin) * db(-42) * ramp(S[3] - 0.3, S[4] + 0.3, 0.5)

    whooshes = np.zeros(N)
    for at in (S[1], S[4]):   # the two whip-pan transitions
        seg = filt(rng.standard_normal(N), "bandpass", [600, 3500])
        i, j = int((at - 0.3) * SR), int((at + 0.15) * SR)
        seg = seg / rms(seg[i:j]) * db(-36)
        whooshes += seg * ramp(at - 0.3, at + 0.15, 0.2)
    mono = airport + wheels + cabin + whooshes
    return np.stack([mono, mono * 0.96], 1)


def main():
    sr, v = wavfile.read(ROOT / "build" / "voice48k.wav")
    v = v.astype(np.float64) / 32768.0
    voice = np.zeros(N)
    voice[:min(len(v), N)] = v[:N]

    # ducking envelope from the voice
    win = int(0.05 * SR)
    env = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode="same"))
    speaking = np.clip(env / 0.03, 0, 1)
    # attack fast / release slow
    duck = np.zeros(N)
    a_att, a_rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR))
    acc = 0.0
    for i in range(0, N, 48):          # 1 ms steps is plenty
        x = speaking[i]
        coef = a_att if x > acc else a_rel
        acc = coef * acc + (1 - coef) * x
        duck[i:i + 48] = acc
    music_gain = db(-7.5 * duck)

    music = build_music()
    music = music / rms(music) * rms(voice) * db(-5)
    music *= music_gain[:, None]

    amb = build_ambience()
    mix = np.stack([voice, voice], 1) + music + amb
    # tiny fades at the edges, no blank frames
    mix[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
    mix = mix / max(np.abs(mix).max(), 1e-9) * db(-3)
    wavfile.write(ROOT / "build" / "mix.wav", SR, (mix * 32767).astype(np.int16))
    print("mix written", mix.shape[0] / SR, "s")


if __name__ == "__main__":
    main()
