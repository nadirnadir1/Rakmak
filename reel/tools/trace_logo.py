"""Vectorize the EFH logo (white/orange on black JPEG) into an SVG with one group per
animatable part: swoosh, plane, E, F, H, divider, line1 (Ecole), line2 (FLY HYANI), line3 (Prive)."""
import numpy as np, potrace, cv2
from PIL import Image
from scipy import ndimage

SRC = 'assets/img/logo_white_src.jpg'
UP = 4
im = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
mx = im.max(-1)
orange = (r - b) > 70
alpha = np.where(orange, np.clip((r - 12) / 228, 0, 1), np.clip((mx - 12) / 231, 0, 1))
H, W = alpha.shape

def regions():
    lab, n = ndimage.label(alpha > 0.5)
    parts = {k: np.zeros_like(alpha, bool) for k in
             ['swoosh', 'plane', 'E', 'F', 'H', 'divider', 'line1', 'line2', 'line3']}
    for i, sl in enumerate(ndimage.find_objects(lab)):
        m = lab == i + 1
        if m.sum() < 30: continue
        ys, xs = sl
        cx, cy = (xs.start + xs.stop) / 2, (ys.start + ys.stop) / 2
        if orange[m].mean() > 0.5: k = 'swoosh'
        elif cx < 440: k = 'plane'
        elif cx < 640: k = 'E'
        elif cx < 850: k = 'F'
        elif cx < 1075: k = 'H'
        elif cx < 1115: k = 'divider'
        elif cy < 180: k = 'line1'
        elif cy < 280: k = 'line2'
        else: k = 'line3'
        parts[k] |= m
    return parts

def trace(mask_soft):
    big = cv2.resize(mask_soft, (W * UP, H * UP), interpolation=cv2.INTER_CUBIC)
    big = cv2.GaussianBlur(big, (0, 0), UP * 0.6)
    bm = potrace.Bitmap(big <= 0.5)  # potracer fills the dark (False/0) pixels
    path = bm.trace(turdsize=8 * UP, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
                    alphamax=1.0, opticurve=True, opttolerance=0.2)
    d = []
    f = lambda p: f"{p.x / UP:.2f},{p.y / UP:.2f}"
    for curve in path:
        d.append(f"M{f(curve.start_point)}")
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{f(seg.c)}L{f(seg.end_point)}")
            else:
                d.append(f"C{f(seg.c1)} {f(seg.c2)} {f(seg.end_point)}")
        d.append("Z")
    return "".join(d)

parts = regions()
out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">']
for k, m in parts.items():
    # soft alpha limited to a dilated neighbourhood of this part
    near = ndimage.binary_dilation(m, iterations=3)
    soft = (alpha * near).astype(np.float32)
    if k != 'swoosh':
        soft = soft * ~orange  # keep orange swoosh pixels out of white parts
    d = trace(soft)
    ys, xs = np.where(m)
    color = '#F48100' if k == 'swoosh' else '#FFFFFF'
    out.append(f'<path id="{k}" data-bbox="{xs.min()},{ys.min()},{xs.max()+1},{ys.max()+1}" '
               f'fill="{color}" fill-rule="evenodd" d="{d}"/>')
out.append('</svg>')
open('assets/img/logo.svg', 'w').write("\n".join(out))
print('wrote assets/img/logo.svg', sum(len(x) for x in out), 'bytes')
