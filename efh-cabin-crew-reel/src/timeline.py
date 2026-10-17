"""Master timeline, locked to the pauses in the uploaded voice-over.

Phrase boundaries come from silence detection on the narration
(ffmpeg silencedetect, -35 dB, 0.18 s). Every cut sits inside a pause.
"""

FPS = 30
W, H = 1080, 1920
VOICE_END = 43.0
DURATION = 46.5          # voice + 3.5 s hold on the contact card (limit: 50 s)

# Spoken phrases (start, end) in seconds, measured from the audio.
PHRASES = [
    (0.00, 3.56), (3.80, 7.24), (7.47, 10.80), (11.06, 14.59), (14.86, 16.68),
    (17.01, 18.42), (18.77, 21.81), (22.11, 22.46), (22.65, 26.66), (26.94, 28.21),
    (28.51, 33.13), (33.38, 38.58), (38.79, 41.45), (41.65, 43.00),
]

# Scene boundaries (mid-pause points).
S = [0.0, 3.68, 10.93, 18.60, 26.80, 33.25, 41.55, DURATION]
