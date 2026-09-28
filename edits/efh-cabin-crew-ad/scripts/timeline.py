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
    (0.00, 1.00), (3.02, 1.12), (4.35, 1.00), (6.55, 'ease', 1.10, 0.6),
    (9.70, 1.00), (12.80, 1.10), (13.83, 1.00), (14.06, 1.14), (15.63, 1.00),
    (16.91, 1.10), (18.90, 1.00), (21.10, 1.12), (22.53, 1.00), (23.73, 1.00),
    (26.60, 1.12), (28.18, 1.00), (30.02, 1.00), (31.52, 1.10), (33.77, 1.00),
    (34.67, 1.10), (36.10, 1.00), (37.60, 1.10), (38.99, 1.00), (39.43, 1.18),
    (40.87, 1.00),
]

# airplane wipes already in the footage (src) -> whoosh sfx
WIPES = [4.05, 9.55, 23.55, 29.85, 36.05]
PUNCH_SHAKE = [39.43]            # "التسجيلات مفتوحة دابا"
DING = [39.50]
