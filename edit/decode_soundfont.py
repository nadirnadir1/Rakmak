import re, base64, subprocess, sys, os, numpy as np
from concurrent.futures import ThreadPoolExecutor
src, dst = sys.argv[1], sys.argv[2]
def dec(b):
    p = subprocess.run(["ffmpeg","-v","error","-f","mp3","-i","-","-ac","1","-ar","44100","-f","f32le","-"], input=b, capture_output=True)
    return np.frombuffer(p.stdout, np.float32)
for fn in sorted(os.listdir(src)):
    name = fn[:-3]
    txt = open(os.path.join(src, fn)).read()
    items = re.findall(r'"([A-G]b?\d)":\s*"data:audio/mp3;base64,([A-Za-z0-9+/=]+)"', txt)
    with ThreadPoolExecutor(8) as ex:
        arrs = list(ex.map(lambda kv: dec(base64.b64decode(kv[1])), items))
    d = {k: a for (k, _), a in zip(items, arrs)}
    np.savez(os.path.join(dst, name + ".npz"), **d)
    lens = [len(a)/44100 for a in arrs]
    print(name, len(d), "notes, len %.2f-%.2fs" % (min(lens), max(lens)), "peak %.2f" % max(np.abs(a).max() for a in arrs))
