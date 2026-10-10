"""Rigid-body tracker: LK optical flow on features inside a component polygon,
fitted per frame with a RANSAC similarity transform that moves polygon + anchors."""
import cv2, numpy as np, json, sys

FR = sys.argv[1]          # dir with decoded frames NNN.jpg
N = 594
W, H = 1440, 2560

_cache = {}
def gray(i):
    if i not in _cache:
        if len(_cache) > 40:
            _cache.pop(next(iter(_cache)))
        _cache[i] = cv2.cvtColor(cv2.imread(f'{FR}/{i:03d}.jpg'), cv2.COLOR_BGR2GRAY)
    return _cache[i]

LK = dict(winSize=(31, 31), maxLevel=4,
          criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 40, 0.01))

def step(i, j, poly):
    a, b = gray(i), gray(j)
    mask = np.zeros_like(a)
    cv2.fillPoly(mask, [poly.astype(np.int32)], 255)
    mask = cv2.erode(mask, np.ones((9, 9), np.uint8))
    pts = cv2.goodFeaturesToTrack(a, 600, 0.003, 6, mask=mask, blockSize=7)
    if pts is None or len(pts) < 8:
        return None, 0
    p1, st, _ = cv2.calcOpticalFlowPyrLK(a, b, pts, None, **LK)
    p0r, st2, _ = cv2.calcOpticalFlowPyrLK(b, a, p1, None, **LK)
    fb = np.linalg.norm((pts - p0r).reshape(-1, 2), axis=1)
    ok = (st.ravel() == 1) & (st2.ravel() == 1) & (fb < 0.8)
    inb = (p1[:, 0, 0] > 2) & (p1[:, 0, 0] < W - 2) & (p1[:, 0, 1] > 2) & (p1[:, 0, 1] < H - 2)
    ok &= inb
    if ok.sum() < 8:
        return None, int(ok.sum())
    M, inl = cv2.estimateAffinePartial2D(pts[ok], p1[ok], method=cv2.RANSAC,
                                         ransacReprojThreshold=1.5, maxIters=4000, confidence=0.999)
    return M, int(inl.sum()) if inl is not None else 0

def apply(M, P):
    P = np.asarray(P, float)
    return P @ M[:, :2].T + M[:, 2]

def track(key, poly, anchors, f0, f1):
    """Track from keyframe `key` forward to f1 and backward to f0 (inclusive)."""
    out = {key: dict(poly=np.asarray(poly, float).tolist(),
                     anchors=np.asarray(anchors, float).tolist(), n=-1)}
    for direction, stop in ((1, f1), (-1, f0)):
        P = np.asarray(poly, float); A = np.asarray(anchors, float)
        i = key
        while i != stop:
            j = i + direction
            M, n = step(i, j, P)
            if M is None:
                print(f'  lost at {i}->{j} (n={n})'); break
            P, A = apply(M, P), apply(M, A)
            out[j] = dict(poly=P.tolist(), anchors=A.tolist(), n=n)
            i = j
    return out

if __name__ == '__main__':
    spec = json.load(open(sys.argv[2]))
    res = {}
    for name, s in spec.items():
        print('tracking', name)
        r = track(s['key'], s['poly'], s['anchors'], s['f0'], s['f1'])
        res[name] = {str(k): v for k, v in sorted(r.items())}
        ns = [v['n'] for v in r.values() if v['n'] >= 0]
        print(f'  frames {min(r)}..{max(r)}  inliers min={min(ns)} median={int(np.median(ns))}')
    json.dump(res, open(sys.argv[3], 'w'))
