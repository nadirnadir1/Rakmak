"""Prepare still assets for the reel renderer.

usage: python prep_assets.py <uploads_dir> <fontsource_dir> <npm_dir> <out_web_dir>
"""
import json, os, re, shutil, sys
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

UP, FONTS, NPM, WEB = sys.argv[1:5]
MOROCCO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "media", "morocco_map.png")
A = os.path.join(WEB, "assets")
os.makedirs(A, exist_ok=True)


def up(name):
    for f in os.listdir(UP):
        if f.startswith(name):
            return os.path.join(UP, f)
    raise FileNotFoundError(name)


# ---------- logos: white-on-black jpg -> RGBA ----------
def logo_alpha(src, out_white, out_blue):
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255.0
    mx = im.max(axis=2)
    a = np.clip((mx - 0.10) / (0.85 - 0.10), 0, 1)
    rgb = np.clip(im / np.maximum(a[..., None], 1e-3), 0, 1)
    sat = (im.max(axis=2) - im.min(axis=2)) / np.maximum(mx, 1e-3)
    ys, xs = np.where(a > 0.05)
    x0, x1, y0, y1 = xs.min() - 6, xs.max() + 6, ys.min() - 6, ys.max() + 6
    def save(rgbarr, path):
        out = np.dstack([rgbarr, a])[y0:y1, x0:x1]
        Image.fromarray((out * 255).astype(np.uint8), "RGBA").save(path)
    save(rgb, out_white)
    blue = np.array([2, 58, 155], np.float32) / 255.0
    whiteish = (sat < 0.35)[..., None]
    save(np.where(whiteish, blue, rgb), out_blue)


logo_alpha(up("413950f4"), f"{A}/logo_white.png", f"{A}/logo_blue.png")

# ---------- flags / passport ----------
Image.open(up("e88ab537")).convert("RGB").save(f"{A}/flag_us.png")
Image.open(up("1ba1eb7d")).convert("RGB").save(f"{A}/flag_uk.png")
Image.open(up("edbf0238")).convert("RGB").save(f"{A}/flag_fr.png")
Image.open(up("c83cc28e")).convert("RGB").save(f"{A}/flag_ma.png")
Image.open(up("5f716f39")).convert("RGBA").save(f"{A}/passport.png")

# ---------- map screenshot: crop away Google UI, grade ----------
m = Image.open(up("79ec3612")).convert("RGB").crop((0, 300, 1079, 1400))
# soften Google's own POI label (our animated pin + card replace it)
box = (385, 440, 850, 605)
reg = m.crop(box).filter(ImageFilter.GaussianBlur(16))
mask = Image.new("L", reg.size, 0)
from PIL import ImageDraw
ImageDraw.Draw(mask).rounded_rectangle((8, 8, reg.size[0] - 8, reg.size[1] - 8), 30, fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(8))
m.paste(reg, box[:2], mask)
m.save(f"{A}/map_raw.jpg", quality=92)
g = ImageEnhance.Color(m).enhance(0.55)
g = ImageEnhance.Contrast(g).enhance(1.12)
arr = np.asarray(g).astype(np.float32) / 255.0
tint = np.array([0.55, 0.70, 1.0], np.float32)
arr = arr * tint * 0.92
Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)).save(f"{A}/map_grade.jpg", quality=92)

# ---------- fonts: copy fontsource css + files ----------
FD = os.path.join(WEB, "fonts")
os.makedirs(FD, exist_ok=True)
want = {
    "cairo": ["700", "800", "900"],
    "tajawal": ["800", "900"],
    "lalezar": ["400"],
    "montserrat": ["500", "700", "800", "900"],
    "bebas-neue": ["400"],
    "caveat": ["700"],
    "jetbrains-mono": ["700", "800"],
}
css_all = []
for fam, weights in want.items():
    pkg = [d for d in os.listdir(FONTS) if d.startswith(f"fontsource-{fam}-") and not d.endswith(".tgz")][0]
    root = os.path.join(FONTS, pkg, "package")
    for w in weights:
        css = open(os.path.join(root, f"{w}.css")).read()
        blocks = re.findall(r"/\*.*?\*/\s*@font-face\s*\{.*?\}", css, re.S)
        for b in blocks:
            if not any(s in b for s in ("-arabic-", "-latin-")):
                continue
            files = re.findall(r"url\(\./files/([^)]+)\)", b)
            for f in files:
                if f.endswith(".woff2"):
                    shutil.copy(os.path.join(root, "files", f), os.path.join(FD, f))
            b = re.sub(r",\s*url\(\./files/[^)]+\.woff\) format\('woff'\)", "", b)
            b = b.replace("url(./files/", "url(./")
            b = b.replace("font-display: swap;", "font-display: block;")
            css_all.append(b)
open(os.path.join(FD, "fonts.css"), "w").write("\n".join(css_all))

# ---------- dotted map (Morocco -> Europe) ----------
topo = json.load(open(os.path.join(NPM, [d for d in os.listdir(NPM) if d.startswith("world-atlas") and not d.endswith(".tgz")][0], "package", "countries-50m.json")))


def decode_arcs(topo):
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx; y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    return arcs


ARCS = decode_arcs(topo)


def ring(idx):
    out = []
    for i in idx:
        pts = ARCS[i] if i >= 0 else ARCS[~i][::-1]
        out.extend(pts if not out else pts[1:])
    return out


countries = {}
for g in topo["objects"]["countries"]["geometries"]:
    polys = []
    if g["type"] == "Polygon":
        polys = [[ring(r) for r in g["arcs"]]]
    elif g["type"] == "MultiPolygon":
        polys = [[ring(r) for r in p] for p in g["arcs"]]
    countries[g.get("id")] = polys

# view window (lon/lat) -> "map space" (1080 px wide, Mercator, y grows southwards)
# covers all of Morocco (down to Lagouira) and western Europe up to Scotland
LON0, LON1, LAT0, LAT1 = -19.0, 14.0, 19.5, 59.5
W = 1080
DEG = np.degrees(1)


def merc(lat):
    return np.log(np.tan(np.pi / 4 + np.radians(lat) / 2))


def imerc(m):
    return np.degrees(2 * np.arctan(np.exp(m)) - np.pi / 2)


Y0, Y1 = merc(LAT0), merc(LAT1)
sc = W / (LON1 - LON0)
MH = (Y1 - Y0) * DEG * sc


def proj(lon, lat):
    return (lon - LON0) * sc, (Y1 - merc(lat)) * DEG * sc


from matplotlib.path import Path as MPath  # noqa: E402
from scipy import ndimage  # noqa: E402

paths = []
for cid, polys in countries.items():
    for p in polys:
        outer = p[0]
        xs = [q[0] for q in outer]
        ys = [q[1] for q in outer]
        if max(xs) < LON0 - 5 or min(xs) > LON1 + 5 or max(ys) < LAT0 - 5 or min(ys) > LAT1 + 5:
            continue
        pts = np.array([proj(*q) for q in outer])
        paths.append((cid, MPath(pts)))

step = 15
dots = []
for yy in np.arange(step / 2, MH, step):
    for xx in np.arange(step / 2 + (step / 2 if int(yy / step) % 2 else 0), W, step):
        for cid, pth in paths:
            if pth.contains_point((xx, yy)):
                dots.append([round(float(xx), 1), round(float(yy), 1), cid])
                break
cities = {k: [round(float(v), 1) for v in proj(*ll)] for k, ll in {
    "RAK": (-8.0, 31.63), "CDG": (2.35, 48.86), "MAD": (-3.70, 40.42), "LHR": (-0.13, 51.51),
}.items()}

# ---------- the school's Morocco map (full territory) fitted onto the dotted map ----------
ma_polys = [poly[0] for cid in ("504", "732") for poly in countries[cid]]
ma_pts = np.concatenate([np.array(r) for r in ma_polys])
lon_min, lat_min = ma_pts.min(axis=0)
lon_max, lat_max = ma_pts.max(axis=0)
src = np.asarray(Image.open(MOROCCO).convert("RGBA")).astype(np.float32) / 255.0
ih, iw = src.shape[:2]
alpha = src[..., 3]

PROJS = {"equirect": lambda lon, lat: (lon, -lat), "mercator": lambda lon, lat: (lon, -merc(lat) * DEG)}
best = None
gx, gy = np.meshgrid(np.arange(0, iw, 4) + 0.5, np.arange(0, ih, 4) + 0.5)
img_mask = alpha[::4, ::4] > 0.5
for name, P in PROJS.items():
    px0, py1 = P(lon_min, lat_min); px1, py0 = P(lon_max, lat_max)
    mask = np.zeros(gx.shape, bool)
    for r in ma_polys:
        q = np.array([P(lo, la) for lo, la in r])
        u = (q[:, 0] - px0) / (px1 - px0) * iw
        v = (q[:, 1] - py0) / (py1 - py0) * ih
        mask |= MPath(np.stack([u, v], 1)).contains_points(np.stack([gx.ravel(), gy.ravel()], 1)).reshape(gx.shape)
    iou = (mask & img_mask[:mask.shape[0], :mask.shape[1]]).sum() / (mask | img_mask[:mask.shape[0], :mask.shape[1]]).sum()
    print(f"morocco map fit {name}: IoU {iou:.3f}")
    if best is None or iou > best[0]:
        best = (iou, name, P, (px0, py0, px1, py1))
_, pname, P, (px0, py0, px1, py1) = best

# warp into map space at K x resolution (premultiplied bilinear sampling)
K = 4
mx0, my0 = proj(lon_min, lat_max)
mx1, my1 = proj(lon_max, lat_min)
ow, oh = int(np.ceil((mx1 - mx0) * K)), int(np.ceil((my1 - my0) * K))
ux, vy = np.meshgrid(np.arange(ow) + 0.5, np.arange(oh) + 0.5)
lon = LON0 + (mx0 + ux / K) / sc
lat = imerc(Y1 - (my0 + vy / K) / (DEG * sc))
qx, qy = P(lon, lat)
ix = (qx - px0) / (px1 - px0) * iw - 0.5
iy = (qy - py0) / (py1 - py0) * ih - 0.5
pre = src.copy(); pre[..., :3] *= pre[..., 3:4]
out = np.stack([ndimage.map_coordinates(pre[..., c], [iy, ix], order=1, mode="constant", cval=0.0) for c in range(4)], -1)
out[..., :3] /= np.maximum(out[..., 3:4], 1e-4)
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), "RGBA").save(f"{A}/morocco_map.png", optimize=True)
ma_rect = [round(float(v), 2) for v in (mx0, my0, mx1 - mx0, my1 - my0)]
print("morocco map ->", pname, "rect", ma_rect, "px", ow, oh)

# ---------- QR code for the website ----------
import segno  # noqa: E402
qr = segno.make("https://www.flyhyani.ma", error="m")
qr_rows = ["".join("1" if c else "0" for c in row) for row in qr.matrix]

json.dump({"dots": dots, "cities": cities, "step": step, "h": round(float(MH), 1), "ma": ma_rect, "qr": qr_rows},
          open(f"{A}/mapdots.json", "w"))
print("dots", len(dots), "cities", cities, "map h", round(float(MH)))
print("assets done")
