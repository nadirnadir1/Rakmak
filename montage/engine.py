"""Drawing primitives for the montage: easing, sprites, cards, icons, particles."""
import math, os
from functools import lru_cache
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = os.environ["MS"]
FD = f"{S}/fonts"
# photo1 = dining + bedroom, photo2 = living room (front), photo3 = bedroom, photo4 = living room (side)
PHOTO_DIR = os.environ.get("PHOTO_DIR", f"{S}/photos")
PHOTOS = [f"{PHOTO_DIR}/photo{i}.jpg" for i in range(1, 5)]

OW, OH = 1080, 1920

# palette
NAVY = (13, 27, 52)
NAVY2 = (31, 60, 122)
GOLD = (219, 168, 66)
GOLD_L = (247, 214, 132)
WHITE = (255, 255, 255)
PAPER = (251, 250, 247)
RED = (226, 36, 46)
GREEN = (24, 178, 98)
BLUE = (46, 74, 226)
SKY = (232, 238, 255)
GREY = (150, 156, 168)
INK = (20, 26, 40)

ANTON = "Anton-Regular.ttf"
PBL = "Poppins-Black.ttf"
PXB = "Poppins-ExtraBold.ttf"
PSB = "Poppins-SemiBold.ttf"
PM = "Poppins-Medium.ttf"
FA = "fa-solid-900.ttf"

ICON = {
    'house': 0xf015, 'key': 0xf084, 'location-dot': 0xf3c5, 'tag': 0xf02b, 'chart-column': 0xe0e3,
    'chart-line': 0xf201, 'check': 0xf00c, 'circle-check': 0xf058, 'triangle-exclamation': 0xf071,
    'lock': 0xf023, 'lock-open': 0xf3c1, 'magnifying-glass': 0xf002, 'heart': 0xf004, 'bell': 0xf0f3,
    'coins': 0xf51e, 'file-lines': 0xf15c, 'file-contract': 0xf56c, 'lightbulb': 0xf0eb, 'star': 0xf005,
    'arrow-trend-up': 0xe098, 'camera': 0xf030, 'scale-balanced': 0xf24e, 'xmark': 0xf00d,
    'user-plus': 0xf234, 'hand-pointer': 0xf25a, 'award': 0xf559, 'trophy': 0xf091,
    'shield-halved': 0xf3ed, 'ruler-combined': 0xf546, 'circle-exclamation': 0xf06a, 'school': 0xf549,
    'train-subway': 0xf239, 'cart-shopping': 0xf07a, 'tree': 0xf1bb, 'arrow-right': 0xf061,
    'eye': 0xf06e, 'gem': 0xf3a5, 'city': 0xf64f, 'building': 0xf1ad, 'bed': 0xf236,
}


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def lin(t, t0, t1):
    if t1 <= t0:
        return 1.0 if t >= t1 else 0.0
    return clamp((t - t0) / (t1 - t0))


def eo3(x):
    return 1 - (1 - x) ** 3


def ei3(x):
    return x ** 3


def eio(x):
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def eback(x, s=1.70158):
    c3 = s + 1
    return 1 + c3 * (x - 1) ** 3 + s * (x - 1) ** 2


def ebounce(x):
    n1, d1 = 7.5625, 2.75
    if x < 1 / d1:
        return n1 * x * x
    if x < 2 / d1:
        x -= 1.5 / d1
        return n1 * x * x + 0.75
    if x < 2.5 / d1:
        x -= 2.25 / d1
        return n1 * x * x + 0.9375
    x -= 2.625 / d1
    return n1 * x * x + 0.984375


def lerp(a, b, p):
    return a + (b - a) * p


# ---------------------------------------------------------------- basics
@lru_cache(None)
def F(name, size):
    return ImageFont.truetype(f"{FD}/{name}", int(size))


def mul_alpha(im, a):
    if a >= 0.999:
        return im
    im = im.copy()
    lut = [int(v * a + 0.5) for v in range(256)]
    im.putalpha(im.getchannel('A').point(lut))
    return im


def paste(layer, im, x, y):
    x = int(round(x)); y = int(round(y))
    W, H = layer.size; w, h = im.size
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    if (x0, y0, x1, y1) != (x, y, x + w, y + h):
        im = im.crop((x0 - x, y0 - y, x1 - x, y1 - y))
    layer.alpha_composite(im, (x0, y0))


def put(layer, spr, cx, cy, s=1.0, rot=0.0, a=1.0, sx=1.0, sy=1.0):
    """Composite sprite centred at (cx,cy) with scale/rotation/opacity."""
    if a <= 0.004:
        return
    fx, fy = s * sx, s * sy
    if fx <= 0.01 or fy <= 0.01:
        return
    im = spr
    tr = abs(fx - 1) > 1e-3 or abs(fy - 1) > 1e-3 or abs(rot) > 0.05
    if tr:
        im = im.convert('RGBa')
        if abs(fx - 1) > 1e-3 or abs(fy - 1) > 1e-3:
            w = max(1, round(spr.width * fx)); h = max(1, round(spr.height * fy))
            im = im.resize((w, h), Image.LANCZOS if (fx < 1 and fy < 1) else Image.BICUBIC)
        if abs(rot) > 0.05:
            im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
        im = im.convert('RGBA')
    im = mul_alpha(im, a)
    paste(layer, im, cx - im.width / 2, cy - im.height / 2)


def solid(size, color, mask):
    im = Image.new('RGBA', size, tuple(color) + (0,))
    im.putalpha(mask)
    return im


@lru_cache(None)
def rrect_mask(w, h, r, ss=3):
    m = Image.new('L', (w * ss, h * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * ss - 1, h * ss - 1), r * ss, fill=255)
    return m.resize((w, h), Image.LANCZOS)


@lru_cache(None)
def circle_mask(d, ss=3):
    m = Image.new('L', (d * ss, d * ss), 0)
    ImageDraw.Draw(m).ellipse((0, 0, d * ss - 1, d * ss - 1), fill=255)
    return m.resize((d, d), Image.LANCZOS)


def shadow_only(im, blur=18, off=(0, 14), op=0.38, pad=48, color=(8, 14, 30)):
    W, H = im.size
    sh = Image.new('L', (W + 2 * pad, H + 2 * pad), 0)
    sh.paste(im.getchannel('A'), (pad + off[0], pad + off[1]))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    lut = [int(v * op) for v in range(256)]
    return solid(sh.size, color, sh.point(lut))


def with_shadow(im, blur=18, off=(0, 14), op=0.38, pad=48):
    out = shadow_only(im, blur, off, op, pad)
    out.alpha_composite(im, (pad, pad))
    return out


def glow(im, blur=22, color=None, op=1.0, pad=60):
    W, H = im.size
    g = Image.new('L', (W + 2 * pad, H + 2 * pad), 0)
    g.paste(im.getchannel('A'), (pad, pad))
    g = g.filter(ImageFilter.GaussianBlur(blur))
    lut = [min(255, int(v * op)) for v in range(256)]
    col = color if color else (255, 255, 255)
    out = solid(g.size, col, g.point(lut))
    out.alpha_composite(im, (pad, pad))
    return out


# ---------------------------------------------------------------- text & icons
@lru_cache(None)
def glyph(ch, font, size, color, stroke=0, stroke_color=None):
    """Return (sprite, (ox, oy)) where offsets are relative to the left-baseline origin."""
    f = F(font, size)
    l, t, r, b = f.getbbox(ch, anchor='ls', stroke_width=stroke)
    w, h = r - l + 6, b - t + 6
    if stroke:
        im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((3 - l, 3 - t), ch, font=f, fill=tuple(color) + (255,), anchor='ls',
                                stroke_width=stroke, stroke_fill=tuple(stroke_color) + (255,))
        return im, (l - 3, t - 3)
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).text((3 - l, 3 - t), ch, font=f, fill=255, anchor='ls')
    return solid((w, h), color, m), (l - 3, t - 3)


@lru_cache(None)
def text(s, font, size, color, stroke=0, stroke_color=None):
    f = F(font, size)
    l, t, r, b = f.getbbox(s, anchor='ls', stroke_width=stroke)
    w, h = r - l + 8, b - t + 8
    if stroke:
        im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((4 - l, 4 - t), s, font=f, fill=tuple(color) + (255,), anchor='ls',
                                stroke_width=stroke, stroke_fill=tuple(stroke_color) + (255,))
        return im
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).text((4 - l, 4 - t), s, font=f, fill=255, anchor='ls')
    return solid((w, h), color, m)


@lru_cache(None)
def icon(name, size, color, stroke=0, stroke_color=None):
    f = F(FA, size)
    ch = chr(ICON[name])
    l, t, r, b = f.getbbox(ch, stroke_width=stroke)
    w, h = r - l + 8, b - t + 8
    if stroke:
        im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((4 - l, 4 - t), ch, font=f, fill=tuple(color) + (255,),
                                stroke_width=stroke, stroke_fill=tuple(stroke_color) + (255,))
        return im
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).text((4 - l, 4 - t), ch, font=f, fill=255)
    return solid((w, h), color, m)


@lru_cache(None)
def badge(name, d, bg=NAVY, fg=WHITE, ring=GOLD, ring_w=7, isc=0.46, shadow=True):
    im = solid((d, d), bg, circle_mask(d))
    if ring:
        rm = Image.new('L', (d * 3, d * 3), 0)
        dr = ImageDraw.Draw(rm)
        dr.ellipse((0, 0, d * 3 - 1, d * 3 - 1), fill=255)
        dr.ellipse((ring_w * 3, ring_w * 3, d * 3 - 1 - ring_w * 3, d * 3 - 1 - ring_w * 3), fill=0)
        im.alpha_composite(solid((d, d), ring, rm.resize((d, d), Image.LANCZOS)))
    ic = icon(name, int(d * isc), fg)
    im.alpha_composite(ic, ((d - ic.width) // 2, (d - ic.height) // 2))
    return with_shadow(im, 14, (0, 10), 0.35, 40) if shadow else im


@lru_cache(None)
def card(idx, w, border=10, radius=22, shadow=True):
    ph = Image.open(PHOTOS[idx]).convert('RGB')
    iw = w - 2 * border
    ih = int(round(iw * ph.height / ph.width))
    ph = ph.resize((iw, ih), Image.LANCZOS).convert('RGBA')
    ph.putalpha(rrect_mask(iw, ih, max(4, radius - border)))
    H = ih + 2 * border
    fr = solid((w, H), WHITE, rrect_mask(w, H, radius))
    fr.alpha_composite(ph, (border, border))
    return with_shadow(fr, 20, (0, 16), 0.42, 50) if shadow else fr


@lru_cache(None)
def white_card(w, h, r=30, color=PAPER):
    return solid((w, h), color, rrect_mask(w, h, r))


@lru_cache(None)
def white_card_shadow(w, h, r=30):
    return shadow_only(white_card(w, h, r), 20, (0, 16), 0.36, 50)


def put_card(layer, w, h, cx, cy, s=1.0, rot=0.0, a=1.0, content=None, r=30, color=PAPER):
    """White card with drop shadow; `content` is an RGBA of the same size drawn on top."""
    base = white_card(w, h, r, color).copy()
    if content is not None:
        base.alpha_composite(content)
    put(layer, white_card_shadow(w, h, r), cx, cy + 0, s, rot, a * 0.95)
    put(layer, base, cx, cy, s, rot, a)


# ---------------------------------------------------------------- fx sprites
@lru_cache(None)
def sparkle(size=48, color=(255, 236, 170)):
    ss = 4; D = size * ss; c = D / 2
    m = Image.new('L', (D, D), 0)
    dr = ImageDraw.Draw(m)
    r1, r2 = D * 0.48, D * 0.09
    pts = []
    for k in range(8):
        ang = k * math.pi / 4 - math.pi / 2
        r = r1 if k % 2 == 0 else r2
        pts.append((c + r * math.cos(ang), c + r * math.sin(ang)))
    dr.polygon(pts, fill=255)
    m = m.resize((size, size), Image.LANCZOS)
    core = solid((size, size), WHITE, m)
    return glow(core, 5, color, 1.6, 12)


@lru_cache(None)
def dot(d=16, color=GOLD_L):
    return solid((d, d), color, circle_mask(d))


@lru_cache(None)
def soft_glow(d=300, color=GOLD_L, op=0.85):
    y, x = np.mgrid[0:d, 0:d]
    r = np.sqrt((x - d / 2) ** 2 + (y - d / 2) ** 2) / (d / 2)
    a = np.clip(1 - r, 0, 1) ** 2 * 255 * op
    return solid((d, d), color, Image.fromarray(a.astype(np.uint8)))


@lru_cache(None)
def rays(d=420, n=14, color=GOLD_L, op=0.55):
    ss = 2; D = d * ss; c = D / 2
    m = Image.new('L', (D, D), 0)
    dr = ImageDraw.Draw(m)
    for k in range(n):
        a0 = 2 * math.pi * k / n
        a1 = a0 + math.pi / n * 0.8
        dr.polygon([(c, c), (c + D * math.cos(a0), c + D * math.sin(a0)),
                    (c + D * math.cos(a1), c + D * math.sin(a1))], fill=255)
    m = m.resize((d, d), Image.LANCZOS)
    y, x = np.mgrid[0:d, 0:d]
    r = np.sqrt((x - d / 2) ** 2 + (y - d / 2) ** 2) / (d / 2)
    fall = np.clip(1 - r, 0, 1) ** 1.5
    a = (np.asarray(m, np.float32) * fall * op).astype(np.uint8)
    return solid((d, d), color, Image.fromarray(a).filter(ImageFilter.GaussianBlur(2)))


def ring(r, width, color, a=1.0):
    d = int(2 * r + 2 * width + 4)
    ss = 2
    m = Image.new('L', (d * ss, d * ss), 0)
    dr = ImageDraw.Draw(m)
    c = d * ss / 2
    dr.ellipse((c - r * ss, c - r * ss, c + r * ss, c + r * ss), outline=255, width=max(1, int(width * ss)))
    m = m.resize((d, d), Image.LANCZOS)
    return mul_alpha(solid((d, d), color, m), a)


class Burst:
    """Deterministic particle burst."""

    def __init__(self, seed, n=16, speed=(160, 340), life=0.7, size=(18, 40), kind='sparkle',
                 colors=((255, 236, 170),), gravity=0.0, spread=(0, 2 * math.pi)):
        rng = np.random.default_rng(seed)
        self.p = []
        for _ in range(n):
            ang = rng.uniform(*spread)
            self.p.append(dict(ang=ang, sp=rng.uniform(*speed), sz=rng.uniform(*size),
                               life=life * rng.uniform(0.7, 1.1), col=colors[rng.integers(len(colors))],
                               rot=rng.uniform(0, 360), spin=rng.uniform(-400, 400)))
        self.kind = kind; self.g = gravity

    def draw(self, layer, tr, cx, cy, scale=1.0):
        if tr < 0:
            return
        for q in self.p:
            if tr > q['life']:
                continue
            p = tr / q['life']
            dist = q['sp'] * eo3(p) * scale
            x = cx + math.cos(q['ang']) * dist
            y = cy + math.sin(q['ang']) * dist + self.g * tr * tr
            sz = q['sz'] * (1 - 0.6 * p)
            a = 1 - p ** 2
            if self.kind == 'sparkle':
                spr = sparkle(48, q['col'])
                put(layer, spr, x, y, s=sz / 48, rot=q['rot'] + q['spin'] * tr, a=a)
            elif self.kind == 'confetti':
                spr = confetti_piece(q['col'])
                put(layer, spr, x, y, s=sz / 30, rot=q['rot'] + q['spin'] * tr, a=a, sy=abs(math.cos(q['rot'] + tr * 9)) + 0.2)
            elif self.kind == 'heart':
                put(layer, icon('heart', 40, q['col']), x, y, s=sz / 40, rot=(q['rot'] % 40) - 20, a=a)
            else:
                put(layer, dot(16, q['col']), x, y, s=sz / 16, a=a)


@lru_cache(None)
def confetti_piece(color):
    return solid((30, 16), color, rrect_mask(30, 16, 3))
