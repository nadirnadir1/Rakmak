"""Lens-blur the raw three.js cabin render into a shallow-focus background plate.

  python3 tools/make_cabin.py raw.png assets/img/cabin.jpg [radius_px]

Disk (bokeh) blur in linear light with a small highlight boost, so the windows, reading lights and
seat-back screens bloom into soft discs like a fast portrait lens.
"""
import sys
import numpy as np
import cv2

src, dst = sys.argv[1], sys.argv[2]
rad = float(sys.argv[3]) if len(sys.argv) > 3 else 22

img = cv2.imread(src, cv2.IMREAD_COLOR).astype(np.float32) / 255.0
lin = np.where(img <= 0.04045, img / 12.92, ((img + 0.055) / 1.055) ** 2.4)
# lift highlights so emissive parts dominate the bokeh like real lights do
lum = lin.mean(axis=2, keepdims=True)
lin = lin * (1 + 3.0 * np.clip((lum - 0.55) / 0.45, 0, 1) ** 2)

r = int(np.ceil(rad))
yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
d = np.sqrt(xx ** 2 + yy ** 2)
k = np.clip(rad + 0.5 - d, 0, 1).astype(np.float32)   # anti-aliased disk
k /= k.sum()
out = cv2.filter2D(lin, -1, k, borderType=cv2.BORDER_REFLECT)
out = cv2.GaussianBlur(out, (0, 0), rad * 0.18)
# gentle filmic roll-off back to display
out = out / (1 + 0.12 * out)
srgb = np.where(out <= 0.0031308, out * 12.92, 1.055 * np.power(np.clip(out, 0, None), 1 / 2.4) - 0.055)
srgb = np.clip(srgb, 0, 1)
cv2.imwrite(dst, (srgb * 255 + 0.5).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
print('->', dst, srgb.shape)
