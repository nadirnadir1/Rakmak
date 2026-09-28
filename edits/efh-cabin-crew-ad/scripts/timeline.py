"""Shared timeline for the EFH premium edit (all times in seconds)."""
FPS = 30
SPEED = 1.1                      # subtle pace-up for retention
HOOK_SRC = (9.72, 13.75)         # "+90% من خريجي المدرسة خدمو كمضيفات..." cold open
HOOK_VID_MIN = 10.0              # first clean frame after the airplane wipe
MAIN_SRC = (0.0, 45.55)          # talking part (end card + CapCut outro dropped)
END_DUR = 3.6                    # custom animated end card

H = (HOOK_SRC[1] - HOOK_SRC[0]) / SPEED
M = (MAIN_SRC[1] - MAIN_SRC[0]) / SPEED
T_MAIN = H
T_END = H + M
TOTAL = T_END + END_DUR


def src2out(s):
    return T_MAIN + (s - MAIN_SRC[0]) / SPEED


# (src_time, zoom) for the main section; 'ease' entries zoom smoothly
ZOOMS = [
    (0.00, 1.00), (3.02, 1.10), (4.47, 1.00), (6.55, 'ease', 1.08, 0.6),
    (10.00, 1.00), (12.80, 1.08), (13.83, 1.00), (14.06, 1.10), (15.90, 1.00),
    (16.91, 1.08), (19.20, 1.00), (21.10, 1.10), (22.53, 1.00), (24.07, 1.00),
    (26.60, 1.10), (28.18, 1.00), (30.47, 1.00), (31.52, 1.08), (33.77, 1.00),
    (34.67, 1.08), (36.53, 1.00), (37.60, 1.08), (38.99, 1.00), (39.73, 1.14),
    (40.87, 1.00),
]

# airplane wipes already in the footage (src): (start, end)
WIPE_WIN = [(4.20, 4.47), (9.67, 10.00), (18.93, 19.20), (23.73, 24.07), (30.13, 30.47),
            (36.23, 36.53), (39.47, 39.73)]
WIPES = [(a + b) / 2 - 0.1 for a, b in WIPE_WIN]   # whoosh sfx anchors

# background plan for the main section (src ranges); None = original background
BG_PLAN = [
    (4.47, 9.67, 'brand'), (14.06, 18.93, 'dep'), (24.07, 30.13, 'globe'),
    (30.47, 33.26, 'sunset'), (36.53, 39.47, 'brand2'), (39.73, 40.87, 'burst'),
]
IRIS = [14.06, 33.26]                 # bg changes that are not hidden by a wipe
PUNCH_SHAKE = [39.73]            # "التسجيلات مفتوحة دابا"
DING = [39.78]
