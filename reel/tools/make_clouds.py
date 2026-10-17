"""Procedural cumulus cloud sprites (RGBA PNG): fractal sphere-puff heightfield, lit with
normals (bright tops, blue-grey self-shadowed crevices), noisy wispy edges, flat base.
Usage: python3 make_clouds.py <out_dir>"""
import sys, os
import numpy as np
from PIL import Image
from scipy.ndimage import zoom, gaussian_filter

out = sys.argv[1]
os.makedirs(out, exist_ok=True)


def fbm(h, w, rng, octaves=6, base=6, persistence=0.55):
    acc = np.zeros((h, w)); amp = 1.0; tot = 0
    for o in range(octaves):
        n = base * 2 ** o
        g = rng.random((max(2, int(n * h / w)) + 3, n + 3))
        up = zoom(g, (h / (g.shape[0] - 3), w / (g.shape[1] - 3)), order=3)[:h, :w]
        acc += amp * up; tot += amp; amp *= persistence
    return acc / tot


def cloud(w, h, seed, n_big=6, base_frac=0.78, wisp=1.0):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    Hf = np.zeros((h, w), np.float32)
    base_y = h * base_frac
    puffs = []
    for i in range(n_big):
        t = (i + 0.5 + (rng.random() - 0.5) * 0.5) / n_big
        r = h * (0.16 + 0.22 * np.sin(np.pi * t) ** 0.8) * (0.85 + rng.random() * 0.3)
        cx = w * (0.10 + 0.80 * t)
        cy = base_y - r * (0.35 + rng.random() * 0.3)
        puffs.append((cx, cy, r))
    # fractal sub-puffs on the upper surface of each big puff
    for (cx, cy, r) in list(puffs):
        for _ in range(5):
            a = rng.uniform(-2.6, -0.5)  # upper arc (y up is negative)
            rr = r * rng.uniform(0.35, 0.6)
            puffs.append((cx + np.cos(a) * r * 0.75, cy + np.sin(a) * r * 0.75, rr))
            for _ in range(2):
                a2 = rng.uniform(-2.8, -0.3); r3 = rr * rng.uniform(0.35, 0.55)
                puffs.append((cx + np.cos(a) * r * 0.75 + np.cos(a2) * rr * 0.8,
                              cy + np.sin(a) * r * 0.75 + np.sin(a2) * rr * 0.8, r3))
    # pad the canvas so no puff is clipped, then shift puffs into the middle
    ox, oy = int(w * 0.15), int(h * 0.25)
    puffs = [(cx + ox, cy + oy, r) for (cx, cy, r) in puffs]
    base_y += oy
    w, h = w + 2 * ox, h + int(oy * 1.4)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    k = h * 0.035  # smooth-max blend radius (no hard creases between puffs)
    acc = np.zeros((h, w), np.float64)
    for (cx, cy, r) in puffs:
        d2 = (xx - cx) ** 2 + (yy - cy) ** 2
        hs = np.sqrt(np.clip(r * r - d2, 0, None))
        acc += np.where(hs > 0, np.exp(np.minimum(hs / k, 60)), 0)
    Hf = np.where(acc > 0, k * np.log(np.maximum(acc, 1e-30)), 0).astype(np.float32)
    Hf = np.clip(Hf, 0, None)
    # flat-ish base
    n = gaussian_filter(fbm(h, w, rng), 3)
    n2 = fbm(h, w, rng, base=14)
    inside = gaussian_filter((Hf > 0).astype(np.float32), 6)
    Hs = gaussian_filter(Hf, 2.0) + (n - 0.5) * h * 0.07 * inside
    # normals + lighting (light from upper-left-front)
    gy, gx = np.gradient(gaussian_filter(Hs, 2.0))
    nx, ny, nz = -gx, -gy, np.ones_like(gx) * 0.9
    nl = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    L = np.array([-0.35, -0.75, 0.56]); L /= np.linalg.norm(L)
    diff = np.clip((nx * L[0] + ny * L[1] + nz * L[2]) / nl, 0, 1)
    height_light = np.clip(1.15 - (yy - (base_y - h * 0.6)) / (h * 0.75), 0.25, 1)
    shade = np.clip(0.35 + 0.55 * diff + 0.25 * height_light - 0.15, 0, 1)
    # darker, softer underside near the flat base
    shade *= 1 - 0.22 * gaussian_filter(np.clip((yy - (base_y - h * 0.30)) / (h * 0.35), 0, 1), 6)
    lit = np.array([255, 253, 250.0]); mid = np.array([214, 224, 240.0]); dark = np.array([128, 146, 182.0])
    s = shade[..., None]
    rgb = np.where(s > 0.5, mid + (lit - mid) * (s - 0.5) / 0.5, dark + (mid - dark) * s / 0.5)
    # alpha: soft, noisy, wispy edges
    edge = Hs / (h * 0.09)
    near = gaussian_filter((Hf > 0).astype(np.float32), 10) > 0.02
    alpha = np.clip(edge + (n - 0.5) * 0.8 * wisp, 0, 1) * near
    alpha = gaussian_filter(alpha, 1.2) ** 1.15
    img = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
    ys, xs = np.where(alpha > 0.01)
    return Image.fromarray(img, 'RGBA').crop((max(0, xs.min() - 4), max(0, ys.min() - 4),
                                             min(w, xs.max() + 5), min(h, ys.max() + 5)))


specs = [(1200, 700, 6, 0.70), (1000, 640, 5, 0.68), (1400, 720, 8, 0.72),
         (800, 560, 4, 0.66), (1100, 560, 7, 0.72), (700, 500, 3, 0.65)]
for i, (w, h, p, f) in enumerate(specs):
    c = cloud(w, h, 300 + i * 31, p, f)
    c.save(f"{out}/cloud{i + 1}.png", optimize=True)
    print('cloud', i + 1, c.size)

rng = np.random.default_rng(7)
g = (np.clip(rng.normal(128, 38, (512, 512)), 0, 255)).astype(np.uint8)
Image.fromarray(g, 'L').save(f"{out}/grain.png", optimize=True)
print('grain ok')
