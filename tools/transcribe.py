"""Transcribe a WAV with faster-whisper; writes JSON with segments + word timings."""
import json, sys
from faster_whisper import WhisperModel
import soundfile as sf, numpy as np

model_dir, wav, out, lang = sys.argv[1], sys.argv[2], sys.argv[3], (sys.argv[4] if len(sys.argv) > 4 else None)
prompt = sys.argv[5] if len(sys.argv) > 5 else None
m = WhisperModel(model_dir, device="cpu", compute_type="int8", cpu_threads=4)
audio, sr = sf.read(wav, dtype="float32")
assert sr == 16000
if audio.ndim > 1: audio = audio.mean(1)
segs, info = m.transcribe(audio, language=lang, beam_size=5, best_of=5, word_timestamps=True,
                          vad_filter=False, condition_on_previous_text=True,
                          initial_prompt=prompt, temperature=[0.0, 0.2, 0.4])
res = {"language": info.language, "prob": info.language_probability, "segments": []}
for s in segs:
    res["segments"].append({"start": s.start, "end": s.end, "text": s.text,
                            "avg_logprob": s.avg_logprob, "no_speech": s.no_speech_prob,
                            "words": [{"s": w.start, "e": w.end, "w": w.word, "p": w.probability} for w in (s.words or [])]})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] ({s.avg_logprob:.2f}) {s.text}", flush=True)
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
print("LANG", info.language, info.language_probability)
