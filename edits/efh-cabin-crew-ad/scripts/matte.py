"""Robust Video Matting pass over the source -> alpha PNGs (full res)."""
import sys, os, time, subprocess
import numpy as np, cv2, onnxruntime as ort
W, H = 1080, 1920
start, end = float(sys.argv[1]), float(sys.argv[2])
out = sys.argv[3] if len(sys.argv) > 3 else 'alpha'
os.makedirs(out, exist_ok=True)
so = ort.SessionOptions(); so.intra_op_num_threads = 4
sess = ort.InferenceSession('models/rvm_mobilenetv3_fp32.onnx', so, providers=['CPUExecutionProvider'])
rec = [np.zeros((1, 1, 1, 1), np.float32)] * 4
ds = np.array([0.3], np.float32)
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{start:.3f}', '-i', 'src.mp4', '-t', f'{end-start:.3f}',
                      '-an', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
i0 = int(round(start * 30)); i = 0; t0 = time.time()
while True:
    buf = p.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    x = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(np.float32).transpose(2, 0, 1)[None] / 255
    fgr, pha, *rec = sess.run(None, {'src': x, 'r1i': rec[0], 'r2i': rec[1], 'r3i': rec[2], 'r4i': rec[3], 'downsample_ratio': ds})
    a = (np.clip(pha[0, 0], 0, 1) * 255 + 0.5).astype(np.uint8)
    cv2.imwrite(f'{out}/{i0 + i:05d}.png', a)
    i += 1
    if i % 60 == 0: print(i, f'{(time.time()-t0)/i:.3f}s/f', flush=True)
print('done', i, f'{(time.time()-t0)/max(i,1):.3f}s/f')
