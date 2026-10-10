# CN-RHR 737 MAX 8 — motion-tracked annotation pipeline

Output: `output/CN-RHR_737MAX8_annotated.mp4`. It is the original clip with text, leader lines and tracking dots composited on top. Footage, timing (variable-frame-rate timestamps kept frame-exact) and audio (stream-copied) are otherwise unchanged.

1. `track.py <frames_dir> spec.json tracks.json`: rigid-body tracking of each component. It runs LK optical flow on features inside a component polygon and fits a RANSAC similarity transform per frame. `spec.json` holds the keyframe polygons and anchor points.
2. `render.py tracks.json pts.txt <fonts_dir> <out_dir>`: renders one RGBA overlay per decoded frame, keyed to that frame's real timestamp. Font: Barlow Semi Condensed (OFL).
3. `validate.py <out_dir>/log.json`: checks every frame. Rules: approved labels only, max 2 labels, no title/label mix, no duplicates, no text overlap, text inside the 8% safe area, and dots stay well inside the frame.
4. Composite with ffmpeg (image-sequence overlay retimed to the source frame times, libx264 CRF 14, BT.709, `-c:a copy`).
5. `verify.py`: compares the exported frames to the source. Pixels outside the graphics differ by mean ≈2/255 (encoder noise), and each frame carries its own overlay (frame-exact sync).
