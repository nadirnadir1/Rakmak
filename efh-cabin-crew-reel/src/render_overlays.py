"""Render every text/logo overlay as a transparent 1080x1920 PNG.

Chromium does the Arabic shaping (joined letters, RTL), so the text is
always correct. Run: python3 src/render_overlays.py
"""
from pathlib import Path

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"
OUT = ROOT / "build" / "overlays"
OUT.mkdir(parents=True, exist_ok=True)

SKY = "#8CC8FF"
ORANGE = "#F28C1B"

# Caption block sits in the lower third, above the TikTok/Reels caption zone.
CAPTION_TOP = 1230


def make_logo():
    """Turn the white-on-black EFH logo into a clean transparent PNG."""
    src = np.asarray(Image.open(ROOT / "assets" / "logo_white_src.jpg").convert("RGB")).astype(np.float32)
    lum = src.max(axis=2)
    alpha = np.clip((lum - 28) / (170 - 28), 0, 1)
    rgb = np.clip(src / np.maximum(alpha[..., None], 1e-3), 0, 255)
    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")
    img = img.crop(img.getbbox())
    path = ROOT / "build" / "logo_white.png"
    img.save(path)
    return path


BASE_CSS = f"""
@font-face {{ font-family: Cairo; font-weight: 500; src: url('{(FONTS / "Cairo-500.ttf").as_uri()}'); }}
@font-face {{ font-family: Cairo; font-weight: 700; src: url('{(FONTS / "Cairo-700.ttf").as_uri()}'); }}
@font-face {{ font-family: Cairo; font-weight: 800; src: url('{(FONTS / "Cairo-800.ttf").as_uri()}'); }}
@font-face {{ font-family: Montserrat; font-weight: 500; src: url('{(FONTS / "Montserrat-500.ttf").as_uri()}'); }}
@font-face {{ font-family: Montserrat; font-weight: 600; src: url('{(FONTS / "Montserrat-600.ttf").as_uri()}'); }}
@font-face {{ font-family: Montserrat; font-weight: 700; src: url('{(FONTS / "Montserrat-700.ttf").as_uri()}'); }}
html, body {{ margin:0; padding:0; width:1080px; height:1920px; background: transparent; overflow:hidden; }}
.frame {{ position:absolute; inset:0; }}
.ar {{ font-family: Cairo; direction: rtl; color: #fff; text-align:center;
       text-shadow: 0 3px 18px rgba(4,12,32,.55), 0 1px 3px rgba(4,12,32,.6); }}
.hl {{ color: {SKY}; }}
.block {{ position:absolute; left:80px; right:80px; text-align:center; }}
"""


def caption(text_html, size=92, weight=800, top=CAPTION_TOP, extra=""):
    return f"""<div class="block ar" style="top:{top}px; font-size:{size}px; font-weight:{weight};
        line-height:1.32; {extra}">{text_html}</div>"""


def overlays(logo_uri):
    rule = f"display:inline-block;width:150px;height:3px;background:{SKY};vertical-align:middle;border-radius:2px"
    return {
        # Scene 1 - hook
        "s1_hook": caption('كاين اللي كيخلّص<br>باش يسافر...'),
        # Scene 2 - reveal
        "s2_reveal": caption('وكاين اللي السفر<br><span class="hl">جزء من خدمتو!</span>'),
        # Scene 3
        "s3_line": caption('كل نهار...<br><span class="hl">تجربة جديدة</span>'),
        # Scene 4
        "s4_cabin": f"""<div class="block" style="top:{CAPTION_TOP - 10}px; font-family:Montserrat; font-weight:700;
            font-size:96px; letter-spacing:.22em; color:#fff; padding-left:.22em;
            text-shadow:0 3px 22px rgba(4,12,32,.6);">CABIN CREW</div>
            <div class="block" style="top:{CAPTION_TOP + 112}px;"><span style="{rule}"></span></div>""",
        "s4_more": caption('أكثر من مجرد سفر', size=78, weight=700, top=CAPTION_TOP + 140),
        # Scene 5 keywords - stacked, each revealed on its own
        "s5_k1": caption('الانضباط', size=86, top=CAPTION_TOP - 40),
        "s5_k2": caption('التواصل', size=86, top=CAPTION_TOP + 70),
        "s5_k3": caption('<span class="hl">السلامة</span>', size=86, top=CAPTION_TOP + 180),
        # Scene 6
        "s6_q": caption('علاش ما تكونش<br><span class="hl">نتا؟</span>', size=100),
        # Scene 7 - brand reveal, built in layers for a staggered entrance
        "s7_logo": f"""<img src="{logo_uri}" style="position:absolute; left:150px; width:780px; top:1000px;">""",
        "s7_title": caption('تكوين مضيفات ومضيفي الطيران', size=58, weight=800, top=1245,
                            extra="white-space:nowrap; left:30px; right:30px;"),
        "s7_pills": f"""<div class="block ar" style="top:1352px; font-size:42px; font-weight:700; text-shadow:none;">
            <span style="background:{SKY}; color:#0B1E45; padding:4px 30px 10px; border-radius:40px;">التسجيل مفتوح الآن</span>
            <span style="display:inline-block;width:18px"></span>
            <span style="border:3px solid {ORANGE}; color:#fff; padding:2px 26px 8px; border-radius:40px;">الأماكن محدودة</span></div>""",
        "s7_contact": f"""<div class="block" style="top:1448px; font-family:Montserrat; color:#fff; direction:ltr;
            text-shadow:0 2px 12px rgba(4,12,32,.6);">
            <div style="font-size:52px; font-weight:700; letter-spacing:.02em;">+212 777 771 314</div>
            <div style="font-size:40px; font-weight:600; opacity:.92; margin-top:2px;">+212 777 771 712</div>
            <div style="font-size:38px; font-weight:600; color:{SKY}; margin-top:8px; letter-spacing:.04em;">www.flyhyani.ma</div>
            </div>""",
    }


def main():
    logo = make_logo()
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        page = browser.new_page(viewport={"width": 1080, "height": 1920})
        for name, body in overlays(logo.as_uri()).items():
            html = OUT / "_tmp.html"
            html.write_text(f"<html><head><meta charset='utf-8'><style>{BASE_CSS}</style></head>"
                            f"<body><div class='frame'>{body}</div></body></html>", encoding="utf-8")
            page.goto(html.as_uri())
            page.evaluate("document.fonts.ready.then(() => document.fonts.size)")
            page.wait_for_timeout(150)
            page.screenshot(path=str(OUT / f"{name}.png"), omit_background=True)
            print("rendered", name)
        browser.close()


if __name__ == "__main__":
    main()
