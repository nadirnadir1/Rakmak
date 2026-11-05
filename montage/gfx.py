"""Small motion-graphics toolkit: easing, Arabic text sprites, compositing, transitions.

Frames are float32 BGR in 0..255. Sprites are float32 BGRA, premultiplied, in 0..1.
"""
import math
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "fonts")

RED = (193, 39, 45)       # Moroccan flag red (RGB)
GREEN = (0, 98, 51)       # flag green
GOLD = (255, 211, 77)
NAVY = (11, 30, 58)
WHITE = (255, 255, 255)


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def lerp(a, b, t):
    return a + (b - a) * t


def prog(t, t0, dur):
    return clamp((t - t0) / dur) if dur > 0 else float(t >= t0)


def ease_out_cubic(t):
    t = clamp(t); return 1 - (1 - t) ** 3


def ease_in_cubic(t):
    t = clamp(t); return t ** 3


def ease_in_out_cubic(t):
    t = clamp(t); return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out_back(t, s=1.7):
    t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1


def ease_out_expo(t):
    t = clamp(t); return 1.0 if t >= 1 else 1 - 2 ** (-10 * t)


def ease_in_out_sine(t):
    t = clamp(t); return -(math.cos(math.pi * t) - 1) / 2


def window(t, t0, t1, fin=0.15, fout=0.15):
    """0..1 envelope: fades in after t0, out before t1."""
    if t < t0 or t > t1:
        return 0.0
    a = prog(t, t0, fin) if fin > 0 else 1.0
    b = 1 - prog(t, t1 - fout, fout) if fout > 0 else 1.0
    return min(a, b)


# ---------------------------------------------------------------- fonts / text
_fonts = {}


def font(name, size, wght=None):
    key = (name, size, wght)
    if key not in _fonts:
        f = ImageFont.truetype(os.path.join(FONT_DIR, name), size, layout_engine=ImageFont.Layout.RAQM)
        if wght is not None:
            vals = []
            for a in f.get_variation_axes():
                n = a["name"].decode() if isinstance(a["name"], bytes) else a["name"]
                vals.append(wght if n.lower().startswith("weight") else a.get("default", 0))
            f.set_variation_by_axes(vals)
        _fonts[key] = f
    return _fonts[key]


def _kw(fnt, rtl):
    return dict(font=fnt, direction="rtl", language="ar") if rtl else dict(font=fnt)


def text_pil(text, fnt, fill=WHITE, stroke=0, stroke_fill=(0, 0, 0), shadow=None, rtl=True, glow=None):
    """Render one line of text to a tight RGBA PIL image (with padding for stroke/shadow)."""
    kw = _kw(fnt, rtl)
    probe = ImageDraw.Draw(Image.new("RGBA", (4, 4)))
    l, t, r, b = probe.textbbox((0, 0), text, stroke_width=stroke, **kw)
    extra = 0
    if shadow:
        extra = int(abs(shadow[0]) + abs(shadow[1]) + shadow[2] * 3)
    if glow:
        extra = max(extra, int(glow[1] * 3))
    pad = stroke + extra + 6
    w, h = r - l + 2 * pad, b - t + 2 * pad
    base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(base).text((pad - l, pad - t), text, fill=tuple(fill) + (255,), stroke_width=stroke,
                              stroke_fill=tuple(stroke_fill) + (255,), **kw)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if glow:  # (rgb, radius, opacity)
        g = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(g).text((pad - l, pad - t), text, fill=tuple(glow[0]) + (int(255 * glow[2]),),
                               stroke_width=stroke + 2, stroke_fill=tuple(glow[0]) + (int(255 * glow[2]),), **kw)
        out.alpha_composite(g.filter(ImageFilter.GaussianBlur(glow[1])))
    if shadow:  # (dx, dy, blur, opacity)
        dx, dy, bl, op = shadow
        s = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(s).text((pad - l + dx, pad - t + dy), text, fill=(0, 0, 0, int(255 * op)),
                               stroke_width=stroke, stroke_fill=(0, 0, 0, int(255 * op)), **kw)
        out.alpha_composite(s.filter(ImageFilter.GaussianBlur(bl)))
    out.alpha_composite(base)
    return out


def to_sprite(img):
    """PIL RGBA -> premultiplied float32 BGRA sprite."""
    a = np.asarray(img.convert("RGBA")).astype(np.float32) / 255.0
    alpha = a[..., 3:4]
    return np.ascontiguousarray(np.concatenate([a[..., 2::-1] * alpha, alpha], axis=2))


def text_sprite(text, fnt, **kw):
    return to_sprite(text_pil(text, fnt, **kw))


class WordLine:
    """An RTL line laid out word by word, so single words can be recolored (karaoke)."""

    def __init__(self, words, fnt, fill=WHITE, hl_fill=GOLD, stroke=6, stroke_fill=(10, 10, 14),
                 shadow=(0, 5, 6, 0.55), static_hl=()):
        self.words = words
        kw = _kw(fnt, True)
        lk = dict(direction="rtl", language="ar")
        space = fnt.getlength(" ", **lk) * 1.05
        widths = [fnt.getlength(w, **lk) for w in words]
        asc, desc = fnt.getmetrics()
        pad = stroke + 24
        total = sum(widths) + space * (len(words) - 1)
        self.w = int(total + 2 * pad)
        self.h = int(asc + desc + 2 * pad)
        base_y = pad + asc
        self.bounds = []
        x_right = self.w - pad
        xs = []
        for wd in widths:
            xs.append(x_right)
            self.bounds.append((x_right - wd, x_right))
            x_right -= wd + space

        def render(colors):
            img = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            for word, xr, col in zip(words, xs, colors):
                d.text((xr, base_y), word, fill=tuple(col) + (255,), anchor="rs", stroke_width=stroke,
                       stroke_fill=tuple(stroke_fill) + (255,), **kw)
            if shadow:
                dx, dy, bl, op = shadow
                s = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
                ds = ImageDraw.Draw(s)
                for word, xr in zip(words, xs):
                    ds.text((xr + dx, base_y + dy), word, fill=(0, 0, 0, int(255 * op)), anchor="rs",
                            stroke_width=stroke, stroke_fill=(0, 0, 0, int(255 * op)), **kw)
                s = s.filter(ImageFilter.GaussianBlur(bl))
                s.alpha_composite(img)
                img = s
            return to_sprite(img)

        base_cols = [hl_fill if w in static_hl else fill for w in words]
        self.normal = render(base_cols)
        self.hl = render([hl_fill] * len(words)) if hl_fill is not None else self.normal
        # cut points halfway through the spaces, so a word's stroke is not clipped
        self.cuts = []
        for i, (x0, x1) in enumerate(self.bounds):
            left = (x0 + self.bounds[i + 1][1]) / 2 if i + 1 < len(self.bounds) else 0
            right = (x1 + self.bounds[i - 1][0]) / 2 if i > 0 else self.w
            self.cuts.append((int(left), int(right)))

    def sprite(self, active=-1):
        if active < 0 or active >= len(self.words):
            return self.normal
        out = self.normal.copy()
        x0, x1 = self.cuts[active]
        out[:, x0:x1] = self.hl[:, x0:x1]
        return out


# ---------------------------------------------------------------- compositing
def composite(frame, spr, x0, y0, opacity=1.0):
    Hf, Wf = frame.shape[:2]
    h, w = spr.shape[:2]
    fx0, fy0 = max(0, x0), max(0, y0)
    fx1, fy1 = min(Wf, x0 + w), min(Hf, y0 + h)
    if fx1 <= fx0 or fy1 <= fy0 or opacity <= 0.002:
        return
    s = spr[fy0 - y0:fy1 - y0, fx0 - x0:fx1 - x0]
    a = s[..., 3:4] * opacity
    roi = frame[fy0:fy1, fx0:fx1]
    roi *= 1.0 - a
    roi += s[..., :3] * (255.0 * opacity)


def blit(frame, spr, cx, cy, scale=1.0, rot=0.0, opacity=1.0, anchor=(0.5, 0.5)):
    """Place sprite with its anchor point at (cx, cy); optional scale / rotation (degrees)."""
    if opacity <= 0.002 or scale <= 0.01:
        return
    h, w = spr.shape[:2]
    ax, ay = anchor[0] * w, anchor[1] * h
    if abs(scale - 1) < 1e-3 and abs(rot) < 1e-3:
        composite(frame, spr, int(round(cx - ax)), int(round(cy - ay)), opacity)
        return
    M = cv2.getRotationMatrix2D((ax, ay), rot, scale)
    M[0, 2] += cx - ax
    M[1, 2] += cy - ay
    pts = M @ np.array([[0, w, 0, w], [0, 0, h, h], [1, 1, 1, 1]], np.float64)
    bx0, by0 = int(math.floor(pts[0].min())) - 1, int(math.floor(pts[1].min())) - 1
    bx1, by1 = int(math.ceil(pts[0].max())) + 1, int(math.ceil(pts[1].max())) + 1
    # skip work entirely off-screen
    if bx1 < 0 or by1 < 0 or bx0 > frame.shape[1] or by0 > frame.shape[0]:
        return
    M[0, 2] -= bx0
    M[1, 2] -= by0
    warped = cv2.warpAffine(spr, M, (bx1 - bx0, by1 - by0), flags=cv2.INTER_LINEAR,
                            borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    composite(frame, warped, bx0, by0, opacity)


def zoom(img, z, cx=W / 2, cy=H / 2, dx=0.0, dy=0.0):
    if abs(z - 1) < 1e-4 and abs(dx) < 1e-3 and abs(dy) < 1e-3:
        return img
    M = np.float32([[z, 0, (1 - z) * cx + dx], [0, z, (1 - z) * cy + dy]])
    return cv2.warpAffine(img, M, (img.shape[1], img.shape[0]), flags=cv2.INTER_LINEAR,
                          borderMode=cv2.BORDER_REFLECT)


def radial_blur(img, amount, n=7, cx=W / 2, cy=H / 2):
    if amount < 0.004:
        return img
    acc = img.copy()
    for i in range(1, n):
        acc += zoom(img, 1 + amount * i / (n - 1), cx, cy)
    return acc / n


def motion_blur_x(img, k):
    k = int(k)
    return img if k < 3 else cv2.blur(img, (k, 1))


def motion_blur_y(img, k):
    k = int(k)
    return img if k < 3 else cv2.blur(img, (1, k))


def flash(frame, a, color=(255, 255, 255)):
    if a <= 0.002:
        return frame
    return frame * (1 - a) + np.array(color[::-1], np.float32) * a


def sepia(frame, amount=1.0):
    g = frame[..., 0] * 0.114 + frame[..., 1] * 0.587 + frame[..., 2] * 0.299
    s = np.stack([g * 0.70, g * 0.90 + 10, g * 1.02 + 22], axis=2)
    return np.clip(frame * (1 - amount) + s * amount, 0, 255)


def darken(frame, a):
    return frame * (1 - a)


# ---------------------------------------------------------------- textures
class Grain:
    def __init__(self, n=8, seed=7):
        rng = np.random.default_rng(seed)
        self.tex = []
        for _ in range(n):
            g = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
            g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)
            self.tex.append(g[..., None])

    def apply(self, frame, i, amp):
        if amp <= 0:
            return frame
        return frame + self.tex[i % len(self.tex)] * amp


def vignette_mask(strength=0.35, power=2.2):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    nx, ny = (x - W / 2) / (W / 2), (y - H / 2) / (H / 2)
    r = np.sqrt(nx ** 2 * 0.9 + ny ** 2 * 0.55)
    return (1 - strength * np.clip(r, 0, 1.6) ** power)[..., None].astype(np.float32)


def bottom_scrim(y0=1080, y1=H, max_a=0.5):
    a = np.zeros((H, 1, 1), np.float32)
    ys = np.arange(H)
    t = np.clip((ys - y0) / (y1 - y0), 0, 1)
    a[:, 0, 0] = (t ** 1.4) * max_a
    return 1 - a


def light_leak_texture(seed=3):
    rng = np.random.default_rng(seed)
    w2, h2 = W * 2, H
    tex = np.zeros((h2 // 4, w2 // 4, 3), np.float32)
    cols = [(255, 140, 40), (255, 80, 60), (255, 200, 120), (230, 60, 90)]
    for _ in range(9):
        cx, cy = rng.uniform(0, w2 // 4), rng.uniform(0, h2 // 4)
        rad = rng.uniform(60, 160)
        c = cols[rng.integers(0, len(cols))]
        yy, xx = np.mgrid[0:h2 // 4, 0:w2 // 4]
        d = np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * rad ** 2)))
        tex += d[..., None] * np.array(c[::-1], np.float32) / 255.0
    tex = cv2.resize(np.clip(tex, 0, 1), (w2, h2), interpolation=cv2.INTER_CUBIC)
    return tex


def apply_leak(frame, tex, offset_x, amount):
    if amount <= 0.002:
        return frame
    ox = int(offset_x) % W
    sub = tex[:, ox:ox + W]
    # screen blend
    f = frame / 255.0
    out = 1 - (1 - f) * (1 - sub * amount)
    return out * 255.0


# ---------------------------------------------------------------- shapes / cards
def rounded_mask(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), radius=r, fill=255)
    return m


def photo_card(content_bgr, border=12, radius=20, shadow=26, shadow_op=0.55):
    """Content image (uint8 BGR) -> sprite with white border, rounded corners and soft shadow."""
    ch, cw = content_bgr.shape[:2]
    w, h = cw + 2 * border, ch + 2 * border
    pad = shadow * 2
    card = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    sh = Image.new("RGBA", card.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((pad, pad + shadow // 3, pad + w, pad + h + shadow // 3),
                                         radius=radius, fill=(0, 0, 0, int(255 * shadow_op)))
    card.alpha_composite(sh.filter(ImageFilter.GaussianBlur(shadow / 2)))
    frame = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    content = Image.fromarray(cv2.cvtColor(content_bgr, cv2.COLOR_BGR2RGB)).convert("RGBA")
    inner = rounded_mask(cw, ch, max(2, radius - border // 2))
    frame.paste(content, (border, border), inner)
    card.paste(frame, (pad, pad), rounded_mask(w, h, radius))
    return to_sprite(card)


def pill(text, fnt, fill=RED, text_fill=WHITE, padx=26, pady=12, rtl=True, radius=None):
    t = text_pil(text, fnt, fill=text_fill, rtl=rtl)
    w, h = t.size[0] + 2 * padx - 12, t.size[1] + 2 * pady - 12
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle((0, 0, w - 1, h - 1), radius=radius or h // 2, fill=tuple(fill) + (255,))
    img.alpha_composite(t, ((w - t.size[0]) // 2, (h - t.size[1]) // 2))
    return to_sprite(img)


def star_points(cx, cy, r, rot=-90):
    pts = []
    for k in range(5):
        a = math.radians(rot + k * 72)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    order = [0, 2, 4, 1, 3, 0]          # pentagram path
    return [pts[i] for i in order]


def star_sprite(r, progress, thickness=14, color=(30, 160, 90), size=None):
    """Pentagram drawn up to `progress` (0..1) of its path, as a sprite."""
    size = size or int(2 * r + thickness * 4)
    c = size / 2
    path = star_points(c, c, r)
    img = np.zeros((size, size, 4), np.uint8)
    done = progress * 5.0
    pts = [path[0]]
    for i in range(5):
        if done <= i:
            break
        f = min(1.0, done - i)
        p0, p1 = path[i], path[i + 1]
        pts.append((p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f))
    if len(pts) >= 2:
        arr = np.array([[int(x * 4), int(y * 4)] for x, y in pts], np.int32)
        cv2.polylines(img, [arr], False, (color[2], color[1], color[0], 255), thickness, cv2.LINE_AA, shift=2)
    # drawn over transparent black, so AA output is already premultiplied
    return img.astype(np.float32) / 255.0


def flag_icon(w=120):
    """Small Moroccan flag (red field + green pentagram) sprite."""
    h = int(w * 2 / 3)
    img = np.zeros((h, w, 4), np.float32)
    img[..., 0] = RED[2] / 255; img[..., 1] = RED[1] / 255; img[..., 2] = RED[0] / 255; img[..., 3] = 1
    st = star_sprite(h * 0.30, 1.0, thickness=max(3, int(w / 22)), color=GREEN, size=h)
    off = (w - h) // 2
    a = st[..., 3:4]
    img[:, off:off + h, :3] = img[:, off:off + h, :3] * (1 - a) + st[..., :3]
    m = np.asarray(rounded_mask(w, h, max(3, w // 14))).astype(np.float32)[..., None] / 255
    return img * m
