"""Quick probe: run YuNet on sample frames, draw boxes, save a contact sheet."""
import cv2, sys, numpy as np
model, video, out = sys.argv[1], sys.argv[2], sys.argv[3]
times = [float(t) for t in sys.argv[4].split(',')]
cap = cv2.VideoCapture(video)
tiles = []
for t in times:
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, fr = cap.read()
    if not ok: continue
    h, w = fr.shape[:2]
    dets_all = []
    for scale in (1.0, 2.0):
        img = cv2.resize(fr, (int(w * scale), int(h * scale))) if scale != 1 else fr
        d = cv2.FaceDetectorYN.create(model, "", (img.shape[1], img.shape[0]), score_threshold=0.5, nms_threshold=0.3, top_k=5000)
        _, dets = d.detect(img)
        if dets is not None:
            for x in dets:
                dets_all.append((x[:4] / scale, x[-1], scale))
    vis = fr.copy()
    for (b, s, sc) in dets_all:
        x, y, bw, bh = b.astype(int)
        col = (0, 255, 0) if sc == 1 else (0, 200, 255)
        cv2.rectangle(vis, (x, y), (x + bw, y + bh), col, 2)
    cv2.putText(vis, f"t={t} n={len(dets_all)}", (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
    tiles.append(cv2.resize(vis, (w // 2, h // 2)))
sheet = np.hstack(tiles)
cv2.imwrite(out, sheet)
print("ok", sheet.shape)
