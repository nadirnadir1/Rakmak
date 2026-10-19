"""Whisper large-v3 (sherpa-onnx ONNX export) helpers:
  - score candidate transcripts for an audio segment (forced decoding log-prob)
  - word-level timestamps via timestamp-token prediction after each word

The ONNX files come from k2-fsa/sherpa-onnx (asr-models release).
"""
import base64
import numpy as np
import onnxruntime as ort
import librosa
import tiktoken

SR = 16000
N_FFT = 400
HOP = 160
N_FRAMES = 3000  # 30 s
PAT = r"""'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+"""


class Whisper:
    def __init__(self, model_dir, threads=4):
        import glob, os
        enc = sorted(glob.glob(f"{model_dir}/*-encoder.int8.onnx"))[0]
        name = os.path.basename(enc).replace("-encoder.int8.onnx", "")
        so = ort.SessionOptions()
        so.intra_op_num_threads = threads
        self.enc = ort.InferenceSession(f"{model_dir}/{name}-encoder.int8.onnx", so,
                                        providers=["CPUExecutionProvider"])
        self.dec = ort.InferenceSession(f"{model_dir}/{name}-decoder.int8.onnx", so,
                                        providers=["CPUExecutionProvider"])
        meta = self.enc.get_modelmeta().custom_metadata_map
        self.sot = int(meta["sot"])
        self.eot = int(meta["eot"])
        self.transcribe = int(meta["transcribe"])
        self.no_ts = int(meta["no_timestamps"])
        self.ts0 = self.no_ts + 1
        self.n_vocab = int(meta["n_vocab"])
        codes = meta["all_language_codes"].split(",")
        toks = [int(x) for x in meta["all_language_tokens"].split(",")]
        self.lang = dict(zip(codes, toks))
        self.n_layer = int(meta["n_text_layer"])
        self.n_state = int(meta["n_text_state"])
        self.n_ctx = int(meta["n_text_ctx"])
        ranks = {}
        for line in open(f"{model_dir}/{name}-tokens.txt", encoding="utf-8"):
            b64, idx = line.rstrip("\n").split(" ")
            ranks[base64.b64decode(b64)] = int(idx)
        self.tok = tiktoken.Encoding("whisper", pat_str=PAT, mergeable_ranks=ranks, special_tokens={})
        self.mel_fb = librosa.filters.mel(sr=SR, n_fft=N_FFT, n_mels=128)

    def log_mel(self, audio):
        audio = np.asarray(audio, np.float32)
        n = N_FRAMES * HOP
        if len(audio) < n:
            audio = np.pad(audio, (0, n - len(audio)))
        else:
            audio = audio[:n]
        window = np.hanning(N_FFT + 1)[:-1].astype(np.float32)
        stft = librosa.stft(audio, n_fft=N_FFT, hop_length=HOP, window=window, center=True)
        mag = np.abs(stft[:, :-1]) ** 2
        mel = self.mel_fb @ mag
        log_spec = np.log10(np.maximum(mel, 1e-10))
        log_spec = np.maximum(log_spec, log_spec.max() - 8.0)
        log_spec = (log_spec + 4.0) / 4.0
        return log_spec[None].astype(np.float32)

    def encode(self, audio):
        k, v = self.enc.run(None, {"mel": self.log_mel(audio)})
        return k, v

    def logits(self, cross, tokens):
        k, v = cross
        cache = np.zeros((self.n_layer, 1, self.n_ctx, self.n_state), np.float32)
        out = self.dec.run(None, {
            "tokens": np.array([tokens], np.int64),
            "in_n_layer_self_k_cache": cache,
            "in_n_layer_self_v_cache": cache,
            "n_layer_cross_k": k,
            "n_layer_cross_v": v,
            "offset": np.array([0], np.int64),
        })
        return out[0][0]  # (n_tokens, vocab)

    def prefix(self, lang="ar", timestamps=True):
        p = [self.sot, self.lang[lang], self.transcribe]
        if not timestamps:
            p.append(self.no_ts)
        return p

    def text_tokens(self, words):
        toks, ends = [], []
        for w in words:
            toks += self.tok.encode(" " + w)
            ends.append(len(toks))
        return toks, ends

    def score(self, cross, text, lang="ar"):
        """Mean and total log-prob of forced decoding text + EOT (no timestamps)."""
        pre = self.prefix(lang, timestamps=False)
        toks, _ = self.text_tokens(text.split())
        seq = pre + toks + [self.eot]
        lg = self.logits(cross, seq[:-1])
        lg = lg[:, : self.ts0]  # text + specials, exclude timestamps
        lp = lg - np.logaddexp.reduce(lg, axis=1, keepdims=True)
        tgt = seq[len(pre):]
        vals = np.array([lp[len(pre) - 1 + i, t] for i, t in enumerate(tgt)])
        return float(vals.sum()), vals

    def word_times(self, cross, words, lang="ar"):
        """Word end times (window-relative seconds).

        Each word is decoded as its own timestamped segment:
        <|t0|> w1 <|t1|><|t1|> w2 <|t2|><|t2|> ... and every <|tk|> is the most likely
        timestamp (>= previous) after word k, given the audio and all previous words.
        """
        pre = self.prefix(lang, timestamps=True)
        lg0 = self.logits(cross, pre)[-1]
        start_idx = int(np.argmax(lg0[self.ts0: self.ts0 + 1501]))
        seq = pre + [self.ts0 + start_idx]
        prev = start_idx
        out = []
        for w in words:
            seq += self.tok.encode(" " + w)
            row = self.logits(cross, seq)[-1]
            ts = row[self.ts0: self.ts0 + 1501].copy()
            ts[:prev] = -np.inf
            idx = int(np.argmax(ts))
            lo, hi = max(prev, idx - 4), min(1501, idx + 5)
            wgt = np.exp(ts[lo:hi] - ts[idx])
            soft = float((np.arange(lo, hi) * wgt).sum() / wgt.sum())
            allp = row - np.logaddexp.reduce(row)
            p_ts = float(np.exp(np.logaddexp.reduce(allp[self.ts0:])))
            out.append((idx * 0.02, soft * 0.02, p_ts))
            seq += [self.ts0 + idx, self.ts0 + idx]
            prev = idx
        return start_idx * 0.02, out
