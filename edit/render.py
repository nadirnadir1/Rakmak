"""Cinematic vertical edit v2: original orientation, exposure-balanced grade,
minimal motion design, modern typography and HYANI watermark."""
import subprocess, sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC, MUSIC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
WIN = tuple(map(float, sys.argv[4].split(":"))) if len(sys.argv) > 4 else None

W, H, FPS = 1080, 1920, 50
BPM = 120.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
END_EXTRA = 1.0
TOTAL = 22 * BAR + END_EXTRA
FD = "/usr/share/fonts/opentype/inter/"

BASE_CURVE = "curves=master='0/0 0.06/0.04 0.5/0.52 0.94/0.96 1/1'"
GRADE = {
    "sky": "eq=contrast=1.12:brightness=0.02:saturation=1.38:gamma=1.03,vibrance=intensity=0.3,"
           + BASE_CURVE + ",colorbalance=bs=0.05:bm=0.02",
    "pink": "eq=contrast=1.12:brightness=0.02:saturation=1.12:gamma=1.03,vibrance=intensity=0.2,"
            + BASE_CURVE + ",colorbalance=bs=0.03:rm=-0.02",
    "ground": "eq=contrast=1.12:brightness=0.02:saturation=1.3:gamma=1.03,vibrance=intensity=0.25,"
              + BASE_CURVE + ",colorbalance=rm=0.02:bs=0.03",
    "ground_pink": "eq=contrast=1.12:brightness=0.02:saturation=1.1:gamma=1.03,vibrance=intensity=0.15,"
                   + BASE_CURVE + ",colorbalance=bs=0.03:rm=-0.03",
}
TARGET_LUMA = {"sky": 0.53, "pink": 0.52, "ground": 0.50, "ground_pink": 0.50}

# (start_bar, n_bars, src_start, speed, kind, hit, interp)
SEGS = [
    (0, 2, 45.8, 0.6, "sky", True, True),      # slow-motion hook
    (2, 1, 0.4, 1.0, "ground", False, False),
    (3, 1, 4.9, 1.0, "ground", False, False),
    (4, 1, 8.0, 2.0, "ground", False, False),
    (5, 1, 19.4, 2.0, "ground", False, False),
    (6, 2, 25.8, 1.0, "sky", True, False),     # drop + title
    (8, 2, 31.0, 1.0, "sky", False, False),
    (10, 2, 36.9, 1.0, "sky", False, False),
    (12, 1, 40.9, 1.0, "sky", False, False),
    (13, 3, 43.4, 1.0, "sky", True, False),
    (16, 2, 49.4, 1.25, "pink", False, False),
    (18, 2, 54.4, 0.95, "pink", False, False),
    (20, 2, 59.3, 2.24, "ground_pink", True, False),
]
HITS = [s[0] * BAR for s in SEGS if s[5]]

def seg_frames(i):
    sb, nb = SEGS[i][0], SEGS[i][1]
    end = (sb + nb) * BAR + (END_EXTRA if i == len(SEGS) - 1 else 0)
    return int(round(sb * BAR * FPS)), int(round(end * FPS))

def decode(i):
    sb, nb, src, speed, kind, hit, interp = SEGS[i]
    f0, f1 = seg_frames(i)
    nfr = f1 - f0
    dur = nfr / FPS
    vf = f"setpts=(PTS-STARTPTS)/{speed},"
    vf += "minterpolate=fps=50:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1," if interp else f"fps={FPS},"
    vf += GRADE[kind] + ",scale=1080:1944:flags=lanczos,crop=1080:1920,unsharp=5:5:0.5"
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{src:.3f}", "-t", f"{dur * speed + 0.2:.3f}", "-i", SRC,
           "-vf", vf, "-an", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    fs = W * H * 3
    frames = [np.frombuffer(raw[k * fs:(k + 1) * fs], np.uint8).reshape(H, W, 3) for k in range(len(raw) // fs)]
    while len(frames) < nfr:
        frames.append(frames[-1])
    frames = frames[:nfr]
    # exposure balancing: smoothed per-frame gamma toward a target mean luma
    lum = np.array([(f[::8, ::8] @ np.array([0.2126, 0.7152, 0.0722])).mean() / 255 for f in frames])
    k = 25
    pad = np.pad(lum, (k, k), mode="edge")
    sm = np.convolve(pad, np.ones(2 * k + 1) / (2 * k + 1), mode="same")[k:-k]
    gam = np.clip(np.log(TARGET_LUMA[kind]) / np.log(np.clip(sm, 0.05, 0.95)), 0.72, 1.12)
    return frames, gam, kind

LUTX = np.arange(256) / 255.0
def apply_gamma(img, g):
    if abs(g - 1) < 0.01:
        return img
    lut = np.clip(255 * LUTX ** g + 0.5, 0, 255).astype(np.uint8)
    return lut[img]

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
rr = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIGNETTE = (1 - 0.16 * np.clip((rr - 0.6) / 0.8, 0, 1) ** 1.8)[..., None].astype(np.float32)

def zoom_crop(img, z, dx=0.0, dy=0.0):
    ih, iw = img.shape[:2]
    cw, ch = iw / z, ih / z
    x0 = min(max((iw - cw) / 2 + dx, 0), iw - cw)
    y0 = min(max((ih - ch) / 2 + dy, 0), ih - ch)
    return Image.fromarray(img).resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))

# ------------------------------------------------------------------ typography
_fonts = {}
def font(name, size):
    key = (name, size)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(FD + name, size)
    return _fonts[key]

def ease_out(u):
    u = min(max(u, 0.0), 1.0)
    return 1 - (1 - u) ** 3

def text_layer(txt, fname, size, tracking, color=(255, 255, 255), shadow=True):
    f = font(fname, size)
    widths = [f.getlength(c) for c in txt]
    tw = sum(widths) + tracking * (len(txt) - 1)
    pad = size
    img = Image.new("RGBA", (int(tw) + 2 * pad, int(size * 1.4) + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = pad
    for c, w_ in zip(txt, widths):
        d.text((x, pad), c, font=f, fill=color + (255,))
        x += w_ + tracking
    if shadow:
        a = img.getchannel("A").filter(ImageFilter.GaussianBlur(size * 0.12))
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sh.putalpha(a.point(lambda v: int(v * 0.55)))
        img = Image.alpha_composite(sh, img)
    return img.crop(img.getbbox())

def put(canvas, img, cx, cy, alpha=1.0, scale=1.0, blur=0.0):
    if alpha <= 0.01:
        return
    if abs(scale - 1) > 1e-3:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.BICUBIC)
    if blur > 0.3:
        padded = Image.new("RGBA", (img.width + int(4 * blur), img.height + int(4 * blur)), (0, 0, 0, 0))
        padded.paste(img, (int(2 * blur), int(2 * blur)))
        img = padded.filter(ImageFilter.GaussianBlur(blur))
    if alpha < 0.999:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v: int(v * alpha)))
    canvas.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))

def letters(canvas, txt, fname, size, tracking, cx, cy, t, stagger=0.045, dur=0.55, color=(255, 255, 255), alpha=1.0):
    """Per-letter reveal: each glyph rises and sharpens with a stagger."""
    f = font(fname, size)
    widths = [f.getlength(c) for c in txt]
    tw = sum(widths) + tracking * (len(txt) - 1)
    x = cx - tw / 2
    for i, (c, w_) in enumerate(zip(txt, widths)):
        u = ease_out((t - i * stagger) / dur)
        if u > 0 and c != " ":
            g = text_layer(c, fname, size, 0, color)
            put(canvas, g, x + w_ / 2, cy + 40 * (1 - u), alpha * u, 1.0, 6 * (1 - u))
        x += w_ + tracking

FLAG = [(206, 17, 38), (0, 122, 61), (255, 255, 255), (20, 20, 20)]
def flag_line(canvas, cx, cy, width, alpha):
    if width < 2 or alpha <= 0.01:
        return
    d = ImageDraw.Draw(canvas)
    seg = width / 4
    x0 = cx - width / 2
    for i, c in enumerate(FLAG):
        d.rectangle((x0 + i * seg, cy - 3, x0 + (i + 1) * seg - 2, cy + 3), fill=c + (int(255 * alpha),))

WM = text_layer("HYANI", "Inter-SemiBold.otf", 44, 14)

def window(T, t0, t1, fin=0.4, fout=0.4):
    return min(ease_out((T - t0) / fin), ease_out((t1 - T) / fout)) if t0 <= T <= t1 else 0.0

_g = Image.new("L", (W, 700), 0)
ImageDraw.Draw(_g).ellipse((60, 120, W - 60, 580), fill=110)
GLOW = Image.new("RGBA", (W, 700), (0, 0, 0, 0))
GLOW.putalpha(_g.filter(ImageFilter.GaussianBlur(90)))

def overlay(canvas, T):
    # hook: "THEY PAINTED / THE SKY"
    if T < 3.9:
        out = ease_out((T - 3.3) / 0.6) if T > 3.3 else 0.0
        put(canvas, GLOW, W / 2, 890, ease_out((T - 0.1) / 0.5) * (1 - out))
        a1 = ease_out((T - 0.15) / 0.5) * (1 - out)
        if a1 > 0:
            trk = 22 + 26 * (1 - ease_out((T - 0.15) / 0.9)) + 20 * out
            put(canvas, text_layer("THEY PAINTED", "InterDisplay-Regular.otf", 70, int(trk)), W / 2,
                760 - 30 * (1 - ease_out((T - 0.15) / 0.5)), a1, 1.0, 4 * out)
        a2 = ease_out((T - 0.5) / 0.5) * (1 - out)
        if a2 > 0:
            s = 1.08 - 0.08 * ease_out((T - 0.5) / 0.7) + 0.06 * out
            put(canvas, text_layer("THE SKY", "InterDisplay-Black.otf", 210, 6), W / 2, 905, a2, s,
                8 * (1 - ease_out((T - 0.5) / 0.5)) + 8 * out)
        flag_line(canvas, W / 2, 1035, 380 * ease_out((T - 0.9) / 0.6), (1 - out))
    # title at the drop
    t0 = 6 * BAR
    if t0 <= T < t0 + 2.8:
        al = window(T, t0, t0 + 2.8, 0.01, 0.45)
        put(canvas, text_layer("UAE AEROBATIC TEAM", "Inter-Medium.otf", 40, 16, (255, 222, 160)),
            W / 2, 700 - 20 * (1 - ease_out((T - t0 - 0.35) / 0.5)), al * ease_out((T - t0 - 0.35) / 0.5))
        letters(canvas, "AL FURSAN", "InterDisplay-Black.otf", 150, 8, W / 2, 805, T - t0, alpha=al)
        flag_line(canvas, W / 2, 905, 420 * ease_out((T - t0 - 0.5) / 0.6), al)
    # watermark
    wa = 0.7
    if T > TOTAL - 1.2:
        wa *= max(0.0, (TOTAL - T) / 1.2)
    ImageDraw.Draw(canvas).rectangle((60, 166, 64, 206), fill=(255, 255, 255, int(255 * wa)))
    put(canvas, WM, 80 + WM.width / 2, 186, wa)

# ------------------------------------------------------------------ main
def main():
    t_start, t_end = WIN if WIN else (0.0, TOTAL)
    enc = subprocess.Popen([
        "ffmpeg", "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-ss", f"{t_start:.3f}", "-i", MUSIC, "-map", "0:v", "-map", "1:a",
        "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-t", f"{t_end - t_start:.3f}",
        "-af", f"afade=t=out:st={max(0, TOTAL - 1.6 - t_start):.3f}:d=1.6",
        "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
    n = 0
    for i, (sb, nb, src, speed, kind, hit, interp) in enumerate(SEGS):
        f0, f1 = seg_frames(i)
        if f1 / FPS < t_start or f0 / FPS > t_end:
            continue
        frames, gam, kind = decode(i)
        print(f"seg {i}: {len(frames)} frames, gamma {gam.min():.2f}-{gam.max():.2f}", flush=True)
        for k, img in enumerate(frames):
            T = (f0 + k) / FPS
            if T < t_start or T >= t_end:
                continue
            ts = k / FPS
            tl = k / max(1, len(frames) - 1)
            img = apply_gamma(img, gam[k])
            z = 1.0 + 0.06 * tl
            z *= 1.0 + (0.10 if hit else 0.03) * math.exp(-ts / 0.18)
            dx = dy = 0.0
            if hit and ts < 0.5 and i > 0:
                amp = 10 * math.exp(-ts / 0.12)
                dx, dy = amp * math.sin(ts * 90), amp * math.cos(ts * 70)
            canvas = zoom_crop(img, z, dx, dy)
            arr = np.asarray(canvas, np.float32) * VIGNETTE
            if hit and ts < 0.35 and i > 0:
                fl = 0.5 * math.exp(-ts / 0.07)
                arr = arr * (1 - fl) + 255 * fl
            dim = 1.0
            if T < 0.25:
                dim = T / 0.25
            if T > TOTAL - 1.2:
                dim = max(0.0, (TOTAL - T) / 1.2)
            arr *= dim
            canvas = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")
            overlay(canvas, T)
            enc.stdin.write(canvas.convert("RGB").tobytes())
            n += 1
    enc.stdin.close()
    enc.wait()
    print("frames:", n, "duration:", n / FPS)

main()
