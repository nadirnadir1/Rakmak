"""Composite the 7 reference images into the final 9:16 reel.

Each image becomes a cinematic 2.5D shot: eased dolly / tracking / arc moves,
reframes on the voice-over pauses, light sweeps, grain, and motion-blurred
whip transitions. Frames are piped straight into ffmpeg.

Run: python3 src/make_video.py  (after render_overlays.py and make_audio.py)
"""
import math
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

from timeline import DURATION, FPS, H, S, W

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "images"
OV = ROOT / "build" / "overlays"
UPS = 1.55                                  # working resolution vs. output
SW, SH = int(W * UPS), int(H * UPS)


# ------------------------------------------------------------ helpers ----
def smooth(x):
    x = min(max(x, 0.0), 1.0)
    return 0.5 - 0.5 * math.cos(math.pi * x)


def lerp(a, b, k):
    return a + (b - a) * k


def grade(img):
    """Natural premium grade: gentle contrast, navy shadows, warm highlights."""
    f = img.astype(np.float32) / 255.0                       # BGR
    lum = (0.114 * f[..., 0] + 0.587 * f[..., 1] + 0.299 * f[..., 2])[..., None]
    f = f + (f - 0.5) * 0.06                                 # light contrast
    shadow = np.clip(1 - lum * 2.2, 0, 1)
    high = np.clip((lum - 0.6) / 0.4, 0, 1)
    f += shadow * np.array([0.022, 0.006, -0.008])           # navy in shadows
    f += high * np.array([-0.012, 0.004, 0.018])             # warm highlights
    return np.clip(f * 255, 0, 255).astype(np.uint8)


def load(name):
    img = cv2.imread(str(IMG / name), cv2.IMREAD_COLOR)
    img = cv2.resize(img, (SW, SH), interpolation=cv2.INTER_LANCZOS4)
    blur = cv2.GaussianBlur(img, (0, 0), 2.2)
    img = cv2.addWeighted(img, 1.35, blur, -0.35, 0)         # restore crispness after upscale
    return grade(img)


def load_overlay(name):
    o = cv2.imread(str(OV / f"{name}.png"), cv2.IMREAD_UNCHANGED).astype(np.float32) / 255.0
    return o[..., :3], o[..., 3:4]


# --------------------------------------------------------------- shots ----
# camera: (t0, t1, (scale, cx, cy, rot_deg) at t0, same at t1)
# scale 1.0 == image fills the frame; cx/cy are normalized image coordinates.
SHOTS = [
    # Scene 1 - hook: push toward the traveler, card and kiosk
    dict(img="s1_traveler.png", t0=S[0], t1=S[1], a=(1.04, 0.50, 0.50, 0.0), b=(1.22, 0.56, 0.52, 0.0)),
    # Scene 2 - reveal: lateral tracking, then tighter tracking on the faces
    dict(img="s2_walking.png", t0=S[1], t1=7.35, a=(1.16, 0.41, 0.50, 0.0), b=(1.20, 0.55, 0.49, 0.0)),
    dict(img="s2_walking.png", t0=7.35, t1=S[2], a=(1.55, 0.44, 0.33, 0.0), b=(1.62, 0.56, 0.32, 0.0)),
    # Scene 3 - imagine this life: slow lateral slide revealing the aircraft
    dict(img="s3_window.png", t0=S[2], t1=14.73, a=(1.30, 0.40, 0.42, 0.0), b=(1.26, 0.58, 0.42, 0.0)),
    dict(img="s3_window.png", t0=14.73, t1=S[3], a=(1.08, 0.50, 0.50, 0.0), b=(1.20, 0.53, 0.46, 0.0)),
    # Scene 4 - cabin crew: dolly down the aisle, then medium on the crew
    dict(img="s4_cabin.png", t0=S[3], t1=22.29, a=(1.03, 0.50, 0.50, 0.0), b=(1.22, 0.50, 0.44, 0.0)),
    dict(img="s4_cabin.png", t0=22.29, t1=S[4], a=(1.42, 0.46, 0.33, 0.0), b=(1.52, 0.49, 0.31, 0.0)),
    # Scene 5 - training: three reframes on the keywords
    dict(img="s5_training.png", t0=S[4], t1=28.36, a=(1.06, 0.50, 0.50, 0.0), b=(1.14, 0.50, 0.47, 0.0)),
    dict(img="s5_training.png", t0=28.36, t1=30.75, a=(1.50, 0.74, 0.42, 0.0), b=(1.58, 0.71, 0.40, 0.0)),
    dict(img="s5_training.png", t0=30.75, t1=S[5], a=(1.45, 0.28, 0.40, 0.0), b=(1.52, 0.36, 0.38, 0.0)),
    # Scene 6 - aspiration: camera arc, then close on their faces
    dict(img="s6_aspiration.png", t0=S[5], t1=38.69, a=(1.12, 0.44, 0.50, -1.1), b=(1.24, 0.56, 0.47, 0.6)),
    dict(img="s6_aspiration.png", t0=38.69, t1=S[6], a=(1.55, 0.36, 0.31, 0.0), b=(1.65, 0.42, 0.30, 0.0)),
    # Scene 7 - brand reveal: elegant pull-out on the group
    dict(img="s7_group.png", t0=S[6], t1=DURATION, a=(1.24, 0.50, 0.40, 0.0), b=(1.04, 0.50, 0.50, 0.0)),
]

# scene-level transitions at these times: kind + half-length in seconds
TRANSITIONS = {
    S[1]: ("whip", 0.17),
    S[2]: ("dissolve", 0.30),
    S[3]: ("dissolve", 0.30),
    S[4]: ("whip", 0.17),
    S[5]: ("dissolve", 0.30),
    S[6]: ("bloom", 0.25),
}

# text cues: overlay, in, out (out=None -> stays to the end)
TEXT = [
    ("s1_hook", 0.12, 3.50),
    ("s2_reveal", 3.95, 7.20),
    ("s3_line", 11.25, 17.90),
    ("s4_cabin", 18.90, 26.45),
    ("s4_more", 22.45, 26.45),
    ("s5_k1", 28.55, 32.95),
    ("s5_k2", 29.95, 32.95),
    ("s5_k3", 31.30, 32.95),
    ("s6_q", 38.95, 41.30),
    ("s7_logo", 41.85, None),
    ("s7_title", 42.35, None),
    ("s7_pills", 42.85, None),
    ("s7_contact", 43.30, None),
]

LIGHT_SWEEPS = [(S[2], S[3]), (S[5], S[6])]


class Renderer:
    def __init__(self):
        self.images = {}
        for s in SHOTS:
            if s["img"] not in self.images:
                self.images[s["img"]] = load(s["img"])
        self.ov = {name: load_overlay(name) for name, _, _ in TEXT}
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        self.yy, self.xx = yy, xx
        r = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.75)) ** 2)
        self.vignette = (1 - 0.22 * np.clip(r - 0.35, 0, 1) ** 1.6)[..., None]
        g = yy / H
        # lower-third scrim keeps white captions readable on bright floors
        self.scrim = (np.clip((g - 0.55) / 0.30, 0, 1) ** 1.3 * 0.42)[..., None]
        # brand card scrim: deep navy from mid-frame down
        self.brand_scrim = (np.clip((g - 0.40) / 0.30, 0, 1) ** 1.1 * 0.80)[..., None]
        self.navy = np.array([48, 20, 8], np.float32) / 255.0      # BGR
        rng = np.random.default_rng(3)
        self.grain = [rng.normal(0, 2.4, (H // 2, W // 2)).astype(np.float32) for _ in range(6)]

    # camera ----------------------------------------------------------------
    def shot_frame(self, shot, t, extra_scale=1.0, shift_x=0.0):
        k = smooth((t - shot["t0"]) / (shot["t1"] - shot["t0"]))
        sc, cx, cy, rot = (lerp(a, b, k) for a, b in zip(shot["a"], shot["b"]))
        sc *= extra_scale
        # subtle handheld micro-motion
        hx = 1.6 * math.sin(t * 1.3) + 0.9 * math.sin(t * 2.9 + 1.0)
        hy = 1.2 * math.sin(t * 1.1 + 2.0) + 0.7 * math.sin(t * 3.3)
        rot += 0.06 * math.sin(t * 0.9)
        src = self.images[shot["img"]]
        # clamp center so the frame never leaves the image
        half_w, half_h = 0.5 / sc, 0.5 / sc
        cx = min(max(cx, half_w + 0.004), 1 - half_w - 0.004)
        cy = min(max(cy, half_h + 0.004), 1 - half_h - 0.004)
        s = sc / UPS                                             # source px -> output px
        M = cv2.getRotationMatrix2D((cx * SW, cy * SH), rot, s)
        M[0, 2] += W / 2 - cx * SW + hx + shift_x
        M[1, 2] += H / 2 - cy * SH + hy
        return cv2.warpAffine(src, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

    def shot_at(self, t):
        for s in SHOTS:
            if s["t0"] <= t < s["t1"]:
                return s
        return SHOTS[-1]

    def base(self, t):
        for at, (kind, half) in TRANSITIONS.items():
            if abs(t - at) < half:
                return self.transition(t, at, kind, half)
        return self.shot_frame(self.shot_at(t), t).astype(np.float32) / 255.0

    def transition(self, t, at, kind, half):
        out_shot = self.shot_at(at - 1e-3)
        in_shot = self.shot_at(at + 1e-3)
        p = (t - (at - half)) / (2 * half)                        # 0..1
        if kind == "whip":
            # short lateral push hidden inside a motion blur; zoomed so no edge shows
            travel = W * 0.10
            if p < 0.5:
                k = smooth(p * 2)
                f = self.shot_frame(out_shot, min(t, at - 1e-3), extra_scale=1 + 0.18 * k, shift_x=-travel * k)
            else:
                k = 1 - smooth((p - 0.5) * 2)
                f = self.shot_frame(in_shot, max(t, at), extra_scale=1 + 0.18 * k, shift_x=travel * k)
            strength = 1 - abs(p - 0.5) * 2
            ks = int(9 + 140 * strength) | 1
            kernel = np.zeros((1, ks), np.float32)
            kernel[0, :] = 1.0 / ks
            f = cv2.filter2D(f, -1, kernel, borderType=cv2.BORDER_REFLECT)
            return f.astype(np.float32) / 255.0
        a = self.shot_frame(out_shot, min(t, at - 1e-3), extra_scale=1 + 0.04 * smooth(p)).astype(np.float32) / 255.0
        b = self.shot_frame(in_shot, max(t, at), extra_scale=1 + 0.04 * (1 - smooth(p))).astype(np.float32) / 255.0
        m = smooth(p)
        f = a * (1 - m) + b * m
        if kind == "bloom":
            glow = math.sin(math.pi * p) * 0.28
            warm = np.array([0.86, 0.94, 1.0], np.float32)
            f = f + (1 - f) * glow * warm
        return f

    # finishing -------------------------------------------------------------
    def light_sweep(self, f, t):
        for a, b in LIGHT_SWEEPS:
            if a <= t < b:
                p = (t - a) / (b - a)
                pos = lerp(-0.4, 1.4, p) * (W + H)
                d = (self.xx * 0.8 + self.yy * 0.35 - pos * 0.6) / 260.0
                band = np.exp(-d * d)[..., None] * 0.07
                f = f + (1 - f) * band * np.array([0.80, 0.92, 1.0], np.float32)
        return f

    def text(self, f, t):
        for name, t_in, t_out in TEXT:
            if t < t_in or (t_out is not None and t > t_out + 0.3):
                continue
            k_in = smooth((t - t_in) / 0.42)
            k_out = 1.0 if t_out is None else 1 - smooth((t - t_out) / 0.28)
            a = k_in * k_out
            if a <= 0:
                continue
            rgb, alpha = self.ov[name]
            dy = (1 - k_in) * 26
            if dy > 0.01:
                M = np.float32([[1, 0, 0], [0, 1, dy]])
                rgb = cv2.warpAffine(rgb, M, (W, H))
                alpha = cv2.warpAffine(alpha, M, (W, H))[..., None]
            al = alpha * a
            f = f * (1 - al) + rgb * al
        return f

    def frame(self, i):
        t = i / FPS
        f = self.base(t)
        f = self.light_sweep(f, t)
        f = f * self.vignette
        # caption scrim (scenes 1-6), brand scrim (scene 7)
        if t < S[6]:
            f = f * (1 - self.scrim) + self.navy * self.scrim
        k = smooth((t - (S[6] + 0.1)) / 0.9)
        if k > 0:
            m = self.brand_scrim * k
            f = f * (1 - m) + self.navy * m
        f = self.text(f, t)
        g = cv2.resize(self.grain[i % len(self.grain)], (W, H), interpolation=cv2.INTER_LINEAR)[..., None] / 255.0
        f = f + g
        return np.clip(f * 255 + 0.5, 0, 255).astype(np.uint8)


def main():
    out = ROOT / "output" / "EFH_Cabin_Crew_Reel_9x16.mp4"
    preview_only = "--stills" in sys.argv
    r = Renderer()
    total = int(round(DURATION * FPS))
    if preview_only:
        sd = ROOT / "build" / "stills"
        sd.mkdir(exist_ok=True)
        for tt in [float(x) for x in sys.argv[sys.argv.index("--stills") + 1].split(",")]:
            cv2.imwrite(str(sd / f"t{tt:05.2f}.jpg"), cv2.resize(r.frame(int(tt * FPS)), (540, 960)))
        return
    cmd = ["ffmpeg", "-y", "-v", "error",
           "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", str(ROOT / "build" / "mix_norm.wav"),
           "-map", "0:v", "-map", "1:a",
           "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", "16M", "-bufsize", "32M", "-profile:v", "high", "-level", "4.2",
           "-pix_fmt", "yuv420p", "-x264-params", "keyint=60:min-keyint=30",
           "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
           "-movflags", "+faststart", "-t", f"{DURATION}", str(out)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(total):
        proc.stdin.write(r.frame(i).tobytes())
        if i % 150 == 0:
            print(f"frame {i}/{total}", flush=True)
    proc.stdin.close()
    proc.wait()
    print("wrote", out)


if __name__ == "__main__":
    main()
