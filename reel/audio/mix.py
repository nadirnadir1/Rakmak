"""Final soundtrack: voiceover (clean, on top) + original music (ducked) + synced SFX.

Usage: python3 mix.py <reel_root> <out.wav>
Loudness target: -14 LUFS integrated, -1 dBTP ceiling (Instagram/Reels).
"""
import json
import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from synth import SR, db, n_of, hp, lp, peq, shelf, limiter, env_follow, place  # noqa: E402
import music  # noqa: E402
import sfx  # noqa: E402

ROOT = sys.argv[1]
OUT = sys.argv[2]
NO_MUSIC = len(sys.argv) > 3 and sys.argv[3] == "nomusic"  # voice + sfx only (to add a trending IG sound)
OFF = 0.30
TOTAL = 59.90

# ------------------------------------------------------------ word timing (same rules as the visuals)
segs = json.load(open(f"{ROOT}/data/words.json"))
CORR = {(8, "أثناء"): (23.046, 23.42), (8, "الخدمة"): (23.42, 24.15), (8, "بشروط"): (24.15, 24.687),
        (11, "هذه"): (37.055, 37.20), (11, "التسهيلات"): (37.20, 37.696)}
WORDS = []
for si, sg in enumerate(segs):
    for w in sg["words"]:
        s, e = CORR.get((si, w["w"]), (w["start"], w["end"]))
        WORDS.append((w["w"], s + OFF, e + OFF))


def Wt(word, nth=1):
    n = 0
    for w, s, e in WORDS:
        if w == word or w.strip("؟،?!.,") == word:
            n += 1
            if n == nth:
                return s
    raise KeyError(word)


# ------------------------------------------------------------ SFX cue sheet (time, name, gain dB)
C = []
add = lambda t, name, g: C.append((t, name, g))
# S1 hook
add(0.0, "hit", -14); add(0.0, "whoosh", -16)
add(1.20, "swish", -15)
add(Wt("موعد") - 0.12, "pop", -13); add(Wt("موعد") - 0.14, "paper", -17)
tx0 = Wt("الفيزا") - 0.1
for i in range(0, 28, 2):
    add(tx0 + i * 0.028, "click", -24)
add(tx0 + 0.6, "error", -20)
add(Wt("لباريس"), "pop_hi", -13)
# S2 split
add(3.69, "whoosh_long", -12)
add(4.06, "pop", -17); add(4.21, "pop", -17); add(4.26, "pop_lo", -19)
add(Wt("بلا") - 0.05, "hit", -14)
add(Wt("سياحية"), "error", -19)
add(Wt("غير") - 0.07, "swish", -17)
add(Wt("خدام") - 0.02, "whoosh", -15); add(Wt("خدام") + 0.3, "success", -13)
# S3 passports
add(8.98, "whoosh_long", -12)
add(Wt("يفاجئك"), "pop_hi", -14)
add(Wt("بجوجهم") + 0.12, "pop", -13); add(Wt("بجوجهم") - 0.05, "whoosh", -17)
add(Wt("مغاربة") - 0.04, "hit", -15)
# S4 the difference + steward reveal
add(12.0, "impact", -10)
add(12.81, "ding", -12); add(12.76, "whoosh_long", -15)
add(Wt("مضيف") - 0.05, "sparkle", -17)
# S5 stamp
add(14.94, "swish", -17)
add(Wt("فعلا") - 0.04, "stamp", -10)
# S6 map
add(16.70, "whoosh_long", -13)
for w, nth in (("فرنسا", 1), ("إسبانيا", 1), ("وبريطانيا", 1)):
    add(Wt(w, nth) - 0.18, "whoosh", -17)
    add(Wt(w, nth) - 0.18 + 0.55, "pop", -14)
# S6b crew badge + exemption seal
add(Wt("طاقم") - 0.05, "whoosh", -16); add(Wt("طاقم") + 0.25, "click", -18)
add(Wt("إعفاءات") - 0.05, "hit", -15); add(Wt("إعفاءات"), "sparkle", -19)
add(23.30, "swish", -18)
# S6c documents
add(24.36, "whoosh", -15); add(Wt("بشروط") - 0.1, "paper", -14)
for i in range(3):
    add(Wt("ووثائق") + i * 0.22, "pop_hi", -15)
# S7 hidden perks
add(26.58, "whoosh_long", -14)
add(Wt("واحدة") - 0.05, "pop", -13)
for i in range(9):
    add(Wt("كيعرفوهاش") - 0.15 + i * 0.06, "pop_lo", -25)
    add(Wt("بزاف") + i * 0.05, "pop_hi", -27)
# S8 postcards
add(31.48, "whoosh_long", -13)
for w in ("السفر", "واكتشاف", "خلال"):
    ti = 31.5 if w == "السفر" else Wt(w) - 0.12
    if w != "السفر":
        add(ti - 0.02, "whoosh", -16)
    add(ti + 0.05, "shutter", -17)
    add(ti + 0.45, "stamp", -14)
add(Wt("التوقفات") - 0.1, "pop", -14)
# S9 but... service vs tourism
add(36.95, "hit", -13); add(36.97, "error", -18)
add(Wt("مرتبطة") - 0.2, "whoosh", -16)
add(Wt("بالخدمة"), "success", -13)
add(Wt("ماشي") - 0.05, "swish", -16)
add(Wt("بالسياحة") + 0.1, "error", -14)
# S10 USA crew visa
add(40.66, "whoosh_long", -13)
add(Wt("فيزا", 2) - 0.35, "whoosh", -15); add(Wt("فيزا", 2) - 0.2, "paper", -15)
# S11 question -> drop
add(43.62, "riser", -12)
add(44.53, "whoosh_rev", -15)
add(45.66, "impact", -8); add(45.69, "bassdrop", -11)
add(Wt("لعالم") - 0.22, "whoosh_long", -12); add(Wt("لعالم") + 0.1, "sparkle", -16)
# S13a logo
add(47.85, "flyby", -13)
add(49.45, "hit", -13); add(49.6, "swish", -17); add(49.8, "pop_lo", -17)
add(50.05, "success", -16); add(50.05, "sparkle", -18)
# S13b location
add(50.86, "whoosh", -14); add(51.13, "pin", -11)
add(51.56, "whoosh_long", -13); add(51.93, "pin", -10); add(52.08, "pop", -15)
# S13c training
add(52.48, "whoosh_long", -13)
add(Wt("مضيفات") - 0.05, "pop", -13); add(Wt("ومضيفي") - 0.05, "pop", -13)
# S14 registration open + end card
add(55.10, "impact", -9)
add(Wt("التسجيل") - 0.05, "flap_long", -18)
add(56.33, "whoosh", -15); add(56.45, "hit", -15); add(56.58, "whoosh", -16)
for i in range(4):
    add(56.5 + 0.25 + i * 0.28 + 0.05, "typing_short", -19)
add(57.95, "pop", -16)
add(58.92, "dingdong", -9)  # second tone lands on the final hit


def load_voice():
    import subprocess
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{ROOT}/assets/src/audio/voiceover.mp3", "-af",
                          "aresample=48000:resampler=soxr:precision=28", "-ac", "1", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    v = np.frombuffer(raw, np.float32).astype(np.float64)
    v = hp(v, 75, 2)
    v = shelf(v, 9000, 1.0, "high")  # a touch of air, nothing else: keep it natural
    return v


def lufs(x):
    meter = pyln.Meter(SR)
    return meter.integrated_loudness(x if x.ndim == 2 else np.stack([x, x], 1))


def main():
    N = n_of(TOTAL)
    # --- voice
    v = load_voice()
    voice = np.zeros(N)
    i0 = n_of(OFF)
    voice[i0:i0 + len(v)] = v[: N - i0]
    vl = lufs(voice[i0:i0 + len(v)])
    voice *= db(-16.0 - vl)
    voice_st = np.stack([voice, voice], 1)

    # --- music
    mus, meta = music.render_music(TOTAL, OFF)
    mus = mus[:N]
    if len(mus) < N:
        mus = np.concatenate([mus, np.zeros((N - len(mus), 2))])
    ml = lufs(mus)
    mus *= db(-18.5 - ml)  # bed level before ducking

    # sidechain duck from the voice envelope
    venv = env_follow(voice, attack=0.015, release=0.35)
    thr = db(-38)
    act = np.clip((20 * np.log10(np.maximum(venv, 1e-9)) - 20 * np.log10(thr)) / 12.0, 0, 1)
    act = signal.lfilter([1 - np.exp(-1 / (0.06 * SR))], [1, -np.exp(-1 / (0.06 * SR))], act)
    duck = db(-8.5 * act)
    mus_d = mus * duck[:, None]
    # keep voice intelligibility: dip the music's presence band harder while she speaks
    pres = peq(mus_d, 2500, -4.0, 0.7)
    mus_d = mus_d * (1 - act[:, None] * 0.6) + pres * (act[:, None] * 0.6)
    # the outro: let the music breathe after the last word
    t = np.arange(N) / SR
    t_end_voice = OFF + 56.03
    lift = np.clip((t - t_end_voice) / 0.6, 0, 1) * 3.0
    mus_d *= db(lift)[:, None]
    # fade the very end
    fade = np.clip((TOTAL - t) / 0.35, 0, 1)
    mus_d *= fade[:, None]

    # --- sfx
    fxbus = np.zeros((N, 2))
    cache = {}
    for (tc, name, g) in sorted(C):
        if name not in cache:
            cache[name] = sfx.LIB[name]()
        place(fxbus, cache[name], tc, db(g))
    fxbus *= db(-5.0 * act)[:, None]  # sfx step back under words
    fxbus *= fade[:, None]

    if NO_MUSIC:
        mus_d = mus_d * 0.0
    mix = voice_st + mus_d + fxbus
    # gentle glue + ceiling
    mix = limiter(mix, ceiling_db=-1.2, attack=0.002, release=0.12)
    L = lufs(mix)
    mix *= db(-14.0 - L)
    mix = limiter(mix, ceiling_db=-1.0, attack=0.001, release=0.08)
    print(f"voice {vl:.1f} LUFS raw | music raw {ml:.1f} | final {lufs(mix):.2f} LUFS, peak {20*np.log10(np.abs(mix).max()):.2f} dBFS")
    # report voice-to-bed ratio while speaking
    m_act = act > 0.8
    def rms_db(x):
        return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
    print(f"while speaking: voice {rms_db(voice[m_act]):.1f} dB, music {rms_db(mus_d[m_act].mean(1)):.1f} dB, sfx {rms_db(fxbus[m_act].mean(1)):.1f} dB")
    sf.write(OUT, mix.astype(np.float32), SR, subtype="FLOAT")
    # stems for QA
    base = OUT.rsplit(".", 1)[0]
    sf.write(base + "_music.wav", mus_d.astype(np.float32), SR, subtype="FLOAT")
    sf.write(base + "_sfx.wav", fxbus.astype(np.float32), SR, subtype="FLOAT")
    json.dump(meta, open(base + "_meta.json", "w"), indent=1)


if __name__ == "__main__":
    main()
