import cv2, sys, numpy as np
model = sys.argv[1]
def detect(fr):
    h, w = fr.shape[:2]; out = []
    for sc in (1.0, 2.0):
        img = cv2.resize(fr, (int(w*sc), int(h*sc))) if sc != 1 else fr
        d = cv2.FaceDetectorYN.create(model, "", (img.shape[1], img.shape[0]), 0.5, 0.3, 5000)
        _, dets = d.detect(img)
        if dets is not None:
            out += [list(x[:4]/sc) + [x[-1]] for x in dets]
    # NMS merge
    boxes = [b[:4] for b in out]; scores = [b[4] for b in out]
    idx = cv2.dnn.NMSBoxes([list(map(float,b)) for b in boxes], [float(s) for s in scores], 0.5, 0.3)
    return [out[i] for i in np.array(idx).flatten()] if len(out) else []
def blur_faces(fr, faces, k_sigma, cover=1.0):
    res = fr.astype(np.float32); H, W = fr.shape[:2]
    for (x, y, w, h, s) in faces:
        cx, cy = x + w/2, y + h*0.45
        a, b = 0.62*w*cover, 0.78*h*cover
        pad = int(max(a, b)*1.6)
        x0, y0, x1, y1 = max(0,int(cx-pad)), max(0,int(cy-pad)), min(W,int(cx+pad)), min(H,int(cy+pad))
        roi = fr[y0:y1, x0:x1]
        sig = max(2.0, k_sigma*w)
        bl = cv2.GaussianBlur(roi, (0,0), sig).astype(np.float32)
        m = np.zeros(roi.shape[:2], np.float32)
        cv2.ellipse(m, (int(cx-x0), int(cy-y0)), (int(a), int(b)), 0, 0, 360, 1.0, -1)
        m = cv2.GaussianBlur(m, (0,0), max(1.5, 0.12*w))[..., None]
        res[y0:y1, x0:x1] = res[y0:y1, x0:x1]*(1-m) + bl*m
    return np.clip(res, 0, 255).astype(np.uint8)
tiles = []
for vid, t in [(sys.argv[2], 58.0), (sys.argv[3], 8.5)]:
    cap = cv2.VideoCapture(vid); cap.set(cv2.CAP_PROP_POS_MSEC, t*1000); ok, fr = cap.read()
    faces = detect(fr)
    row = [cv2.resize(blur_faces(fr, faces, k), (360, 640)) for k in (0.06, 0.10, 0.16)]
    tiles.append(np.hstack(row))
cv2.imwrite(sys.argv[4], np.vstack(tiles))
