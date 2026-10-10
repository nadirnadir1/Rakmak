"""Beat-synced vertical edit renderer. Decodes graded segments with ffmpeg,
composes effects/text in numpy+PIL, pipes frames to an x264 encoder."""
import subprocess, sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC = sys.argv[1]
MUSIC = sys.argv[2]
OUT = sys.argv[3]
PREVIEW = len(sys.argv) > 4  # optional: only render a time window "a:b"

W, H, FPS = 1080, 1920, 50
BPM = 128.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
END_EXTRA = 1.4
TOTAL = 23 * BAR + END_EXTRA
FONT_BLACK = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
FONT_BOLD = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"

GRADE = {
    "sky": "eq=contrast=1.18:brightness=0.035:saturation=1.45:gamma=1.04,vibrance=intensity=0.35,"
           "curves=master='0/0 0.25/0.21 0.5/0.52 0.75/0.8 1/1',colorbalance=bs=0.06:bm=0.03:rh=0.02",
    "pink": "eq=contrast=1.16:brightness=0.04:saturation=1.12:gamma=1.05,vibrance=intensity=0.25,"
            "curves=master='0/0 0.25/0.21 0.5/0.52 0.75/0.8 1/1',colorbalance=bs=0.04:rm=-0.02",
    "ground": "eq=contrast=1.15:brightness=0.03:saturation=1.35:gamma=1.06,vibrance=intensity=0.3,"
              "curves=master='0/0 0.25/0.21 0.5/0.52 0.75/0.8 1/1',colorbalance=rm=0.03:bm=-0.02:bs=0.04",
    "ground_pink": "eq=contrast=1.15:brightness=0.035:saturation=1.12:gamma=1.06,vibrance=intensity=0.2,"
                   "curves=master='0/0 0.25/0.21 0.5/0.52 0.75/0.8 1/1',colorbalance=bs=0.03:rm=-0.02",
}

# (start_bar, n_bars, src_start, speed, kind, punch)
SEGS = [
    (0, 2, 45.0, 1.0, "sky", 1.0),
    (2, 1, 0.3, 1.0, "ground", 0.6),
    (3, 1, 5.0, 1.0, "ground", 0.6),
    (4, 1, 8.0, 2.0, "ground", 0.6),
    (5, 1, 19.5, 2.0, "ground", 0.6),
    (6, 2, 25.8, 1.0, "sky", 1.0),
    (8, 2, 31.0, 1.0, "sky", 0.8),
    (10, 2, 36.9, 1.0, "sky", 0.8),
    (12, 1, 40.9, 1.0, "sky", 0.5),
    (13, 3, 42.8, 1.0, "sky", 1.0),
    (16, 2, 49.0, 1.44, "pink", 0.8),
    (18, 2, 54.4, 1.0, "pink", 0.8),
    (20, 3, 59.3, 1.6, "ground_pink", 0.6),  # also covers END_EXTRA
]
DROP_BARS = set(range(0, 2)) | (set(range(6, 20)) - {12})
BIG_HITS = [0.0, 6 * BAR, 13 * BAR]
GLITCH_CUTS = [8 * BAR, 10 * BAR, 16 * BAR, 18 * BAR, 2 * BAR, 4 * BAR]

def seg_duration(i):
    sb, nb = SEGS[i][0], SEGS[i][1]
    d = nb * BAR
    if i == len(SEGS) - 1:
        d += END_EXTRA
    return d

def decode(i):
    sb, nb, src, speed, kind, _ = SEGS[i]
    dur = seg_duration(i)
    nfr = int(round((sb * BAR + dur) * FPS)) - int(round(sb * BAR * FPS))
    vf = f"setpts=(PTS-STARTPTS)/{speed},fps={FPS},{GRADE[kind]}"
    if kind.startswith("ground"):
        vf += ",transpose=2,scale=1584:880:flags=lanczos"
        fw, fh = 1584, 880
    else:
        vf += ",scale=1080:1944:flags=lanczos,crop=1080:1920"
        fw, fh = 1080, 1920
    vf += ",unsharp=5:5:0.6"
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{src:.3f}", "-t", f"{dur * speed + 0.2:.3f}", "-i", SRC,
           "-vf", vf, "-an", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    fs = fw * fh * 3
    frames = [np.frombuffer(raw[k * fs:(k + 1) * fs], np.uint8).reshape(fh, fw, 3) for k in range(len(raw) // fs)]
    while len(frames) < nfr:
        frames.append(frames[-1])
    return frames[:nfr], kind

# ------------------------------------------------------------------ helpers
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIGNETTE = (1 - 0.32 * np.clip((r - 0.55) / 0.85, 0, 1) ** 1.6)[..., None].astype(np.float32)

def zoom_crop(img, z, dx=0.0, dy=0.0):
    """img is HxW (any size >= target aspect); zoom about center + offset, return W x H."""
    ih, iw = img.shape[:2]
    cw, ch = iw / z, ih / z
    cx = iw / 2 + dx
    cy = ih / 2 + dy
    x0 = min(max(cx - cw / 2, 0), iw - cw)
    y0 = min(max(cy - ch / 2, 0), ih - ch)
    im = Image.fromarray(img)
    return im.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))

FG_W, FG_H = 1080, 600
FG_Y = (H - FG_H) // 2
mask = Image.new("L", (FG_W, FG_H), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, FG_W - 1, FG_H - 1), radius=28, fill=255)
FG_MASK = mask
shadow = Image.new("L", (W, H), 0)
ImageDraw.Draw(shadow).rounded_rectangle((20, FG_Y + 18, W - 20, FG_Y + FG_H + 30), radius=40, fill=170)
SHADOW = np.asarray(shadow.filter(ImageFilter.GaussianBlur(30)), np.float32)[..., None] / 255.0

def ground_frame(img, z, dx, dy, tl):
    """Landscape clip over blurred, darkened copy of itself."""
    # background: cover-fill, heavy blur
    small = Image.fromarray(img).resize((396, 220), Image.BILINEAR)
    bh = 480
    bw = int(396 * bh / 220)
    bg = small.resize((bw, bh), Image.BILINEAR)
    x0 = (bw - 270) // 2 + int(dx * 0.1)
    bg = bg.crop((x0, 0, x0 + 270, bh)).filter(ImageFilter.GaussianBlur(9)).resize((W, H), Image.BILINEAR)
    bga = np.asarray(bg, np.float32) * 0.55
    bga *= (1 - 0.6 * SHADOW)
    # foreground with slow push-in plus punch
    ih, iw = img.shape[:2]
    zz = z * (1.0 + 0.05 * tl)
    cw, ch = iw / zz, ih / zz
    cx0 = (iw - cw) / 2 + dx * 0.5
    cy0 = (ih - ch) / 2 + dy * 0.5
    cx0 = min(max(cx0, 0), iw - cw)
    cy0 = min(max(cy0, 0), ih - ch)
    fg = Image.fromarray(img).resize((FG_W, FG_H), Image.BILINEAR, box=(cx0, cy0, cx0 + cw, cy0 + ch))
    canvas = Image.fromarray(np.clip(bga, 0, 255).astype(np.uint8))
    canvas.paste(fg, (0, FG_Y), FG_MASK)
    return canvas

# text ------------------------------------------------------------------
_tcache = {}
def text_img(txt, size, font=FONT_BLACK, tracking=0, color=(255, 255, 255), stroke=0):
    key = (txt, size, font, tracking, color, stroke)
    if key in _tcache:
        return _tcache[key]
    f = ImageFont.truetype(font, size)
    widths = [f.getlength(c) for c in txt]
    tw = int(sum(widths) + tracking * (len(txt) - 1)) + 2 * size
    th = int(size * 1.6)
    pad = size // 2
    layer = Image.new("RGBA", (tw + 2 * pad, th + 2 * pad), (0, 0, 0, 0))
    sh = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    d, ds = ImageDraw.Draw(layer), ImageDraw.Draw(sh)
    x = pad + size
    for c, w_ in zip(txt, widths):
        ds.text((x + size * 0.04, pad + size * 0.1), c, font=f, fill=(0, 0, 0, 200))
        d.text((x, pad), c, font=f, fill=color + (255,), stroke_width=stroke, stroke_fill=(0, 0, 0, 255))
        x += w_ + tracking
    sh = sh.filter(ImageFilter.GaussianBlur(max(2, size // 12)))
    out = Image.alpha_composite(sh, layer)
    out = out.crop(out.getbbox())
    _tcache[key] = out
    return out

def draw_text(canvas, img, cx, cy, scale=1.0, alpha=1.0):
    if alpha <= 0.01 or scale <= 0.01:
        return
    if abs(scale - 1) > 1e-3:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.BILINEAR)
    if alpha < 1:
        a = img.getchannel("A").point(lambda v: int(v * alpha))
        img = img.copy()
        img.putalpha(a)
    canvas.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))

def pop(t, dur=0.35, over=1.12):
    """scale curve 0 -> overshoot -> 1"""
    if t < 0:
        return 0.0
    if t >= dur:
        return 1.0
    u = t / dur
    return 1 + (over - 1) * math.sin(math.pi * u) - (1 - u) ** 3

def fade(t, t0, t1, a=0.15):
    if t < t0 or t > t1:
        return 0.0
    return min(1.0, (t - t0) / a, (t1 - t) / a)

def overlay_text(canvas, T):
    # 1) hook title
    if T < 3.75:
        al = fade(T, 0.05, 3.7, 0.12)
        draw_text(canvas, text_img("AL FURSAN", 150, tracking=6), W / 2, 560, pop(T - 0.05, 0.4, 1.15), al)
        if T > 0.45:
            u = min(1, (T - 0.45) / 0.3)
            draw_text(canvas, text_img("UAE AEROBATIC TEAM", 58, FONT_BLACK, tracking=12, color=(255, 236, 170)),
                      W / 2, 690 + 30 * (1 - u) ** 2, 1.0, al * u)
        # thin accent line
    # 2) build "WAIT FOR IT..."
    t0 = 2 * BAR + 0.3
    if t0 <= T < 5 * BAR:
        msg = "WAIT FOR IT..."
        nch = min(len(msg), int((T - t0) / (BEAT / 2)) + 1)
        tb = ((T - 2 * BAR) % BEAT)
        pulse = 1 + 0.05 * math.exp(-tb / 0.09)
        al = fade(T, t0, 5 * BAR, 0.1)
        full = text_img(msg, 92, tracking=4)
        part = text_img(msg[:nch], 92, tracking=4)
        img = full.crop((0, 0, min(full.width, part.width), full.height))
        canvas_img = Image.new("RGBA", full.size, (0, 0, 0, 0))
        canvas_img.paste(img, (0, 0))
        draw_text(canvas, canvas_img, W / 2, 470, pulse, al)
    # 3) countdown on beats 0..2 of bar 5
    for k, num in enumerate(("3", "2", "1")):
        tb = T - (5 * BAR + k * BEAT)
        if 0 <= tb < BEAT:
            s = 1.0 + 0.7 * math.exp(-tb / 0.07)
            al = min(1.0, (BEAT - tb) / 0.12)
            draw_text(canvas, text_img(num, 330, tracking=0, color=(255, 255, 255), stroke=0), W / 2, 960, s, al)
    # 4) outro call to action
    t1 = 20 * BAR + BEAT * 2
    if T >= t1:
        al = fade(T, t1, TOTAL - 0.6, 0.15)
        draw_text(canvas, text_img("FOLLOW FOR MORE", 96, tracking=4), W / 2, 470, pop(T - t1, 0.4, 1.12), al)
        t2 = t1 + BEAT * 2
        if T > t2:
            u = min(1, (T - t2) / 0.3)
            draw_text(canvas, text_img("LIKE  •  SHARE  •  SAVE", 46, FONT_BOLD, tracking=10,
                                       color=(255, 236, 170)), W / 2, 580 + 25 * (1 - u) ** 2, 1.0, al * u)

# ------------------------------------------------------------------ main
def main():
    win = None
    if PREVIEW:
        a, b = map(float, sys.argv[4].split(":"))
        win = (a, b)
    t_start = win[0] if win else 0.0
    t_end = win[1] if win else TOTAL
    enc = subprocess.Popen([
        "ffmpeg", "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-ss", f"{t_start:.3f}", "-i", MUSIC,
        "-map", "0:v", "-map", "1:a",
        "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
        "-t", f"{t_end - t_start:.3f}",
        "-af", f"afade=t=out:st={max(0, TOTAL - 1.2 - t_start):.3f}:d=1.2",
        "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
    fidx = 0
    for i in range(len(SEGS)):
        sb, nb, src, speed, kind, punch = SEGS[i]
        seg_t0 = sb * BAR
        dur = seg_duration(i)
        if seg_t0 + dur < t_start or seg_t0 > t_end:
            continue
        frames, kind = decode(i)
        print(f"seg {i}: {len(frames)} frames ({kind})", flush=True)
        for k, img in enumerate(frames):
            T = (int(round(seg_t0 * FPS)) + k) / FPS
            if T < t_start or T >= t_end:
                continue
            tl = k / max(1, len(frames) - 1)  # 0..1 within segment
            ts = k / FPS
            bar = int(T // BAR)
            # zoom: punch-in on cut + slow push + beat bounce in drops
            z = 1.0 + 0.16 * punch * math.exp(-ts / 0.13)
            if not kind.startswith("ground"):
                z *= 1.0 + 0.07 * tl
            if bar in DROP_BARS:
                tb = T % BEAT
                z *= 1 + 0.022 * math.exp(-tb / 0.07)
            # shake on big hits
            dx = dy = 0.0
            for h in BIG_HITS:
                th = T - h
                if 0 <= th < 0.5:
                    amp = 22 * math.exp(-th / 0.12)
                    dx += amp * math.sin(th * 97)
                    dy += amp * math.cos(th * 71)
            if kind.startswith("ground"):
                canvas = ground_frame(img, z, dx, dy, tl)
            else:
                canvas = zoom_crop(img, z * 1.03, dx, dy)
            arr = np.asarray(canvas, np.float32)
            # RGB split glitch on certain cuts
            for g in GLITCH_CUTS:
                tg = T - g
                if 0 <= tg < 0.16:
                    s = int(16 * (1 - tg / 0.16)) + 1
                    arr[:, s:, 0] = arr[:, :-s, 0].copy()
                    arr[:, :-s, 2] = arr[:, s:, 2].copy()
            # white flash on cuts
            fl = 0.0
            for h in BIG_HITS:
                th = T - h
                if 0 <= th < 0.4:
                    fl = max(fl, 0.85 * math.exp(-th / 0.07))
            if abs(ts) < 0.12 and seg_t0 not in BIG_HITS:
                fl = max(fl, 0.35 * math.exp(-ts / 0.04))
            # breath before the drop (bar 5, beat 3)
            dim = 1.0
            if 5 * BAR + 3 * BEAT <= T < 6 * BAR:
                dim = 0.35
            # fade-in at start, fade-out at end
            if T < 0.08:
                dim *= T / 0.08
            if T > TOTAL - 0.9:
                dim *= max(0.0, (TOTAL - T) / 0.9)
            arr = arr * VIGNETTE
            if fl > 0:
                arr = arr * (1 - fl) + 255 * fl
            arr *= dim
            canvas = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")
            overlay_text(canvas, T)
            enc.stdin.write(canvas.convert("RGB").tobytes())
            fidx += 1
    enc.stdin.close()
    enc.wait()
    print("frames:", fidx, "duration:", fidx / FPS)

main()
