"""Rasterise land rings to an equirectangular mask and keep Fibonacci-lattice points on land.
Usage: python3 make_globe_dots.py land_rings.json out.js N"""
import sys, json, math
import numpy as np
from PIL import Image, ImageDraw

rings = json.load(open(sys.argv[1]))
N = int(sys.argv[3])
W, H = 8192, 4096
img = Image.new('L', (W, H), 0)
dr = ImageDraw.Draw(img)


def xy(ring):
    return [((lon + 180) / 360 * W, (90 - lat) / 180 * H) for lon, lat in ring]


for poly in rings:
    dr.polygon(xy(poly[0]), fill=255)
    for hole in poly[1:]:
        dr.polygon(xy(hole), fill=0)
m = np.array(img) > 127

i = np.arange(N)
y = 1 - i / (N - 1) * 2
lat = np.degrees(np.arcsin(y))
lon = (np.degrees(i * math.pi * (3 - math.sqrt(5))) % 360) - 180
px = np.clip(((lon + 180) / 360 * W).astype(int), 0, W - 1)
py = np.clip(((90 - lat) / 180 * H).astype(int), 0, H - 1)
keep = m[py, px] & (lat > -58)
pts = np.stack([lon[keep], lat[keep]], 1).round(2).ravel()
open(sys.argv[2], 'w').write('window.GLOBE_DOTS=[' + ','.join(f'{v:g}' for v in pts) + '];\n')
print('land dots', int(keep.sum()))
