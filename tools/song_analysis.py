"""Beat grid + loudness envelope of the music track (for cutting on the beat)."""
import sys, json, numpy as np, librosa
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
rms = librosa.feature.rms(y=y, hop_length=512)[0]
t = librosa.times_like(rms, sr=sr, hop_length=512)
print("tempo", tempo)
# loudness per second
for s in range(0, int(len(y) / sr), 2):
    m = (t >= s) & (t < s + 2)
    db = 20 * np.log10(rms[m].mean() + 1e-9)
    nb = ((beats >= s) & (beats < s + 2)).sum()
    print(f"{s:4d}s {db:6.1f}dB " + "#" * int(max(0, db + 40)) + f"  beats:{nb}")
json.dump({"tempo": float(np.atleast_1d(tempo)[0]), "beats": [float(b) for b in beats]}, open(sys.argv[2], "w"))
