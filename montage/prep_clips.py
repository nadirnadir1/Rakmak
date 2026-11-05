"""Cut, scale (1080x1920 @30fps), sharpen and grade every shot used in the montage.

usage: prep_clips.py WORK_DIR
WORK_DIR holds src/ (originals) and blur/ (face-blurred crowd clips).
Writes WORK_DIR/shots/<name>.mp4
"""
import os, subprocess, sys

WORK = sys.argv[1]
OUT = os.path.join(WORK, "shots")
os.makedirs(OUT, exist_ok=True)

GRADE_BROLL = "eq=contrast=1.05:saturation=1.12:gamma=0.99,colorbalance=rm=0.015:bm=-0.015:rh=0.01:bh=-0.01"
GRADE_SPEECH = "eq=contrast=1.06:saturation=1.03:gamma=0.98"
SHARP = "unsharp=5:5:0.75:5:5:0.0"

# name: (source, in-point, duration, kind)
SHOTS = {
    "H2": ("blur/v48a_blur.mp4", 56.60, 2.60, "broll"),
    "T1": ("blur/v47_blur.mp4", 1.00, 2.30, "broll"),
    "T2": ("blur/v47_blur.mp4", 5.00, 2.40, "broll"),
    "M1": ("blur/v48a_blur.mp4", 20.00, 2.40, "broll"),
    "M2": ("blur/v48a_blur.mp4", 53.00, 2.40, "broll"),
    "M4": ("blur/v18_blur.mp4", 2.00, 2.40, "broll"),
    "O1": ("blur/v18_blur.mp4", 8.30, 3.70, "broll"),
    "I2": ("blur/v47_blur.mp4", 8.50, 6.00, "broll"),
    "G": ("src/v21.mp4", 0.70, 38.40, "speech"),
    "B": ("src/v19.mp4", 0.30, 72.10, "speech"),
}


def run(name, src, ss, dur, kind):
    if kind == "speech":
        vf = f"fps=30,scale=1080:1938:flags=lanczos,crop=1080:1920:0:9,{SHARP},{GRADE_SPEECH}"
    else:
        vf = f"fps=30,scale=1080:1920:flags=lanczos,{GRADE_BROLL}"
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{ss:.3f}", "-i", os.path.join(WORK, src),
           "-t", f"{dur:.3f}", "-an", "-vf", vf, "-c:v", "libx264", "-crf", "12",
           "-preset", "fast", "-pix_fmt", "yuv420p", os.path.join(OUT, name + ".mp4")]
    subprocess.run(cmd, check=True)
    print("ok", name)


if __name__ == "__main__":
    for k, v in SHOTS.items():
        run(k, *v)
