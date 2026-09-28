"""Premium re-edit renderer for the EFH cabin-crew ad."""
import subprocess, sys, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from timeline import *

W, HH = 1080, 1920
SRC = 'src.mp4'
FD = 'fonts/'
CAIRO9, CAIRO7 = FD + 'Cairo-900.ttf', FD + 'Cairo-700.ttf'
MONT = FD + 'Montserrat-800.ttf'
EMOJI = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
GOLD = (255, 193, 40)
NAVY = (14, 42, 105)


# ------------------------------------------------------------ helpers
def ease_out(x):
    x = min(max(x, 0), 1); return 1 - (1 - x) ** 3


def ease_back(x, s=1.7):
    x = min(max(x, 0), 1); x -= 1; return x * x * ((s + 1) * x + s) + 1


def clamp01(x):
    return min(max(x, 0.0), 1.0)


def text_img(txt, font, size, fill=(255, 255, 255), stroke=0, stroke_fill=(0, 0, 0), rtl=False):
    f = ImageFont.truetype(font, size)
    kw = dict(direction='rtl', language='ar') if rtl else {}
    bb = f.getbbox(txt, stroke_width=stroke, **kw)
    w, h = bb[2] - bb[0] + 8, bb[3] - bb[1] + 8
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 - bb[0], 4 - bb[1]), txt, font=f, fill=fill, stroke_width=stroke,
                            stroke_fill=stroke_fill, **kw)
    return im


def emoji_img(e, size):
    f = ImageFont.truetype(EMOJI, 109)
    im = Image.new('RGBA', (140, 140), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4, 4), e, font=f, embedded_color=True)
    im = im.crop(im.getbbox())
    r = size / im.height
    return im.resize((max(1, int(im.width * r)), size), Image.LANCZOS)


def hcat_rtl(parts, gap=14, valign='center'):
    """parts in logical (reading) order; laid out right-to-left."""
    parts = list(reversed(parts))
    h = max(p.height for p in parts)
    w = sum(p.width for p in parts) + gap * (len(parts) - 1)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    x = 0
    for p in parts:
        im.alpha_composite(p, (x, (h - p.height) // 2))
        x += p.width + gap
    return im


def hcat(parts, gap=14):
    return hcat_rtl(list(reversed(parts)), gap)


def shadowed(im, blur=14, off=(0, 6), alpha=0.75, pad=30):
    w, h = im.size
    out = Image.new('RGBA', (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    a = im.split()[3].point(lambda v: int(v * alpha))
    sh = Image.new('RGBA', im.size, (0, 0, 0, 255)); sh.putalpha(a)
    out.alpha_composite(sh, (pad + off[0], pad + off[1]))
    out = out.filter(ImageFilter.GaussianBlur(blur))
    out.alpha_composite(im, (pad, pad))
    return out


def rrect(w, h, r, fill, outline=None, width=0):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=fill, outline=outline, width=width)
    return im


def to_np(im):
    a = np.asarray(im.convert('RGBA')).astype(np.float32) / 255.0
    rgb = a[..., :3][..., ::-1].copy()  # BGR
    return rgb, a[..., 3:4].copy()


class Layer:
    def __init__(self, im):
        self.rgb, self.a = to_np(im)
        self.w, self.h = im.size

    def draw(self, frame, cx, cy, scale=1.0, alpha=1.0):
        if alpha <= 0.003:
            return
        rgb, a = self.rgb, self.a
        if abs(scale - 1) > 1e-3:
            nw, nh = max(1, int(self.w * scale)), max(1, int(self.h * scale))
            rgb = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_LINEAR)
            a = cv2.resize(a, (nw, nh), interpolation=cv2.INTER_LINEAR)[..., None]
        h, w = a.shape[:2]
        x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
        fx0, fy0 = max(0, x0), max(0, y0)
        fx1, fy1 = min(frame.shape[1], x0 + w), min(frame.shape[0], y0 + h)
        if fx1 <= fx0 or fy1 <= fy0:
            return
        sub = frame[fy0:fy1, fx0:fx1]
        aa = a[fy0 - y0:fy1 - y0, fx0 - x0:fx1 - x0] * alpha
        cc = rgb[fy0 - y0:fy1 - y0, fx0 - x0:fx1 - x0]
        frame[fy0:fy1, fx0:fx1] = sub * (1 - aa) + cc * aa


# ------------------------------------------------------------ grade
xs = np.linspace(0, 1, 256)
s = xs * xs * (3 - 2 * xs)
base = xs * 0.72 + s * 0.28
lut_r = np.clip(base * 1.025 + 0.005, 0, 1)
lut_g = np.clip(base, 0, 1)
lut_b = np.clip(base * 0.965 + 0.022 * (1 - xs), 0, 1)
LUT = np.stack([lut_b, lut_g, lut_r], 1).reshape(256, 1, 3)
LUT = (LUT * 255).astype(np.uint8)
yy, xx = np.mgrid[0:HH, 0:W].astype(np.float32)
rr = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - HH * 0.45) / (HH * 0.72)) ** 2)
VIG = (1 - 0.28 * np.clip(rr - 0.35, 0, 1) ** 1.6)[..., None].astype(np.float32)


def grade(bgr_u8):
    x = cv2.LUT(bgr_u8, LUT).astype(np.float32) / 255.0
    luma = x @ np.array([0.114, 0.587, 0.299], np.float32)
    x = luma[..., None] + (x - luma[..., None]) * 1.12
    bl = cv2.GaussianBlur(x, (0, 0), 1.3)
    x = x + (x - bl) * 0.45
    return np.clip(x * VIG, 0, 1)


def zoom(img, z, ax=540, ay=820, dx=0, dy=0):
    if abs(z - 1) < 1e-4 and dx == 0 and dy == 0:
        return img
    M = np.float32([[z, 0, ax - ax * z + dx], [0, z, ay - ay * z + dy]])
    return cv2.warpAffine(img, M, (W, HH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


# ------------------------------------------------------------ source reader
class Reader:
    def __init__(self, start):
        self.start = start
        self.p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{start:.3f}', '-i', SRC, '-an',
                                   '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
        self.idx = -1
        self.cur = None

    def get(self, t):
        want = max(0, int(round((t - self.start) * FPS)))
        if want - self.idx > 90:  # far jump: re-seek
            self.p.kill(); self.__init__(t); want = 0
        while self.idx < want:
            buf = self.p.stdout.read(W * HH * 3)
            if len(buf) < W * HH * 3:
                break
            self.cur = np.frombuffer(buf, np.uint8).reshape(HH, W, 3)
            self.idx += 1
        return self.cur


# ------------------------------------------------------------ zoom schedule
def main_zoom(ts):
    """zoom for main section at source time ts (+ entry overshoot)."""
    z, seg_t0, prev = 1.0, 0.0, 1.0
    for e in ZOOMS:
        if ts < e[0]:
            break
        if e[1] == 'ease':
            prev = z
            k = ease_out((ts - e[0]) / e[3])
            z = prev + (e[2] - prev) * k
            seg_t0 = e[0]
            continue
        prev, z, seg_t0 = z, e[1], e[0]
    dt = ts - seg_t0
    push = 1 + min(dt, 4) * 0.008            # slow drift-in inside each shot
    over = 0.035 * math.exp(-dt * 14) if abs(z - prev) > 0.02 else 0
    return z * push + over


# ------------------------------------------------------------ overlays
def build_layers():
    L = {}
    white = (255, 255, 255)
    st = dict(stroke=3, stroke_fill=(10, 20, 45))
    # hook
    a1 = text_img('حلمك تخدم', CAIRO9, 80, white, rtl=True, **st)
    a2 = text_img('فالطيران؟', CAIRO9, 80, GOLD, rtl=True, **st)
    plane = emoji_img('✈️', 70)
    L['hook1'] = Layer(shadowed(hcat_rtl([a1, a2, plane], gap=18)))
    b = text_img('هادشي خاصك تعرفو', CAIRO9, 54, NAVY, rtl=True)
    down = emoji_img('👇', 54)
    inner = hcat_rtl([b, down], gap=12)
    pill = rrect(inner.width + 64, inner.height + 26, (inner.height + 26) // 2, GOLD + (255,))
    pill.alpha_composite(inner, (32, 13))
    L['hook2'] = Layer(shadowed(pill, blur=10, alpha=0.5))
    # brand chip
    t = text_img('EFH', MONT, 38, GOLD)
    t2 = text_img('MARRAKECH', MONT, 29, white)
    inner = hcat([emoji_img('✈️', 34), t, t2], gap=12)
    chip = rrect(inner.width + 40, inner.height + 22, (inner.height + 22) // 2, (8, 26, 70, 190),
                 outline=(255, 255, 255, 70), width=2)
    chip.alpha_composite(inner, (20, 11))
    L['chip'] = Layer(chip)
    # end card
    logo = Image.open('assets/logo_raw.png').convert('RGBA')
    logo = logo.resize((760, int(760 * logo.height / logo.width)), Image.LANCZOS)
    card = rrect(860, logo.height + 70, 36, (255, 255, 255, 255))
    card.alpha_composite(logo, ((860 - logo.width) // 2, 35))
    L['logo'] = Layer(shadowed(card, blur=22, alpha=0.55, off=(0, 12)))
    L['logo_w'] = card.size
    t1 = text_img('التسجيلات', CAIRO9, 84, white, rtl=True)
    t2 = text_img('مفتوحة', CAIRO9, 84, GOLD, rtl=True)
    t3 = text_img('دابا', CAIRO9, 84, white, rtl=True)
    L['title'] = Layer(shadowed(hcat_rtl([t1, t2, t3], gap=20)))
    sub = text_img('تكوين مضيفات ومضيفي الطيران • مراكش', CAIRO7, 44, (215, 226, 245), rtl=True)
    L['sub'] = Layer(shadowed(sub, blur=8, alpha=0.6))

    def icon(path, size):
        im = Image.open(path).convert('RGBA')
        im = im.crop((4, 4, im.width - 4, im.height - 4)).resize((size, size), Image.LANCZOS)
        m = Image.new('L', (size, size), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), int(size * 0.24), fill=255)
        im.putalpha(m)
        return im

    def row(ic, txt, fsize):
        tx = text_img(txt, MONT, fsize, white)
        inner = hcat([icon(ic, 76), tx], gap=26)
        p = rrect(860, 124, 62, (255, 255, 255, 38), outline=(255, 255, 255, 110), width=3)
        p.alpha_composite(inner, ((860 - inner.width) // 2, (124 - inner.height) // 2))
        return Layer(shadowed(p, blur=16, alpha=0.35))
    L['r1'] = row('assets/wa_raw.png', '07 77 77 13 14', 56)
    L['r2'] = row('assets/wa_raw.png', '07 77 77 17 12', 56)
    L['r3'] = row('assets/ig_raw.png', '@flyhyani.aviation.school', 40)
    cta = text_img('راسلنا دابا فالواتساب', CAIRO9, 50, white, rtl=True)
    L['cta'] = Layer(shadowed(hcat_rtl([cta, emoji_img('💬', 50)], gap=14), blur=8))
    # shimmer band
    band = np.zeros((400, 160, 4), np.uint8)
    for x in range(160):
        v = int(150 * math.exp(-((x - 80) / 34) ** 2))
        band[:, x] = (255, 255, 255, v)
    L['shine'] = Layer(Image.fromarray(band, 'RGBA').rotate(18, expand=True))
    return L


def progress_bar(frame, t):
    p = clamp01(t / TOTAL)
    w = int(W * p)
    frame[0:9, :] = frame[0:9, :] * 0.55
    if w > 0:
        grad = np.linspace(0, 1, w, dtype=np.float32)[None, :, None]
        c1 = np.array([40, 150, 255], np.float32) / 255  # orange (BGR)
        c2 = np.array(GOLD[::-1], np.float32) / 255
        frame[0:9, :w] = c1 * (1 - grad) + c2 * grad


def flash(frame, a):
    if a > 0:
        frame[:] = frame * (1 - a) + a


# ------------------------------------------------------------ main loop
def render(out_path, stills=None):
    L = build_layers()
    hook_r = Reader(HOOK_VID_MIN)
    main_r = Reader(MAIN_SRC[0])
    last_main = None
    end_bg = None
    nframes = int(round(TOTAL * FPS))
    times = [i / FPS for i in range(nframes)]
    enc = None
    if stills is None:
        enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24',
                                '-s', f'{W}x{HH}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264',
                                '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
                                '-profile:v', 'high', '-movflags', '+faststart', out_path],
                               stdin=subprocess.PIPE)
    else:
        want = set(int(round(s * FPS)) for s in stills)
    for i, t in enumerate(times):
        if stills is not None and i > max(want):
            break
        if stills is not None and i not in want:
            continue
        if t < T_MAIN:
            ts = HOOK_SRC[0] + t * SPEED
            src = hook_r.get(max(ts, HOOK_VID_MIN))
            f = grade(src)
            z = 1.30 - 0.22 * ease_out(t / 0.45) + 0.05 * clamp01(t / T_MAIN)
            f = zoom(f, z, 540, 520)
        elif t < T_END:
            ts = (t - T_MAIN) * SPEED + MAIN_SRC[0]
            src = main_r.get(ts)
            last_main = src
            f = grade(src)
            z = main_zoom(ts)
            k = t - T_MAIN
            z += 0.22 * (1 - ease_out(k / 0.35))            # drop punch-in
            dx = dy = 0
            for sh in PUNCH_SHAKE:
                d = ts - sh
                if 0 <= d < 0.35:
                    amp = 14 * (1 - d / 0.35)
                    dx, dy = amp * math.sin(d * 90), amp * math.cos(d * 70)
            f = zoom(f, z, 540, 820, dx, dy)
            if 39.45 <= ts < 39.9:                          # warm glow on "registrations open"
                g = math.sin(math.pi * (ts - 39.45) / 0.45) * 0.10
                f = np.clip(f + g * np.array([0.1, 0.65, 1.0], np.float32), 0, 1)
        else:
            if end_bg is None:
                if last_main is None:
                    last_main = Reader(MAIN_SRC[1] - 0.05).get(MAIN_SRC[1] - 0.05)
                b = grade(last_main)
                b = cv2.GaussianBlur(b, (0, 0), 28)
                grad = np.linspace(0, 1, HH, dtype=np.float32)[:, None, None]
                navy_top = np.array([70, 30, 8], np.float32) / 255
                navy_bot = np.array([40, 14, 4], np.float32) / 255
                tint = navy_top * (1 - grad) + navy_bot * grad
                end_bg = b * 0.28 + tint * 0.72
            k = t - T_END
            f = zoom(end_bg, 1.0 + 0.02 * k)
            f = f.copy()
            # logo card
            s = ease_back(k / 0.45)
            L['logo'].draw(f, 540, 520, 0.6 + 0.4 * s, clamp01(k / 0.2))
            if k > 1.3:  # shimmer
                sx = -300 + (k - 1.3) / 0.6 * 1600
                if sx < 1400:
                    lw, lh = L['logo_w']
                    sub = f[520 - lh // 2:520 + lh // 2, 540 - lw // 2 + 18:540 + lw // 2 - 18]
                    tmp = sub.copy()
                    L['shine'].draw(tmp, sx - (540 - lw // 2 + 18), lh // 2, 1.0, 0.8)
                    f[520 - lh // 2:520 + lh // 2, 540 - lw // 2 + 18:540 + lw // 2 - 18] = tmp
            for key, y, t0 in (('title', 800, 0.2), ('sub', 900, 0.35), ('r1', 1060, 0.5),
                               ('r2', 1205, 0.7), ('r3', 1350, 0.9), ('cta', 1490, 1.15)):
                u = (k - t0) / 0.35
                if u > 0:
                    L[key].draw(f, 540, y + 40 * (1 - ease_out(u)), 0.92 + 0.08 * ease_back(u),
                                clamp01(u * 1.6))
            # gentle pulse on CTA
            if k > 1.6:
                pass
        # ---- overlays common
        if t < T_MAIN + 0.2:
            k = t
            out = clamp01((t - (T_MAIN - 0.18)) / 0.3)
            s1 = 1.06 - 0.06 * ease_out(k / 0.3) + 0.25 * out
            L['hook1'].draw(f, 540, 200, s1, 1 - out)
            s2 = 0.94 + 0.06 * ease_back(k / 0.4) + 0.25 * out
            L['hook2'].draw(f, 540, 318, s2, 1 - out)
        if T_MAIN + 2.6 < t < T_END - 0.1:
            u = clamp01((t - T_MAIN - 2.6) / 0.4)
            v = clamp01((T_END - 0.1 - t) / 0.3)
            L['chip'].draw(f, 40 + L['chip'].w / 2 - 60 * (1 - ease_out(u)), 205, 1.0, min(u, v))
        progress_bar(f, t)
        # flashes at the big cuts
        for c in (T_MAIN, T_END):
            d = t - c
            if -0.1 <= d < 0:
                flash(f, 0.6 * (1 + d / 0.1))
            elif 0 <= d < 0.22:
                flash(f, 0.85 * (1 - d / 0.22) ** 2)
        out8 = (np.clip(f, 0, 1) * 255 + 0.5).astype(np.uint8)
        if enc:
            enc.stdin.write(out8.tobytes())
        elif i in want:
            cv2.imwrite(f'still_{t:05.2f}.jpg', out8, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if i % 150 == 0:
            print(f'{i}/{nframes}', flush=True)
    if enc:
        enc.stdin.close(); enc.wait()


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'stills':
        render(None, [float(x) for x in sys.argv[2:]])
    else:
        render(sys.argv[1] if len(sys.argv) > 1 else 'video_only.mp4')
