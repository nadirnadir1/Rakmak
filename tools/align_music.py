"""Find where a clip's background music sits inside a reference song (chroma cross-correlation)."""
import sys, numpy as np, librosa
ref, clip = sys.argv[1], sys.argv[2]
sr = 22050; hop = 512
yr, _ = librosa.load(ref, sr=sr, mono=True)
yc, _ = librosa.load(clip, sr=sr, mono=True)
cr = librosa.feature.chroma_cqt(y=yr, sr=sr, hop_length=hop)
cc = librosa.feature.chroma_cqt(y=yc, sr=sr, hop_length=hop)
def norm(c):
    c = c - c.mean(axis=0, keepdims=True)
    return c / (np.linalg.norm(c, axis=0, keepdims=True) + 1e-9)
cr, cc = norm(cr), norm(cc)
win = int(8 * sr / hop)  # 8 s windows from the clip
fps = sr / hop
for start in range(0, cc.shape[1] - win, int(4 * fps)):
    q = cc[:, start:start + win]
    best = (-1, 0)
    for off in range(0, cr.shape[1] - win, 2):
        s = float((cr[:, off:off + win] * q).sum() / win)
        if s > best[0]: best = (s, off)
    print(f"clip {start / fps:6.1f}s -> ref {best[1] / fps:6.1f}s  score {best[0]:.3f}")
