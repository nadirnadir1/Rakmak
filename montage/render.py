"""Render the Green March 51 montage (video only, 1080x1920 @ 30fps).

usage:
  render.py WORK_DIR OUT.mp4                 full render
  render.py WORK_DIR OUT_DIR --stills t1,t2  write preview PNGs at given times
"""
import json
import math
import os
import subprocess
import sys
import time

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gfx import *  # noqa: E402,F403

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = sys.argv[1]
SUBS = json.load(open(os.path.join(HERE, "subtitles.json"), encoding="utf-8"))

# ------------------------------------------------------------------ timeline
SEG = {
    "H1": (0.000, 2.200), "H2": (2.200, 4.567),
    "T1": (4.567, 6.607), "T2": (6.607, 8.720),
    "M1": (8.720, 10.807), "M2": (10.807, 12.873), "M3": (12.873, 14.970),
    "M4": (14.970, 17.080), "M5": (17.080, 18.890),
    "G": (18.890, 57.090), "B": (57.090, 128.790),
    "O1": (128.790, 132.200), "O2": (132.200, 136.000), "O3": (136.000, 144.500),
}
TOTAL = SEG["O3"][1]
GIRL_IN, BOY_IN = 0.70, 0.30            # in-points inside the original speech clips


def gv(tc):  # girl clip time -> video time
    return SEG["G"][0] + (tc - GIRL_IN)


def bv(tc):  # boy clip time -> video time
    return SEG["B"][0] + (tc - BOY_IN)


def seg_of(t):
    for k, (a, b) in SEG.items():
        if a <= t < b:
            return k
    return "O3"


# ------------------------------------------------------------------ sources
class Clip:
    """Sequential frame reader for a prepared 1080x1920 shot."""

    def __init__(self, path):
        self.path, self.proc, self.idx, self.last = path, None, -1, None

    def _open(self, start):
        if self.proc:
            self.proc.kill()
        self.proc = subprocess.Popen(
            ["ffmpeg", "-v", "error", "-ss", f"{start / FPS:.4f}", "-i", self.path,
             "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            bufsize=W * H * 3 * 2)
        self.idx = start - 1

    def frame(self, i):
        i = max(0, i)
        if self.proc is None or i < self.idx or i > self.idx + 90:
            self._open(i)
        while self.idx < i:
            buf = self.proc.stdout.read(W * H * 3)
            if len(buf) < W * H * 3:
                break
            self.last = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
            self.idx += 1
        return self.last


class Still:
    """Large photo that can be zoomed / panned to fill the 9:16 frame."""

    def __init__(self, img):
        src = img.astype(np.float32)
        ih, iw = src.shape[:2]
        sb = max(W / iw, H / ih)
        f = min(1.0, 1.5 * sb)
        if f < 0.99:
            src = cv2.resize(src, (int(iw * f), int(ih * f)), interpolation=cv2.INTER_AREA)
            sb /= f
        self.src, self.sb = src, sb
        self.ih, self.iw = src.shape[:2]

    def render(self, z=1.0, ux=0.5, uy=0.5):
        s = self.sb * z
        hw, hh = W / (2 * s), H / (2 * s)
        cx = clamp(ux * self.iw, hw, self.iw - hw)
        cy = clamp(uy * self.ih, hh, self.ih - hh)
        M = np.float32([[s, 0, W / 2 - s * cx], [0, s, H / 2 - s * cy]])
        return cv2.warpAffine(self.src, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def imread(path):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:  # webp etc.
        img = cv2.cvtColor(np.asarray(Image.open(path).convert("RGB")), cv2.COLOR_RGB2BGR)
    if img.ndim == 3 and img.shape[2] == 4:
        img = img[..., :3]
    return img


def key_logo(img):
    """Black-background logo -> (colour sprite, white sprite)."""
    f = img.astype(np.float32)
    a = np.clip((f.max(axis=2) - 28) / 80.0, 0, 1)[..., None]
    col = np.clip(f / np.maximum(a, 1e-3), 0, 255) / 255.0
    colour = np.concatenate([col * a, a], axis=2)
    white = np.concatenate([np.ones_like(col) * a, a], axis=2)
    return colour.astype(np.float32), white.astype(np.float32)


def key_white(img):
    """White-background artwork (the map) -> sprite."""
    f = img.astype(np.float32)
    a = np.clip((255 - f.min(axis=2)) / 70.0, 0, 1)[..., None]
    col = np.clip((f - (1 - a) * 255) / np.maximum(a, 1e-3), 0, 255) / 255.0
    return np.concatenate([col * a, a], axis=2).astype(np.float32)


def resize_sprite(spr, w):
    h = int(spr.shape[0] * w / spr.shape[1])
    return cv2.resize(spr, (w, h), interpolation=cv2.INTER_AREA)


def fit(img, w, h):
    """Cover-crop uint8 image to exactly w x h."""
    ih, iw = img.shape[:2]
    s = max(w / iw, h / ih)
    r = cv2.resize(img, (int(math.ceil(iw * s)), int(math.ceil(ih * s))), interpolation=cv2.INTER_AREA)
    y0, x0 = (r.shape[0] - h) // 2, (r.shape[1] - w) // 2
    return r[y0:y0 + h, x0:x0 + w]


def wipe_rtl(spr, p, soft=0.12):
    """Reveal a sprite from right to left (Arabic reading order)."""
    if p >= 1:
        return spr
    w = spr.shape[1]
    x = np.arange(w, dtype=np.float32) / w
    edge = 1 - p * (1 + soft)
    m = np.clip((x - edge) / soft, 0, 1)
    return spr * m[None, :, None]


def wipe_down(spr, p, soft=0.08):
    if p >= 1:
        return spr
    h = spr.shape[0]
    y = np.arange(h, dtype=np.float32) / h
    edge = p * (1 + soft)
    m = np.clip((edge - y) / soft, 0, 1)
    return spr * m[:, None, None]


class CardMaker:
    """Fast per-frame photo card (white border, rounded, shadow) for video content."""

    def __init__(self, cw, ch, border=12, radius=22, shadow=26):
        blank = np.full((ch, cw, 3), 255, np.uint8)
        self.base = photo_card(blank, border, radius, shadow)
        self.pad = shadow * 2 + border
        m = np.asarray(rounded_mask(cw, ch, max(2, radius - border // 2))).astype(np.float32) / 255
        self.mask = m[..., None]
        self.cw, self.ch = cw, ch

    def make(self, content_bgr):
        spr = self.base.copy()
        c = cv2.resize(content_bgr, (self.cw, self.ch), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        y0 = x0 = self.pad
        region = spr[y0:y0 + self.ch, x0:x0 + self.cw]
        region[..., :3] = region[..., :3] * (1 - self.mask) + c * self.mask
        return spr


# ------------------------------------------------------------------ assets
P = lambda *a: os.path.join(WORK, *a)  # noqa: E731
clips = {k: Clip(P("shots", k + ".mp4")) for k in ["H2", "T1", "T2", "M1", "M2", "M4", "O1", "I2", "G", "B"]}

img_march = imread(P("src", "img_hist_march.jpg"))
img_trucks = imread(P("src", "img_hist_trucks.jpg"))
img_truck_bw = imread(P("src", "img_hist_truck_bw.webp"))
img_hall = imread(P("blur", "img_hall_flags_blur.jpg"))
img_group = imread(P("blur", "img_group_blur.jpg"))
img_flag = imread(P("src", "img_flag.jpg"))
_m = cv2.imread(P("src", "img_map.png"), cv2.IMREAD_UNCHANGED)
if _m.shape[2] == 4:
    _a = _m[..., 3:4].astype(np.float32) / 255
    _m = (_m[..., :3].astype(np.float32) * _a + 255 * (1 - _a)).astype(np.uint8)
img_map = _m
img_logo = imread(P("src", "img_logo.jpg"))

st_march = Still(img_march)
st_hall = Still(img_hall)
st_group = Still(img_group)
st_flag = Still(img_flag)

logo_col, logo_white = key_logo(img_logo)
# trim logo to its content
ys, xs = np.where(logo_col[..., 3] > 0.05)
logo_col = logo_col[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
logo_white = logo_white[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def logo_card(width=700):
    lw = width - 90
    lg = resize_sprite(logo_col, lw)
    h = lg.shape[0] + 70
    pad = 40
    img = Image.new("RGBA", (width + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((pad, pad + 12, pad + width, pad + h + 12), radius=40, fill=(0, 0, 0, 120))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    ImageDraw.Draw(img).rounded_rectangle((pad, pad, pad + width, pad + h), radius=40, fill=(255, 255, 255, 255))
    spr = to_sprite(img)
    composite_s = spr.copy()
    y0, x0 = pad + 35, pad + 45
    a = lg[..., 3:4]
    region = composite_s[y0:y0 + lg.shape[0], x0:x0 + lg.shape[1]]
    region[..., :3] = region[..., :3] * (1 - a) + lg[..., :3]
    return composite_s


LOGO_CARD = logo_card(700)
LOGO_CARD_END = logo_card(760)

map_spr = key_white(img_map)
ys, xs = np.where(map_spr[..., 3] > 0.05)
map_spr = map_spr[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
map_spr = resize_sprite(map_spr, 470)
_ma = cv2.GaussianBlur(map_spr[..., 3], (0, 0), 14)
map_glow = np.dstack([_ma * 1.0, _ma * 1.0, _ma * 1.0, _ma]).astype(np.float32) * 0.85

grain = Grain()
VIG = vignette_mask(0.28)
VIG_STRONG = vignette_mask(0.55, 1.8)
SCRIM = bottom_scrim(1080, H, 0.55)
SPEECH_MUL = (VIG * SCRIM).astype(np.float32)
LEAK = light_leak_texture()

# fonts
F_CAIRO = lambda s, w=900: font("Cairo-VF.ttf", s, w)  # noqa: E731
F_TAJ = lambda s: font("Tajawal-ExtraBold.ttf", s)  # noqa: E731
F_RUQAA = lambda s: font("ArefRuqaa-Bold.ttf", s)  # noqa: E731
F_ANTON = lambda s: font("Anton-Regular.ttf", s)  # noqa: E731
F_MONT = lambda s, w=600: font("Montserrat-VF.ttf", s, w)  # noqa: E731

SH = (0, 8, 12, 0.6)
spr_cache = {}


def S(key, fn):
    if key not in spr_cache:
        spr_cache[key] = fn()
    return spr_cache[key]


# ------------------------------------------------------------------ odometer
class Odometer:
    def __init__(self, fnt):
        digs = [text_pil(str(d), fnt, fill=WHITE, rtl=False, shadow=(0, 10, 16, 0.55)) for d in range(10)]
        self.cw = max(i.size[0] for i in digs)
        self.ch = max(i.size[1] for i in digs)
        strip = Image.new("RGBA", (self.cw, self.ch * 11), (0, 0, 0, 0))
        for k in range(11):
            im = digs[k % 10]
            strip.alpha_composite(im, ((self.cw - im.size[0]) // 2, k * self.ch + (self.ch - im.size[1]) // 2))
        self.strip = to_sprite(strip)
        ramp = np.ones(self.ch, np.float32)
        e = int(self.ch * 0.16)
        ramp[:e] = np.linspace(0, 1, e)
        ramp[-e:] = np.linspace(1, 0, e)
        self.ramp = ramp[:, None, None]

    def sprite(self, values, speeds):
        n = len(values)
        step = int(self.cw * 0.78)
        out = np.zeros((self.ch, step * (n - 1) + self.cw, 4), np.float32)
        for i, (v, sp) in enumerate(zip(values, speeds)):
            v = v % 10
            y = int(round(v * self.ch)) % (10 * self.ch)
            cell = self.strip[y:y + self.ch]
            if sp > 0.02:
                k = int(min(70, sp * self.ch / FPS * 0.9))
                if k >= 3:
                    cell = cv2.blur(cell, (1, k))
                cell = cell * self.ramp
            x = i * step
            dst = out[:, x:x + self.cw]
            dst[:] = cell + dst * (1 - cell[..., 3:4])
        return out


ODO = Odometer(F_ANTON(330))
YEAR_FROM, YEAR_TO = [1, 9, 7, 5], [2, 0, 2, 6]
YEAR_STEPS = [11, 11, 15, 21]


def year_values(t):
    vals, speeds = [], []
    for i in range(4):
        t0, d = SEG["H2"][0] - 0.02 + 0.06 * i, 0.55 + 0.12 * i
        p = prog(t, t0, d)
        e = ease_out_cubic(p)
        e2 = ease_out_cubic(prog(t + 1 / FPS, t0, d))
        vals.append(YEAR_FROM[i] + YEAR_STEPS[i] * e)
        speeds.append((e2 - e) * YEAR_STEPS[i] * FPS)
    return vals, speeds


# ------------------------------------------------------------------ subtitles
SUB_MAXW = 900


def split_lines(words, fnt):
    kw = dict(font=fnt, direction="rtl", language="ar")
    d = ImageDraw.Draw(Image.new("RGBA", (4, 4)))
    total = d.textlength(" ".join(words), **kw)
    if total <= SUB_MAXW or len(words) < 3:
        return [words]
    best, best_cost = None, 1e9
    for k in range(1, len(words)):
        a = d.textlength(" ".join(words[:k]), **kw)
        b = d.textlength(" ".join(words[k:]), **kw)
        cost = max(a, b)
        if cost < best_cost:
            best, best_cost = k, cost
    return [words[:best], words[best:]]


class Caption:
    def __init__(self, t0, t1, words, starts=None, static_hl=(), size=70, key=False):
        self.t0, self.t1 = t0, t1
        fnt = F_TAJ(size + (10 if key else 0))
        self.lines = []
        idx = 0
        for ln in split_lines(words, fnt):
            self.lines.append((WordLine(ln, fnt, static_hl=static_hl, hl_fill=GOLD), idx))
            idx += len(ln)
        self.starts = starts
        self.lh = int((size + (10 if key else 0)) * 1.32)

    def draw(self, frame, t, cy=1390):
        a = window(t, self.t0, self.t1, 0.12, 0.10)
        if a <= 0:
            return
        e = ease_out_cubic(prog(t, self.t0, 0.16))
        dy = (1 - e) * 18
        sc = 0.95 + 0.05 * e
        active = -1
        if self.starts:
            for i, s in enumerate(self.starts):
                if t >= s:
                    active = i
        n = len(self.lines)
        for li, (wl, off) in enumerate(self.lines):
            y = cy + (li - (n - 1) / 2) * self.lh + dy
            loc = active - off if 0 <= active - off < len(wl.words) else -1
            blit(frame, wl.sprite(loc), W / 2, y, scale=sc, opacity=a)


def build_captions():
    caps = []
    for c in SUBS["girl"]:
        if c.get("style") == "accent":
            continue
        caps.append(Caption(gv(c["t0"]), gv(c["t1"]), c["text"].split(), static_hl=set(c.get("hl", []))))
    for c in SUBS["boy"]:
        words = [w for w, _ in c["words"]]
        starts = [bv(s) for _, s in c["words"]]
        caps.append(Caption(bv(c["t0"]), bv(c["t1"]), words, starts=starts, key=c.get("key", False)))
    return caps


CAPTIONS = build_captions()
GIRL_ACCENT = [c for c in SUBS["girl"] if c.get("style") == "accent"][0]
FINALE = [(bv(k["t"]), k["text"]) for k in SUBS["boy_finale"]]

# ------------------------------------------------------------------ virtual camera for speeches
GIRL_CAM = [(0.70, 5.30, 1.00, 1.05), (5.30, 10.25, 1.00, 1.02), (10.25, 16.05, 1.10, 1.14),
            (16.05, 21.70, 1.00, 1.02), (21.70, 26.70, 1.08, 1.11), (26.70, 30.30, 1.00, 1.04),
            (30.30, 36.25, 1.10, 1.14), (36.25, 39.20, 1.16, 1.18)]
BOY_CAM = [(0.30, 15.40, 1.00, 1.06), (15.40, 34.40, 1.00, 1.03), (34.40, 39.60, 1.12, 1.15),
           (39.60, 53.60, 1.02, 1.07), (53.60, 61.40, 1.00, 1.02), (61.40, 66.10, 1.10, 1.13),
           (66.10, 67.70, 1.02, 1.03), (67.70, 69.20, 1.06, 1.07), (69.20, 70.20, 1.10, 1.11),
           (70.20, 71.10, 1.14, 1.15), (71.10, 72.60, 1.18, 1.20)]


def cam(tc, keys):
    for a, b, z0, z1 in keys:
        if a <= tc < b:
            return lerp(z0, z1, ease_in_out_sine(prog(tc, a, b - a)))
    return keys[-1][3]


# ------------------------------------------------------------------ overlay elements
def speaker_tag(title):
    def mk():
        t1 = text_pil(title, F_CAIRO(54, 800), fill=WHITE)
        t2 = text_pil("École FLY HYANI Privé", F_MONT(26, 600), fill=(200, 212, 232), rtl=False)
        w = max(t1.size[0], t2.size[0]) + 60
        h = t1.size[1] + t2.size[1] + 6
        img = Image.new("RGBA", (w + 16, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle((0, 0, w, h - 1), radius=22, fill=NAVY + (220,))
        d.rectangle((w - 10, 14, w + 2, h // 2), fill=RED + (255,))
        d.rectangle((w - 10, h // 2, w + 2, h - 15), fill=(20, 150, 80, 255))
        img.alpha_composite(t1, (w - 26 - t1.size[0], -2))
        img.alpha_composite(t2, (w - 26 - t2.size[0], t1.size[1] - 14))
        return to_sprite(img)
    return S(("tag", title), mk)


def draw_tag(frame, t, title, t0, t1):
    a = window(t, t0, t1, 0.35, 0.30)
    if a <= 0:
        return
    e = ease_out_cubic(prog(t, t0, 0.45))
    x_out = (1 - ease_in_cubic(prog(t, t1 - 0.3, 0.3))) if t > t1 - 0.3 else 1
    dx = (1 - e) * 90 + (1 - x_out) * 60
    spr = speaker_tag(title)
    blit(frame, spr, 1040 + dx, 300, opacity=a, anchor=(1.0, 0.5))


CARD_CW, CARD_CH = 500, 320
card_video = CardMaker(CARD_CW, CARD_CH)


def card_sprite(name, img):
    return S(("card", name), lambda: photo_card(fit(img, CARD_CW, CARD_CH)))


def year_pill(text):
    return S(("pill", text), lambda: pill(text, F_ANTON(58) if text.isdigit() else F_CAIRO(42, 800),
                                          rtl=not text.isdigit()))


def draw_card(frame, t, spr, t0, t1, rot=-3.0, cx=785, cy=520, tag=None, tag_rtl=False):
    a = window(t, t0, t1, 0.25, 0.25)
    if a <= 0:
        return
    pin = ease_out_back(prog(t, t0, 0.45), 1.4)
    pout = ease_in_cubic(prog(t, t1 - 0.25, 0.25))
    sc = (0.55 + 0.45 * pin) * (1 - 0.15 * pout) * (1 + 0.025 * prog(t, t0, t1 - t0))
    r = rot + (1 - pin) * 9
    blit(frame, spr, cx, cy + (1 - pin) * 60, scale=sc, rot=r, opacity=a)
    if tag:
        ta = window(t, t0 + 0.2, t1, 0.2, 0.2)
        te = ease_out_back(prog(t, t0 + 0.2, 0.35))
        blit(frame, year_pill(tag), cx + 6, cy + CARD_CH / 2 + 58, scale=0.6 + 0.4 * te, rot=rot * 0.6, opacity=ta)


def counter_sprite(n):
    s = f"{n:,}".replace(",", ".")
    return text_sprite(s, F_ANTON(150), fill=WHITE, stroke=0, shadow=(0, 8, 12, 0.6), rtl=False)


def draw_counter(frame, t):
    t0, t1 = bv(24.00), bv(25.90)
    a = window(t, t0 - 0.1, bv(34.40), 0.15, 0.25)
    if a <= 0:
        return
    n = int(round(350000 * ease_out_cubic(prog(t, t0, t1 - t0)) / 1000.0) * 1000)
    pop = 1 + 0.12 * (1 - ease_out_cubic(prog(t, t1, 0.35))) if t >= t1 else 1.0
    blit(frame, counter_sprite(n), 785, 860, scale=pop, opacity=a)
    la = window(t, bv(26.78), bv(34.40), 0.2, 0.25)
    if la > 0:
        lab = S("lab350", lambda: text_sprite("مغربي ومغربية", F_CAIRO(52, 800), fill=GOLD, shadow=SH))
        e = ease_out_cubic(prog(t, bv(26.78), 0.3))
        blit(frame, lab, 785, 1000 + (1 - e) * 20, opacity=la)


def draw_map(frame, t):
    t0, t1 = bv(53.70), bv(60.20)
    a = window(t, t0, t1, 0.2, 0.3)
    if a <= 0:
        return
    p = ease_in_out_cubic(prog(t, t0, 0.9))
    sc = 1 + 0.03 * prog(t, t0, t1 - t0)
    blit(frame, wipe_down(map_glow, p), 790, 560, scale=sc, opacity=a * 0.9)
    blit(frame, wipe_down(map_spr, p), 790, 560, scale=sc, opacity=a)


def draw_finale(frame, t):
    """'عاش الملك ...' kinetic hits at the end of the boy's speech."""
    hold_end = SEG["O1"][0] + 1.4
    for i, (tk, text) in enumerate(FINALE):
        t_next = FINALE[i + 1][0] if i + 1 < len(FINALE) else hold_end
        if t < tk or t > t_next + 0.2:
            continue
        last = i == len(FINALE) - 1
        spr = S(("fin", i), lambda: text_sprite(text, F_CAIRO(150 if last else 132, 1000),
                                                fill=GOLD if last else WHITE, stroke=7,
                                                stroke_fill=(12, 12, 18), shadow=(0, 10, 16, 0.6)))
        e = ease_out_cubic(prog(t, tk, 0.16))
        sc = 1.5 - 0.5 * e
        a = prog(t, tk, 0.06)
        dy = 0.0
        if t > t_next:
            q = prog(t, t_next, 0.12)
            a *= 1 - q
            dy = -90 * ease_out_cubic(q)
        blit(frame, spr, W / 2, 1340 + dy, scale=sc, opacity=a)


def finale_shake(t):
    dx = dy = fl = 0.0
    for tk, _ in FINALE:
        if tk <= t < tk + 0.25:
            k = 1 - prog(t, tk, 0.25)
            rng = np.random.default_rng(int(t * 1000))
            dx, dy = rng.uniform(-9, 9) * k, rng.uniform(-9, 9) * k
            fl = 0.16 * (1 - prog(t, tk, 0.12))
    return dx, dy, fl


def draw_word_hit(frame, t, word, t0, t1, y=960):
    a = window(t, t0, t1, 0.07, 0.16)
    if a <= 0:
        return
    spr = S(("hit", word), lambda: text_sprite(word, F_CAIRO(200, 1000), fill=WHITE, stroke=5,
                                               stroke_fill=(15, 15, 20), shadow=(0, 12, 18, 0.65)))
    e = ease_out_expo(prog(t, t0, 0.28))
    sc = (1.35 - 0.35 * e) * (1 + 0.05 * prog(t, t0, t1 - t0))
    blit(frame, spr, W / 2, y, scale=sc, opacity=a)
    # underline: red then green
    lw = int(300 * ease_out_cubic(prog(t, t0 + 0.08, 0.3)))
    if lw > 4:
        bar = np.zeros((12, lw, 4), np.float32)
        bar[:, :, 3] = 1
        bar[:, : lw // 2, :3] = np.array([RED[2], RED[1], RED[0]], np.float32) / 255
        bar[:, lw // 2:, :3] = np.array([40, 160, 30], np.float32) / 255
        blit(frame, bar, W / 2, y + 150, opacity=a)


# ------------------------------------------------------------------ base layers
def frame_of(name, t, t_start, z=1.0, cx=W / 2, cy=H / 2, dx=0.0, dy=0.0):
    i = int(round((t - t_start) * FPS))
    f = clips[name].frame(i).astype(np.float32)
    return zoom(f, z, cx, cy, dx, dy)


def punch(t, t0, amount=0.06, dur=0.22):
    return 1 + amount * (1 - ease_out_cubic(prog(t, t0, dur)))


def whip(frame, t, t_cut, dur=0.16, direction=-1, out=True):
    """Whip-pan: blur + slide. `out` = leaving shot (before cut) else entering."""
    if out:
        p = prog(t, t_cut - dur, dur)
        if p <= 0:
            return frame
        sh = direction * W * 0.35 * ease_in_cubic(p)
        k = 1 + 140 * p
    else:
        p = 1 - prog(t, t_cut, dur)
        if p <= 0:
            return frame
        sh = -direction * W * 0.35 * ease_in_cubic(p)
        k = 1 + 140 * p
    M = np.float32([[1, 0, sh], [0, 1, 0]])
    frame = cv2.warpAffine(frame, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    return motion_blur_x(frame, k)


def render_base(t):
    k = seg_of(t)
    a, b = SEG[k]
    if k == "H1":
        z = lerp(1.20, 1.10, ease_out_cubic(prog(t, 0, 1.6))) + 0.07 * ease_in_cubic(prog(t, 1.6, 0.6))
        f = st_march.render(z, 0.47, 0.50)
        f = sepia(f, 0.9)
        f = (f - 128) * 1.12 + 128 + 6 * math.sin(t * 37.0)   # contrast + flicker
        f = radial_blur(f, 0.05 * ease_in_cubic(prog(t, 1.95, 0.25)))
        return np.clip(f, 0, 255), "hist"
    if k == "H2":
        z = 1.0 + 0.14 * (1 - ease_out_expo(prog(t, a, 0.7)))
        rng = np.random.default_rng(int(t * 1000))
        sk = 12 * (1 - prog(t, a, 0.3))
        f = frame_of("H2", t, a, z, dx=rng.uniform(-sk, sk), dy=rng.uniform(-sk, sk))
        f = radial_blur(f, 0.09 * (1 - prog(t, a, 0.25)))
        if t > b - 0.18:
            f = radial_blur(f, 0.12 * prog(t, b - 0.18, 0.18))
        return f, "broll"
    if k in ("T1", "T2"):
        z = punch(t, a, 0.05) * lerp(1.0, 1.05, prog(t, SEG["T1"][0], SEG["T2"][1] - SEG["T1"][0]))
        f = frame_of(k, t, a, z)
        f = darken(f, 0.42)
        return f, "title"
    if k == "M1":
        f = frame_of("M1", t, a, punch(t, a, 0.07) * lerp(1.0, 1.08, prog(t, a, b - a)))
        return darken(f, 0.22), "broll"
    if k == "M2":
        f = frame_of("M2", t, a, punch(t, a) * lerp(1.0, 1.06, prog(t, a, b - a)))
        return f, "broll"
    if k == "M3":
        f = st_hall.render(punch(t, a) * lerp(1.05, 1.16, prog(t, a, b - a)), 0.5, 0.56)
        return f, "broll"
    if k == "M4":
        f = frame_of("M4", t, a, punch(t, a) * lerp(1.08, 1.0, prog(t, a, b - a)))
        return f, "broll"
    if k == "M5":
        f = st_group.render(punch(t, a), lerp(0.36, 0.62, ease_in_out_sine(prog(t, a, b - a))), 0.5)
        f = whip(f, t, b, 0.16, -1, True)
        return f, "broll"
    if k == "G":
        tc = GIRL_IN + (t - a)
        f = frame_of("G", t, a, cam(tc, GIRL_CAM), 330, 860)
        f = whip(f, t, a, 0.16, -1, False)
        return f, "speech"
    if k == "B":
        tc = BOY_IN + (t - a)
        dx, dy, _ = finale_shake(t)
        z = cam(tc, BOY_CAM) * (1 + 0.08 * (1 - ease_out_cubic(prog(t, a, 0.45))))
        f = frame_of("B", t, a, z, 350, 800, dx, dy)
        return f, "speech"
    if k == "O1":
        f = frame_of("O1", t, a, punch(t, a, 0.06) * lerp(1.0, 1.07, prog(t, a, b - a)))
        f = whip(f, t, b, 0.16, -1, True)
        return f, "broll"
    if k == "O2":
        bg = S("grp_bg", lambda: darken(cv2.GaussianBlur(st_group.render(1.0, 0.5, 0.5), (0, 0), 28), 0.45))
        f = bg.copy()
        f = whip(f, t, a, 0.16, -1, False)
        return f, "broll"
    # O3 end card
    f = st_flag.render(lerp(1.0, 1.10, prog(t, a, b - a)), 0.5, 0.5)
    f = darken(f, 0.50)
    return f, "end"


# ------------------------------------------------------------------ overlays per section
def overlays(frame, t):
    k = seg_of(t)
    # --- hook
    if k in ("H1", "H2"):
        if t < SEG["H2"][0] + 0.25:
            a = 1 - prog(t, 1.95, 0.25)
            spr = S("qabl", lambda: text_sprite("قبل 51 سنة", F_CAIRO(92, 900), fill=WHITE, shadow=SH))
            p = ease_out_cubic(prog(t, 0.08, 0.55))
            blit(frame, wipe_rtl(spr, p), W / 2, 700, opacity=a)
        # year odometer
        if t < SEG["H2"][0]:
            vals, sp = YEAR_FROM, [0, 0, 0, 0]
        else:
            vals, sp = year_values(t)
        ap = ease_out_expo(prog(t, 0.30, 0.45))
        sc = (1.25 - 0.25 * ap) * (1 + 0.04 * prog(t, 0.3, 4.0))
        out = 1.0
        if t > SEG["H2"][1] - 0.22:
            out = 1 - prog(t, SEG["H2"][1] - 0.22, 0.22)
            sc *= 1 + 0.25 * prog(t, SEG["H2"][1] - 0.22, 0.22)
        blit(frame, ODO.sprite(vals, sp), W / 2, 1000, scale=sc, opacity=ap * out)
        if t >= SEG["H2"][0]:
            # "same flag, same spirit"
            spr = S("same", lambda: text_sprite("نفس العلم • نفس الروح", F_CAIRO(80, 900), fill=WHITE,
                                                stroke=3, stroke_fill=(15, 15, 20), shadow=SH))
            p = ease_out_cubic(prog(t, SEG["H2"][0] + 0.85, 0.55))
            blit(frame, wipe_rtl(spr, p), W / 2, 1265, opacity=out)
            lw = int(560 * ease_out_cubic(prog(t, SEG["H2"][0] + 1.1, 0.45)))
            if lw > 4:
                bar = np.zeros((10, lw, 4), np.float32); bar[..., 3] = 1
                bar[..., :3] = np.array([RED[2], RED[1], RED[0]], np.float32) / 255
                blit(frame, bar, W / 2, 1345, opacity=out)
        return
    # --- title
    if k in ("T1", "T2"):
        t0 = SEG["T1"][0]
        t_end = SEG["T2"][1]
        out = 1 - prog(t, t_end - 0.25, 0.25)
        osc = 1 - 0.08 * prog(t, t_end - 0.25, 0.25)
        drift = 1 + 0.03 * prog(t, t0, t_end - t0)
        p_star = ease_in_out_cubic(prog(t, t0 + 0.05, 0.9))
        st = star_sprite(255, p_star, thickness=16, color=(25, 150, 80))
        blit(frame, st, W / 2, 905, scale=drift * osc, rot=-4 * prog(t, t0, 4), opacity=0.9 * out)
        e1 = ease_out_cubic(prog(t, t0 + 0.05, 0.35))
        s1 = S("dhikra", lambda: text_sprite("الذكرى", F_CAIRO(96, 900), fill=WHITE, shadow=SH))
        blit(frame, s1, W / 2, 640 + (1 - e1) * 40, scale=drift * osc, opacity=e1 * out)
        e2 = ease_out_back(prog(t, t0 + 0.15, 0.45), 1.6)
        s2 = S("51", lambda: text_sprite("51", F_ANTON(420), fill=WHITE, shadow=(0, 14, 20, 0.6), rtl=False))
        blit(frame, s2, W / 2, 905, scale=(0.5 + 0.5 * e2) * drift * osc, opacity=min(1, e2 * 1.5) * out)
        s3 = S("masira", lambda: text_sprite("للمسيرة الخضراء المظفرة", F_RUQAA(124), fill=WHITE, shadow=SH))
        p3 = ease_in_out_cubic(prog(t, t0 + 0.5, 0.75))
        blit(frame, wipe_rtl(s3, p3), W / 2, 1185, scale=drift * osc, opacity=out)
        e4 = ease_out_back(prog(t, t0 + 1.05, 0.4))
        s4 = S("date", lambda: pill("6 نونبر 1975 — 2026", F_TAJ(44)))
        blit(frame, s4, W / 2, 1345, scale=(0.6 + 0.4 * e4) * osc, opacity=prog(t, t0 + 1.05, 0.12) * out)
        return
    # --- school montage
    if k == "M1":
        a, b = SEG["M1"]
        al = window(t, a, b, 0.05, 0.2)
        e = ease_out_back(prog(t, a + 0.03, 0.45), 1.5)
        blit(frame, LOGO_CARD, W / 2, 760, scale=0.7 + 0.3 * e, opacity=al)
        s = S("talaba", lambda: text_sprite("طلبتنا يخلّدون الذكرى", F_CAIRO(76, 900), fill=WHITE, shadow=SH))
        blit(frame, wipe_rtl(s, ease_out_cubic(prog(t, a + 0.3, 0.55))), W / 2, 1020, opacity=al)
        return
    words = {"M2": "وحدة", "M3": "وفاء", "M4": "انتماء", "M5": "فخر"}
    if k in words:
        a, b = SEG[k]
        draw_word_hit(frame, t, words[k], a, b - (0.05 if k == "M5" else 0.0))
        return
    # --- speeches
    if k == "G":
        draw_tag(frame, t, "كلمة الطالبة", SEG["G"][0] + 0.2, SEG["G"][0] + 4.6)
        draw_card(frame, t, card_sprite("trucks", img_trucks), gv(5.40), gv(10.20), rot=-3, tag="1975")
        if gv(16.20) - 0.1 <= t <= gv(21.60) + 0.1:
            i = int(round((t - gv(16.20)) * FPS))
            spr = card_video.make(clips["I2"].frame(max(0, i)))
            draw_card(frame, t, spr, gv(16.20), gv(21.60), rot=2.5, tag="2026")
        for c in CAPTIONS:
            c.draw(frame, t)
        # accent "عاش المغرب!"
        g0, g1 = gv(GIRL_ACCENT["t0"]), gv(GIRL_ACCENT["t1"])
        aa = window(t, g0, g1, 0.08, 0.25)
        if aa > 0:
            spr = S("girl_accent", lambda: text_sprite(GIRL_ACCENT["text"], F_CAIRO(120, 1000), fill=GOLD,
                                                       stroke=6, stroke_fill=(12, 12, 18), shadow=SH))
            e = ease_out_back(prog(t, g0, 0.35), 1.8)
            blit(frame, spr, W / 2, 1370, scale=0.6 + 0.4 * e, opacity=aa)
        return
    if k == "B":
        draw_tag(frame, t, "كلمة الطالب", SEG["B"][0] + 0.25, SEG["B"][0] + 4.6)
        draw_card(frame, t, card_sprite("truck_bw", img_truck_bw), bv(15.50), bv(23.10), rot=2.5, tag="1975")
        draw_card(frame, t, card_sprite("march", img_march), bv(23.30), bv(34.40), rot=-2.5)
        draw_counter(frame, t)
        draw_map(frame, t)
        for c in CAPTIONS:
            c.draw(frame, t)
        draw_finale(frame, t)
        return
    if k == "O1":
        draw_finale(frame, t)
        for c in CAPTIONS:
            c.draw(frame, t)
        return
    if k == "O2":
        a, b = SEG["O2"]
        card = S("grp_card", lambda: photo_card(fit(img_group, 960, 444), border=14, radius=24))
        e = ease_out_back(prog(t, a + 0.05, 0.5), 1.3)
        blit(frame, card, W / 2, 1060, scale=(0.8 + 0.2 * e) * (1 + 0.03 * prog(t, a, b - a)),
             opacity=prog(t, a, 0.15))
        s1 = S("kul", lambda: text_sprite("كل عام", F_CAIRO(100, 1000), fill=WHITE, shadow=SH))
        s2 = S("bikhayr", lambda: text_sprite("والمغرب بخير", F_CAIRO(100, 1000), fill=GOLD, shadow=SH))
        blit(frame, wipe_rtl(s1, ease_out_cubic(prog(t, a + 0.25, 0.45))), W / 2, 560)
        blit(frame, wipe_rtl(s2, ease_out_cubic(prog(t, a + 0.55, 0.5))), W / 2, 690)
        fl = S("flag_icon", lambda: flag_icon(110))
        blit(frame, fl, W / 2, 1400, scale=ease_out_back(prog(t, a + 0.9, 0.4)), opacity=prog(t, a + 0.9, 0.1))
        return
    if k == "O3":
        a, b = SEG["O3"]
        e = ease_out_back(prog(t, a + 0.05, 0.55), 1.4)
        drift = 1 + 0.03 * prog(t, a, b - a)
        blit(frame, LOGO_CARD_END, W / 2, 760, scale=(0.6 + 0.4 * e) * drift, opacity=prog(t, a, 0.12))
        s1 = S("end1", lambda: text_sprite("الذكرى 51", F_CAIRO(86, 1000), fill=WHITE, shadow=SH))
        e1 = ease_out_cubic(prog(t, a + 0.40, 0.4))
        blit(frame, s1, W / 2, 1000 + (1 - e1) * 30, scale=drift, opacity=e1)
        s1b = S("end1b", lambda: text_sprite("للمسيرة الخضراء المظفرة", F_RUQAA(104), fill=WHITE, shadow=SH))
        blit(frame, wipe_rtl(s1b, ease_in_out_cubic(prog(t, a + 0.6, 0.7))), W / 2, 1125, scale=drift)
        s2 = S("end2", lambda: text_sprite("6 نونبر 1975  —  6 نونبر 2026", F_TAJ(44), fill=(225, 230, 240),
                                           shadow=SH))
        blit(frame, s2, W / 2, 1250, scale=drift, opacity=prog(t, a + 1.1, 0.4))
        s3 = S("end3", lambda: text_sprite("عاش المغرب", F_CAIRO(74, 1000), fill=GOLD, shadow=SH))
        e3 = ease_out_back(prog(t, a + 1.5, 0.45))
        blit(frame, s3, W / 2, 1380, scale=(0.6 + 0.4 * e3) * drift, opacity=prog(t, a + 1.5, 0.15))
        fl = S("flag_icon", lambda: flag_icon(110))
        blit(frame, fl, W / 2, 1490, scale=ease_out_back(prog(t, a + 1.8, 0.4)) * drift,
             opacity=prog(t, a + 1.8, 0.1))


# ------------------------------------------------------------------ frame assembly
def render_frame(fi):
    t = fi / FPS
    base, kind = render_base(t)
    if kind == "speech":
        base *= SPEECH_MUL
    elif kind == "hist":
        base *= VIG_STRONG
    else:
        base *= VIG
    overlays(base, t)
    # transitions / global
    if SEG["H2"][0] <= t < SEG["H2"][0] + 0.35:            # the drop
        base = flash(base, 0.95 * (1 - ease_out_cubic(prog(t, SEG["H2"][0], 0.35))))
    for tc in (SEG["T1"][0], SEG["M1"][0]):
        if tc <= t < tc + 0.18:
            base = flash(base, 0.55 * (1 - prog(t, tc, 0.18)))
    gb = SEG["B"][0]
    if gb - 0.7 <= t < gb + 0.5:                            # light-leak into the boy's speech
        amt = math.sin(math.pi * prog(t, gb - 0.7, 1.2)) * 0.55
        base = apply_leak(base, LEAK, (t - gb + 0.7) * 1100, amt)
        if gb <= t < gb + 0.2:
            base = flash(base, 0.6 * (1 - prog(t, gb, 0.2)))
    if SEG["B"][0] <= t < SEG["O1"][0]:
        _, _, fl = finale_shake(t)
        base = flash(base, fl)
    e3 = SEG["O3"][0]
    if e3 <= t < e3 + 0.35:
        base = flash(base, 0.85 * (1 - ease_out_cubic(prog(t, e3, 0.35))))
    if e3 - 1.2 <= t < e3 + 0.6:
        base = apply_leak(base, LEAK, (t - e3) * 700 + 300, math.sin(math.pi * prog(t, e3 - 1.2, 1.8)) * 0.6)
    if t < 0.12:
        base = base * prog(t, 0, 0.12)
    if t > TOTAL - 1.2:
        base = base * (1 - ease_in_out_sine(prog(t, TOTAL - 1.2, 1.2)))
    # heavy grain only on the 1975 archive shot; elsewhere a faint dither (keeps gradients clean, small file)
    amp = 11 if kind == "hist" else 1.2
    base = grain.apply(base, fi if kind == "hist" else fi // 2, amp)
    return np.clip(base, 0, 255).astype(np.uint8)


def main():
    if len(sys.argv) > 3 and sys.argv[3] == "--stills":
        out_dir = sys.argv[2]
        os.makedirs(out_dir, exist_ok=True)
        for ts in sys.argv[4].split(","):
            fi = int(round(float(ts) * FPS))
            cv2.imwrite(os.path.join(out_dir, f"still_{float(ts):07.2f}.jpg"), render_frame(fi),
                        [cv2.IMWRITE_JPEG_QUALITY, 90])
        return
    out = sys.argv[2]
    t_from = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
    t_to = float(sys.argv[4]) if len(sys.argv) > 4 else TOTAL
    n0, n1 = int(round(t_from * FPS)), int(round(t_to * FPS))
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24",
                            "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                            "-crf", "14", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    t_start = time.time()
    for fi in range(n0, n1):
        enc.stdin.write(render_frame(fi).tobytes())
        if fi % 150 == 0:
            el = time.time() - t_start
            print(f"frame {fi}/{n1}  t={fi / FPS:6.2f}s  {el:6.1f}s elapsed", flush=True)
    enc.stdin.close()
    enc.wait()
    print("done", out, f"{time.time() - t_start:.1f}s")


if __name__ == "__main__":
    main()
