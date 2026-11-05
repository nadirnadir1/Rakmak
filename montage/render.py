"""Render the Green March 51 montage (video only, 1080x1920 @ 30fps).

Motion language: clean editorial animation (mask reveals, focus pulls, smooth slides,
hard cuts on the beat, flag-colour wipes). No bounce, shake, flashes or auto-zoom jumps.

usage:
  render.py WORK_DIR OUT.mp4                 full render
  render.py WORK_DIR OUT_DIR --stills t1,t2  write preview JPGs at given times
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
from timeline import BOY_PREP_IN, GIRL_PREP_IN, Timeline  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = sys.argv[1]
SUBS = json.load(open(os.path.join(HERE, "subtitles.json"), encoding="utf-8"))

TL = Timeline(WORK)
SEG = TL.SEG
TOTAL = TL.TOTAL
gv, bv = TL.gv, TL.bv     # original speech-clip time -> video time


def seg_of(t):
    for k, (a, b) in SEG.items():
        if a <= t < b:
            return k
    return "O3"


# ------------------------------------------------------------------ easing / reveal helpers
def ease_out_quint(t):
    t = clamp(t); return 1 - (1 - t) ** 5


def reveal_up(spr, p, dist=0.9):
    """Text rises from behind an invisible line at the bottom of its own box."""
    if p >= 0.999:
        return spr
    h = spr.shape[0]
    dy = int(round((1 - clamp(p)) * h * dist))
    out = np.zeros_like(spr)
    if dy < h:
        out[dy:] = spr[:h - dy]
    return out


def defocus(spr, sigma):
    if sigma < 0.4:
        return spr
    pad = int(sigma * 3) + 1
    big = cv2.copyMakeBorder(spr, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
    return cv2.GaussianBlur(big, (0, 0), sigma)


def bar(w, h, colors):
    """Horizontal bar split into equal colour parts (RGB tuples) as a sprite."""
    w = max(2, int(w))
    b = np.zeros((h, w, 4), np.float32)
    b[..., 3] = 1
    n = len(colors)
    for i, c in enumerate(colors):
        b[:, i * w // n:(i + 1) * w // n, :3] = np.array(c[::-1], np.float32) / 255
    return b


def brand_wipe(frame, p):
    """Red band with a green leading edge sweeping right->left; fully covers the frame at p=0.5."""
    if p <= 0 or p >= 1:
        return frame
    e = ease_in_out_cubic(p)
    width = W * 1.25
    cx = W * 1.75 - e * W * 2.5
    off = 0.12 * H / 2
    x0, x1 = cx - width / 2, cx + width / 2
    band = np.array([[x0 + off, 0], [x1 + off, 0], [x1 - off, H], [x0 - off, H]], np.float32)
    edge = np.array([[x0 - 46 + off, 0], [x0 + off, 0], [x0 - off, H], [x0 - 46 - off, H]], np.float32)
    for poly, col in ((band, RED), (edge, (0, 122, 61))):
        m = np.zeros((H, W), np.uint8)
        cv2.fillPoly(m, [np.round(poly * 4).astype(np.int32)], 255, cv2.LINE_AA, shift=2)
        a = (m.astype(np.float32) / 255)[..., None]
        frame = frame * (1 - a) + np.array(col[::-1], np.float32) * a
    return frame


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
    """Black-background logo -> colour sprite."""
    f = img.astype(np.float32)
    a = np.clip((f.max(axis=2) - 28) / 80.0, 0, 1)[..., None]
    col = np.clip(f / np.maximum(a, 1e-3), 0, 255) / 255.0
    return np.concatenate([col * a, a], axis=2).astype(np.float32)


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
    """Fast per-frame photo card (white border, rounded, soft shadow)."""

    def __init__(self, cw, ch, border=10, radius=24, shadow=28):
        blank = np.full((ch, cw, 3), 255, np.uint8)
        self.base = photo_card(blank, border, radius, shadow, 0.5)
        self.pad = shadow * 2 + border
        m = np.asarray(rounded_mask(cw, ch, max(2, radius - border // 2))).astype(np.float32) / 255
        self.mask = m[..., None]
        self.cw, self.ch = cw, ch

    def make(self, content_bgr):
        spr = self.base.copy()
        c = cv2.resize(content_bgr, (self.cw, self.ch), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        region = spr[self.pad:self.pad + self.ch, self.pad:self.pad + self.cw]
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

logo_col = key_logo(img_logo)
ys, xs = np.where(logo_col[..., 3] > 0.05)
logo_col = logo_col[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def logo_card(width=700):
    lg = resize_sprite(logo_col, width - 90)
    h = lg.shape[0] + 70
    pad = 40
    img = Image.new("RGBA", (width + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((pad, pad + 12, pad + width, pad + h + 12), radius=40, fill=(0, 0, 0, 110))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    ImageDraw.Draw(img).rounded_rectangle((pad, pad, pad + width, pad + h), radius=40, fill=(255, 255, 255, 255))
    spr = to_sprite(img)
    y0, x0 = pad + 35, pad + 45
    a = lg[..., 3:4]
    region = spr[y0:y0 + lg.shape[0], x0:x0 + lg.shape[1]]
    region[..., :3] = region[..., :3] * (1 - a) + lg[..., :3]
    return spr


LOGO_CARD = logo_card(700)
LOGO_CARD_END = logo_card(760)

map_spr = key_white(img_map)
ys, xs = np.where(map_spr[..., 3] > 0.05)
map_spr = resize_sprite(map_spr[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 470)
_ma = cv2.GaussianBlur(map_spr[..., 3], (0, 0), 14)
map_glow = np.dstack([_ma, _ma, _ma, _ma]).astype(np.float32) * 0.8

grain = Grain()
VIG = vignette_mask(0.28)
VIG_STRONG = vignette_mask(0.55, 1.8)
SPEECH_MUL = (VIG * bottom_scrim(1080, H, 0.55)).astype(np.float32)

F_CAIRO = lambda s, w=900: font("Cairo-VF.ttf", s, w)  # noqa: E731
F_TAJ = lambda s: font("Tajawal-ExtraBold.ttf", s)  # noqa: E731
F_RUQAA = lambda s: font("ArefRuqaa-Bold.ttf", s)  # noqa: E731
F_ANTON = lambda s: font("Anton-Regular.ttf", s)  # noqa: E731
F_MONT = lambda s, w=600: font("Montserrat-VF.ttf", s, w)  # noqa: E731

SH = (0, 8, 12, 0.6)
_cache = {}


def S(key, fn):
    if key not in _cache:
        _cache[key] = fn()
    return _cache[key]


def T(key, text, fnt, **kw):
    kw.setdefault("shadow", SH)
    return S(key, lambda: text_sprite(text, fnt, **kw))


# ------------------------------------------------------------------ odometer (1975 -> 2026)
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
            y = int(round((v % 10) * self.ch)) % (10 * self.ch)
            cell = self.strip[y:y + self.ch]
            if sp > 0.02:
                k = int(min(70, sp * self.ch / FPS * 0.9))
                if k >= 3:
                    cell = cv2.blur(cell, (1, k))
                cell = cell * self.ramp
            dst = out[:, i * step:i * step + self.cw]
            dst[:] = cell + dst * (1 - cell[..., 3:4])
        return out


ODO = Odometer(F_ANTON(330))
YEAR_FROM, YEAR_STEPS = [1, 9, 7, 5], [11, 11, 15, 21]


def year_values(t):
    vals, speeds = [], []
    for i in range(4):
        t0, d = SEG["H2"][0] - 0.02 + 0.06 * i, 0.55 + 0.12 * i
        e = ease_out_cubic(prog(t, t0, d))
        e2 = ease_out_cubic(prog(t + 1 / FPS, t0, d))
        vals.append(YEAR_FROM[i] + YEAR_STEPS[i] * e)
        speeds.append((e2 - e) * YEAR_STEPS[i] * FPS)
    return vals, speeds


# ------------------------------------------------------------------ subtitles
SUB_MAXW = 900


def split_lines(words, fnt):
    kw = dict(font=fnt, direction="rtl", language="ar")
    d = ImageDraw.Draw(Image.new("RGBA", (4, 4)))
    if d.textlength(" ".join(words), **kw) <= SUB_MAXW or len(words) < 3:
        return [words]
    best, best_cost = 1, 1e9
    for k in range(1, len(words)):
        cost = max(d.textlength(" ".join(words[:k]), **kw), d.textlength(" ".join(words[k:]), **kw))
        if cost < best_cost:
            best, best_cost = k, cost
    return [words[:best], words[best:]]


class Caption:
    def __init__(self, t0, t1, words, starts=None, static_hl=(), size=70, key=False):
        self.t0, self.t1 = t0, t1
        fs = size + (10 if key else 0)
        fnt = F_TAJ(fs)
        self.lines, idx = [], 0
        for ln in split_lines(words, fnt):
            self.lines.append((WordLine(ln, fnt, static_hl=static_hl, hl_fill=GOLD), idx))
            idx += len(ln)
        self.starts = starts
        self.lh = int(fs * 1.32)

    def draw(self, frame, t, cy=1390):
        if t1_gap(self.t0, self.t1) or not (self.t0 <= t <= self.t1):
            return
        a = window(t, self.t0, self.t1, 0.12, 0.10)
        e = ease_out_quint(prog(t, self.t0, 0.22))
        dy = (1 - e) * 14
        active = -1
        if self.starts:
            for i, s in enumerate(self.starts):
                if t >= s:
                    active = i
        n = len(self.lines)
        for li, (wl, off) in enumerate(self.lines):
            y = cy + (li - (n - 1) / 2) * self.lh + dy
            loc = active - off if 0 <= active - off < len(wl.words) else -1
            blit(frame, wl.sprite(loc), W / 2, y, opacity=a)


def t1_gap(t0, t1):
    return t1 - t0 < 0.05


def build_captions():
    caps = []
    for c in SUBS["girl"]:
        if c.get("style") == "accent":
            continue
        caps.append(Caption(gv(c["t0"]), gv(c["t1"]), c["text"].split(), static_hl=set(c.get("hl", []))))
    for c in SUBS["boy"]:
        caps.append(Caption(bv(c["t0"]), bv(c["t1"]), [w for w, _ in c["words"]],
                            starts=[bv(s) for _, s in c["words"]], key=c.get("key", False)))
    return caps


CAPTIONS = build_captions()
GIRL_ACCENT = [c for c in SUBS["girl"] if c.get("style") == "accent"][0]
FINALE = [(bv(k["t"]), k["text"]) for k in SUBS["boy_finale"]]


# ------------------------------------------------------------------ speech camera (changes only at real cuts)
def framing(tight):
    out, cur = [], 0
    for k, (a, b) in enumerate(tight.iv):
        if k > 0 and b - a >= 1.2:
            cur = 1 - cur
        out.append((1.0, 1.075)[cur])
    return out


GIRL_FRAMING, BOY_FRAMING = framing(TL.girl), framing(TL.boy)
# the closing chant gets one smooth push-in that starts exactly at a cut
BOY_FINALE_FROM = TL.boy.iv[TL.boy.index(TL.boy.fwd(67.0))][0]


def speech_base(name, tight, frames, prep_in, t, cx, cy, finale_from=None):
    tn = t - SEG[name][0]
    t_orig = tight.inv(tn)
    k = tight.index(tn)
    a, b = tight.iv[k]
    z = frames[k] + 0.02 * ease_in_out_sine(prog(t_orig, a, b - a))
    if finale_from is not None and t_orig >= finale_from:
        z = 1.0 + 0.12 * ease_in_out_sine(prog(t_orig, finale_from, 71.9 - finale_from))
    f = clips[name].frame(int(round((t_orig - prep_in) * FPS))).astype(np.float32)
    return zoom(f, z, cx, cy)


# ------------------------------------------------------------------ overlay pieces
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
    if not (t0 <= t <= t1):
        return
    e = ease_out_quint(prog(t, t0, 0.55))
    q = ease_in_cubic(prog(t, t1 - 0.35, 0.35))
    a = min(prog(t, t0, 0.2), 1 - q)
    blit(frame, speaker_tag(title), 1040 + (1 - e) * 110 + q * 50, 300, opacity=a, anchor=(1.0, 0.5))


class Inset:
    """Photo / video card on the right side; slides in, slow zoom inside, slides out."""

    def __init__(self, t0, t1, img=None, clip=None, label=None, cx=785, cy=520, cw=500, ch=320):
        self.t0, self.t1, self.clip, self.label = t0, t1, clip, label
        self.cx, self.cy, self.cw, self.ch = cx, cy, cw, ch
        self.cm = CardMaker(cw, ch)
        self.big = fit(img, int(cw * 1.15), int(ch * 1.15)) if img is not None else None

    def content(self, t):
        z = 1.0 + 0.15 * ease_in_out_sine(prog(t, self.t0, self.t1 - self.t0))
        if self.clip:
            i = int(round((t - self.t0) * FPS))
            src = fit(clips[self.clip].frame(max(0, i)), int(self.cw * 1.15), int(self.ch * 1.15))
        else:
            src = self.big
        h, w = src.shape[:2]
        cw, ch = int(w / z), int(h / z)
        x0, y0 = (w - cw) // 2, (h - ch) // 2
        return src[y0:y0 + ch, x0:x0 + cw]

    def draw(self, frame, t):
        if not (self.t0 <= t <= self.t1):
            return
        e = ease_out_quint(prog(t, self.t0, 0.6))
        q = ease_in_cubic(prog(t, self.t1 - 0.35, 0.35))
        a = min(prog(t, self.t0, 0.25), 1 - q)
        x = self.cx + (1 - e) * 130 + q * 70
        blit(frame, self.cm.make(self.content(t)), x, self.cy, opacity=a)
        if self.label:
            spr = S(("lab", self.label), lambda: pill(self.label, F_ANTON(46), rtl=False, padx=20, pady=8))
            la = min(prog(t, self.t0 + 0.35, 0.25), 1 - q)
            le = ease_out_quint(prog(t, self.t0 + 0.35, 0.5))
            blit(frame, spr, x - self.cw / 2 + spr.shape[1] / 2 + 6, self.cy - self.ch / 2 + 4 + (1 - le) * 16,
                 opacity=la)


INSETS_G = [Inset(gv(5.40), gv(10.20), img=img_trucks, label="1975"),
            Inset(gv(16.20), gv(21.60), clip="I2", label="2026")]
INSETS_B = [Inset(bv(15.50), bv(23.10), img=img_truck_bw, label="1975"),
            Inset(bv(23.30), bv(34.40), img=img_march)]


def draw_counter(frame, t):
    t0, t1, t_end = bv(24.00), bv(25.90), bv(34.40)
    if not (t0 - 0.15 <= t <= t_end):
        return
    a = min(prog(t, t0 - 0.15, 0.3), 1 - prog(t, t_end - 0.35, 0.35))
    e = ease_out_quint(prog(t, t0 - 0.15, 0.5))
    n = int(round(350000 * ease_out_cubic(prog(t, t0, t1 - t0)) / 1000.0) * 1000)
    spr = text_sprite(f"{n:,}".replace(",", "."), F_ANTON(150), fill=WHITE, shadow=(0, 8, 12, 0.6), rtl=False)
    blit(frame, spr, 785, 860 + (1 - e) * 24, opacity=a)
    if t >= bv(26.78):
        lab = T("lab350", "مغربي ومغربية", F_CAIRO(52, 800), fill=GOLD)
        p = ease_out_quint(prog(t, bv(26.78), 0.45))
        blit(frame, reveal_up(lab, p), 785, 1000, opacity=a)


def draw_map(frame, t):
    t0, t1 = bv(53.70), bv(60.20)
    if not (t0 <= t <= t1):
        return
    a = window(t, t0, t1, 0.2, 0.35)
    p = ease_in_out_cubic(prog(t, t0, 1.0))
    sc = 1 + 0.03 * prog(t, t0, t1 - t0)
    blit(frame, wipe_down(map_glow, p), 790, 560, scale=sc, opacity=a * 0.85)
    blit(frame, wipe_down(map_spr, p), 790, 560, scale=sc, opacity=a)


def draw_finale(frame, t):
    """'عاش الملك / عاش الوطن / عاش الشعب / وعاش المغرب': each line rises in, the previous rises out."""
    hold_end = SEG["O1"][0] + 1.5
    for i, (tk, text) in enumerate(FINALE):
        t_next = FINALE[i + 1][0] if i + 1 < len(FINALE) else hold_end
        if t < tk or t > t_next + 0.2:
            continue
        last = i == len(FINALE) - 1
        spr = S(("fin", i), lambda: text_sprite(text, F_CAIRO(150 if last else 132, 1000),
                                                fill=GOLD if last else WHITE, stroke=6,
                                                stroke_fill=(12, 12, 18), shadow=(0, 10, 16, 0.6)))
        p = ease_out_quint(prog(t, tk, 0.32))
        y, a = 1340.0, 1.0
        if t > t_next:
            q = ease_in_cubic(prog(t, t_next, 0.18))
            y -= 60 * q
            a = 1 - q
        blit(frame, reveal_up(spr, p), W / 2, y, opacity=a)
        lw = 420 * ease_out_quint(prog(t, tk + 0.08, 0.45))
        if lw > 4:
            blit(frame, bar(lw, 10, [RED, (20, 150, 80)]), W / 2, y + 110, opacity=a)


def draw_word(frame, t, word, t0, t1, y=960):
    if not (t0 <= t <= t1):
        return
    spr = T(("w", word), word, F_CAIRO(180, 1000), fill=WHITE, stroke=4, stroke_fill=(15, 15, 20),
            shadow=(0, 12, 18, 0.6))
    p = ease_out_quint(prog(t, t0, 0.45))
    q = ease_in_cubic(prog(t, t1 - 0.2, 0.2))
    sc = 1 + 0.035 * prog(t, t0, t1 - t0)
    blit(frame, reveal_up(spr, p), W / 2, y - q * 24, scale=sc, opacity=1 - q)
    lw = 320 * ease_out_quint(prog(t, t0 + 0.12, 0.5))
    if lw > 4:
        blit(frame, bar(lw, 10, [RED, (20, 150, 80)]), W / 2, y + 140 - q * 24, opacity=1 - q)


# ------------------------------------------------------------------ base layers
def frame_of(name, t, t_start, z=1.0, cx=W / 2, cy=H / 2):
    f = clips[name].frame(int(round((t - t_start) * FPS))).astype(np.float32)
    return zoom(f, z, cx, cy)


def base_for(k, t):
    a, b = SEG[k]
    if k == "H1":
        z = lerp(1.14, 1.05, ease_in_out_sine(prog(t, 0, 2.2)))
        f = sepia(st_march.render(z, 0.47, 0.50), 0.9)
        return np.clip((f - 128) * 1.10 + 128, 0, 255), "hist"
    if k == "H2":
        return frame_of("H2", t, a, 1.0 + 0.06 * (1 - ease_out_quint(prog(t, a, 0.7)))), "broll"
    if k in ("T1", "T2"):
        z = lerp(1.0, 1.05, prog(t, SEG["T1"][0], SEG["T2"][1] - SEG["T1"][0]))
        return darken(frame_of(k, t, a, z), 0.40), "title"
    if k == "M1":
        return darken(frame_of("M1", t, a, lerp(1.0, 1.06, prog(t, a, b - a))), 0.22), "broll"
    if k == "M2":
        return frame_of("M2", t, a, lerp(1.0, 1.05, prog(t, a, b - a))), "broll"
    if k == "M3":
        return st_hall.render(lerp(1.05, 1.12, ease_in_out_sine(prog(t, a, b - a))), 0.5, 0.56), "broll"
    if k == "M4":
        return frame_of("M4", t, a, lerp(1.06, 1.0, prog(t, a, b - a))), "broll"
    if k == "M5":
        return st_group.render(1.0, lerp(0.40, 0.60, ease_in_out_sine(prog(t, a, b - a))), 0.5), "broll"
    if k == "G":
        return speech_base("G", TL.girl, GIRL_FRAMING, GIRL_PREP_IN, t, 330, 860), "speech"
    if k == "B":
        return speech_base("B", TL.boy, BOY_FRAMING, BOY_PREP_IN, t, 350, 800, finale_from=BOY_FINALE_FROM), "speech"
    if k == "O1":
        return frame_of("O1", t, a, lerp(1.0, 1.06, prog(t, a, b - a))), "broll"
    if k == "O2":
        bg = S("grp_bg", lambda: darken(cv2.GaussianBlur(st_group.render(1.08, 0.5, 0.5), (0, 0), 28), 0.45))
        return zoom(bg, 1.0 + 0.04 * prog(t, a, b - a)), "broll"
    return darken(st_flag.render(lerp(1.0, 1.08, prog(t, a, b - a)), 0.5, 0.5), 0.50), "end"


def overlays_for(k, frame, t):
    if k in ("H1", "H2"):
        h2 = SEG["H2"][0]
        if t < h2 + 0.1:
            spr = T("qabl", "قبل 51 سنة", F_CAIRO(90, 900), fill=WHITE)
            q = ease_in_cubic(prog(t, 1.9, 0.3))
            blit(frame, reveal_up(spr, ease_out_quint(prog(t, 0.10, 0.6))), W / 2, 700 - 20 * q, opacity=1 - q)
        vals, sp = (YEAR_FROM, [0, 0, 0, 0]) if t < h2 else year_values(t)
        e = ease_out_quint(prog(t, 0.30, 0.7))
        out = 1 - ease_in_cubic(prog(t, SEG["H2"][1] - 0.25, 0.25))
        spr = ODO.sprite(vals, sp)
        if e < 1:
            spr = defocus(spr, (1 - e) * 12)
        blit(frame, spr, W / 2, 1000 + (1 - e) * 40 - (1 - out) * 24, opacity=min(1, e * 1.4) * out)
        if t >= h2:
            s = T("same", "نفس العلم • نفس الروح", F_CAIRO(80, 900), fill=WHITE, stroke=3, stroke_fill=(15, 15, 20))
            blit(frame, reveal_up(s, ease_out_quint(prog(t, h2 + 0.85, 0.55))), W / 2, 1265 - (1 - out) * 24,
                 opacity=out)
            lw = 560 * ease_out_quint(prog(t, h2 + 1.1, 0.55))
            if lw > 4:
                blit(frame, bar(lw, 10, [RED]), W / 2, 1345 - (1 - out) * 24, opacity=out)
        return
    if k in ("T1", "T2"):
        t0, t_end = SEG["T1"][0], SEG["T2"][1]
        q = ease_in_cubic(prog(t, t_end - 0.3, 0.3))
        dy, out = -24 * q, 1 - q
        drift = 1 + 0.025 * prog(t, t0, t_end - t0)
        st = star_sprite(255, ease_in_out_cubic(prog(t, t0 + 0.05, 1.0)), thickness=16, color=(25, 150, 80))
        blit(frame, st, W / 2, 905 + dy, scale=drift, rot=-4 * prog(t, t0, 4.2), opacity=0.9 * out)
        s1 = T("dhikra", "الذكرى", F_CAIRO(96, 900), fill=WHITE)
        blit(frame, reveal_up(s1, ease_out_quint(prog(t, t0 + 0.05, 0.5))), W / 2, 640 + dy, scale=drift, opacity=out)
        e2 = ease_out_quint(prog(t, t0 + 0.15, 0.7))
        s2 = T("51", "51", F_ANTON(420), fill=WHITE, shadow=(0, 14, 20, 0.6), rtl=False)
        blit(frame, defocus(s2, (1 - e2) * 16), W / 2, 905 + dy, scale=(1.10 - 0.10 * e2) * drift,
             opacity=min(1, e2 * 1.5) * out)
        s3 = T("masira", "للمسيرة الخضراء المظفرة", F_RUQAA(124), fill=WHITE)
        blit(frame, wipe_rtl(s3, ease_in_out_cubic(prog(t, t0 + 0.5, 0.8))), W / 2, 1185 + dy, scale=drift,
             opacity=out)
        s4 = S("date", lambda: pill("6 نونبر 1975 — 2026", F_TAJ(44)))
        e4 = ease_out_quint(prog(t, t0 + 1.1, 0.5))
        blit(frame, s4, W / 2, 1345 + dy + (1 - e4) * 20, opacity=min(prog(t, t0 + 1.1, 0.25), out))
        return
    if k == "M1":
        a, b = SEG["M1"]
        q = ease_in_cubic(prog(t, b - 0.25, 0.25))
        e = ease_out_quint(prog(t, a + 0.04, 0.6))
        blit(frame, defocus(LOGO_CARD, (1 - e) * 10), W / 2, 760 + (1 - e) * 40 - q * 24,
             opacity=min(prog(t, a + 0.04, 0.25), 1 - q))
        s = T("talaba", "طلبتنا يخلّدون الذكرى", F_CAIRO(76, 900), fill=WHITE)
        blit(frame, reveal_up(s, ease_out_quint(prog(t, a + 0.3, 0.55))), W / 2, 1020 - q * 24, opacity=1 - q)
        return
    words = {"M2": "وحدة", "M3": "وفاء", "M4": "انتماء", "M5": "فخر"}
    if k in words:
        a, b = SEG[k]
        draw_word(frame, t, words[k], a, b)
        return
    if k == "G":
        draw_tag(frame, t, "كلمة الطالبة", SEG["G"][0] + 0.3, SEG["G"][0] + 4.6)
        for ins in INSETS_G:
            ins.draw(frame, t)
        for c in CAPTIONS:
            c.draw(frame, t)
        g0, g1 = gv(GIRL_ACCENT["t0"]), gv(GIRL_ACCENT["t1"])
        if g0 <= t <= g1:
            spr = T("girl_accent", GIRL_ACCENT["text"], F_CAIRO(120, 1000), fill=GOLD, stroke=6,
                    stroke_fill=(12, 12, 18))
            blit(frame, reveal_up(spr, ease_out_quint(prog(t, g0, 0.4))), W / 2, 1370,
                 opacity=1 - prog(t, g1 - 0.25, 0.25))
        return
    if k == "B":
        draw_tag(frame, t, "كلمة الطالب", SEG["B"][0] + 0.35, SEG["B"][0] + 4.6)
        for ins in INSETS_B:
            ins.draw(frame, t)
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
        e = ease_out_quint(prog(t, a + 0.1, 0.7))
        blit(frame, card, W / 2, 1060 + (1 - e) * 50, scale=1 + 0.03 * prog(t, a, b - a),
             opacity=prog(t, a + 0.1, 0.3))
        s1 = T("kul", "كل عام", F_CAIRO(100, 1000), fill=WHITE)
        s2 = T("bikhayr", "والمغرب بخير", F_CAIRO(100, 1000), fill=GOLD)
        blit(frame, reveal_up(s1, ease_out_quint(prog(t, a + 0.3, 0.55))), W / 2, 560)
        blit(frame, reveal_up(s2, ease_out_quint(prog(t, a + 0.6, 0.55))), W / 2, 690)
        fl = S("flag_icon", lambda: flag_icon(110))
        ef = ease_out_quint(prog(t, a + 1.0, 0.5))
        blit(frame, fl, W / 2, 1400 + (1 - ef) * 20, opacity=prog(t, a + 1.0, 0.25))
        return
    if k == "O3":
        a, b = SEG["O3"]
        drift = 1 + 0.03 * prog(t, a, b - a)
        e = ease_out_quint(prog(t, a + 0.15, 0.8))
        blit(frame, defocus(LOGO_CARD_END, (1 - e) * 12), W / 2, 760 + (1 - e) * 40, scale=drift,
             opacity=prog(t, a + 0.15, 0.3))
        s1 = T("end1", "الذكرى 51", F_CAIRO(86, 1000), fill=WHITE)
        blit(frame, reveal_up(s1, ease_out_quint(prog(t, a + 0.5, 0.55))), W / 2, 1000, scale=drift)
        s1b = T("end1b", "للمسيرة الخضراء المظفرة", F_RUQAA(104), fill=WHITE)
        blit(frame, wipe_rtl(s1b, ease_in_out_cubic(prog(t, a + 0.7, 0.8))), W / 2, 1125, scale=drift)
        s2 = T("end2", "6 نونبر 1975  —  6 نونبر 2026", F_TAJ(44), fill=(225, 230, 240))
        blit(frame, s2, W / 2, 1250, scale=drift, opacity=prog(t, a + 1.2, 0.4))
        s3 = T("end3", "عاش المغرب", F_CAIRO(74, 1000), fill=GOLD)
        blit(frame, reveal_up(s3, ease_out_quint(prog(t, a + 1.6, 0.55))), W / 2, 1380, scale=drift)
        fl = S("flag_icon", lambda: flag_icon(110))
        ef = ease_out_quint(prog(t, a + 1.9, 0.5))
        blit(frame, fl, W / 2, 1490 + (1 - ef) * 20, scale=drift, opacity=prog(t, a + 1.9, 0.25))


def compose(k, t):
    base, kind = base_for(k, t)
    base *= SPEECH_MUL if kind == "speech" else VIG_STRONG if kind == "hist" else VIG
    overlays_for(k, base, t)
    return base, kind


XFADES = {"O2": 0.5, "O3": 0.6}          # crossfade length into these sections
WIPES = ("G", "B")                       # flag-colour wipe into the speeches


def render_frame(fi):
    t = fi / FPS
    k = seg_of(t)
    frame, kind = compose(k, t)
    keys = list(SEG)
    for nk, d in XFADES.items():
        b = SEG[nk][0]
        if b - d / 2 <= t < b + d / 2:
            pk = keys[keys.index(nk) - 1]
            other_k = nk if k == pk else pk
            other, _ = compose(other_k, t)
            p = ease_in_out_sine(prog(t, b - d / 2, d))
            a_new = p if other_k == nk else 1 - p
            frame = frame * (1 - a_new) + other * a_new
    for nk in WIPES:
        b = SEG[nk][0]
        if b - 0.3 <= t < b + 0.3:
            frame = brand_wipe(frame, prog(t, b - 0.3, 0.6))
    if t < 0.12:
        frame = frame * prog(t, 0, 0.12)
    if t > TOTAL - 1.2:
        frame = frame * (1 - ease_in_out_sine(prog(t, TOTAL - 1.2, 1.2)))
    hist = kind == "hist"
    frame = grain.apply(frame, fi if hist else fi // 2, 11 if hist else 1.2)
    return np.clip(frame, 0, 255).astype(np.uint8)


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
    n1 = int(round(TOTAL * FPS))
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24",
                            "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                            "-crf", "14", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    t_start = time.time()
    for fi in range(n1):
        enc.stdin.write(render_frame(fi).tobytes())
        if fi % 150 == 0:
            print(f"frame {fi}/{n1}  t={fi / FPS:6.2f}s  {time.time() - t_start:6.1f}s elapsed", flush=True)
    enc.stdin.close()
    enc.wait()
    print("done", out, f"{time.time() - t_start:.1f}s")


if __name__ == "__main__":
    main()
