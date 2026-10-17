"""Transcribe the voiceover with Whisper large-v3 (sherpa-onnx, int8) and dump
segment + token timestamps to JSON. Usage: python3 transcribe.py <model_dir> <wav16k> <out.json>"""
import sys, json, time
import numpy as np, soundfile as sf, sherpa_onnx

mdir, wav, out = sys.argv[1], sys.argv[2], sys.argv[3]
lang = sys.argv[4] if len(sys.argv) > 4 else "ar"
rec = sherpa_onnx.OfflineRecognizer.from_whisper(
    encoder=f"{mdir}/large-v3-encoder.int8.onnx",
    decoder=f"{mdir}/large-v3-decoder.int8.onnx",
    tokens=f"{mdir}/large-v3-tokens.txt",
    language=lang, task="transcribe", num_threads=4,
    enable_token_timestamps=True, enable_segment_timestamps=True,
)
audio, sr = sf.read(wav, dtype="float32")
assert sr == 16000
res = {"chunks": []}
# Whisper works on 30 s windows: transcribe in chunks split at known pauses.
cuts = [0.0] + [float(c) for c in (sys.argv[5].split(",") if len(sys.argv) > 5 else [])] + [len(audio) / sr]
for a, b in zip(cuts[:-1], cuts[1:]):
    t0 = time.time()
    s = rec.create_stream()
    s.accept_waveform(sr, audio[int(a * sr):int(b * sr)])
    rec.decode_stream(s)
    r = s.result
    d = {"start": a, "end": b, "text": r.text,
         "tokens": list(r.tokens), "timestamps": [a + t for t in r.timestamps],
         "durations": list(getattr(r, "durations", []) or [])}
    for k in ("segment_timestamps", "segment_durations", "segment_texts"):
        if hasattr(r, k):
            v = getattr(r, k)
            d[k] = [a + x for x in v] if k == "segment_timestamps" else list(v)
    res["chunks"].append(d)
    print(f"[{a:6.2f}-{b:6.2f}] ({time.time()-t0:.1f}s) {r.text}", flush=True)
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
