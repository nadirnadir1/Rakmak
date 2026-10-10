# CN-RHR 737 MAX 8 — motion-tracked annotation pipeline

Output: `output/CN-RHR_737MAX8_annotated.mp4`. It is the original clip with text, leader lines and tracking dots composited on top. Footage, timing (variable-frame-rate timestamps kept frame-exact) and audio (stream-copied) are otherwise unchanged.

1. `track.py <frames_dir> spec.json tracks.json`: rigid-body tracking of each component. It runs LK optical flow on features inside a component polygon and fits a RANSAC similarity transform per frame. `spec.json` holds the keyframe polygons and anchor points.
2. `render.py tracks.json pts.txt <fonts_dir> <out_dir>`: renders one RGBA overlay per decoded frame, keyed to that frame's real timestamp. Font: Barlow Semi Condensed (OFL).
3. `validate.py <out_dir>/log.json`: checks every frame. Rules: approved labels only, max 2 labels, no title/label mix, no duplicates, no text overlap, text inside the 8% safe area, and dots stay well inside the frame.
4. Composite with ffmpeg (image-sequence overlay retimed to the source frame times, libx264 CRF 14, BT.709, `-c:a copy`).
5. `verify.py`: compares the exported frames to the source. Pixels outside the graphics differ by mean ≈2/255 (encoder noise), and each frame carries its own overlay (frame-exact sync).

## v2 — premium motion design (`output/CN-RHR_737MAX8_annotated_v2_premium.mp4`)

The v2 graphics layer is re-rendered with `render2.py` from the same tracking data, labels and story, then composited onto the untouched original footage. Compositing onto the flattened v1 would have doubled every label.

- **Three-stage reveal:** target acquisition (dot pops in with one expanding pulse, then a faint 1.6 s tracking pulse), a precision line draw (connector ≈0.22 s, then the underline with a short cyan accent), and the label rising from behind the underline (opacity + position, staggered per line).
- **Mirrored exit:** text fades, the underline retracts into the elbow, the connector retracts into the dot, then the dot collapses. Nothing ever detaches from the component.
- **Registration:** a two-line "AIRCRAFT REGISTRATION / CN-RHR" label, plus thin corner brackets that converge on the painted letters without covering them.
- **Refined anchors:** the chevron dot sits in the centre of a serration, and the registration dot sits just outside the brackets, beside the letters. Both are mapped through the existing per-frame transforms.
- **Titles:** the first line is a cinematic fade with drift and letter-spacing that tightens. The second is a masked, staggered rise with a thin cyan rule. Annotations start as it fades.
- **Checks:** `validate2.py` and `verify2.py` run the same per-frame checks as v1.
