"""v2 renderer: original colors, animated background replacement, parallax, new hook."""
import sys, math, subprocess
import numpy as np, cv2
from timeline import *
import render as R
import backgrounds as B

W, HH = 1080, 1920
ALPHA_DIR = 'alpha'


def load_alpha(ts):
    i = int(round(ts * FPS))
    a = cv2.imread(f'{ALPHA_DIR}/{i:05d}.png', 0)
    if a is None:
        return None
    a = a.astype(np.float32) / 255
    # fill holes enclosed by the body (white shirt sometimes reads as background)
    m = (a > 0.97).astype(np.uint8)
    ff = np.pad(1 - m, 1, constant_values=1).astype(np.uint8)
    cv2.floodFill(ff, None, (0, 0), 2)
    holes = (ff[1:-1, 1:-1] == 1).astype(np.float32)
    if holes.any():
        a = np.maximum(a, cv2.GaussianBlur(cv2.dilate(holes, np.ones((5, 5), np.uint8)), (0, 0), 2))
    # keep only the main subject (drop floating blobs)
    m = (a > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    if n > 2:
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        keep = (lab == big).astype(np.uint8)
        keep = cv2.dilate(keep, np.ones((31, 31), np.uint8))
        a *= cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 6)
    return a


def composite(fg, a, bg):
    a3 = a[..., None]
    out = fg * a3 + bg * (1 - a3)
    # light wrap: let a little of the new background bleed into the subject's edge
    inv = cv2.GaussianBlur(1 - a, (0, 0), 9)
    lw = (inv * a * 0.45)[..., None]
    bgb = cv2.resize(cv2.GaussianBlur(cv2.resize(bg, (W // 4, HH // 4)), (0, 0), 3), (W, HH))
    return out * (1 - lw) + bgb * lw


def bg_kind(ts):
    for a, b, k in BG_PLAN:
        if a <= ts < b:
            return k, ts - a
    return None, 0.0


def in_wipe(ts):
    return any(a <= ts < b for a, b in WIPE_WIN)


def zoom2(img, z, ax=540, ay=820, dx=0, dy=0, interp=cv2.INTER_LINEAR):
    if abs(z - 1) < 1e-4 and dx == 0 and dy == 0:
        return img
    M = np.float32([[z, 0, ax - ax * z + dx], [0, z, ay - ay * z + dy]])
    return cv2.warpAffine(img, M, (W, HH), flags=interp, borderMode=cv2.BORDER_REFLECT)


def render(out_path, stills=None):
    L = R.build_layers()
    bgs = {'sky': B.Sky(), 'sunset': B.Sky(sunset=True, seed=4), 'brand': B.Brand(),
           'brand2': B.Brand(seed=11, accent='#ffd36a'), 'dep': B.Departures(), 'globe': B.Globe(),
           'burst': B.Burst()}
    endbg = B.Brand(seed=21)
    endbg.l_a = endbg.l_a * 0            # no background logo on the end card (card has it)
    endbg.l_glow = endbg.l_glow * 0
    hook_r = R.Reader(HOOK_VID_MIN)
    main_r = R.Reader(MAIN_SRC[0])
    nframes = int(round(TOTAL * FPS))
    enc = None
    want = set()
    if stills is None:
        enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24',
                                '-s', f'{W}x{HH}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264',
                                '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
                                '-profile:v', 'high', '-movflags', '+faststart', out_path],
                               stdin=subprocess.PIPE)
    else:
        want = set(int(round(s * FPS)) for s in stills)
    for i in range(nframes):
        t = i / FPS
        if stills is not None:
            if i > max(want): break
            if i not in want: continue
        if t < T_MAIN:
            # ---------------- HOOK: presenter above the clouds, jet passing behind her
            ts = HOOK_SRC[0] + t * SPEED
            tv = max(ts, HOOK_VID_MIN)
            src = hook_r.get(tv).astype(np.float32) / 255
            a = load_alpha(tv)
            zf = 1.30 - 0.22 * R.ease_out(t / 0.45) + 0.05 * R.clamp01(t / T_MAIN)
            zb = 1.18 - 0.14 * R.ease_out(t / 0.8) + 0.03 * R.clamp01(t / T_MAIN)
            px = 720 - (t / 2.6) * 1300
            bg = bgs['sky'].frame(t + 2.0, plane=(px, 150 + t * 10, True))
            bg = zoom2(bg, zb, 540, 700)
            fg = zoom2(src, zf, 540, 520, interp=cv2.INTER_CUBIC)
            az = zoom2(a, zf, 540, 520)
            f = composite(fg, az, bg)
        elif t < T_END:
            ts = (t - T_MAIN) * SPEED + MAIN_SRC[0]
            src = main_r.get(ts).astype(np.float32) / 255
            z = R.main_zoom(ts)
            k = t - T_MAIN
            z += 0.22 * (1 - R.ease_out(k / 0.35))           # drop punch-in
            dx = dy = 0
            for sh in PUNCH_SHAKE:
                d = ts - sh
                if 0 <= d < 0.35:
                    amp = 14 * (1 - d / 0.35)
                    dx, dy = amp * math.sin(d * 90), amp * math.cos(d * 70)
            fg = zoom2(src, z, 540, 820, dx, dy, interp=cv2.INTER_CUBIC)
            az = None

            def comp_for(kind, u):
                nonlocal az
                if kind is None:
                    return fg
                if az is None:
                    az = zoom2(load_alpha(ts), z, 540, 820, dx, dy)
                bg = bgs[kind].frame(u)
                zb = 1 + (z - 1) * 0.35 + 0.012 * u          # parallax: background moves less
                bg = zoom2(bg, zb, 540, 820, dx * 0.3, dy * 0.3)
                return composite(fg, az, bg)

            kind, u = bg_kind(ts)
            f = fg if in_wipe(ts) else comp_for(kind, u)
            for ir in IRIS:                                  # iris reveal between backgrounds
                d = ts - ir
                if 0 <= d < 0.4 and not in_wipe(ts):
                    ok, ou = bg_kind(ir - 0.01)
                    old = comp_for(ok, ou + d)
                    r = 60 + R.ease_out(d / 0.4) * 1500
                    yy, xx = np.ogrid[0:HH, 0:W]
                    dist = np.sqrt((xx - 540.0) ** 2 + (yy - 520.0) ** 2).astype(np.float32)
                    m = np.clip((r - dist) / 18, 0, 1)[..., None]
                    f = f * m + old * (1 - m)
                    ring = np.exp(-((dist - r) / 10) ** 2)[..., None]
                    f = f + ring * np.array([0.35, 0.8, 1.0], np.float32) * 0.9 * (1 - d / 0.4)
            if 39.75 <= ts < 40.2:                           # warm glow on "registrations open"
                g = math.sin(math.pi * (ts - 39.75) / 0.45) * 0.08
                f = np.clip(f + g * np.array([0.1, 0.65, 1.0], np.float32), 0, 1.2)
        else:
            k = t - T_END
            f = endbg.frame(k + 1.0)
            B.draw_plane(f, 1150 - k * 520, 1640 - k * 40, big=False, trail_len=700)
            s = R.ease_back(k / 0.45)
            L['logo'].draw(f, 540, 520, 0.6 + 0.4 * s, R.clamp01(k / 0.2))
            if k > 1.3:
                sx = -300 + (k - 1.3) / 0.6 * 1600
                if sx < 1400:
                    lw, lh = L['logo_w']
                    sl = (slice(520 - lh // 2, 520 + lh // 2), slice(540 - lw // 2 + 18, 540 + lw // 2 - 18))
                    tmp = f[sl].copy()
                    L['shine'].draw(tmp, sx - (540 - lw // 2 + 18), lh // 2, 1.0, 0.8)
                    f[sl] = tmp
            for key, y, t0 in (('title', 800, 0.2), ('sub', 900, 0.35), ('r1', 1060, 0.5),
                               ('r2', 1205, 0.7), ('r3', 1350, 0.9), ('cta', 1490, 1.15)):
                uu = (k - t0) / 0.35
                if uu > 0:
                    L[key].draw(f, 540, y + 40 * (1 - R.ease_out(uu)), 0.92 + 0.08 * R.ease_back(uu),
                                R.clamp01(uu * 1.6))
        f = np.ascontiguousarray(np.clip(f, 0, 1), dtype=np.float32)
        R.progress_bar(f, t)
        for c in (T_MAIN, T_END):
            d = t - c
            if -0.1 <= d < 0:
                R.flash(f, 0.6 * (1 + d / 0.1))
            elif 0 <= d < 0.22:
                R.flash(f, 0.85 * (1 - d / 0.22) ** 2)
        out8 = (np.clip(f, 0, 1) * 255 + 0.5).astype(np.uint8)
        if enc:
            enc.stdin.write(out8.tobytes())
        else:
            cv2.imwrite(f'v2_{t:05.2f}.jpg', out8, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if i % 150 == 0:
            print(f'{i}/{nframes}', flush=True)
    if enc:
        enc.stdin.close(); enc.wait()


if __name__ == '__main__':
    if sys.argv[1] == 'stills':
        render(None, [float(x) for x in sys.argv[2:]])
    else:
        render(sys.argv[1])
