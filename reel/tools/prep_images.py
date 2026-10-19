"""Prepare still images: logo cutouts (remove black background), icon crops, map crop."""
import sys
import numpy as np
from PIL import Image, ImageFilter

SRC = sys.argv[1]
OUT = sys.argv[2]


def cutout(path, target, floor=0.06):
    im = np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255.0
    mx = im.max(axis=2)
    a = np.clip((mx - floor) / (target - floor), 0, 1)
    rgb = np.clip(im / np.maximum(a[..., None], 1e-3), 0, 1)
    rgba = np.dstack([rgb, a])
    return Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), "RGBA")


def trim(img, pad=6):
    bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    x0, y0, x1, y1 = bbox
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


white = cutout(f"{SRC}/logo_white_on_black.jpg", 0.85)
blue = cutout(f"{SRC}/logo_blue_on_black.jpg", 0.55)
for name, im in (("logo_white", white), ("logo_blue", blue)):
    t = trim(im)
    t.save(f"{OUT}/{name}.png")
    # plane + swoosh emblem (left part of the logo)
    w = t.width
    icon = trim(t.crop((0, 0, int(w * 0.285), t.height)))
    icon.save(f"{OUT}/{name.replace('logo', 'icon')}.png")
    # "EFH" letters only
    efh = trim(t.crop((int(w * 0.285), 0, int(w * 0.705), t.height)))
    efh.save(f"{OUT}/{name.replace('logo', 'efh')}.png")
    # "Ecole FLY HYANI Prive" tag
    tag = trim(t.crop((int(w * 0.705), 0, w, t.height)))
    tag.save(f"{OUT}/{name.replace('logo', 'tag')}.png")
    print(name, t.size, icon.size, efh.size, tag.size)

# Google Maps screenshot: remove Google's own place label for the school (our pin + label replace it),
# then crop around the school, away from the app buttons. School pin ends up at (640, 518) in the crop.
import cv2  # noqa: E402

src = cv2.imread(f"{SRC}/google_map.jpg")
h, w = src.shape[:2]
x0, y0, x1, y1 = 385, 740, 860, 905
hsv = cv2.cvtColor(src[y0:y1, x0:x1], cv2.COLOR_BGR2HSV)
white = ((hsv[..., 2] > 215) & (hsv[..., 1] < 45)).astype(np.uint8) * 255
mask = np.zeros((h, w), np.uint8)
mask[y0:y1, x0:x1] = cv2.dilate(white, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)), iterations=4)
cv2.circle(mask, (820, 818), 36, 255, -1)
out = cv2.inpaint(src, mask, 6, cv2.INPAINT_NS)
blur = cv2.GaussianBlur(out, (0, 0), 2.2)
m3 = cv2.GaussianBlur(mask, (0, 0), 3)[..., None] / 255.0
out = (out * (1 - m3) + blur * m3).astype(np.uint8)
cv2.imwrite(f"{OUT}/google_map_clean.jpg", out, [cv2.IMWRITE_JPEG_QUALITY, 95])
cv2.imwrite(f"{OUT}/map_crop.jpg", out[300:1400, 180:1079], [cv2.IMWRITE_JPEG_QUALITY, 95])
print("map", out.shape)
