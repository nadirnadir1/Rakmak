"""Meta Omnilingual ASR (CTC, 1B v2, sherpa-onnx int8 export) helpers:
greedy transcription per phrase and CTC forced alignment of a known transcript.

  python3 -I omni_ctc.py decode <model_dir> <wav16k> <phrases.json> <out.json>
  python3 -I omni_ctc.py align  <model_dir> <wav16k> <script.json>  <out.json>

script.json: [{"start": s, "end": e, "text": "<arabic words>"}, ...]  (phrase windows)
out (align): same phrases with "words": [{"w": word, "start": t0, "end": t1}, ...]
"""
import sys, json
import numpy as np
import soundfile as sf
import onnxruntime as ort

SR = 16000
HOP = 320  # wav2vec2 frame stride (20 ms)


def load_model(mdir):
    so = ort.SessionOptions()
    so.intra_op_num_threads = 4
    sess = ort.InferenceSession(f"{mdir}/model.int8.onnx", so, providers=["CPUExecutionProvider"])
    vocab = {}
    for line in open(f"{mdir}/tokens.txt", encoding="utf-8"):
        line = line.rstrip("\n")
        tok, idx = line.rsplit(" ", 1)
        vocab[int(idx)] = tok if tok != "" else " "
    return sess, vocab


def logprobs(sess, x):
    x = (x - x.mean()) / np.sqrt(x.var() + 1e-5)
    logits = sess.run(None, {"x": x[None].astype(np.float32)})[0][0]
    m = logits.max(-1, keepdims=True)
    return logits - m - np.log(np.exp(logits - m).sum(-1, keepdims=True))


def greedy(lp, vocab, blank=0):
    ids = lp.argmax(-1)
    out, prev = [], -1
    for i in ids:
        if i != prev and i != blank:
            out.append(vocab.get(int(i), "?"))
        prev = i
    return "".join(out).replace("▁", " ").strip()


def forced_align(lp, targets, blank=0):
    """Standard CTC Viterbi alignment. Returns per-target (first_frame, last_frame)."""
    T, S = lp.shape[0], 2 * len(targets) + 1
    ext = [blank] * S
    for i, t in enumerate(targets):
        ext[2 * i + 1] = t
    NEG = -1e30
    dp = np.full((T, S), NEG)
    bp = np.zeros((T, S), dtype=np.int8)
    dp[0, 0] = lp[0, blank]
    dp[0, 1] = lp[0, ext[1]]
    for t in range(1, T):
        for s in range(S):
            cands = [dp[t - 1, s]]
            if s >= 1: cands.append(dp[t - 1, s - 1])
            if s >= 2 and ext[s] != blank and ext[s] != ext[s - 2]: cands.append(dp[t - 1, s - 2])
            k = int(np.argmax(cands))
            dp[t, s] = cands[k] + lp[t, ext[s]]
            bp[t, s] = k
    s = S - 1 if dp[T - 1, S - 1] >= dp[T - 1, S - 2] else S - 2
    path = []
    for t in range(T - 1, -1, -1):
        path.append(s)
        s -= int(bp[t, s])
    path = path[::-1]
    spans = [[None, None] for _ in targets]
    for t, s in enumerate(path):
        if s % 2 == 1:
            j = s // 2
            if spans[j][0] is None: spans[j][0] = t
            spans[j][1] = t
    return spans


def main():
    mode, mdir, wav, inp, out = sys.argv[1:6]
    sess, vocab = load_model(mdir)
    inv = {v: k for k, v in vocab.items()}
    audio, sr = sf.read(wav, dtype="float32")
    assert sr == SR
    items = json.load(open(inp))
    res = []
    for it in items:
        a, b = (it["start"], it["end"]) if isinstance(it, dict) else it
        x = audio[int(a * SR):int(b * SR)]
        lp = logprobs(sess, x)
        if mode == "decode":
            txt = greedy(lp, vocab)
            res.append({"start": a, "end": b, "text": txt})
            print(f"[{a:6.2f}-{b:6.2f}] {txt}", flush=True)
            continue
        words = it["text"].split()
        targets, owner = [], []
        for wi, w in enumerate(words):
            if wi > 0 and " " in inv:
                targets.append(inv[" "]); owner.append(-1)
            for ch in w:
                if ch in inv:
                    targets.append(inv[ch]); owner.append(wi)
                else:
                    print("  (no token for", repr(ch), ")", file=sys.stderr)
        spans = forced_align(lp, targets)
        fr = HOP / SR
        wt = []
        for wi, w in enumerate(words):
            fs_ = [spans[k] for k in range(len(targets)) if owner[k] == wi and spans[k][0] is not None]
            t0 = a + min(s[0] for s in fs_) * fr
            t1 = a + (max(s[1] for s in fs_) + 1) * fr
            wt.append({"w": w, "start": round(t0, 3), "end": round(t1, 3)})
        res.append({**it, "words": wt, "greedy": greedy(lp, vocab)})
        print(f"[{a:6.2f}-{b:6.2f}] " + " ".join(f"{d['w']}({d['start']:.2f}-{d['end']:.2f})" for d in wt), flush=True)
    json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
