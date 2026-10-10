"""Render per-frame RGBA overlays (text, leader lines, tracking dots) keyed to
each decoded frame's real timestamp, plus a per-frame validation log."""
import json, sys, os, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

TRACKS, PTS, FONTDIR, OUT = sys.argv[1:5]
W, H = 1440, 2560
SAFE = (int(W * .08), int(H * .08), W - int(W * .08), H - int(H * .08))  # x0,y0,x1,y1
T = json.load(open(TRACKS))
pts = sorted(float(x) for x in open(PTS).read().split())
N = len(pts)

F_TITLE = ImageFont.truetype(f'{FONTDIR}/BarlowSemiCondensed-Bold.ttf', 88)
F_LABEL = ImageFont.truetype(f'{FONTDIR}/BarlowSemiCondensed-SemiBold.ttf', 54)
CYAN = (0, 229, 255)
TRACK_SPACING = 2.0  # px letter spacing

def smooth(t):  # smoothstep 0..1
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)

def env(t, t0, t1, fin=0.30, fout=0.30):
    if t < t0 or t > t1: return 0.0
    return min(smooth((t - t0) / fin), smooth((t1 - t) / fout))

# ---------------------------------------------------------------- annotations
# track/anchor: which tracked anchor drives the dot.
# off: elbow position relative to the dot; side: text extends 'L' or 'R' of elbow.
ANN = [
    dict(text=['ENGINE NACELLE'], track='engine', a=0, t0=2.45, t1=3.55,
         off=(-40, -300), side='R'),
    dict(text=['ENGINE NACELLE CHEVRONS'], track='engine', a=1, t0=2.60, t1=4.15,
         off=(170, 175), side='R'),
    dict(text=['AIRCRAFT REGISTRATION — CN-RHR'], track='reg', a=0, t0=3.70, t1=4.95,
         off=(70, -300), side='L'),
    dict(text=['WING LOWER SURFACE'], track='wing', a=0, t0=4.30, t1=5.50,
         off=(230, -210), side='R'),
    dict(text=['VERTICAL STABILIZER'], track='tail', a=0, t0=7.30, t1=9.97,
         off=(-130, -470), side='L'),
    dict(text=['HORIZONTAL', 'STABILIZER'], track='tail', a=1, t0=8.70, t1=9.97,
         off=(60, -230), side='R', minx=1065),
]
TITLES = [
    dict(lines=['HOW PEOPLE THINK', 'I SEE AIRPLANES'], t0=0.00, t1=1.22, cy=470),
    dict(lines=['BUT THIS IS HOW', 'I ACTUALLY SEE THEM.'], t0=1.30, t1=2.40, cy=470),
]

def text_size(lines, font):
    ws, hs = [], []
    for ln in lines:
        w = sum(font.getlength(c) for c in ln) + TRACK_SPACING * (len(ln) - 1)
        ws.append(w)
    asc, desc = font.getmetrics()
    lh = asc + desc
    return max(ws), lh, ws

def draw_text(draw, x, y, ln, font, fill=255):
    for c in ln:
        draw.text((x, y), c, font=font, fill=fill)
        x += font.getlength(c) + TRACK_SPACING

def anchor_at(track, a, fi):
    d = T[track].get(str(fi))
    return None if d is None else np.array(d['anchors'][a])

def layout(ann, dot):
    """Return elbow, text box (x0,y0,x1,y1), underline span, following the dot."""
    tw, lh, _ = text_size(ann['text'], F_LABEL)
    nl = len(ann['text'])
    th = lh * nl
    ex, ey = dot[0] + ann['off'][0], dot[1] + ann['off'][1]
    gap = 10
    if ann['side'] == 'R':
        x0 = ex
    else:
        x0 = ex - tw
    y1 = ey - gap           # text sits above the underline
    y0 = y1 - th
    # clamp text box into safe area, carry elbow with it
    minx = max(SAFE[0], ann.get('minx', 0))
    dx = max(minx - x0, 0) + min(SAFE[2] - (x0 + tw), 0)
    dy = max(SAFE[1] - y0, 0) + min(SAFE[3] - (y1 + gap), 0)
    x0 += dx; ex += dx; y0 += dy; y1 += dy; ey += dy
    ul = (x0, x0 + tw) if True else None
    return (ex, ey), (x0, y0, x0 + tw, y1), ul

def render(fi):
    t = pts[fi]
    white = Image.new('L', (W, H), 0)
    dw = ImageDraw.Draw(white)
    cyan = np.zeros((H, W), np.float32)
    whitef = np.zeros((H, W), np.float32)
    log = dict(frame=fi, t=round(t, 4), labels=[], titles=[])

    for tt in TITLES:
        a = env(t, tt['t0'], tt['t1'], 0.25, 0.22)
        if a <= 0: continue
        lyr = Image.new('L', (W, H), 0); d = ImageDraw.Draw(lyr)
        asc, desc = F_TITLE.getmetrics(); lh = asc + desc + 6
        y = tt['cy'] - lh * len(tt['lines']) / 2 + (1 - smooth((t - tt['t0']) / 0.35)) * 18
        boxes = []
        for ln in tt['lines']:
            w = text_size([ln], F_TITLE)[0]
            x = (W - w) / 2
            draw_text(d, x, y, ln, F_TITLE)
            boxes.append((x, y, x + w, y + lh)); y += lh
        whitef = np.maximum(whitef, np.asarray(lyr, np.float32) / 255 * a)
        log['titles'].append(dict(lines=tt['lines'], alpha=round(a, 3), boxes=boxes))

    for ann in ANN:
        a = env(t, ann['t0'], ann['t1'])
        if a <= 0: continue
        dot = anchor_at(ann['track'], ann['a'], fi)
        if dot is None:
            raise SystemExit(f'no track for {ann["text"]} at frame {fi}')
        elbow, box, ul = layout(ann, dot)
        age = t - ann['t0']
        # line draw-on
        grow = smooth(age / 0.40)
        lw = np.zeros((H, W), np.uint8)
        p0 = np.array(dot, float); p1 = np.array(elbow, float)
        v = p1 - p0; L = np.linalg.norm(v); u = v / max(L, 1e-6)
        start = p0 + u * 16  # leave the dot clear
        seg1_end = start + (p1 - start) * min(grow / 0.6, 1)
        S = 4  # subpixel shift for cv2 AA
        def P(p): return (int(round(p[0] * (1 << S))), int(round(p[1] * (1 << S))))
        cv2.line(lw, P(start), P(seg1_end), 255, 3, cv2.LINE_AA, S)
        if grow > 0.6:
            g2 = (grow - 0.6) / 0.4
            if ann['side'] == 'R':
                q0, q1 = (box[0], elbow[1]), (box[0] + (box[2] - box[0]) * g2, elbow[1])
            else:
                q0, q1 = (box[2], elbow[1]), (box[2] - (box[2] - box[0]) * g2, elbow[1])
            # connect elbow to underline start if clamping shifted it
            cv2.line(lw, P(p1), P(q0), 255, 3, cv2.LINE_AA, S)
            cv2.line(lw, P(q0), P(q1), 255, 3, cv2.LINE_AA, S)
        whitef = np.maximum(whitef, lw.astype(np.float32) / 255 * a)
        # text (fades in after line starts)
        ta = a * smooth((age - 0.18) / 0.30)
        if ta > 0:
            lyr = Image.new('L', (W, H), 0); d = ImageDraw.Draw(lyr)
            _, lh, ws = text_size(ann['text'], F_LABEL)
            y = box[1]
            for ln, w in zip(ann['text'], ws):
                x = box[0] if ann['side'] == 'R' else box[2] - w
                draw_text(d, x, y - 4, ln, F_LABEL)
                y += lh
            whitef = np.maximum(whitef, np.asarray(lyr, np.float32) / 255 * ta)
        # tracking dot + pulsing ring
        cl = np.zeros((H, W), np.uint8)
        pop = 1 + 0.6 * math.exp(-age * 9) * (age < 0.6)
        cv2.circle(cl, P(dot), int(9 * pop * (1 << S)), 255, -1, cv2.LINE_AA, S)
        cv2.circle(cl, P(dot), int(15 * (1 << S)), 255, 2, cv2.LINE_AA, S)
        ph = (age % 1.1) / 1.1
        rl = np.zeros((H, W), np.uint8)
        cv2.circle(rl, P(dot), int((16 + 22 * ph) * (1 << S)), 255, 2, cv2.LINE_AA, S)
        cyan = np.maximum(cyan, np.maximum(cl.astype(np.float32) / 255,
                                           rl.astype(np.float32) / 255 * (1 - ph) * 0.9) * a)
        log['labels'].append(dict(text=' / '.join(ann['text']), alpha=round(a, 3), text_alpha=round(ta, 3),
                                  dot=[round(float(dot[0]), 1), round(float(dot[1]), 1)],
                                  box=[round(float(b), 1) for b in box],
                                  elbow=[round(float(elbow[0]), 1), round(float(elbow[1]), 1)]))

    if whitef.max() == 0 and cyan.max() == 0:
        return None, log
    # soft shadow for legibility (text + lines only, never a scrim)
    sh = cv2.GaussianBlur(np.maximum(whitef, cyan * 0.6), (0, 0), 5) * 0.75
    sh = np.maximum(sh, np.roll(np.roll(whitef, 2, 0), 2, 1) * 0.55)
    # composite: shadow (black) -> white -> cyan
    A = np.zeros((H, W), np.float32); C = np.zeros((H, W, 3), np.float32)
    for col, al in (((0, 0, 0), sh), ((255, 255, 255), whitef), (CYAN, cyan)):
        al = np.clip(al, 0, 1)
        C = C * (1 - al[..., None]) + np.array(col, np.float32) * al[..., None]
        A = A * (1 - al) + al
    rgba = np.dstack([np.where(A[..., None] > 0, C / np.maximum(A[..., None], 1e-6), 0), A * 255])
    return rgba.clip(0, 255).astype(np.uint8), log

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    only = [int(x) for x in sys.argv[5].split(',')] if len(sys.argv) > 5 else range(N)
    blank = None
    logs = []
    for fi in only:
        img, log = render(fi)
        logs.append(log)
        path = f'{OUT}/{fi:03d}.png'
        if img is None:
            if blank is None:
                blank = f'{OUT}/blank.png'
                Image.new('RGBA', (W, H), (0, 0, 0, 0)).save(blank)
            if os.path.exists(path): os.remove(path)
            os.link(blank, path)
        else:
            Image.fromarray(img, 'RGBA').save(path, compress_level=1)
    json.dump(logs, open(f'{OUT}/log.json', 'w'))
