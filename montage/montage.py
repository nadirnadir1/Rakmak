"""Real-estate montage renderer.

Output = hook (src 32.72s-34.20s) + full source video, 1080x1920 @25fps.
Graphics are drawn on a layer *behind* the speaker (using the RVM alpha matte)
or in front of him (hand-reactive items). Element times are in source seconds.
"""
import math, os, sys, subprocess
from functools import lru_cache
import numpy as np, cv2
from PIL import Image, ImageDraw
from engine import *

S = os.environ["MS"]
SW, SH = 720, 1280
K = OW / SW
FPS = 25
HOOK_START, HOOK_N = 818, 37
FR = [('hook', HOOK_START + k, k / FPS) for k in range(HOOK_N)] + [('main', k, k / FPS) for k in range(1088)]
NOUT = len(FR)

FRAMES = np.load(f"{S}/work/frames.npy", mmap_mode='r')
ALPHA = np.load(f"{S}/work/alpha.npy", mmap_mode='r')
SUBM = np.load(f"{S}/work/submask.npy", mmap_mode='r')
SUB_Y0 = 560
HN = dict(np.load(f"{S}/work/hands.npz"))
GH, RH = 'Right', 'Left'   # GH = hand on image-left (main gesturing hand), RH = image-right hand


class Ctx:
    def __init__(self, seg, sf, t):
        self.seg, self.sf, self.t = seg, sf, t
        self.bg = None; self.fg = None
        self.dark = 0.0; self.redvig = 0.0

    def L(self, which):
        if which == 'bg':
            if self.bg is None:
                self.bg = Image.new('RGBA', (OW, OH), (0, 0, 0, 0))
            return self.bg
        if self.fg is None:
            self.fg = Image.new('RGBA', (OW, OH), (0, 0, 0, 0))
        return self.fg


def hand(c, lab, kind='palm', fb=None):
    v = HN[f"{lab}_{kind}"][c.sf]
    if np.isnan(v[0]):
        return fb
    return (float(v[0]) * K, float(v[1]) * K)


# ================================================================ banner (behind head)
PW, PH, PCY = 1000, 206, 136
STY = {
    'white': dict(bg=PAPER, fg=NAVY, acc=GOLD, icon=BLUE),
    'navy': dict(bg=NAVY, fg=WHITE, acc=GOLD, icon=GOLD_L),
    'red': dict(bg=RED, fg=WHITE, acc=(255, 214, 0), icon=(255, 226, 110)),
    'gold': dict(bg=GOLD, fg=NAVY, acc=NAVY, icon=NAVY),
}


@lru_cache(None)
def panel_w(style, w):
    st = STY[style]
    arr = np.zeros((PH, w, 3), np.float32); arr[:] = st['bg']
    arr *= np.linspace(1.07, 0.92, PH)[:, None, None]
    arr = np.clip(arr, 0, 255)
    arr[PH - 13:, :] = st['acc']
    im = Image.fromarray(arr.astype(np.uint8)).convert('RGBA')
    im.putalpha(rrect_mask(w, PH, min(44, w // 2)))
    return im


def panel(style):
    return panel_w(style, PW)


@lru_cache(None)
def panel_shadow_w(style, w):
    return shadow_only(panel_w(style, w), 22, (0, 16), 0.42, 50)


def panel_shadow(style):
    return panel_shadow_w(style, PW)


def clip_to(temp, ref):
    from PIL import ImageChops
    temp.putalpha(ImageChops.multiply(temp.getchannel('A'), ref.getchannel('A')))
    return temp


@lru_cache(None)
def fit_font(txt, font, cap, maxw):
    size = int(cap / 0.72)
    capH = -F(font, size).getbbox('H', anchor='ls')[1]
    size = int(size * cap / capH)
    while F(font, size).getlength(txt) > maxw and size > 20:
        size = int(size * 0.96)
    return size


def banner(c, t0, t1, txt, style='white', ic=None, anim='slide', cap=128, font=ANTON,
           t_in=0.42, t_out=0.28, stagger=0.028, parts=None):
    """Title panel behind the head. anim: slide (drops from top), split (opens out from
    behind the head), slam (punch-in for warnings)."""
    t = c.t
    if not (t0 <= t <= t1):
        return
    st = STY[style]
    pin = lin(t, t0, t0 + t_in); pout = lin(t, t1 - t_out, t1)
    if parts:
        fs = min(fit_font(p_, font, cap, int(PW * 0.36)) for p_, _ in parts)
    else:
        fs = fit_font(txt, font, cap, PW - 110 - (int(cap * 1.2) if ic else 0))
    f = F(font, fs)
    tw = f.getlength(txt)
    capH = -f.getbbox('H', anchor='ls')[1]
    isz = int(capH * 0.92)
    iw = (icon(ic, isz, st['icon']).width + 28) if ic else 0
    x0 = (PW - (tw + iw)) / 2
    base = PH / 2 + capH / 2 - 16
    if anim == 'split':
        wv = lerp(96, PW, eo3(pin)) * (1 - 0.9 * ei3(pout))
        wq = max(88, int(wv / 8) * 8)
    else:
        wv = wq = PW
    off = (PW - wq) / 2
    ref = panel_w(style, wq)
    temp = ref.copy()

    def prog(k, xc):
        if anim == 'slide':
            tk = t0 + 0.10 + k * stagger
            return lin(t, tk, tk + 0.34)
        if anim == 'split':
            return clamp((wv / 2 - abs(xc - PW / 2) - 10) / 150)
        return 1.0

    if ic:
        icx = x0 + (iw - 28) / 2
        pk = prog(0, icx) if anim != 'slide' else lin(t, t0 + 0.06, t0 + 0.38)
        if pk > 0:
            put(temp, icon(ic, isz, st['icon']), icx - off, base - capH / 2,
                s=eback(pk, 2.0) if anim != 'slam' else 1, a=min(1, pk * 2))
    if parts:
        letters = []
        for ptxt, pcx in parts:
            px = pcx - f.getlength(ptxt) / 2
            letters += [(ch, px + f.getlength(ptxt[:j])) for j, ch in enumerate(ptxt)]
    else:
        letters = [(ch, x0 + iw + f.getlength(txt[:j])) for j, ch in enumerate(txt)]
    for k, (ch, xk) in enumerate(letters):
        if ch == ' ':
            continue
        g, (ox, oy) = glyph(ch, font, fs, st['fg'])
        pk = prog(k, xk + g.width / 2)
        if pk <= 0:
            continue
        rise = (1 - eback(pk, 1.4)) * (120 if anim == 'slide' else 70) if anim != 'slam' else 0
        paste(temp, mul_alpha(g, min(1, pk * 1.6)), xk + ox - off, base + oy + rise)
    clip_to(temp, ref)
    if anim == 'slide':
        y = PCY - 330 * (1 - eback(pin, 1.1)) - 330 * ei3(pout); s = 1.0; a = 1.0
    elif anim == 'split':
        y = PCY; s = 1.0; a = min(1, pin * 6) * (1 - lin(pout, 0.8, 1.0))
    else:  # slam
        pi = lin(t, t0, t0 + 0.15)
        s = (1 + 0.55 * (1 - eo3(pi))) * (1 - 0.12 * pout); a = min(1, pi * 2.5) * (1 - pout); y = PCY
    L = c.L('bg')
    put(L, panel_shadow_w(style, wq), 540, y, s=s, a=a * 0.9)
    put(L, temp, 540, y, s=s, a=a)


def banner_stars(c, t0, t1):
    t = c.t
    if not (t0 <= t <= t1):
        return
    pin = lin(t, t0, t0 + 0.4); pout = lin(t, t1 - 0.28, t1)
    temp = panel('gold').copy()
    for k in range(5):
        pk = lin(t, t0 + 0.15 + k * 0.13, t0 + 0.45 + k * 0.13)
        x = PW / 2 + (k - 2) * 168
        put(temp, icon('star', 110, (40, 30, 10)), x, PH / 2 - 8, s=0.98, a=0.25)   # empty slot
        if pk > 0:
            put(temp, icon('star', 110, WHITE, 6, NAVY), x, PH / 2 - 10, s=eback(pk, 2.6))
    y = PCY - 340 * (1 - eback(pin, 1.1)) - 340 * ei3(pout)
    L = c.L('bg')
    put(L, panel_shadow('gold'), 540, y, a=0.9)
    put(L, temp, 540, y)


def banner_years(c, t0, t1):
    t = c.t
    if not (t0 <= t <= t1):
        return
    pin = lin(t, t0, t0 + 0.4); pout = lin(t, t1 - 0.28, t1)
    temp = panel('gold').copy()
    fs = fit_font('2018 2026', ANTON, 128, 760)
    f = F(ANTON, fs)
    capH = -f.getbbox('H', anchor='ls')[1]
    dw = max(f.getlength(d) for d in '0123456789')
    sw = f.getlength('2018')
    arrow = icon('arrow-right', int(capH * 0.55), NAVY)
    total = sw + 40 + arrow.width + 40 + 4 * dw
    x0 = (PW - total) / 2
    base = PH / 2 + capH / 2 - 16
    paste(temp, mul_alpha(text('2018', ANTON, fs, (60, 44, 16)), 0.85), x0, base - capH - 4)
    put(temp, arrow, x0 + sw + 40 + arrow.width / 2, base - capH / 2)
    v = 2018 + 8 * eio(lin(t, t0 + 0.17, 30.16))
    stripH = int(capH + 40)
    strip = Image.new('RGBA', (int(4 * dw) + 4, stripH), (0, 0, 0, 0))
    rowh = capH * 1.25
    for pos, place in enumerate([1000, 100, 10, 1]):
        q = v / place
        d = int(math.floor(q)) % 10
        if place == 1:
            fr = v - math.floor(v)
        else:
            fr = clamp((v % place) - (place - 1))
        for dd, off in ((d, -fr * rowh), ((d + 1) % 10, (1 - fr) * rowh)):
            if abs(off) > rowh:
                continue
            g, (ox, oy) = glyph(str(dd), ANTON, fs, NAVY)
            gx = pos * dw + (dw - f.getlength(str(dd))) / 2
            paste(strip, g, gx + ox, stripH - 20 + oy + off)
    pulse = 1 + 0.1 * math.sin(math.pi * lin(t, 30.16, 30.42))
    xs = x0 + sw + 80 + arrow.width
    put(temp, strip, xs + strip.width / 2, base - stripH / 2 + 20, s=pulse)
    y = PCY - 340 * (1 - eback(pin, 1.1)) - 340 * ei3(pout)
    L = c.L('bg')
    put(L, panel_shadow('gold'), 540, y, a=0.9)
    put(L, temp, 540, y)


# ================================================================ helper motions
HEAD = (540, 470)   # where things hide behind the head


def from_head(t, ts, ex, ey, dur=0.45, back_s=1.15):
    p = lin(t, ts, ts + dur)
    return lerp(HEAD[0], ex, eback(p, back_s)), lerp(HEAD[1], ey, eo3(p)), p


def to_head(t, te, x, y, dur=0.28):
    q = lin(t, te - dur, te)
    return lerp(x, HEAD[0], ei3(q)), lerp(y, HEAD[1], ei3(q)), q


BURSTS = {
    'open0': Burst(1, 14, (120, 260), 0.75, (18, 38)),
    'open1': Burst(2, 14, (120, 260), 0.75, (18, 38)),
    'house': Burst(3, 16, (110, 230), 0.7, (16, 34)),
    'key': Burst(4, 12, (90, 200), 0.6, (14, 30)),
    'merge': Burst(5, 18, (100, 240), 0.7, (16, 36)),
    'heart': Burst(6, 10, (120, 260), 0.9, (26, 46), 'heart', ((236, 50, 80), (255, 105, 130), WHITE), -300,
                   (-math.pi * 0.95, -math.pi * 0.05)),
    'trophy': Burst(7, 34, (220, 460), 1.3, (18, 30), 'confetti',
                    (GOLD, GOLD_L, BLUE, RED, GREEN, WHITE), 520),
    'trophy_s': Burst(8, 14, (140, 300), 0.8, (20, 40)),
    'lock': Burst(9, 20, (150, 320), 0.8, (18, 38)),
    'tip': Burst(10, 12, (90, 200), 0.5, (14, 28)),
    'follow': Burst(11, 12, (140, 300), 1.1, (30, 50), 'heart', ((236, 50, 80), (255, 105, 130), WHITE), -250,
                    (-math.pi * 0.95, -math.pi * 0.05)),
    'stamp': Burst(12, 14, (120, 260), 0.5, (12, 22), 'dot', ((200, 240, 210), GREEN)),
    'bulb': Burst(13, 14, (130, 260), 0.8, (16, 32)),
}


# ================================================================ custom sprites
@lru_cache(None)
def hook_text():
    fs = fit_font('ATTENTION', ANTON, 124, 700)
    return glow(text('ATTENTION', ANTON, fs, (255, 44, 44)), 26, (255, 20, 20), 1.25, 70)


@lru_cache(None)
def warn_spr():
    return glow(icon('triangle-exclamation', 170, (255, 196, 0), 4, (60, 20, 0)), 18, (255, 120, 0), 1.0, 40)


@lru_cache(None)
def xmark_spr():
    return with_shadow(icon('xmark', 240, RED, 12, WHITE), 14, (0, 10), 0.4, 40)


@lru_cache(None)
def checkbox_empty():
    m = Image.new('L', (46 * 3, 46 * 3), 0)
    dr = ImageDraw.Draw(m)
    dr.rounded_rectangle((0, 0, 46 * 3 - 1, 46 * 3 - 1), 12 * 3, fill=255)
    dr.rounded_rectangle((5 * 3, 5 * 3, 41 * 3, 41 * 3), 8 * 3, fill=0)
    return solid((46, 46), (205, 210, 222), m.resize((46, 46), Image.LANCZOS))


@lru_cache(None)
def stamp_spr():
    w, h = 340, 128
    m = Image.new('L', (w * 3, h * 3), 0)
    dr = ImageDraw.Draw(m)
    dr.rounded_rectangle((0, 0, w * 3 - 1, h * 3 - 1), 24 * 3, fill=255)
    dr.rounded_rectangle((9 * 3, 9 * 3, w * 3 - 9 * 3, h * 3 - 9 * 3), 16 * 3, fill=0)
    im = solid((w, h), GREEN, m.resize((w, h), Image.LANCZOS))
    bg = solid((w, h), (255, 255, 255), rrect_mask(w, h, 24))
    bg = mul_alpha(bg, 0.92)
    bg.alpha_composite(im)
    t = text('VALIDÉ', ANTON, 78, GREEN)
    ic = icon('check', 62, GREEN)
    tot = t.width + 18 + ic.width
    bg.alpha_composite(ic, (int((w - tot) / 2), int((h - ic.height) / 2)))
    bg.alpha_composite(t, (int((w - tot) / 2 + ic.width + 18), int((h - t.height) / 2)))
    return with_shadow(bg, 12, (0, 8), 0.3, 30)


@lru_cache(None)
def sign_spr():
    bw, bh, ch = 300, 205, 120
    W, H = bw + 60, 2 * (ch + bh) + 40
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    hx, hy = W / 2, H / 2
    board = white_card(bw, bh, 22).copy()
    head = solid((bw, 70), RED, rrect_mask(bw, 70, 22))
    board.alpha_composite(head, (0, 0))
    board.alpha_composite(solid((bw, 30), RED, Image.new('L', (bw, 30), 255)), (0, 40))
    tt = text('À VENDRE', ANTON, 52, WHITE)
    board.alpha_composite(tt, ((bw - tt.width) // 2, (70 - tt.height) // 2 + 2))
    hi = icon('house', 92, NAVY)
    board.alpha_composite(hi, ((bw - hi.width) // 2, 70 + (bh - 70 - hi.height) // 2))
    bx, by = int(hx - bw / 2), int(hy + ch)
    sh = shadow_only(board, 16, (0, 12), 0.38, 40)
    im.alpha_composite(sh, (bx - 40, by - 40))
    im.alpha_composite(board, (bx, by))
    dr = ImageDraw.Draw(im)
    for ex in (bx + 46, bx + bw - 46):
        dr.line((hx, hy, ex, by + 6), fill=(110, 116, 128, 255), width=5)
    dr.ellipse((hx - 11, hy - 11, hx + 11, hy + 11), fill=NAVY + (255,))
    return im


@lru_cache(None)
def map_base():
    w, h, ss = 340, 290, 2
    im = Image.new('RGBA', (w * ss, h * ss), (0, 0, 0, 0))
    inner = Image.new('RGBA', ((w - 24) * ss, (h - 24) * ss), (234, 239, 243, 255))
    dr = ImageDraw.Draw(inner)
    W2, H2 = inner.size
    dr.ellipse((-40 * ss, 150 * ss, 120 * ss, 300 * ss), fill=(196, 228, 196, 255))
    dr.polygon([(190 * ss, 0), (260 * ss, 0), (W2, 90 * ss), (W2, 150 * ss)], fill=(188, 214, 246, 255))
    for (x0, y0, x1, y1, wd, col) in [
        (0, 70, 316, 110, 16, (255, 255, 255)), (0, 200, 316, 175, 16, (255, 255, 255)),
        (70, 0, 95, 266, 16, (255, 255, 255)), (230, 0, 210, 266, 16, (255, 255, 255)),
        (0, 140, 316, 130, 22, (255, 216, 120)), (150, 0, 160, 266, 22, (255, 216, 120))]:
        dr.line((x0 * ss, y0 * ss, x1 * ss, y1 * ss), fill=col + (255,), width=wd * ss)
    for (x0, y0, x1, y1) in [(110, 20, 140, 55), (180, 160, 200, 190), (250, 190, 290, 240), (20, 15, 55, 50)]:
        dr.rounded_rectangle((x0 * ss, y0 * ss, x1 * ss, y1 * ss), 4 * ss, fill=(214, 220, 228, 255))
    inner.putalpha(rrect_mask(W2, H2, 20 * ss, 1))
    im.alpha_composite(inner, (12 * ss, 12 * ss))
    return im.resize((w, h), Image.LANCZOS)


@lru_cache(None)
def skyline(side):
    w, h = 400, 600
    rng = np.random.default_rng(7 if side == 'L' else 11)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    x = 0 if side == 'L' else 10
    while x < w:
        bw = int(rng.integers(52, 98)); bh = int(rng.integers(190, 470))
        if side == 'R' and 230 < x < 330:
            x += 6
            continue
        col = NAVY if rng.random() < 0.5 else (26, 46, 92)
        dr.rectangle((x, h - bh, x + bw - 5, h), fill=col + (255,))
        for yy in range(h - bh + 16, h - 12, 26):
            for xx in range(x + 10, x + bw - 16, 18):
                if rng.random() < 0.33:
                    dr.rectangle((xx, yy, xx + 7, yy + 11), fill=GOLD_L + (255,))
        x += bw
    if side == 'R':   # minaret silhouette
        mx = 262
        dr.rectangle((mx, 70, mx + 54, h), fill=NAVY2 + (255,))
        for yy in range(110, h - 40, 70):
            dr.rectangle((mx + 8, yy, mx + 46, yy + 6), fill=GOLD + (255,))
            dr.rounded_rectangle((mx + 20, yy + 18, mx + 34, yy + 44), 6, fill=GOLD_L + (255,))
        dr.rectangle((mx + 10, 30, mx + 44, 70), fill=NAVY2 + (255,))
        dr.rectangle((mx + 4, 64, mx + 50, 72), fill=GOLD + (255,))
        dr.line((mx + 27, 0, mx + 27, 30), fill=GOLD + (255,), width=4)
        for k in range(3):
            dr.ellipse((mx + 21, 4 + k * 9, mx + 33, 13 + k * 9), fill=GOLD + (255,))
    return im


@lru_cache(None)
def button_spr(clicked):
    w, h = 560, 132
    if not clicked:
        g = np.zeros((h, w, 3), np.float32)
        xs = np.linspace(0, 1, w)[None, :, None]
        g[:] = np.array([46, 92, 255]) * (1 - xs) + np.array([132, 58, 245]) * xs
        im = Image.fromarray(g.astype(np.uint8)).convert('RGBA')
        im.putalpha(rrect_mask(w, h, h // 2))
        ic = icon('user-plus', 54, WHITE)
        tt = text("S'ABONNER", PBL, 50, WHITE)
    else:
        im = solid((w, h), WHITE, rrect_mask(w, h, h // 2))
        ic = icon('circle-check', 56, GREEN)
        tt = text('ABONNÉ', PBL, 50, NAVY)
    tot = ic.width + 22 + tt.width
    x0 = (w - tot) // 2
    im.alpha_composite(ic, (x0, (h - ic.height) // 2))
    im.alpha_composite(tt, (x0 + ic.width + 22, (h - tt.height) // 2 + 3))
    return with_shadow(im, 18, (0, 14), 0.4, 50)


@lru_cache(None)
def cursor_spr():
    return with_shadow(icon('hand-pointer', 112, WHITE, 6, NAVY), 10, (0, 8), 0.35, 30)


@lru_cache(None)
def trophy_spr():
    return glow(icon('trophy', 168, GOLD_L, 6, NAVY), 16, (255, 240, 200), 0.9, 40)


@lru_cache(None)
def bulb_spr():
    return icon('lightbulb', 190, GOLD_L, 7, NAVY)


@lru_cache(None)
def pill(txt, color, ic=None, size=28):
    tt = text(txt, PXB, size, WHITE)
    icw = 0
    if ic:
        ii = icon(ic, int(size * 0.9), WHITE); icw = ii.width + 10
    w, h = tt.width + icw + 36, int(size * 1.75)
    im = solid((w, h), color, rrect_mask(w, h, h // 2))
    if ic:
        im.alpha_composite(ii, (18, (h - ii.height) // 2))
    im.alpha_composite(tt, (18 + icw, (h - tt.height) // 2 + 1))
    return im


# ================================================================ content renderers (cards)
CL_ROWS = [('tag', 'Budget', 13.55, 14.40), ('location-dot', 'Quartier', 15.02, 15.40),
           ('ruler-combined', 'Surface', 16.05, 16.42), ('file-contract', 'Documents', 17.30, 18.66)]


def checklist_content(t, w=344, h=372):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for k, (ic, lab, ta, tc) in enumerate(CL_ROWS):
        pa = lin(t, ta, ta + 0.35)
        if pa <= 0:
            continue
        row = Image.new('RGBA', (w, 84), (0, 0, 0, 0))
        put(row, badge(ic, 62, SKY, BLUE, None, isc=0.45, shadow=False), 26 + 31, 42)
        tt = text(lab, PSB, 34, NAVY)
        paste(row, tt, 100, 42 - tt.height / 2 + 2)
        put(row, checkbox_empty(), w - 48, 42)
        pc = lin(t, tc, tc + 0.3)
        if pc > 0:
            put(row, badge('check', 52, GREEN, WHITE, None, isc=0.5, shadow=False), w - 48, 42, s=eback(pc, 2.4))
        paste(im, mul_alpha(row, eo3(pa)), -60 * (1 - eo3(pa)), 22 + k * 84)
        if k < 3:
            ImageDraw.Draw(im).line((24, 22 + k * 84 + 84, w - 24, 22 + k * 84 + 84), fill=(232, 235, 242, 255), width=2)
    return im


def gauge_content(t, w=344, h=290):
    ss = 2
    im = Image.new('RGBA', (w * ss, h * ss), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    cx, cy, r = w * ss / 2, 212 * ss, 128 * ss
    for a0, a1, col in [(180, 240, (98, 150, 255)), (240, 300, GREEN), (300, 360, RED)]:
        dr.arc((cx - r, cy - r, cx + r, cy + r), a0 + 1.5, a1 - 1.5, fill=col + (255,), width=34 * ss)
    tt = t - 13.65
    th = 340 if tt < 0 else 270 + 70 * math.exp(-4.2 * tt) * math.cos(10 * tt)
    rad = math.radians(th); Ln = r - 30 * ss
    dr.line((cx, cy, cx + Ln * math.cos(rad), cy + Ln * math.sin(rad)), fill=NAVY + (255,), width=11 * ss)
    dr.ellipse((cx - 19 * ss, cy - 19 * ss, cx + 19 * ss, cy + 19 * ss), fill=NAVY + (255,))
    dr.ellipse((cx - 7 * ss, cy - 7 * ss, cx + 7 * ss, cy + 7 * ss), fill=GOLD + (255,))
    im = im.resize((w, h), Image.LANCZOS)
    ttl = text('DH / m²', PXB, 30, GREY)
    paste(im, ttl, (w - ttl.width) / 2, 20)
    for lab, x in (('BAS', 40), ('CHER', w - 40)):
        tl = text(lab, PSB, 20, GREY)
        paste(im, tl, x - tl.width / 2, 228)
    pj = lin(t, 14.36, 14.62)
    if pj > 0:
        put(im, pill('JUSTE', GREEN, 'check', 26), w / 2, 262, s=eback(pj, 2.2))
    return im


def map_content(t, w=344, h=290):
    im = map_base().copy()
    if im.size != (w, h):
        im = im.resize((w, h))
    tp = 15.12
    p = lin(t, tp, tp + 0.6)
    bx, by = w / 2, 150
    if t > tp + 0.35:
        for k in range(2):
            rr = ((t - (tp + 0.35) - k * 0.45) % 0.9) / 0.9
            if t - (tp + 0.35) - k * 0.45 < 0:
                continue
            rg = ring(14 + 70 * rr, 5, RED, (1 - rr) * 0.8)
            put(im, rg, bx, by + 6, sy=0.42)
    if p > 0:
        py = lerp(-70, by - 38, ebounce(p))
        put(im, icon('location-dot', 78, RED, 4, WHITE), bx, py)
    for ic, (x, y), ta in [('school', (64, 70), 15.62), ('train-subway', (280, 76), 15.78),
                           ('cart-shopping', (66, 222), 15.94), ('tree', (278, 224), 16.1)]:
        pa = lin(t, ta, ta + 0.3)
        if pa > 0:
            put(im, badge(ic, 54, WHITE, NAVY, BLUE, 3, 0.44, True), x, y, s=eback(pa, 2.2))
    return im


def docs_content(t, w=344, h=300):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    put(im, icon('file-lines', 150, NAVY), w / 2 - 10, h / 2)
    done = lin(t, 18.66, 18.9)
    ang = 2 * math.pi * 0.85 * (t - 17.4)
    mx, my = w / 2 + 62 * math.cos(ang), h / 2 + 44 * math.sin(ang)
    put(im, icon('magnifying-glass', 92, BLUE, 5, WHITE), mx, my, a=1 - done)
    if done > 0:
        put(im, badge('check', 86, GREEN, WHITE, WHITE, 4, 0.5, True), w / 2 + 70, h / 2 + 64, s=eback(done, 2.4))
    return im


def chart_content(t, w=344, h=300):
    ss = 2
    im = Image.new('RGBA', (w * ss, h * ss), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    base = 262 * ss; x0 = 44 * ss; bw = 40 * ss; gap = 15 * ss
    hs = [0.30, 0.47, 0.40, 0.66, 0.90]
    tops = []
    for i, hh in enumerate(hs):
        p = lin(t, 21.78 + i * 0.12, 21.78 + i * 0.12 + 0.4)
        H = max(0.0, 168 * ss * hh * eback(p, 1.6))
        x = x0 + i * (bw + gap)
        col = GOLD if i == 4 else NAVY2
        if H > 2:
            dr.rounded_rectangle((x, base - H, x + bw, base), 8 * ss, fill=col + (255,))
        tops.append((x + bw / 2, base - 168 * ss * hh - 18 * ss))
    dr.line((30 * ss, base + 2 * ss, w * ss - 30 * ss, base + 2 * ss), fill=(210, 214, 224, 255), width=3 * ss)
    q = lin(t, 22.35, 22.8)
    if q > 0:
        n = len(tops) - 1
        seg = q * n
        pts = [tops[0]]
        for i in range(n):
            if seg >= i + 1:
                pts.append(tops[i + 1])
            elif seg > i:
                f_ = seg - i
                pts.append((lerp(tops[i][0], tops[i + 1][0], f_), lerp(tops[i][1], tops[i + 1][1], f_)))
        dr.line(pts, fill=GREEN + (255,), width=6 * ss, joint='curve')
        for pnt in pts[:-1]:
            dr.ellipse((pnt[0] - 6 * ss, pnt[1] - 6 * ss, pnt[0] + 6 * ss, pnt[1] + 6 * ss), fill=GREEN + (255,))
    im = im.resize((w, h), Image.LANCZOS)
    tl = text('MARCHÉ', PXB, 26, GREY)
    paste(im, tl, 26, 18)
    pa = lin(t, 22.78, 23.0)
    if pa > 0:
        put(im, icon('arrow-trend-up', 50, GREEN), w - 52, 36, s=eback(pa, 2.2))
    return im


def coins_content(t, w=344, h=300):
    ss = 2
    im = Image.new('RGBA', (w * ss, h * ss), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    stacks = [(78, 3, 34.30), (172, 5, 34.55), (266, 8, 34.85)]
    for (x, n, ts) in stacks:
        for k in range(n):
            tk = ts + k * 0.06
            p = lin(t, tk, tk + 0.22)
            if p <= 0:
                continue
            y = 250 - k * 15 - (1 - eo3(p)) * 60
            X, Y = x * ss, y * ss
            rw, rh = 34 * ss, 11 * ss
            dr.ellipse((X - rw, Y - rh + 5 * ss, X + rw, Y + rh + 5 * ss), fill=(170, 120, 30, 255))
            dr.rectangle((X - rw, Y, X + rw, Y + 5 * ss), fill=(170, 120, 30, 255))
            dr.ellipse((X - rw, Y - rh, X + rw, Y + rh), fill=GOLD + (255,))
            dr.ellipse((X - rw * 0.7, Y - rh * 0.7, X + rw * 0.7, Y + rh * 0.7), fill=GOLD_L + (255,))
    im = im.resize((w, h), Image.LANCZOS)
    tl = text('PATRIMOINE', PXB, 26, GREY)
    paste(im, tl, 26, 18)
    pa = lin(t, 35.2, 35.45)
    if pa > 0:
        put(im, icon('arrow-trend-up', 64, GREEN), w - 60, 70, s=eback(pa, 2.2))
    return im


def timeline_content(t, w=320, h=220):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    tl = text('PARCOURS', PXB, 26, GREY)
    paste(im, tl, 26, 18)
    v = 8 * eio(lin(t, 29.62, 30.16))
    x0, x1, y = 40, w - 40, 118
    ss = 2
    ln = Image.new('RGBA', (w * ss, h * ss), (0, 0, 0, 0))
    dr = ImageDraw.Draw(ln)
    dr.line((x0 * ss, y * ss, x1 * ss, y * ss), fill=(222, 226, 234, 255), width=10 * ss)
    xp = lerp(x0, x1, v / 8)
    dr.line((x0 * ss, y * ss, xp * ss, y * ss), fill=GOLD + (255,), width=10 * ss)
    for k in range(9):
        x = lerp(x0, x1, k / 8)
        on = v >= k - 0.02
        r = 11 if on else 8
        dr.ellipse(((x - r) * ss, (y - r) * ss, (x + r) * ss, (y + r) * ss),
                   fill=(GOLD if on else (205, 210, 222)) + (255,))
    im.alpha_composite(ln.resize((w, h), Image.LANCZOS))
    for lab, x in (('2018', x0), ('2026', x1)):
        tt = text(lab, PXB, 26, NAVY)
        paste(im, tt, x - tt.width / 2, 150)
    put(im, soft_glow(80, GOLD_L, 0.9), xp, y)
    return im


# ================================================================ timeline elements (main)
def el_open(c):
    t = c.t
    banner(c, 0.15, 2.66, 'ACHAT VENTE', 'white', parts=[('ACHAT', 205), ('VENTE', 800)], stagger=0.05)
    if 0.12 <= t <= 2.82:
        L = c.L('bg')
        for k, (lab, idx, bx, href, rot0, dl) in enumerate([(GH, 0, 200, 108, -6, 0.0), (RH, 1, 880, 864, 6, 0.1)]):
            p = lin(t, 0.12 + dl, 0.12 + dl + 0.55); q = lin(t, 2.52, 2.82)
            if p <= 0:
                continue
            h = hand(c, lab)
            hx = h[0] if h else href
            x = bx + 0.3 * (hx - href)
            y = 880 - 380 * eback(p, 1.25) + 420 * ei3(q) + 7 * math.sin(2 * math.pi * 0.8 * t + k)
            rot = rot0 + 2.5 * math.sin(2 * math.pi * 0.55 * t + k * 1.7)
            put(L, card(idx, 300), x, y, rot=rot, a=min(1, p * 4))
        Fl = c.L('fg')
        for k, (lab, href, ts) in enumerate([(GH, (110, 960), 0.12), (RH, (864, 960), 0.22)]):
            h = hand(c, lab) or href
            BURSTS[f'open{k}'].draw(Fl, t - ts, h[0], h[1] - 70)


def el_savoir(c):
    banner(c, 2.80, 4.36, 'À SAVOIR', 'navy', 'circle-exclamation', anim='split')


def el_arnaque(c):
    t = c.t
    banner(c, 4.40, 5.18, 'ARNAQUE', 'red', 'triangle-exclamation', anim='slam')
    if 4.40 <= t <= 5.18:
        c.redvig = 0.55 * (1 - lin(t, 4.40, 5.0))
        L = c.L('bg')
        q = lin(t, 5.02, 5.18)
        for k, (x, y) in enumerate([(185, 560), (895, 545)]):
            pk = lin(t, 4.44 + 0.05 * k, 4.74 + 0.05 * k)
            pulse = 1 + 0.07 * math.sin(2 * math.pi * 3.2 * t + k)
            put(L, warn_spr(), x, y, s=eback(pk, 2) * pulse * (1 - q), a=pk, rot=(-8 if k == 0 else 8))


CAR = [(5.25, 2, 190, 455, -6), (5.55, 1, 890, 445, 6), (6.62, 0, 215, 545, 5), (7.05, 3, 865, 535, -5)]


def el_carousel(c):
    t = c.t
    if not (5.25 <= t <= 8.75):
        return
    L = c.L('bg')
    for k, (ts, idx, ex, ey, er) in enumerate(CAR):
        if t < ts:
            continue
        x, y, p = from_head(t, ts, ex, ey, 0.5)
        rot = er * eo3(p)
        if t >= 7.76:
            d = math.exp(-6 * (t - 7.76))
            x += 12 * d * math.sin(2 * math.pi * 11 * (t - 7.76) + k)
        if t >= 8.14:
            tf = t - 8.14 - k * 0.03
            if tf > 0:
                y += 2600 * tf * tf
                rot += (-50 if ex < 540 else 50) * tf
        put(L, card(idx, 300), x, y, rot=rot, a=min(1, p * 5))
    if 7.76 <= t <= 8.45:
        p = lin(t, 7.76, 7.92); q = lin(t, 8.12, 8.4)
        for k, (x, y) in enumerate([(205, 500), (878, 490)]):
            put(L, xmark_spr(), x, y + 500 * q * q, s=1.6 - 0.6 * eo3(p), a=min(1, p * 3) * (1 - q), rot=-6 + 12 * k)
    banner(c, 7.76, 8.42, 'INSUFFISANT', 'red', 'xmark', anim='slam')


def palm_item_pos(h, dx=20, lift=270, ymax=960):
    return clamp(h[0] + dx, 135, 945), min(h[1] - lift, ymax)


def sparkle_trail(L, t, a, b, n=7, alpha=1.0, seed=0):
    for k in range(n):
        ph = (t * 0.95 + k / n + seed * 0.37) % 1.0
        x = lerp(a[0], b[0], ph) + 14 * math.sin(ph * 9 + k)
        y = lerp(a[1], b[1], ph)
        put(L, sparkle(48), x, y, s=0.32 + 0.18 * math.sin(math.pi * ph), a=math.sin(math.pi * ph) * alpha, rot=ph * 180)


def el_palm(c):
    t = c.t
    if not (8.36 <= t <= 13.2):
        return
    Fl = c.L('fg')
    gh = hand(c, GH) or (250, 1290)
    rh = hand(c, RH) or (760, 1150)
    hx, hy = palm_item_pos(gh)
    bob = 7 * math.sin(2 * math.pi * 0.9 * t)
    # key on right palm, flies into the house at 9.62
    if 8.50 <= t <= 9.98:
        kx, ky = palm_item_pos(rh, 0)
        p = lin(t, 8.50, 8.85)
        fq = lin(t, 9.62, 9.95)
        x = lerp(lerp(rh[0], kx, eo3(p)), hx, eio(fq)); y = lerp(lerp(rh[1] - 60, ky, eo3(p)), hy, eio(fq))
        put(Fl, soft_glow(260), x, y + bob, a=0.8 * p * (1 - fq))
        put(Fl, badge('key', 150, GOLD, NAVY, WHITE, 6, 0.46), x, y + bob, s=eback(p, 1.8) * (1 - 0.6 * fq), a=1 - fq ** 4,
            rot=8 * math.sin(2 * math.pi * 0.7 * t))
        if fq <= 0:
            sparkle_trail(Fl, t, (rh[0], rh[1] - 40), (x, y + 60), alpha=p, seed=1)
        BURSTS['key'].draw(Fl, t - 8.50, rh[0], rh[1] - 60)
    # house badge on gesture palm -> flips into a photo card at 10.12
    p = lin(t, 8.40, 8.78)
    flip1 = lin(t, 10.12, 10.27); flip2 = lin(t, 10.27, 10.44)
    nope = t - 12.68
    exitq = lin(t, 12.95, 13.18)
    x, y = hx, hy + bob
    if t < 12.95:
        sparkle_trail(Fl, t, (gh[0], gh[1] - 40), (x, y + 70), alpha=p * (1 - lin(t, 12.6, 12.9)))
    if t < 10.27:
        put(Fl, soft_glow(300), x, y, a=0.85 * p)
        pulse = 1 + 0.15 * math.sin(math.pi * lin(t, 9.92, 10.12))
        put(Fl, badge('house', 170, NAVY, GOLD_L, GOLD, 7, 0.46), x, y, s=eback(p, 1.8) * pulse, sx=1 - flip1)
        BURSTS['house'].draw(Fl, t - 8.40, gh[0], gh[1] - 60)
        BURSTS['merge'].draw(Fl, t - 9.94, x, y)
    else:
        rot = 0.0
        if nope > 0:
            rot = 9 * math.exp(-5 * nope) * math.sin(2 * math.pi * 4.5 * nope)
        cx_, cy_ = lerp(x, gh[0], ei3(exitq)), lerp(y, gh[1] - 40, ei3(exitq))
        sc = 1 - exitq
        put(Fl, card(3, 330), cx_, cy_, sx=eo3(flip2) if t < 10.44 else 1, s=sc, rot=rot)
        ph = lin(t, 11.72, 11.98)
        if ph > 0:
            gray = lin(t, 12.68, 12.85)
            hb = badge('heart', 92, (236, 50, 80) if gray < 0.5 else (170, 170, 178), WHITE, WHITE, 5, 0.5)
            put(Fl, hb, cx_ + 136 * sc, cy_ - 104 * sc, s=eback(ph, 2.6) * sc)
            BURSTS['heart'].draw(Fl, t - 11.72, cx_ + 136, cy_ - 104)
    banner(c, 11.62, 12.95, 'COUP DE CŒUR ?', 'gold', 'heart')


def el_check(c):
    t = c.t
    banner(c, 13.40, 19.98, 'CHECK-LIST', 'white', 'circle-check', anim='split')
    if not (13.42 <= t <= 20.1):
        return
    L = c.L('bg')
    # left: checklist card slides out from behind the head
    x, y, p = from_head(t, 13.42, 205, 505, 0.5)
    x, y, q = to_head(t, 20.05, x, y, 0.28) if t > 19.77 else (x, y, 0)
    nf = sum(eo3(lin(t, r[2], r[2] + 0.35)) for r in CL_ROWS)
    chh = max(128, int((44 + 84 * nf) / 4) * 4)
    cont = checklist_content(t).crop((0, 0, 344, chh))
    put_card(L, 344, chh, x, y - 186 + chh / 2, s=0.6 + 0.4 * eo3(p), a=min(1, p * 4), content=cont)
    ps = lin(t, 19.38, 19.56)
    if 19.38 <= t <= 20.05:
        put(L, stamp_spr(), x + 6, y + 40, s=1.8 - 0.8 * eo3(ps), a=min(1, ps * 3) * (1 - q), rot=-12)
        BURSTS['stamp'].draw(L, t - 19.5, x + 6, y + 40)
    # right: gauge -> map -> documents
    if 13.45 <= t <= 15.12:
        x, y, p = from_head(t, 13.45, 866, 490, 0.5)
        if t > 14.84:
            x, y, q = to_head(t, 15.12, x, y)
        put_card(L, 344, 290, x, y, s=0.6 + 0.4 * eo3(p), a=min(1, p * 4), content=gauge_content(t))
    if 15.0 <= t <= 17.3:
        x, y, p = from_head(t, 15.0, 866, 490, 0.45)
        if t > 17.02:
            x, y, q = to_head(t, 17.3, x, y)
        put_card(L, 344, 290, x, y, s=0.6 + 0.4 * eo3(p), a=min(1, p * 4), content=map_content(t))
    if 17.25 <= t <= 20.08:
        x, y, p = from_head(t, 17.25, 866, 495, 0.45)
        if t > 19.8:
            x, y, q = to_head(t, 20.08, x, y)
        put_card(L, 344, 300, x, y, s=0.6 + 0.4 * eo3(p), a=min(1, p * 4), content=docs_content(t))


def el_vendre(c):
    t = c.t
    banner(c, 20.10, 21.58, 'VENDEURS', 'navy', 'key')
    if not (20.18 <= t <= 21.66):
        return
    L = c.L('bg')
    ta = 20.30
    p = lin(t, 20.18, ta + 0.08)
    hy = lerp(-420, 318, eo3(p))
    q = lin(t, 21.42, 21.66)
    hy -= 760 * ei3(q)
    ang = 0.0
    if t > ta:
        ang = 17 * math.exp(-2.3 * (t - ta)) * math.sin(7.5 * (t - ta))
    # wall bracket
    br = solid((250, 16), NAVY, rrect_mask(250, 16, 6))
    put(L, br, 92, hy - 8, a=min(1, p * 3))
    put(L, sign_spr(), 205, hy, rot=ang)


def el_estim(c):
    t = c.t
    banner(c, 21.64, 23.06, 'ESTIMATION', 'white', 'chart-line', anim='split')
    if not (21.66 <= t <= 23.12):
        return
    L = c.L('bg')
    x, y, p = from_head(t, 21.66, 866, 495, 0.45)
    if t > 22.84:
        x, y, q = to_head(t, 23.12, x, y)
    put_card(L, 344, 300, x, y, s=0.6 + 0.4 * eo3(p), a=min(1, p * 4), content=chart_content(t))


FAN = [(23.22, 0, 185, 455, -9), (23.32, 1, 895, 455, 9), (23.42, 2, 228, 525, 5), (23.52, 3, 852, 525, -5)]


def el_staging(c):
    t = c.t
    banner(c, 23.18, 24.78, 'HOME STAGING', 'white', 'camera')
    banner_stars(c, 24.86, 26.82)
    if not (23.22 <= t <= 26.9):
        return
    L = c.L('bg')
    gh = hand(c, GH) or (162, 960)
    for k, (ts, idx, ex, ey, er) in enumerate(FAN):
        x, y, p = from_head(t, ts, ex, ey, 0.5)
        if ex < 540:
            x += 0.12 * (gh[0] - 162)
        y += 6 * math.sin(2 * math.pi * 0.7 * t + k)
        rot = er * eo3(p) + 1.5 * math.sin(2 * math.pi * 0.5 * t + k)
        if t > 26.58:
            x, y, q = to_head(t, 26.9 - (3 - k) * 0.03, x, y, 0.3)
        put(L, card(idx, 290), x, y, rot=rot, a=min(1, p * 5))


def el_casa(c):
    t = c.t
    if 27.66 <= t <= 29.58:
        L = c.L('bg')
        for side, x, ts in (('L', 200, 27.68), ('R', 880, 27.82)):
            p = lin(t, ts, ts + 0.6)
            q = lin(t, 29.32, 29.58)
            yb = 905 + 620 * (1 - eo3(p)) + 620 * ei3(q)
            put(L, skyline(side), x, yb - 300)
    banner(c, 28.40, 29.42, 'CASABLANCA', 'navy', 'location-dot', anim='split')


def el_years(c):
    t = c.t
    banner_years(c, 29.45, 31.86)
    if 29.50 <= t <= 31.88:
        L = c.L('bg')
        x, y, p = from_head(t, 29.50, 880, 440, 0.45)
        if t > 31.6:
            x, y, q = to_head(t, 31.88, x, y)
        put_card(L, 320, 220, x, y, s=0.6 + 0.4 * eo3(p), a=min(1, p * 4), content=timeline_content(t))
    if 30.12 <= t <= 31.86:
        Fl = c.L('fg')
        gh = hand(c, GH) or (240, 1056)
        x, y = palm_item_pos(gh, 30, 290, 880)
        p = lin(t, 30.12, 30.45); q = lin(t, 31.6, 31.86)
        y += 6 * math.sin(2 * math.pi * 0.9 * t)
        put(Fl, rays(440), x, y, rot=t * 40, a=p * (1 - q) * 0.9, s=0.9)
        put(Fl, soft_glow(320), x, y, a=p * (1 - q))
        put(Fl, trophy_spr(), x, y, s=eback(p, 2.0) * (1 - q))
        BURSTS['trophy'].draw(Fl, t - 30.16, x, y - 20)
        BURSTS['trophy_s'].draw(Fl, t - 30.14, x, y)


def el_secret(c):
    t = c.t
    banner(c, 31.94, 34.10, 'LES SECRETS', 'navy', 'lock', anim='split')
    if not (31.98 <= t <= 34.14):
        return
    L = c.L('bg')
    x, y, p = from_head(t, 31.98, 870, 480, 0.45)
    rot = 0
    if 33.0 <= t < 33.45:
        rot = 10 * math.sin(2 * math.pi * 9 * (t - 33.0))
    opened = t >= 33.45
    po = lin(t, 33.45, 33.8)
    q = lin(t, 33.94, 34.14)
    if opened:
        put(L, rays(520), x, y, rot=t * 35, a=po * (1 - q))
        put(L, soft_glow(380), x, y, a=po * (1 - q))
    spr = badge('lock-open' if opened else 'lock', 230, NAVY, GOLD_L, GOLD, 8, 0.44)
    s = (0.6 + 0.4 * eo3(p)) * (1 + 0.25 * math.sin(math.pi * po)) * (1 - q)
    put(L, spr, x, y, s=s, rot=rot, a=min(1, p * 4))
    BURSTS['lock'].draw(L, t - 33.46, x, y)


def el_invest(c):
    t = c.t
    banner(c, 34.18, 36.26, 'INVESTISSEMENT', 'white')
    if 34.20 <= t <= 36.32:
        L = c.L('bg')
        x, y, p = from_head(t, 34.20, 866, 495, 0.45)
        if t > 36.04:
            x, y, q = to_head(t, 36.32, x, y)
        put_card(L, 344, 300, x, y, s=0.6 + 0.4 * eo3(p), a=min(1, p * 4), content=coins_content(t))
    if 35.0 <= t <= 36.3:
        L = c.L('bg')
        x, y, p = from_head(t, 35.0, 205, 490, 0.45)
        if t > 36.02:
            x, y, q = to_head(t, 36.3, x, y)
        put(L, badge('scale-balanced', 210, NAVY, GOLD_L, GOLD, 8, 0.48), x, y, s=0.6 + 0.4 * eo3(p),
            rot=7 * math.sin(2 * math.pi * 0.9 * (t - 35.0)), a=min(1, p * 4))


FLICK = [0, 1, 0.15, 1, 0.35, 1, 1]


def el_conf(c):
    t = c.t
    banner(c, 36.38, 38.96, 'CONFIANCE', 'white', 'shield-halved', anim='split')
    if 36.42 <= t <= 38.98:
        L = c.L('bg')
        x, y, p = from_head(t, 36.42, 870, 480, 0.45)
        q = lin(t, 38.72, 38.98)
        on = FLICK[min(len(FLICK) - 1, int(max(0, t - 36.5) / 0.05))] if t < 36.85 else 1.0
        on *= lin(t, 36.5, 36.5001)
        puls = 1 + 0.05 * math.sin(2 * math.pi * 1.2 * t)
        put(L, rays(480, 16), x, y - 10, rot=-t * 25, a=on * (1 - q) * 0.95)
        put(L, soft_glow(400, (255, 236, 160)), x, y - 10, a=on * (1 - q), s=puls)
        put(L, bulb_spr(), x, y, s=(0.6 + 0.4 * eo3(p)) * (1 - q), a=min(1, p * 4))
        if t >= 36.5:
            BURSTS['bulb'].draw(L, t - 36.55, x, y - 20)
    if 37.98 <= t <= 38.75:
        Fl = c.L('fg')
        tip = hand(c, GH, 'tip')
        if tip is None:
            tip = hand(c, GH) or (300, 1150)
        for k in range(3):
            tr = t - 38.0 - k * 0.12
            if 0 <= tr <= 0.55:
                pr = tr / 0.55
                put(Fl, ring(18 + 170 * eo3(pr), 9 * (1 - pr) + 2, WHITE, (1 - pr) * 0.95), tip[0], tip[1])
        BURSTS['tip'].draw(Fl, t - 38.0, tip[0], tip[1])


def el_follow(c):
    t = c.t
    if not (39.52 <= t <= 41.95):
        return
    Fl = c.L('fg')
    cx, cy = 540, 1500
    p = lin(t, 39.55, 39.92); q = lin(t, 41.66, 41.92)
    clicked = t >= 40.52
    press = 1 - 0.1 * math.sin(math.pi * lin(t, 40.44, 40.62))
    s = eback(p, 1.8) * press * (1 - q)
    put(Fl, button_spr(clicked), cx, cy, s=s)
    if 40.5 <= t <= 41.1:
        pr = lin(t, 40.5, 41.1)
        put(Fl, ring(60 + 260 * eo3(pr), 8 * (1 - pr) + 2, WHITE, (1 - pr) * 0.9), cx + 80, cy, sy=0.45)
    if 40.0 <= t <= 41.1:
        mv = eio(lin(t, 40.0, 40.42))
        px = lerp(940, 650, mv); py = lerp(1830, 1545, mv)
        cs = 1 - 0.14 * math.sin(math.pi * lin(t, 40.44, 40.62))
        ca = min(1, lin(t, 40.0, 40.12) * 2) * (1 - lin(t, 40.9, 41.1))
        put(Fl, cursor_spr(), px + 20, py + 40, s=cs, a=ca)
    pb = lin(t, 40.6, 40.9)
    if pb > 0:
        tr = t - 40.6
        rot = 22 * math.exp(-2.2 * tr) * math.sin(2 * math.pi * 6 * tr)
        put(Fl, badge('bell', 124, GOLD, NAVY, WHITE, 6, 0.48), cx + 350, cy - 6, s=eback(pb, 2.2) * (1 - q), rot=rot)
    BURSTS['follow'].draw(Fl, t - 40.55, cx, cy - 60)


def el_end(c):
    t = c.t
    banner(c, 41.70, 43.52, 'ACHAT • VENTE • CONSEILS', 'navy', t_out=0.01)
    if 41.74 <= t <= 43.52:
        L = c.L('bg')
        for k, (idx, bx, rot0, dl) in enumerate([(2, 200, -6, 0.0), (3, 880, 6, 0.1)]):
            p = lin(t, 41.74 + dl, 41.74 + dl + 0.55)
            if p <= 0:
                continue
            y = 880 - 380 * eback(p, 1.25) + 7 * math.sin(2 * math.pi * 0.8 * t + k)
            rot = rot0 + 2.5 * math.sin(2 * math.pi * 0.55 * t + k * 1.7)
            put(L, card(idx, 300), bx, y, rot=rot, a=min(1, p * 4))


MAIN_ELEMENTS = [el_open, el_savoir, el_arnaque, el_carousel, el_palm, el_check, el_vendre, el_estim,
                 el_staging, el_casa, el_years, el_secret, el_invest, el_conf, el_follow, el_end]


def el_hook(c):
    h = c.t
    c.dark = 1.0
    L = c.L('bg')
    p = lin(h, 0.0, 0.18)
    flick = [1, 0.3, 1, 1, 0.5, 1][min(5, int(h / 0.04))] if h < 0.24 else 1
    put(L, hook_text(), 540, 112, s=1 + 0.35 * (1 - eo3(p)), a=min(1, p * 3) * flick)
    for k, x in enumerate((92, 988)):
        put(L, warn_spr(), x, 108, s=0.5 * eback(lin(h, 0.05, 0.3), 2), a=lin(h, 0.05, 0.2))
    for k, (x, y) in enumerate([(185, 560), (895, 545)]):
        pk = lin(h, 0.12 + 0.06 * k, 0.42 + 0.06 * k)
        pulse = 1 + 0.07 * math.sin(2 * math.pi * 3.2 * h + k)
        put(L, warn_spr(), x, y, s=eback(pk, 2) * pulse, a=pk, rot=(-8 if k == 0 else 8))


# ================================================================ camera
def _ease(name):
    return {'o': eo3, 'i': ei3, 'io': eio, 'l': (lambda x: x)}[name]


CAM_MAIN = [(0.00, 1.12, 'l'), (0.38, 1.0, 'o'),
            (2.72, 1.0, 'l'), (4.36, 1.045, 'io'), (4.40, 1.045, 'l'), (4.52, 1.11, 'o'), (5.10, 1.10, 'l'), (5.42, 1.0, 'io'),
            (8.36, 1.0, 'l'), (10.84, 1.03, 'io'), (11.0, 1.03, 'l'), (13.30, 1.0, 'io'),
            (14.30, 1.0, 'l'), (14.42, 1.055, 'o'), (14.92, 1.055, 'l'), (15.22, 1.0, 'io'),
            (21.62, 1.0, 'l'), (21.74, 1.045, 'o'), (22.95, 1.045, 'l'), (23.18, 1.0, 'io'),
            (27.60, 1.0, 'l'), (29.30, 1.04, 'io'), (30.14, 1.04, 'l'), (30.26, 1.08, 'o'), (31.0, 1.07, 'l'), (31.4, 1.0, 'io'),
            (33.40, 1.0, 'l'), (33.52, 1.08, 'o'), (34.05, 1.08, 'l'), (34.35, 1.0, 'io'),
            (35.0, 1.0, 'l'), (35.12, 1.06, 'o'), (36.15, 1.06, 'l'), (36.42, 1.0, 'io'),
            (38.02, 1.0, 'l'), (38.12, 1.05, 'o'), (38.9, 1.05, 'l'), (39.2, 1.0, 'io'),
            (41.70, 1.0, 'l'), (43.52, 1.04, 'l')]
CAM_HOOK = [(0.0, 1.20, 'l'), (0.22, 1.08, 'o'), (1.28, 1.13, 'l'), (1.48, 1.34, 'i')]
SHAKE_MAIN = [(4.40, 0.45, 14), (7.76, 0.35, 10), (19.42, 0.25, 7), (30.16, 0.3, 7), (33.45, 0.3, 8)]
SHAKE_HOOK = [(0.0, 0.55, 16)]


def cam_scale(keys, t):
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, s0, _), (t1, s1, e) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            return s0 + (s1 - s0) * _ease(e)(lin(t, t0, t1))
    return keys[-1][1]


def camera(seg, t):
    keys, shakes = (CAM_HOOK, SHAKE_HOOK) if seg == 'hook' else (CAM_MAIN, SHAKE_MAIN)
    s = cam_scale(keys, t)
    ox = oy = rot = 0.0
    for (t0, d, amp) in shakes:
        if t0 <= t <= t0 + d:
            k = (1 - (t - t0) / d) ** 2 * amp
            ox += k * (0.6 * math.sin(2 * math.pi * 17 * t + 1.3) + 0.4 * math.sin(2 * math.pi * 29 * t))
            oy += k * (0.6 * math.sin(2 * math.pi * 19 * t + 0.4) + 0.4 * math.sin(2 * math.pi * 31 * t + 2))
            rot += k * 0.05 * math.sin(2 * math.pi * 13 * t)
    s = max(s, 1 + (abs(ox) + abs(oy)) / 380)
    return s, ox, oy, rot


# ================================================================ compositing
yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
_r = np.sqrt(((xx - OW / 2) / (OW / 2)) ** 2 + ((yy - OH * 0.45) / (OH * 0.62)) ** 2)
VIG = (1 - 0.22 * np.clip(_r, 0, 1.6) ** 2.2).astype(np.float32)[..., None]
VIG_RED = (np.clip(_r - 0.35, 0, 1) ** 1.4).astype(np.float32)[..., None]
_rg = np.sqrt(((xx - 540) / 620) ** 2 + ((yy - 420) / 760) ** 2)
DARKBG = (np.array([10, 13, 26], np.float32) + np.clip(1 - _rg, 0, 1)[..., None] ** 1.6 * np.array([165, 18, 30], np.float32)).astype(np.float32)
del yy, xx, _r, _rg
_x = np.arange(256) / 255.0
_c = np.clip(0.5 + (_x - 0.5) * 1.06, 0, 1)
_c = _c + 0.03 * np.sin(np.pi * _c) * (_c - 0.5)
LUT = np.stack([np.clip(_c * 255 * 1.012 + 1, 0, 255), np.clip(_c * 255, 0, 255), np.clip(_c * 255 * 0.985, 0, 255)], -1).astype(np.uint8)


def compose(i):
    seg, sf, tl = FR[i]
    c = Ctx(seg, sf, tl)
    if seg == 'hook':
        el_hook(c)
    else:
        for el in MAIN_ELEMENTS:
            el(c)
    src = np.asarray(FRAMES[sf])
    up = cv2.resize(src, (OW, OH), interpolation=cv2.INTER_LANCZOS4)
    bl = cv2.GaussianBlur(up, (0, 0), 1.1)
    up = cv2.addWeighted(up, 1.38, bl, -0.38, 0)
    upf = up.astype(np.float32)
    al = cv2.resize(np.asarray(ALPHA[sf]), (OW, OH), interpolation=cv2.INTER_LINEAR).astype(np.float32) * (1 / 255)
    if c.dark > 0:
        al = np.power(al, 1.35)
        base = upf * (1 - c.dark) + (upf * 0.15 + DARKBG) * c.dark
    else:
        base = upf.copy()
    if c.bg is not None:
        b = np.asarray(c.bg, dtype=np.float32)
        A = b[..., 3:4] * (1 / 255)
        base += (b[..., :3] - base) * A
    a3 = al[..., None]
    comp = base + (upf - base) * a3
    sm = np.asarray(SUBM[sf])
    band = cv2.resize(sm, (OW, int(sm.shape[0] * K)), interpolation=cv2.INTER_LINEAR).astype(np.float32) * (1 / 255)
    y0 = int(SUB_Y0 * K); y1 = y0 + band.shape[0]
    m = (band * (1 - al[y0:y1]))[..., None]
    comp[y0:y1] += (upf[y0:y1] - comp[y0:y1]) * m
    if c.fg is not None:
        fa = np.asarray(c.fg, dtype=np.float32)
        A2 = fa[..., 3:4] * (1 / 255)
        comp += (fa[..., :3] - comp) * A2
    if c.redvig > 0:
        comp += (np.array([200, 10, 20], np.float32) - comp) * (VIG_RED * c.redvig)
    out = np.clip(comp, 0, 255).astype(np.uint8)
    s, ox, oy, rot = camera(seg, tl)
    if abs(s - 1) > 1e-4 or ox or oy or rot:
        M = cv2.getRotationMatrix2D((540, 360), rot, s)
        M[0, 2] += ox; M[1, 2] += oy
        out = cv2.warpAffine(out, M, (OW, OH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT101)
    return post(seg, tl, out)


def post(seg, tl, img):
    f = img.astype(np.float32)
    flash = 0.0; split = 0
    if seg == 'hook':
        if tl >= 1.28:
            k = lin(tl, 1.28, 1.48) ** 2
            split = int(30 * k); f += 70 * k
            flash = 0.5 * lin(tl, 1.40, 1.46)
        if tl < 0.1:
            flash = max(flash, 0.6 * (1 - tl / 0.1))
    else:
        if tl < 0.16:
            flash = 0.8 * (1 - tl / 0.16)
            split = int(16 * (1 - tl / 0.12)) if tl < 0.12 else 0
    if split > 0:
        f[..., 0] = np.roll(f[..., 0], -split, axis=1)
        f[..., 2] = np.roll(f[..., 2], split, axis=1)
    if flash > 0:
        f += (255 - f) * flash
    f *= VIG
    out = np.clip(f, 0, 255).astype(np.uint8)
    for ch in range(3):
        out[..., ch] = cv2.LUT(out[..., ch], LUT[:, ch])
    return out


def render_range(a, b, path):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OW}x{OH}", "-r", str(FPS),
           "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p",
           "-x264-params", "keyint=50:min-keyint=25", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(a, b):
        p.stdin.write(compose(i).tobytes())
    p.stdin.close(); p.wait()


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "frames":
        out = sys.argv[2]
        for tok in sys.argv[3:]:
            i = int(tok)
            Image.fromarray(compose(i)).save(f"{out}/o_{i:04d}.jpg", quality=88)
    elif mode == "range":
        render_range(int(sys.argv[2]), int(sys.argv[3]), sys.argv[4])
