"""Transcribe the voiceover phrase by phrase with Whisper large-v3 (sherpa-onnx).

Usage: python3 transcribe.py <model_dir> <vo16k.wav> <silences.txt> <out.json>
Phrases are cut at silences >= MIN_GAP seconds.
"""
import json, sys
import numpy as np
import soundfile as sf
import sherpa_onnx

MIN_GAP = 0.15

def main():
    model_dir, wav_path, sil_path, out_path = sys.argv[1:5]
    audio, sr = sf.read(wav_path, dtype="float32")
    assert sr == 16000
    total = len(audio) / sr
    sil = [tuple(map(float, l.split())) for l in open(sil_path) if l.strip()]
    cuts = [(a + b) / 2 for a, b in sil if b - a >= MIN_GAP]
    bounds = [0.0] + cuts + [total]
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=f"{model_dir}/large-v3-encoder.int8.onnx",
        decoder=f"{model_dir}/large-v3-decoder.int8.onnx",
        tokens=f"{model_dir}/large-v3-tokens.txt",
        language="ar", task="transcribe", num_threads=4,
    )
    out = []
    for i in range(len(bounds) - 1):
        s, e = bounds[i], bounds[i + 1]
        seg = audio[int(s * sr): int(e * sr)]
        seg = np.concatenate([np.zeros(int(0.2 * sr), np.float32), seg, np.zeros(int(0.3 * sr), np.float32)])
        st = rec.create_stream()
        st.accept_waveform(sr, seg)
        rec.decode_stream(st)
        txt = st.result.text.strip()
        print(f"[{s:6.2f}-{e:6.2f}] {txt}", flush=True)
        out.append({"start": round(s, 3), "end": round(e, 3), "text": txt})
    json.dump(out, open(out_path, "w"), ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()
