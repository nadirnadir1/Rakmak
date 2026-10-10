import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro(sys.argv[1] + "/kokoro-v1.0.onnx", sys.argv[1] + "/voices-v1.0.bin")
print(sorted(k.get_voices()))
lines = json.load(open(sys.argv[2]))
for name, voice, speed, text in lines:
    a, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
    sf.write(f"{sys.argv[3]}/{name}.wav", a, sr)
    print(name, voice, round(len(a) / sr, 2), "s")
