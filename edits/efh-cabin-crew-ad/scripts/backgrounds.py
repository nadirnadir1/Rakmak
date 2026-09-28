"""Procedural animated backgrounds (1080x1920, BGR float32 0..1)."""
import json, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
MONT = 'fonts/Montserrat-800.ttf'
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'


def hexc(h):
    h = h.lstrip('#'); r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return np.array([b, g, r], np.float32) / 255


def vgrad(stops, h=H, w=W):
    """stops: list of (y_frac, hex)."""
    ys = np.linspace(0, 1, h, dtype=np.float32)
    out = np.zeros((h, 3), np.float32)
    for c in range(3):
        out[:, c] = np.interp(ys, [s[0] for s in stops], [hexc(s[1])[c] for s in stops])
    return np.repeat(out[:, None, :], w, 1)


def radial(cx, cy, r, h=H, w=W):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    return np.clip(1 - np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r, 0, 1)


def fbm(h, w, seed, octaves=6, base=3, persist=0.5, aspect=1.0):
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32); amp = 1.0; tot = 0
    for o in range(octaves):
        gh = max(2, int(base * 2 ** o)); gw = max(2, int(base * 2 ** o * w / h / aspect))
        g = rng.random((gh, gw)).astype(np.float32)
        acc += cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC) * amp
        tot += amp; amp *= persist
    return acc / tot


def noise1d(n, seed, octaves=5, cells=6, persist=0.5):
    rng = np.random.default_rng(seed)
    acc = np.zeros(n, np.float32); amp = 1.0; tot = 0
    for o in range(octaves):
        k = cells * 2 ** o + 1
        g = rng.random(k).astype(np.float32)
        acc += cv2.resize(g[None], (n, 1), interpolation=cv2.INTER_CUBIC)[0] * amp
        tot += amp; amp *= persist
    return acc / tot


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


def over(dst, rgb, a, x, y):
    """alpha-composite rgb/a (float) onto dst at top-left (x,y), clipped."""
    h, w = a.shape[:2]
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(dst.shape[1], x + w), min(dst.shape[0], y + h)
    if x1 <= x0 or y1 <= y0: return
    aa = a[y0 - y:y1 - y, x0 - x:x1 - x]
    if aa.ndim == 2: aa = aa[..., None]
    dst[y0:y1, x0:x1] = dst[y0:y1, x0:x1] * (1 - aa) + rgb[y0 - y:y1 - y, x0 - x:x1 - x] * aa


def add_glow(dst, rgb, a, x, y, gain=1.0):
    h, w = a.shape[:2]
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(dst.shape[1], x + w), min(dst.shape[0], y + h)
    if x1 <= x0 or y1 <= y0: return
    aa = a[y0 - y:y1 - y, x0 - x:x1 - x]
    if aa.ndim == 2: aa = aa[..., None]
    dst[y0:y1, x0:x1] += rgb[y0 - y:y1 - y, x0 - x:x1 - x] * aa * gain


# ------------------------------------------------------------------ airplane
def airplane(length=380, facing_left=True):
    S = 4; w, h = 1000 * S, 400 * S
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    P = lambda pts: [(x * S, y * S) for x, y in pts]
    body, shade, navy, orange = (246, 248, 252, 255), (196, 204, 218, 255), (20, 48, 110, 255), (242, 145, 0, 255)
    d.polygon(P([(430, 214), (560, 214), (720, 312), (668, 318)]), fill=shade)           # far wing
    d.polygon(P([(850, 170), (920, 38), (978, 38), (952, 168)]), fill=navy)              # fin
    d.ellipse(P([(40, 168), (170, 232)]), fill=body)                                   # nose
    d.rectangle(P([(100, 168), (830, 232)]), fill=body)
    d.polygon(P([(820, 168), (950, 150), (968, 166), (905, 232), (820, 232)]), fill=body)  # tail cone
    d.rectangle(P([(100, 222), (905, 232)]), fill=shade)                               # belly shade
    d.rectangle(P([(140, 206), (840, 212)]), fill=orange)                              # livery
    d.rectangle(P([(140, 213), (840, 217)]), fill=navy)
    for x in range(170, 810, 17):
        d.ellipse(P([(x, 186), (x + 7, 194)]), fill=(40, 60, 90, 255))                 # windows
    d.polygon(P([(62, 188), (92, 180), (100, 196), (66, 198)]), fill=(30, 45, 70, 255))  # cockpit
    d.polygon(P([(400, 218), (520, 218), (650, 336), (598, 342)]), fill=(225, 230, 240, 255))  # near wing
    d.ellipse(P([(420, 236), (520, 272)]), fill=(170, 178, 192, 255))                  # engine
    d.ellipse(P([(420, 240), (440, 268)]), fill=(60, 66, 80, 255))
    d.polygon(P([(840, 205), (905, 205), (968, 240), (936, 243)]), fill=(225, 230, 240, 255))  # h-stab
    im = im.resize((length, int(length * 0.4)), Image.LANCZOS)
    if not facing_left:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    a = np.asarray(im).astype(np.float32) / 255
    return a[..., :3][..., ::-1].copy(), a[..., 3].copy()


PLANE_RGB, PLANE_A = airplane(380)
PLANE_S_RGB, PLANE_S_A = airplane(170)


def draw_plane(dst, x, y, big=True, trail=True, trail_col=(1, 1, 1), trail_len=900):
    rgb, a = (PLANE_RGB, PLANE_A) if big else (PLANE_S_RGB, PLANE_S_A)
    h, w = a.shape
    if trail:  # contrail behind engines (plane faces left -> trail to the right)
        L = trail_len; th = max(3, int(h * 0.06))
        xs = np.arange(L, dtype=np.float32)
        fade = (1 - xs / L) ** 1.5
        ty = int(y + h * 0.63); tx = int(x + w * 0.52)
        band = np.zeros((th * 8, L), np.float32)
        yy = np.arange(th * 8, dtype=np.float32)[:, None] - th * 4
        spread = th * (1 + xs / L * 2.5)
        band = np.exp(-(yy / spread) ** 2) * fade * 0.55
        rgbt = np.ones((th * 8, L, 3), np.float32) * np.array(trail_col, np.float32)
        over(dst, rgbt, band, tx, ty - th * 4)
    over(dst, rgb, a, int(x), int(y))


# ------------------------------------------------------------------ sky
class Sky:
    def __init__(self, sunset=False, seed=1):
        self.sunset = sunset
        if sunset:
            self.grad = vgrad([(0, '#1d1b4a'), (0.28, '#5a2f78'), (0.52, '#d2587a'), (0.68, '#ff9a5a'), (0.8, '#ffd08a'), (1, '#ffe3b0')])
            sun, sunc = (560, 1180, 700), hexc('#ffd9a0')
            lit, shd = hexc('#ffd2a8'), hexc('#7a4a78')
        else:
            self.grad = vgrad([(0, '#0f3f8f'), (0.3, '#2f74c9'), (0.6, '#7fb5ea'), (0.78, '#cfe5fa'), (1, '#eef6ff')])
            sun, sunc = (860, 330, 800), hexc('#fff6dc')
            lit, shd = hexc('#ffffff'), hexc('#9fb4cf')
        g = radial(*sun) ** 2.2
        self.grad = self.grad + g[..., None] * sunc * 0.55
        # sea of clouds texture (wide, scrolls)
        TW, TH = 3600, 900
        prof = noise1d(TW, seed + 3, octaves=6, cells=8)
        prof = cv2.GaussianBlur(prof[None], (0, 0), 3)[0]
        top = 160 + 260 * (1 - prof)
        d = fbm(TH, TW, seed, octaves=7, base=3, aspect=1.6)
        yy = np.arange(TH, dtype=np.float32)[:, None]
        dens = d + (yy - top[None]) / 260.0
        a = smoothstep(0.55, 0.85, dens)
        hi = np.clip((a - np.roll(a, 30, 0)) * 1.8, 0, 1)
        body = smoothstep(0.0, 1.0, (yy - top[None]) / 500.0)
        mixk = np.clip(0.75 - body * 0.6 + hi * 0.8 + (d - 0.5) * 0.6, 0, 1)[..., None]
        col = shd * (1 - mixk) + lit * mixk
        self.c_rgb, self.c_a = col.astype(np.float32), a.astype(np.float32)
        # far cloud band (smaller, hazier)
        d2 = fbm(500, TW, seed + 9, octaves=6, base=3, aspect=2.2)
        top2 = 200 + 120 * (1 - noise1d(TW, seed + 11, octaves=5, cells=6))
        yy2 = np.arange(500, dtype=np.float32)[:, None]
        a2 = smoothstep(0.55, 0.8, d2 + (yy2 - top2[None]) / 200.0) * 0.75
        k2 = np.clip(0.8 + (d2 - 0.5), 0, 1)[..., None]
        self.f_rgb = (shd * 0.6 + lit * 0.4) * (1 - k2) + lit * k2
        haze = self.grad[1300:1800].mean((0, 1))
        self.f_rgb = self.f_rgb * 0.6 + haze * 0.4
        self.f_a = a2.astype(np.float32)
        # wisps high up
        w = fbm(700, TW, seed + 21, octaves=6, base=2, aspect=4.0)
        self.w_a = (smoothstep(0.58, 0.8, w) * 0.35).astype(np.float32)
        self.w_rgb = np.ones((700, TW, 3), np.float32) * (lit * 0.9 + 0.1)
        self.TW = TW

    def frame(self, u, plane=None):
        f = self.grad.copy()
        o = int(u * 25) % (self.TW - W)
        over(f, self.w_rgb[:, o:o + W], self.w_a[:, o:o + W], 0, 150)
        o2 = int(u * 40 + 700) % (self.TW - W)
        over(f, self.f_rgb[:, o2:o2 + W], self.f_a[:, o2:o2 + W], 0, 980)
        if plane is not None:
            px, py, big = plane
            draw_plane(f, px, py, big, trail_col=(1, 1, 1) if not self.sunset else (1, 0.93, 0.85))
        o3 = int(u * 90 + 1500) % (self.TW - W)
        over(f, self.c_rgb[:, o3:o3 + W], self.c_a[:, o3:o3 + W], 0, 1080)
        return f


# ------------------------------------------------------------------ brand navy
def logo_white():
    im = cv2.imread('assets/logo_raw.png').astype(np.float32) / 255
    mn = im.min(2)
    a = np.clip((1 - mn - 0.06) / 0.35, 0, 1)
    hsv = cv2.cvtColor((im * 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
    orange = (hsv[..., 0] > 5) & (hsv[..., 0] < 30) & (hsv[..., 1] > 90)
    rgb = np.ones_like(im)
    rgb[orange] = hexc('#ffa51f')
    return rgb, a


class Brand:
    def __init__(self, seed=5, accent='#ffb21f'):
        self.base = vgrad([(0, '#0b2466'), (0.45, '#0e2f7c'), (1, '#040c28')])
        self.base += radial(540, 650, 900)[..., None] ** 2 * hexc('#2a62c8') * 0.55
        rng = np.random.default_rng(seed)
        self.parts = [(rng.uniform(0, W), rng.uniform(0, H), rng.uniform(2, 7), rng.uniform(20, 70), rng.uniform(0.15, 0.6))
                      for _ in range(70)]
        self.accent = hexc(accent)
        lr, la = logo_white()
        s = 700 / lr.shape[1]
        self.l_rgb = cv2.resize(lr, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        self.l_a = cv2.resize(la, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        glow = cv2.GaussianBlur(self.l_a, (0, 0), 18)
        self.l_glow = glow
        # beam template: long soft diagonal band
        bw = 2600
        x = np.linspace(-1, 1, 220, dtype=np.float32)
        prof = np.exp(-(x / 0.35) ** 2)
        beam = np.repeat(prof[:, None], bw, 1)
        self.beam = beam

    def frame(self, u):
        f = self.base.copy()
        # moving light beams (rotated bands)
        for k, (ang, spd, off, g) in enumerate(((-28, 260, 0, 0.16), (-28, 190, 900, 0.10), (-28, 320, 1700, 0.08))):
            pos = (off + u * spd) % 3200 - 1100
            M = cv2.getRotationMatrix2D((1300, 110), ang, 1.0)
            M[0, 2] += pos - 1300; M[1, 2] += 900 - 110
            b = cv2.warpAffine(self.beam, M * 0.25, (W // 4, H // 4), flags=cv2.INTER_LINEAR)
            b = cv2.resize(b, (W, H), interpolation=cv2.INTER_LINEAR)
            f += b[..., None] * (self.accent * 0.5 + 0.5) * g
        # bokeh particles drifting up
        lay = np.zeros((H, W), np.float32)
        for (x, y, r, spd, a) in self.parts:
            yy = (y - u * spd) % (H + 40) - 20
            xx = x + math.sin(u * 0.8 + y) * 12
            cv2.circle(lay, (int(xx), int(yy)), int(r), float(a), -1, cv2.LINE_AA)
        lay = cv2.GaussianBlur(lay, (0, 0), 1.5)
        f += lay[..., None] * np.array([0.95, 0.9, 0.8], np.float32) * 0.8
        # logo with glow + gentle float
        lw, lh = self.l_a.shape[1], self.l_a.shape[0]
        x = (W - lw) // 2; y = 70 + int(math.sin(u * 1.6) * 8)
        pulse = 0.55 + 0.25 * math.sin(u * 3)
        add_glow(f, np.ones_like(self.l_rgb) * hexc('#5fa8ff'), self.l_glow, x, y, pulse)
        over(f, self.l_rgb, self.l_a * min(1, u / 0.3), x, y)
        return np.clip(f, 0, 1.4)


# ------------------------------------------------------------------ departures board
class Departures:
    ROWS = [('08:15', 'DUBAI', 'A12', 'BOARDING', 'g'), ('08:40', 'PARIS', 'B04', 'ON TIME', 'w'),
            ('09:05', 'DOHA', 'A07', 'BOARDING', 'g'), ('09:30', 'ISTANBUL', 'C21', 'ON TIME', 'w'),
            ('10:10', 'LONDON', 'B11', 'GATE OPEN', 'g'), ('10:45', 'NEW YORK', 'D02', 'ON TIME', 'w'),
            ('11:20', 'MONTREAL', 'D09', 'ON TIME', 'w'), ('11:55', 'JEDDAH', 'A03', 'FINAL CALL', 'o'),
            ('12:30', 'MADRID', 'C14', 'ON TIME', 'w'), ('13:05', 'ROME', 'B18', 'ON TIME', 'w')]
    COLS = [5, 9, 3, 10]
    CW, CHh = 30, 48

    def __init__(self, seed=3):
        rng = np.random.default_rng(seed)
        f = vgrad([(0, '#0a0f1c'), (0.5, '#101a2e'), (1, '#070a12')])
        # terminal bokeh lights
        bok = np.zeros((H, W, 3), np.float32)
        for _ in range(60):
            x, y = rng.uniform(0, W), rng.uniform(900, H)
            r = rng.uniform(12, 45)
            c = hexc(rng.choice(['#ffcf7a', '#8fc3ff', '#ffffff', '#ffb35c']))
            cv2.circle(bok, (int(x), int(y)), int(r), tuple(float(v) * rng.uniform(0.08, 0.25) for v in c), -1, cv2.LINE_AA)
        bok = cv2.GaussianBlur(bok, (0, 0), 10)
        self.base = f + bok
        # glass/ceiling light strips
        for y in (40, 70):
            self.base[y:y + 6] += 0.18
        self.font = ImageFont.truetype(MONO, 34)
        self.glyph = {}
        self.cols = {'w': hexc('#ffd24a'), 'g': hexc('#46e07a'), 'o': hexc('#ff8a3d')}
        hdr = Image.new('RGBA', (900, 110), (0, 0, 0, 0))
        ImageDraw.Draw(hdr).text((0, 0), 'DEPARTURES', font=ImageFont.truetype(MONT, 86), fill=(255, 210, 74, 255))
        a = np.asarray(hdr).astype(np.float32) / 255
        self.h_rgb, self.h_a = a[..., :3][..., ::-1].copy(), a[..., 3].copy()
        self.hw = int(self.h_a.sum(0).nonzero()[0].max()) + 4
        self.rng = np.random.default_rng(seed + 1)
        self.px0 = 50
        self.py0 = 290
        self.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:'

    def g(self, ch):
        if ch not in self.glyph:
            im = Image.new('L', (self.CW, self.CHh), 0)
            ImageDraw.Draw(im).text((self.CW // 2, self.CHh // 2), ch, font=self.font, fill=255, anchor='mm')
            self.glyph[ch] = np.asarray(im).astype(np.float32) / 255
        return self.glyph[ch]

    def frame(self, u):
        f = self.base.copy()
        # panel
        pw = sum(self.COLS) * (self.CW + 2) + 3 * 18 + 40
        x0, y0 = self.px0, self.py0 - 170
        ph = 170 + len(self.ROWS) * (self.CHh + 14) + 30
        f[y0:y0 + ph, x0:x0 + pw] = f[y0:y0 + ph, x0:x0 + pw] * 0.25 + hexc('#05070c') * 0.75
        cv2.rectangle(f, (x0, y0), (x0 + pw, y0 + ph), (0.25, 0.25, 0.28), 2, cv2.LINE_AA)
        # header + plane icon
        over(f, self.h_rgb, self.h_a, x0 + 30, y0 + 30)
        pr = cv2.resize(PLANE_S_RGB, None, fx=0.75, fy=0.75); pa = cv2.resize(PLANE_S_A, None, fx=0.75, fy=0.75)
        pr = pr * 0 + hexc('#ffd24a')
        over(f, pr, pa, x0 + 30 + self.hw + 20, y0 + 50)
        # rows of split-flap cells
        for r, row in enumerate(self.ROWS):
            y = self.py0 + r * (self.CHh + 14)
            x = x0 + 20
            settle = 0.25 + r * 0.08
            for ci, (txt, n) in enumerate(zip(row[:4], self.COLS)):
                col = self.cols[row[4]] if ci == 3 else self.cols['w']
                txt = txt.ljust(n)
                for k in range(n):
                    cx = x + k * (self.CW + 2)
                    f[y:y + self.CHh, cx:cx + self.CW] = hexc('#15181f')
                    f[y + self.CHh // 2:y + self.CHh // 2 + 2, cx:cx + self.CW] = hexc('#050608')
                    st = settle + k * 0.025
                    ch = txt[k]
                    flipping = u < st and ch != ' '
                    if flipping:
                        ch = self.chars[int((u * 40 + k * 7 + r * 3)) % len(self.chars)]
                    if ch != ' ':
                        gm = self.g(ch)
                        f[y:y + self.CHh, cx:cx + self.CW] += gm[..., None] * col * (0.85 if flipping else 1.0)
                        if flipping:  # darker top half while flapping
                            f[y:y + self.CHh // 2, cx:cx + self.CW] *= 0.6
                x += n * (self.CW + 2) + 18
        # clock blink / scanning highlight
        return np.clip(f, 0, 1.2)


# ------------------------------------------------------------------ globe with flight routes
CITIES = {'Marrakech': (31.63, -8.0), 'Dubai': (25.2, 55.27), 'Paris': (48.85, 2.35), 'New York': (40.71, -74.0),
          'Doha': (25.29, 51.53), 'Istanbul': (41.0, 28.97), 'London': (51.5, -0.12), 'Montreal': (45.5, -73.57),
          'Jeddah': (21.49, 39.19), 'Madrid': (40.42, -3.7)}


def land_mask():
    gj = json.load(open('land.geojson'))
    m = np.zeros((720, 1440), np.uint8)
    for ft in gj['features']:
        g = ft['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for poly in polys:
            ring = np.array(poly[0])
            pts = np.stack([(ring[:, 0] + 180) * 4, (90 - ring[:, 1]) * 4], 1).astype(np.int32)
            cv2.fillPoly(m, [pts], 255)
    return m


def sph(lat, lon):
    la, lo = np.radians(lat), np.radians(lon)
    return np.stack([np.cos(la) * np.sin(lo), np.sin(la), np.cos(la) * np.cos(lo)], -1)


class Globe:
    def __init__(self):
        self.base = vgrad([(0, '#040b22'), (0.5, '#081a45'), (1, '#030816')])
        self.cx, self.cy, self.R = 540, 600, 520
        self.base += radial(self.cx, self.cy, self.R * 1.5)[..., None] ** 2 * hexc('#1e5bd0') * 0.5
        m = land_mask()
        lats, lons = [], []
        for lat in np.arange(-80, 84, 1.7):
            step = 1.7 / max(0.2, math.cos(math.radians(lat)))
            for lon in np.arange(-180, 180, step):
                if m[int((90 - lat) * 4) % 720, int((lon + 180) * 4) % 1440]:
                    lats.append(lat); lons.append(lon)
        self.pts = sph(np.array(lats), np.array(lons)).astype(np.float32)
        self.routes = [('Marrakech', c) for c in ('Dubai', 'Paris', 'New York', 'Doha', 'Istanbul', 'London', 'Montreal', 'Jeddah', 'Madrid')]
        # rim glow
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt((xx - self.cx) ** 2 + (yy - self.cy) ** 2)
        self.rim = (np.exp(-((d - self.R) / 22) ** 2) * 0.55 + np.clip(1 - (d - self.R) / 140, 0, 1) * (d > self.R) * 0.25)
        self.disc = (d < self.R).astype(np.float32)

    def rot(self, p, yaw, pitch):
        cy, sy, cp, sp = math.cos(yaw), math.sin(yaw), math.cos(pitch), math.sin(pitch)
        x = p[..., 0] * cy - p[..., 2] * sy; z = p[..., 0] * sy + p[..., 2] * cy
        y = p[..., 1] * cp - z * sp; z2 = p[..., 1] * sp + z * cp
        return np.stack([x, y, z2], -1)

    def proj(self, q, alt=1.0):
        return self.cx + q[..., 0] * self.R * alt, self.cy - q[..., 1] * self.R * alt

    def frame(self, u):
        f = self.base.copy()
        f += self.disc[..., None] * hexc('#0a2a6e') * 0.6
        yaw = math.radians(37 + u * 4)   # Marrakech sits left of the presenter's head
        pitch = math.radians(-16)
        q = self.rot(self.pts, yaw, pitch)
        front = q[:, 2] > 0
        X, Y = self.proj(q)
        lay = np.zeros((H, W), np.float32)
        xi, yi = X.astype(np.int32), Y.astype(np.int32)
        ok = (xi >= 1) & (xi < W - 1) & (yi >= 1) & (yi < H - 1)
        for sel, val in ((front & ok, 1.0), (~front & ok, 0.18)):
            z = np.clip(q[sel, 2], 0, 1) if val == 1.0 else 1
            np.add.at(lay, (yi[sel], xi[sel]), val * (0.45 + 0.55 * z))
        lay = cv2.dilate(lay, np.ones((3, 3), np.uint8))
        lay = cv2.GaussianBlur(lay, (0, 0), 0.8)
        f += lay[..., None] * hexc('#8fcaff') * 1.3
        f += self.rim[..., None] * hexc('#4f9dff')
        # routes
        arc = np.zeros((H, W), np.float32)
        heads = []
        for k, (a, b) in enumerate(self.routes):
            p0, p1 = sph(*CITIES[a]), sph(*CITIES[b])
            om = math.acos(float(np.clip(np.dot(p0, p1), -1, 1)))
            prog = np.clip((u - 0.15 - k * 0.18) / 1.1, 0, 1)
            if prog <= 0: continue
            ts = np.linspace(0, prog, 60)
            pts = np.array([(math.sin((1 - t) * om) * p0 + math.sin(t * om) * p1) / math.sin(om) for t in ts])
            alt = 1 + 0.18 * np.sin(np.pi * ts / 1.0) * om
            q2 = self.rot(pts, yaw, pitch)
            x2, y2 = self.cx + q2[:, 0] * self.R * alt, self.cy - q2[:, 1] * self.R * alt
            vis = (q2[:, 2] > -0.05) | (alt > 1.05)
            poly = np.stack([x2, y2], 1)[vis].astype(np.int32)
            if len(poly) > 1:
                cv2.polylines(arc, [poly], False, 1.0, 3, cv2.LINE_AA)
                if prog < 1: heads.append(tuple(poly[-1]))
        glow = cv2.GaussianBlur(arc, (0, 0), 6)
        f += (arc * 0.9 + glow * 1.6)[..., None] * hexc('#ffc23a')
        for (hx, hy) in heads:
            cv2.circle(f, (int(hx), int(hy)), 7, (0.85, 0.95, 1.0), -1, cv2.LINE_AA)
        # Marrakech pulse
        qm = self.rot(sph(*CITIES['Marrakech']), yaw, pitch)
        mx, my = self.proj(qm)
        ph = (u * 1.2) % 1
        cv2.circle(f, (int(mx), int(my)), int(10 + ph * 60), tuple(float(c) * (1 - ph) for c in hexc('#ffc23a')), 3, cv2.LINE_AA)
        cv2.circle(f, (int(mx), int(my)), 11, tuple(float(c) for c in hexc('#ffd35a')), -1, cv2.LINE_AA)
        return np.clip(f, 0, 1.3)


# ------------------------------------------------------------------ gold burst
class Burst:
    def __init__(self, seed=8):
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        self.cx, self.cy = 540, 560
        self.ang = np.arctan2(yy - self.cy, xx - self.cx)
        self.dist = np.sqrt((xx - self.cx) ** 2 + (yy - self.cy) ** 2)
        r = np.clip(self.dist / 1500, 0, 1)[..., None]
        c0, c1, c2 = hexc('#fff0b8'), hexc('#ffb21f'), hexc('#8a2f00')
        self.base = np.where(r < 0.35, c0 * (1 - r / 0.35) + c1 * (r / 0.35), c1 * (1 - (r - 0.35) / 0.65) + c2 * ((r - 0.35) / 0.65))
        rng = np.random.default_rng(seed)
        self.sp = [(rng.uniform(0, 2 * np.pi), rng.uniform(0, 1), rng.uniform(250, 700), rng.uniform(2, 6)) for _ in range(90)]

    def frame(self, u):
        rays = 0.5 + 0.5 * np.cos(self.ang * 16 + u * 0.9)
        rays = smoothstep(0.4, 0.9, rays) * np.clip(self.dist / 250, 0, 1)
        f = self.base * (0.88 + 0.22 * rays[..., None])
        pulse = 1 + 0.06 * math.sin(u * 10)
        f = f * pulse
        lay = np.zeros((H, W), np.float32)
        for (a, ph, spd, rad) in self.sp:
            d = ((ph + u * spd / 1200) % 1) * 1300
            x, y = self.cx + math.cos(a) * d, self.cy + math.sin(a) * d
            al = min(1, d / 200) * (1 - d / 1300)
            cv2.circle(lay, (int(x), int(y)), int(rad), float(al), -1, cv2.LINE_AA)
        f += cv2.GaussianBlur(lay, (0, 0), 1.2)[..., None] * np.array([0.8, 0.95, 1.0], np.float32)
        return np.clip(f, 0, 1.3)


if __name__ == '__main__':
    import sys, time
    outs = []
    for name, obj, u, extra in (('sky', Sky(), 1.0, {'plane': (500, 180, True)}), ('sunset', Sky(sunset=True, seed=4), 1.0, {'plane': (300, 420, False)}),
                                ('brand', Brand(), 1.0, {}), ('dep', Departures(), 1.5, {}), ('globe', Globe(), 1.6, {}), ('burst', Burst(), 0.5, {})):
        t0 = time.time(); fr = obj.frame(u, **extra); t1 = time.time()
        print(name, f'{t1 - t0:.3f}s')
        outs.append(cv2.resize((np.clip(fr, 0, 1) * 255).astype(np.uint8), (360, 640)))
    cv2.imwrite('bg_test.jpg', np.hstack(outs))
