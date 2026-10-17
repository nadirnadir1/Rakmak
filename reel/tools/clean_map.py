"""Remove the Google Maps UI buttons (layers, compass, my-location, directions) and the
'Recently viewed' tag from the location screenshot. POI labels are kept for realism; the
school's own label is covered in the video by the branded EFH label card.
Usage: python3 clean_map.py in.jpg out.jpg"""
import sys
import numpy as np
import cv2

src = cv2.imread(sys.argv[1])
H, W = src.shape[:2]
gray = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)
out = src.copy()


def fill(region, mask_fn):
    """shift-map inpainting (texture-coherent) on a local crop"""
    x0, y0, x1, y1 = region
    crop = out[y0:y1, x0:x1].copy()
    m = np.zeros(crop.shape[:2], np.uint8)
    mask_fn(m, x0, y0)
    lab = cv2.cvtColor(crop, cv2.COLOR_BGR2Lab)
    res = np.zeros_like(lab)
    cv2.xphoto.inpaint(lab, 255 - m, res, cv2.xphoto.INPAINT_SHIFTMAP)
    res = cv2.cvtColor(res, cv2.COLOR_Lab2BGR)
    # feathered paste back
    a = cv2.GaussianBlur(cv2.dilate(m, np.ones((7, 7), np.uint8)).astype(np.float32) / 255, (0, 0), 3)[..., None]
    out[y0:y1, x0:x1] = (res * a + crop * (1 - a)).astype(np.uint8)


def circle(cx, cy, r):
    return lambda m, x0, y0: cv2.circle(m, (cx - x0, cy - y0), r, 255, -1)


def rect(a, b, c, d):
    return lambda m, x0, y0: cv2.rectangle(m, (a - x0, b - y0), (c - x0, d - y0), 255, -1)


fill((700, 0, W, 360), lambda m, x0, y0: (circle(992, 92, 62)(m, x0, y0), circle(992, 240, 62)(m, x0, y0)))
fill((680, 1320, W, 1754), lambda m, x0, y0: (rect(900, 1404, W - 1, 1554)(m, x0, y0), rect(900, 1574, W - 1, 1724)(m, x0, y0)))


def recently(m, x0, y0):  # 'Recently viewed' text only (thin strokes)
    roi = np.zeros_like(gray); roi[853:893, 545:780] = 1
    t = ((gray > 185) & (roi > 0)).astype(np.uint8) * 255
    t = cv2.dilate(t, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    m |= t[y0:y0 + m.shape[0], x0:x0 + m.shape[1]]


fill((470, 780, 860, 960), recently)
cv2.imwrite(sys.argv[2], out, [cv2.IMWRITE_JPEG_QUALITY, 95])
print('cleaned', W, H)
