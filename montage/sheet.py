"""Tile preview stills into one contact sheet: sheet.py OUT.jpg cols img1 img2 ..."""
import sys, cv2, numpy as np
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = []
for f in files:
    im = cv2.resize(cv2.imread(f), (360, 640), interpolation=cv2.INTER_AREA)
    cv2.putText(im, f.split('_')[-1][:-4], (8, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    ims.append(im)
while len(ims) % cols: ims.append(np.zeros_like(ims[0]))
rows = [np.hstack(ims[i:i + cols]) for i in range(0, len(ims), cols)]
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
