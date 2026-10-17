"""Transcribe each pause-delimited phrase separately with Whisper large-v3 (sherpa-onnx).
Usage: python3 transcribe_phrases.py <model_dir> <wav16k> <phrases.json> <out.json>"""
import sys, json, time
import numpy as np, soundfile as sf, sherpa_onnx
mdir, wav, pj, out = sys.argv[1:5]
rec = sherpa_onnx.OfflineRecognizer.from_whisper(
    encoder=f"{mdir}/large-v3-encoder.int8.onnx", decoder=f"{mdir}/large-v3-decoder.int8.onnx",
    tokens=f"{mdir}/large-v3-tokens.txt", language="ar", task="transcribe", num_threads=4)
audio, sr = sf.read(wav, dtype="float32")
pad = np.zeros(int(0.25 * sr), dtype=np.float32)
res = []
for a, b in json.load(open(pj)):
    t0 = time.time()
    s = rec.create_stream()
    s.accept_waveform(sr, np.concatenate([pad, audio[int(a * sr):int(b * sr)], pad]))
    rec.decode_stream(s)
    res.append({"start": a, "end": b, "text": s.result.text.strip()})
    print(f"[{a:6.2f}-{b:6.2f}] ({time.time()-t0:.0f}s) {s.result.text.strip()}", flush=True)
    json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
