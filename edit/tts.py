"""Radio lines with kokoro-onnx; a voice can be a blend like 'am_michael:0.6+am_fenrir:0.4'."""
import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro(sys.argv[1] + "/kokoro-v1.0.onnx", sys.argv[1] + "/voices-v1.0.bin")

def voice(spec):
    if "+" not in spec and ":" not in spec:
        return spec
    style = 0
    for part in spec.split("+"):
        name, w = part.split(":")
        style = style + k.get_voice_style(name) * float(w)
    return style

for name, spec, speed, text in json.load(open(sys.argv[2])):
    a, sr = k.create(text, voice=voice(spec), speed=speed, lang="en-us")
    sf.write(f"{sys.argv[3]}/{name}.wav", a, sr)
    print(name, round(len(a) / sr, 2), "s")
