"""Soft privacy blur for faces in crowd footage.

Pipeline: YuNet face detection (2 scales) -> IoU tracking -> gap filling,
padding and temporal smoothing -> feathered elliptical Gaussian blur whose
strength follows the face size (small, far faces get less blur).

usage: faceblur.py MODEL IN OUT --ss 0 --t 10 [--fps 30] [--k 0.11] [--debug DIR]
"""
import argparse, json, os, subprocess
from multiprocessing import Pool

import cv2
import numpy as np

MAXGAP = 10        # frames a track may go undetected before it ends
PAD_BEFORE = 4     # frames a box is held before a track starts
PAD_AFTER = 8      # frames a box is held after a track ends


def probe_size(path):
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
        "stream=width,height:stream_side_data=rotation", "-of", "json", path])
    s = json.loads(out)["streams"][0]
    w, h = s["width"], s["height"]
    rot = 0
    for sd in s.get("side_data_list", []):
        rot = int(sd.get("rotation", 0))
    return (h, w) if abs(rot) % 180 == 90 else (w, h)


def frames(path, ss, t, fps, size):
    w, h = size
    cmd = ["ffmpeg", "-v", "error", "-ss", str(ss), "-t", str(t), "-i", path,
           "-vf", f"fps={fps}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=10 ** 8)
    n = w * h * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)
    p.wait()


_det = {}


def _detect(args):
    model, fr = args
    h, w = fr.shape[:2]
    out = []
    for sc in (1.0, 2.0):
        img = fr if sc == 1 else cv2.resize(fr, (int(w * sc), int(h * sc)), interpolation=cv2.INTER_CUBIC)
        key = (img.shape[1], img.shape[0])
        if key not in _det:
            _det[key] = cv2.FaceDetectorYN.create(model, "", key, 0.55, 0.3, 5000)
        _, d = _det[key].detect(img)
        if d is not None:
            out += [[float(v) for v in x[:4] / sc] + [float(x[-1])] for x in d]
    if not out:
        return []
    idx = cv2.dnn.NMSBoxes([b[:4] for b in out], [b[4] for b in out], 0.5, 0.35)
    return [out[i] for i in np.array(idx).flatten()]


def iou(a, b):
    ax, ay, aw, ah = a[:4]
    bx, by, bw, bh = b[:4]
    x0, y0 = max(ax, bx), max(ay, by)
    x1, y1 = min(ax + aw, bx + bw), min(ay + ah, by + bh)
    inter = max(0, x1 - x0) * max(0, y1 - y0)
    return inter / (aw * ah + bw * bh - inter + 1e-9)


def track(dets):
    tracks = []
    for fi, ds in enumerate(dets):
        active = [t for t in tracks if fi - t["last"] <= MAXGAP]
        used = set()
        pairs = []
        for ti, t in enumerate(active):
            lb = t["boxes"][t["last"]]
            for di, d in enumerate(ds):
                o = iou(lb, d)
                cd = np.hypot((lb[0] + lb[2] / 2) - (d[0] + d[2] / 2), (lb[1] + lb[3] / 2) - (d[1] + d[3] / 2))
                if o > 0.1 or cd < 0.7 * max(lb[2], d[2]):
                    pairs.append((o - cd / (10 * max(lb[2], 1)), ti, di))
        pairs.sort(reverse=True)
        tdone = set()
        for _, ti, di in pairs:
            if ti in tdone or di in used:
                continue
            t = active[ti]
            t["boxes"][fi] = ds[di]
            t["last"] = fi
            tdone.add(ti)
            used.add(di)
        for di, d in enumerate(ds):
            if di not in used:
                tracks.append({"boxes": {fi: d}, "last": fi})
    return tracks


def densify(tracks, nframes, size):
    W, H = size
    per_frame = [[] for _ in range(nframes)]
    kept = 0
    for t in tracks:
        ks = sorted(t["boxes"])
        scores = [t["boxes"][k][4] for k in ks]
        if len(ks) < 3 and max(scores) < 0.8:
            continue  # very likely a false positive
        if len(ks) < 2 and max(scores) < 0.9:
            continue
        kept += 1
        f0, f1 = ks[0], ks[-1]
        arr = np.array([t["boxes"][k][:4] for k in ks], np.float64)
        cx = arr[:, 0] + arr[:, 2] / 2
        cy = arr[:, 1] + arr[:, 3] / 2
        sz = np.maximum(arr[:, 2], arr[:, 3] * 0.8)
        fr = np.arange(max(0, f0 - PAD_BEFORE), min(nframes, f1 + PAD_AFTER + 1))
        icx = np.interp(fr, ks, cx)
        icy = np.interp(fr, ks, cy)
        isz = np.interp(fr, ks, sz)

        def smooth(v, k):
            if len(v) < 3:
                return v
            k = min(k, len(v) // 2 * 2 + 1)
            pad = k // 2
            vp = np.pad(v, pad, mode="edge")
            return np.convolve(vp, np.ones(k) / k, mode="valid")

        icx, icy, isz = smooth(icx, 5), smooth(icy, 5), smooth(isz, 9)
        for f, a, b, s in zip(fr, icx, icy, isz):
            per_frame[f].append((a, b, s))
    return per_frame, kept


def blur_frame(fr, faces, k):
    if not faces:
        return fr
    res = fr.astype(np.float32)
    H, W = fr.shape[:2]
    for (cx, cy, s) in faces:
        s = max(s, 12.0)
        a, b = 0.66 * s, 0.86 * s           # ellipse covers face + some hair
        ccy = cy - 0.06 * s
        pad = int(max(a, b) * 1.7) + 4
        x0, y0 = max(0, int(cx - pad)), max(0, int(ccy - pad))
        x1, y1 = min(W, int(cx + pad)), min(H, int(ccy + pad))
        if x1 - x0 < 4 or y1 - y0 < 4:
            continue
        roi = res[y0:y1, x0:x1]
        sig = max(2.2, k * s)
        bl = cv2.GaussianBlur(roi, (0, 0), sig)
        m = np.zeros(roi.shape[:2], np.float32)
        cv2.ellipse(m, (int(cx - x0), int(ccy - y0)), (max(2, int(a)), max(2, int(b))), 0, 0, 360, 1.0, -1)
        m = cv2.GaussianBlur(m, (0, 0), max(1.5, 0.14 * s))[..., None]
        roi[:] = roi * (1 - m) + bl * m
    return np.clip(res, 0, 255).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("model"); ap.add_argument("inp"); ap.add_argument("out")
    ap.add_argument("--ss", type=float, default=0); ap.add_argument("--t", type=float, required=True)
    ap.add_argument("--fps", type=float, default=30); ap.add_argument("--k", type=float, default=0.11)
    ap.add_argument("--debug", default=None)
    a = ap.parse_args()
    size = probe_size(a.inp)

    dets = []
    with Pool(4) as pool:
        batch = []
        for fr in frames(a.inp, a.ss, a.t, a.fps, size):
            batch.append((a.model, fr.copy()))
            if len(batch) == 32:
                dets += pool.map(_detect, batch); batch = []
        if batch:
            dets += pool.map(_detect, batch)
    n = len(dets)
    per_frame, kept = densify(track(dets), n, size)
    print(f"{a.inp}: {n} frames, {sum(len(d) for d in dets)} detections, {kept} tracks")

    W, H = size
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24",
                            "-s", f"{W}x{H}", "-r", str(a.fps), "-i", "-", "-c:v", "libx264",
                            "-crf", "12", "-preset", "fast", "-pix_fmt", "yuv420p", a.out],
                           stdin=subprocess.PIPE)
    if a.debug:
        os.makedirs(a.debug, exist_ok=True)
    for fi, fr in enumerate(frames(a.inp, a.ss, a.t, a.fps, size)):
        if fi >= n:
            break
        outf = blur_frame(fr, per_frame[fi], a.k)
        enc.stdin.write(outf.tobytes())
        if a.debug and fi % 15 == 0:
            dbg = outf.copy()
            for (cx, cy, s) in per_frame[fi]:
                cv2.circle(dbg, (int(cx), int(cy)), int(s * 0.7), (0, 255, 0), 1)
            cv2.imwrite(os.path.join(a.debug, f"f{fi:05d}.jpg"), cv2.resize(dbg, (W // 2, H // 2)))
    enc.stdin.close(); enc.wait()
    json.dump({"fps": a.fps, "faces": [[list(map(float, f)) for f in pf] for pf in per_frame]},
              open(a.out + ".faces.json", "w"))


if __name__ == "__main__":
    main()
