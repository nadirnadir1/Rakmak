"""v2 overlay renderer — same tracking data, labels and story as v1, with premium
motion design: target acquisition pulse -> precision line draw -> masked label
reveal, mirrored exits, registration corner brackets, cinematic titles.
Overlays are keyed to each decoded frame's real timestamp."""
import json, sys, os, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

TRACKS, PTS, FONTDIR, OUT = sys.argv[1:5]
W, H = 1440, 2560
SAFE = (int(W * .08), int(H * .08), W - int(W * .08), H - int(H * .08))
T = json.load(open(TRACKS))
SPEC_KEY = {'engine': 130, 'reg': 130, 'wing': 230, 'tail': 575}
pts = sorted(float(x) for x in open(PTS).read().split())
N = len(pts)

FONT_B = f'{FONTDIR}/BarlowSemiCondensed-Bold.ttf'
FONT_SB = f'{FONTDIR}/BarlowSemiCondensed-SemiBold.ttf'
F_TITLE = ImageFont.truetype(FONT_B, 88)
F_LABEL = ImageFont.truetype(FONT_SB, 54)
F_REG = ImageFont.truetype(FONT_B, 76)
CYAN = (0, 229, 255)
LW = 3          # connector line width
SS = 4          # cv2 sub-pixel bits

# ---------------------------------------------------------------- easing
def clamp01(x): return min(max(x, 0.0), 1.0)
def lin(t, a, b): return clamp01((t - a) / (b - a))
def ease_out(x): x = clamp01(x); return 1 - (1 - x) ** 3
def ease_in(x): x = clamp01(x); return x ** 3
def ease_io(x): x = clamp01(x); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def ease_back(x, s=1.4):
    x = clamp01(x); return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2

# ---------------------------------------------------------------- tracking
_key_poly = {k: np.array(T[k][str(f)]['poly'], np.float32) for k, f in SPEC_KEY.items()}
def xform(track, fi):
    d = T[track].get(str(fi))
    if d is None: return None
    M, _ = cv2.estimateAffinePartial2D(_key_poly[track], np.array(d['poly'], np.float32), method=cv2.LMEDS)
    return M
def mapp(M, P):
    P = np.asarray(P, float); return P @ M[:, :2].T + M[:, 2]

# ---------------------------------------------------------------- content
# key: keyframe anchor point (refined), off: elbow offset from dot,
# side: text grows Right or Left of elbow.  Labels as the approved names.
ANN = [
    dict(lines=[('ENGINE NACELLE', F_LABEL)], track='engine', key=(270, 1965),
         t0=2.15, t1=3.65, off=(-40, -300), side='R'),
    dict(lines=[('ENGINE NACELLE CHEVRONS', F_LABEL)], track='engine', key=(446, 2013),
         t0=2.38, t1=4.25, off=(190, 165), side='R'),
    dict(lines=[('AIRCRAFT REGISTRATION', F_LABEL), ('CN-RHR', F_REG)], track='reg', key=(842, 1335),
         t0=3.72, t1=5.20, off=(70, -320), side='L',
         brackets=((574, 1100), (858, 1580))),
    dict(lines=[('WING LOWER SURFACE', F_LABEL)], track='wing', key=(540, 830),
         t0=4.30, t1=5.55, off=(230, -210), side='R'),
    dict(lines=[('VERTICAL STABILIZER', F_LABEL)], track='tail', key=(845, 1790),
         t0=7.25, t1=9.96, off=(-130, -470), side='L'),
    dict(lines=[('HORIZONTAL', F_LABEL), ('STABILIZER', F_LABEL)], track='tail', key=(1130, 1971),
         t0=8.55, t1=9.96, off=(60, -230), side='R', minx=1065),
]
TITLES = [
    dict(lines=['HOW PEOPLE THINK', 'I SEE AIRPLANES'], t0=0.00, t1=1.22, cy=470, style='soft'),
    dict(lines=['BUT THIS IS HOW', 'I ACTUALLY SEE THEM.'], t0=1.22, t1=2.42, cy=470, style='impact'),
]

def track_w(font, ln, sp):
    return sum(font.getlength(c) for c in ln) + sp * (len(ln) - 1)

def draw_text(draw, x, y, ln, font, sp, fill=255):
    for c in ln:
        draw.text((x, y), c, font=font, fill=fill); x += font.getlength(c) + sp

def line_metrics(lines, sp=2.0):
    out = []
    for txt, f in lines:
        asc, desc = f.getmetrics()
        out.append((txt, f, track_w(f, txt, sp), asc + desc))
    return out

def layout(ann, dot):
    lm = line_metrics(ann['lines'])
    tw = max(m[2] for m in lm); th = sum(m[3] for m in lm)
    ex, ey = dot[0] + ann['off'][0], dot[1] + ann['off'][1]
    gap = 12
    x0 = ex if ann['side'] == 'R' else ex - tw
    y1 = ey - gap; y0 = y1 - th
    minx = max(SAFE[0], ann.get('minx', 0))
    dx = max(minx - x0, 0) + min(SAFE[2] - (x0 + tw), 0)
    dy = max(SAFE[1] - y0, 0) + min(SAFE[3] - (y1 + gap), 0)
    return (ex + dx, ey + dy), (x0 + dx, y0 + dy, x0 + dx + tw, y1 + dy), lm

def P(p): return (int(round(p[0] * (1 << SS))), int(round(p[1] * (1 << SS))))
def R(r): return max(int(round(r * (1 << SS))), 0)

class Layers:
    def __init__(s):
        s.white = np.zeros((H, W), np.float32); s.cyan = np.zeros((H, W), np.float32)
    def add(s, which, m, a):
        if a <= 0: return
        tgt = s.white if which == 'w' else s.cyan
        np.maximum(tgt, m.astype(np.float32) / 255 * a, out=tgt)

def seg(m, p, q, w=LW):
    cv2.line(m, P(p), P(q), 255, w, cv2.LINE_AA, SS)

def text_layer(lines_xy, sp=2.0):
    lyr = Image.new('L', (W, H), 0); d = ImageDraw.Draw(lyr)
    for x, y, txt, f in lines_xy: draw_text(d, x, y, txt, f, sp)
    return np.asarray(lyr)

# ---------------------------------------------------------------- annotation
IN_DOT, IN_LINE0, IN_LINE1, IN_UL1, IN_TXT0, IN_TXT1 = 0.22, 0.12, 0.34, 0.47, 0.30, 0.68
OUT_LEN = 0.38

def draw_annotation(L, ann, fi, t, log):
    if not (ann['t0'] <= t <= ann['t1']): return
    M = xform(ann['track'], fi)
    if M is None: raise SystemExit(f'no track {ann["track"]} @ {fi}')
    dot = mapp(M, [ann['key']])[0]
    elbow, box, lm = layout(ann, dot)
    age, rem = t - ann['t0'], ann['t1'] - t
    o = lin(rem, OUT_LEN, 0)                # 0 -> 1 across the exit
    # ---- exit progress per element (text first, then lines retract, dot last)
    tx_out = ease_in(lin(o, 0.0, 0.40)); ul_out = ease_io(lin(o, 0.12, 0.45))
    ln_out = ease_io(lin(o, 0.45, 0.80)); dot_out = ease_in(lin(o, 0.70, 1.0))

    # ---- STEP 1: target acquisition
    s = ease_back(age / IN_DOT) * (1 - dot_out)
    m = np.zeros((H, W), np.uint8)
    cv2.circle(m, P(dot), R(8.5 * s), 255, -1, cv2.LINE_AA, SS)
    L.add('c', m, 1.0)
    m = np.zeros((H, W), np.uint8)              # thin outer ring
    cv2.circle(m, P(dot), R(15 * s), 255, 2, cv2.LINE_AA, SS)
    L.add('c', m, 0.85 * (1 - dot_out))
    acq = lin(age, 0.0, 0.55)                    # one-shot acquisition pulse
    if 0 < acq < 1:
        m = np.zeros((H, W), np.uint8)
        cv2.circle(m, P(dot), R(14 + 46 * ease_out(acq)), 255, 2, cv2.LINE_AA, SS)
        L.add('c', m, 0.75 * (1 - acq) ** 1.5)
    if age > 0.55:                               # subtle steady tracking pulse
        ph = ((age - 0.55) % 1.6) / 1.6
        m = np.zeros((H, W), np.uint8)
        cv2.circle(m, P(dot), R(16 + 16 * ease_out(ph)), 255, 2, cv2.LINE_AA, SS)
        L.add('c', m, 0.38 * (1 - ph) * (1 - dot_out))

    # ---- registration corner brackets (frame the real letters, never cover them)
    if 'brackets' in ann:
        (bx0, by0), (bx1, by1) = ann['brackets']
        cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2
        bin_ = ease_out(lin(age, 0.05, 0.45)); bout = ease_in(lin(o, 0.1, 0.5))
        sc = 1 + 0.18 * (1 - bin_) + 0.08 * bout
        arm = 40
        m = np.zeros((H, W), np.uint8)
        for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            kx = cx + sx * (bx1 - bx0) / 2 * sc; ky = cy + sy * (by1 - by0) / 2 * sc
            c, hx, vy = mapp(M, [(kx, ky), (kx - sx * arm, ky), (kx, ky - sy * arm)])
            seg(m, c, hx, 2); seg(m, c, vy, 2)
        L.add('w', m, 0.85 * bin_ * (1 - bout))

    # ---- STEP 2: precision line (dot -> elbow -> underline)
    p0 = np.array(dot); p1 = np.array(elbow)
    u = (p1 - p0) / max(np.linalg.norm(p1 - p0), 1e-6)
    start = p0 + u * 18
    g1 = ease_io(lin(age, IN_LINE0, IN_LINE1)); g2 = ease_out(lin(age, IN_LINE1 - 0.02, IN_UL1))
    ux0, ux1 = (box[0], box[2]) if ann['side'] == 'R' else (box[2], box[0])
    q0 = np.array((ux0, p1[1]))
    m = np.zeros((H, W), np.uint8)
    # draw-on from the dot outwards; exit mirrors it (underline retracts into
    # the elbow, then the connector retracts into the dot) so no piece detaches
    k1 = min(g1, 1 - ln_out); k2 = min(g2, 1 - ul_out)
    if k1 > 0: seg(m, start, start + (p1 - start) * k1)
    if k2 > 0 and ln_out == 0:
        seg(m, p1, q0)                               # elbow -> underline start
        seg(m, q0, (ux0 + (ux1 - ux0) * k2, p1[1]))
    L.add('w', m, 1.0)
    # minimal cyan accent: short segment at the underline origin
    if k2 > 0 and ln_out == 0:
        m = np.zeros((H, W), np.uint8)
        acc = 30 * k2; dirn = 1 if ux1 > ux0 else -1
        seg(m, (ux0, p1[1]), (ux0 + dirn * acc, p1[1]), 3)
        L.add('c', m, 1.0)

    # ---- STEP 3: label reveal (rises from behind the underline, masked)
    ta_in = lin(age, IN_TXT0, IN_TXT1)
    y = box[1]; lines_xy = []; alpha_rows = []
    for k, (txt, f, w, lh) in enumerate(lm):
        st = ease_out(lin(age, IN_TXT0 + 0.08 * k, IN_TXT1 + 0.08 * k))
        rise = (1 - st) * 26 + tx_out * 10
        x = box[0] if ann['side'] == 'R' else box[2] - w
        lines_xy.append((x, y - 4 + rise, txt, f)); alpha_rows.append((y, y + lh, st * (1 - tx_out)))
        y += lh
    if ta_in > 0 and tx_out < 1:
        tm = np.zeros((H, W), np.float32)
        for lxy, (_, _, a) in zip(lines_xy, alpha_rows):
            if a > 0: np.maximum(tm, text_layer([lxy]).astype(np.float32) * a, out=tm)
        clip = int(math.floor(p1[1] - 2))              # mask: nothing below the underline
        tm[clip:] = 0
        L.add('w', tm.astype(np.uint8), 1.0)
    full = ease_out(lin(age, IN_TXT0 + 0.08 * (len(lm) - 1), IN_TXT1 + 0.08 * (len(lm) - 1))) * (1 - tx_out)
    log['labels'].append(dict(text=' / '.join(l[0] for l in ann['lines']),
                              alpha=round(1 - dot_out, 3), text_alpha=round(full, 3),
                              dot=[round(float(dot[0]), 1), round(float(dot[1]), 1)],
                              box=[round(float(b), 1) for b in box]))

# ---------------------------------------------------------------- titles
def draw_title(L, tt, t, log):
    if not (tt['t0'] <= t <= tt['t1']): return
    age, rem = t - tt['t0'], tt['t1'] - t
    asc, desc = F_TITLE.getmetrics(); lh = asc + desc + 6
    n = len(tt['lines']); ytop = tt['cy'] - lh * n / 2
    out = ease_in(lin(rem, 0.30, 0.0))
    boxes = []; lyr = np.zeros((H, W), np.float32)
    for k, ln in enumerate(tt['lines']):
        if tt['style'] == 'soft':          # cinematic: fade + drift + tracking tightens
            st = ease_out(lin(age, 0.05 + 0.10 * k, 0.65 + 0.10 * k))
            sp = 2 + 10 * (1 - st) + 6 * out; dy = 22 * (1 - st) - 10 * out
            a = st * (1 - out)
        else:                              # impact: masked rise per line, staggered
            st = ease_out(lin(age, 0.02 + 0.12 * k, 0.40 + 0.12 * k))
            sp = 2 + 4 * out; dy = 70 * (1 - st) - 12 * out
            a = min(1, st * 1.6) * (1 - out)
        w = track_w(F_TITLE, ln, sp); x = (W - w) / 2; y = ytop + k * lh
        m = text_layer([(x, y + dy, ln, F_TITLE)], sp).astype(np.float32) * a
        if tt['style'] == 'impact':        # line-mask so letters rise into view
            m[:int(y - 6)] = 0; m[int(y + lh + 2):] = 0
        np.maximum(lyr, m, out=lyr)
        boxes.append((x, y + dy, x + w, y + dy + lh))
    L.add('w', lyr.astype(np.uint8), 1.0)
    if tt['style'] == 'impact':            # thin cyan rule draws out under the line
        g = ease_io(lin(age, 0.35, 0.75)); r = ease_in(lin(rem, 0.30, 0.05))
        half = 150 * g * (1 - r)
        if half > 1:
            m = np.zeros((H, W), np.uint8); yy = ytop + n * lh + 18
            seg(m, (W / 2 - half, yy), (W / 2 + half, yy), 3)
            L.add('c', m, 1.0 - r)
    log['titles'].append(dict(lines=tt['lines'], alpha=round(1 - out, 3), boxes=boxes))

# ---------------------------------------------------------------- frame
def render(fi):
    t = pts[fi]; L = Layers(); log = dict(frame=fi, t=round(t, 4), labels=[], titles=[])
    for tt in TITLES: draw_title(L, tt, t, log)
    for ann in ANN: draw_annotation(L, ann, fi, t, log)
    if L.white.max() == 0 and L.cyan.max() == 0: return None, log
    sh = cv2.GaussianBlur(np.maximum(L.white, L.cyan * 0.5), (0, 0), 5) * 0.72
    sh = np.maximum(sh, np.roll(np.roll(L.white, 2, 0), 2, 1) * 0.5)
    A = np.zeros((H, W), np.float32); C = np.zeros((H, W, 3), np.float32)
    for col, al in (((0, 0, 0), sh), ((255, 255, 255), L.white), (CYAN, L.cyan)):
        al = np.clip(al, 0, 1)
        C = C * (1 - al[..., None]) + np.array(col, np.float32) * al[..., None]
        A = A * (1 - al) + al
    rgba = np.dstack([np.where(A[..., None] > 0, C / np.maximum(A[..., None], 1e-6), 0), A * 255])
    return rgba.clip(0, 255).astype(np.uint8), log

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    only = [int(x) for x in sys.argv[5].split(',')] if len(sys.argv) > 5 else range(N)
    blank = f'{OUT}/blank.png'
    if not os.path.exists(blank): Image.new('RGBA', (W, H), (0, 0, 0, 0)).save(blank)
    logs = []
    for fi in only:
        img, log = render(fi); logs.append(log)
        path = f'{OUT}/{fi:03d}.png'
        if os.path.exists(path): os.remove(path)
        if img is None: os.link(blank, path)
        else: Image.fromarray(img, 'RGBA').save(path, compress_level=1)
    json.dump(logs, open(f'{OUT}/log.json', 'w'))
