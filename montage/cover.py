"""Reel cover images (1080x1920) for the Green March 51 video.

usage: cover.py WORK_DIR OUT_DIR
Key content stays inside the centre 3:4 area (y 240..1680) that the profile grid shows.
"""
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gfx import (GOLD, GREEN, RED, WHITE, H, W, blit, font, photo_card, sepia, star_sprite,  # noqa: E402
                 text_pil, text_sprite, to_sprite, Grain, vignette_mask)

WORK, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
P = lambda *a: os.path.join(WORK, *a)  # noqa: E731


def imread(path):
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        img = cv2.cvtColor(np.asarray(Image.open(path).convert("RGB")), cv2.COLOR_RGB2BGR)
    return img


def cover_fit(img, w, h, ux=0.5, uy=0.5):
    ih, iw = img.shape[:2]
    s = max(w / iw, h / ih)
    r = cv2.resize(img, (int(math.ceil(iw * s)), int(math.ceil(ih * s))),
                   interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    x0 = int((r.shape[1] - w) * ux)
    y0 = int((r.shape[0] - h) * uy)
    return r[y0:y0 + h, x0:x0 + w].astype(np.float32)


def rgba_sprite(path):
    im = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32) / 255
    a = im[..., 3:4]
    spr = np.concatenate([im[..., 2::-1] * a, a], axis=2)
    ys, xs = np.where(spr[..., 3] > 0.05)
    return np.ascontiguousarray(spr[ys.min():ys.max() + 1, xs.min():xs.max() + 1])


def logo_badge(width=360):
    lg = rgba_sprite(P("src", "img_logo_new.webp"))
    h = int(lg.shape[0] * (width - 56) / lg.shape[1])
    lg = cv2.resize(lg, (width - 56, h), interpolation=cv2.INTER_AREA)
    bw, bh, pad = width, h + 34, 30
    from PIL import ImageDraw, ImageFilter
    img = Image.new("RGBA", (bw + 2 * pad, bh + 2 * pad), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((pad, pad + 8, pad + bw, pad + bh + 8), radius=bh // 2, fill=(0, 0, 0, 110))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    ImageDraw.Draw(img).rounded_rectangle((pad, pad, pad + bw, pad + bh), radius=bh // 2, fill=(255, 255, 255, 255))
    spr = to_sprite(img)
    reg = spr[pad + 17:pad + 17 + h, pad + 28:pad + 28 + lg.shape[1]]
    reg[:] = lg + reg * (1 - lg[..., 3:4])
    return spr


def ribbon(text, fnt, fill=RED, padx=46, pady=10, skew=0.0):
    t = text_pil(text, fnt, fill=WHITE)
    w, h = t.size[0] + 2 * padx - 12, t.size[1] + 2 * pady - 12
    from PIL import ImageDraw
    img = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    off = int(h * skew)
    d.polygon([(20 + off, 20), (20 + w + off, 20), (20 + w - off, 20 + h), (20 - off, 20 + h)], fill=tuple(fill) + (255,))
    img.alpha_composite(t, (20 + (w - t.size[0]) // 2, 20 + (h - t.size[1]) // 2))
    return to_sprite(img)


def finish(frame, grain_amp=3.0, seed=0):
    g = Grain(n=1, seed=seed)
    frame = g.apply(frame, 0, grain_amp)
    return np.clip(frame, 0, 255).astype(np.uint8)


SH = (0, 10, 16, 0.65)
F_CAIRO = lambda s, w=900: font("Cairo-VF.ttf", s, w)  # noqa: E731
F_RUQAA = lambda s: font("ArefRuqaa-Bold.ttf", s)  # noqa: E731
F_ANTON = lambda s: font("Anton-Regular.ttf", s)  # noqa: E731

hist = imread(P("src", "img_hist_quran.jpg"))
hall = imread(P("blur", "img_hall_flags_blur.jpg"))


# ---------------------------------------------------------------- cover A: 1975 | 2026
def cover_a():
    top = cover_fit(hist, W, 1010, ux=0.42, uy=0.5)
    top = sepia(top, 0.92)
    top = np.clip((top - 128) * 1.12 + 128, 0, 255)
    bottom = cover_fit(hall, W, 1920, uy=0.5)[620:620 + 1010]
    bottom = np.clip((bottom - 128) * 1.06 + 128, 0, 255)
    hsv = cv2.cvtColor(np.clip(bottom, 0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.18, 0, 255)
    bottom = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)

    frame = np.zeros((H, W, 3), np.float32)
    frame[:1010] = top
    frame[910:] = bottom
    # diagonal seam: top photo above the line y = 900 + 120 * x / W
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    seam = 905 + 110 * xx / W
    m_top = np.clip((seam - yy) / 2.0 + 0.5, 0, 1)[..., None]
    top_full = np.zeros_like(frame)
    top_full[:1010] = top
    frame = top_full * m_top + frame * (1 - m_top)
    # darken behind the text zones for contrast
    shade = np.ones((H, 1, 1), np.float32)
    ys = np.arange(H, dtype=np.float32)
    shade[:, 0, 0] = 1 - 0.38 * np.exp(-((ys - 900) / 420) ** 2)
    frame *= shade
    frame *= vignette_mask(0.32)
    # seam line: white with a thin green and red edge
    for off, col, th in ((-9, GREEN, 6), (0, (245, 240, 230), 10), (9, RED, 6)):
        pts = np.array([[0, 905 + off], [W, 1015 + off]], np.int32)
        cv2.line(frame, tuple(pts[0]), tuple(pts[1]), tuple(float(c) for c in col[::-1]), th, cv2.LINE_AA)

    # era tags
    # 1975 above the seam on the left, 2026 below it on the right: 1975 -> 51 -> 2026
    t75 = text_sprite("1975", F_ANTON(100), fill=(250, 236, 205), shadow=SH, rtl=False)
    blit(frame, t75, 44, 790, anchor=(0.0, 0.5), opacity=0.96)
    t26 = text_sprite("2026", F_ANTON(100), fill=WHITE, shadow=SH, rtl=False)
    blit(frame, t26, W - 44, 1112, anchor=(1.0, 0.5), opacity=0.96)

    # title block crossing the seam
    blit(frame, star_sprite(300, 1.0, thickness=22, color=(25, 160, 85)), W / 2, 935, rot=-6, opacity=0.95)
    blit(frame, text_sprite("الذكرى", F_CAIRO(112, 1000), fill=WHITE, shadow=SH), W / 2, 600)
    blit(frame, text_sprite("51", F_ANTON(500), fill=WHITE, shadow=(0, 16, 24, 0.7), rtl=False), W / 2, 930)
    blit(frame, ribbon("للمسيرة الخضراء المظفرة", F_RUQAA(104), skew=0.18), W / 2, 1225)
    blit(frame, text_sprite("نفس العلم • نفس الروح", F_CAIRO(66, 900), fill=WHITE, stroke=3,
                            stroke_fill=(15, 15, 20), shadow=SH), W / 2, 1385)
    blit(frame, logo_badge(380), W / 2, 1515)
    return finish(frame, 3.5, 1)


# ---------------------------------------------------------------- cover B: honour line, full bleed
def cover_b():
    frame = cover_fit(hall, W, H, uy=0.5)
    hsv = cv2.cvtColor(frame.astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.2, 0, 255)
    frame = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
    ys = np.arange(H, dtype=np.float32)[:, None, None]
    # deep green wash over the empty ceiling, fading out above the students
    a = np.clip(1 - (ys - 300) / 700, 0, 1) ** 1.3 * 0.88
    green = np.array([30, 52, 6], np.float32)       # BGR of a deep flag green
    frame = frame * (1 - a) + green * a
    # soft dark band at the bottom for the slogan and logo
    b = np.clip((ys - 1330) / 420, 0, 1) ** 1.5 * 0.7
    frame = frame * (1 - b)
    frame *= vignette_mask(0.28)

    blit(frame, star_sprite(285, 1.0, thickness=20, color=(40, 175, 95)), W / 2, 640, rot=-6, opacity=0.9)
    blit(frame, text_sprite("الذكرى", F_CAIRO(108, 1000), fill=WHITE, shadow=SH), W / 2, 330)
    blit(frame, text_sprite("51", F_ANTON(470), fill=WHITE, shadow=(0, 16, 24, 0.7), rtl=False), W / 2, 640)
    blit(frame, ribbon("للمسيرة الخضراء المظفرة", F_RUQAA(104), skew=0.18), W / 2, 930)
    date = text_sprite("6 نونبر 1975  —  6 نونبر 2026", F_CAIRO(46, 800), fill=(255, 236, 200), shadow=SH)
    blit(frame, date, W / 2, 1060)
    blit(frame, text_sprite("نفس العلم • نفس الروح", F_CAIRO(70, 900), fill=WHITE, stroke=3,
                            stroke_fill=(15, 15, 20), shadow=SH), W / 2, 1470)
    blit(frame, logo_badge(380), W / 2, 1600)
    return finish(frame, 3.0, 2)


for name, fn in (("A_1975-2026", cover_a), ("B_saff-charaf", cover_b)):
    img = fn()
    path = os.path.join(OUT, f"EFH_Marche_Verte_51_cover_{name}.jpg")
    cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print("wrote", path)
