"""Blur faces in a still photo (same look as faceblur.py)."""
import sys, cv2, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from faceblur import blur_frame
model, inp, out = sys.argv[1], sys.argv[2], sys.argv[3]
k = float(sys.argv[4]) if len(sys.argv) > 4 else 0.11
img = cv2.imread(inp)
h, w = img.shape[:2]
dets = []
for sc in (0.75, 1.0, 1.6, 2.4):
    im = cv2.resize(img, (int(w * sc), int(h * sc)), interpolation=cv2.INTER_CUBIC)
    d = cv2.FaceDetectorYN.create(model, "", (im.shape[1], im.shape[0]), 0.5, 0.3, 5000)
    _, r = d.detect(im)
    if r is not None:
        dets += [[float(v) for v in x[:4] / sc] + [float(x[-1])] for x in r]
idx = np.array(cv2.dnn.NMSBoxes([b[:4] for b in dets], [b[4] for b in dets], 0.5, 0.35)).flatten() if dets else []
faces = []
for i in idx:
    x, y, bw, bh, s = dets[i]
    if s < 0.72 and max(bw, bh) >= 100:
        continue  # large but unsure: hands, lamps
    faces.append((x + bw / 2, y + bh / 2, max(bw, bh * 0.8)))
res = blur_frame(img, faces, k)
cv2.imwrite(out, res, [cv2.IMWRITE_JPEG_QUALITY, 95])
dbg = res.copy()
for (cx, cy, s) in faces:
    cv2.circle(dbg, (int(cx), int(cy)), int(s * 0.7), (0, 255, 0), 2)
cv2.imwrite(out.replace('.jpg', '_dbg.jpg'), cv2.resize(dbg, (w // 2, h // 2)))
print(inp, len(faces), "faces")
