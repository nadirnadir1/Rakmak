"""Tile still frames into one contact sheet: python3 contact_sheet.py out.jpg cols width img1 img2 ..."""
import sys
from PIL import Image, ImageDraw
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
ims = [Image.open(p).convert('RGB') for p in sys.argv[4:]]
h = int(w * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols - 1) * 6, rows * (h + 26)), (40, 40, 40))
for i, (im, p) in enumerate(zip(ims, sys.argv[4:])):
    x, y = (i % cols) * (w + 6), (i // cols) * (h + 26)
    sheet.paste(im.resize((w, h), Image.LANCZOS), (x, y + 26))
    ImageDraw.Draw(sheet).text((x + 4, y + 6), p.split('/')[-1], fill=(255, 255, 0))
sheet.save(out, quality=88)
