"""
Generate synthetic product images for the mock API: same file name, same pixel size,
same PNG/RGBA format and (within ~2 %) the same byte size as FakeStore's originals, so
that image download cost - which dominates LCP on slow networks - is preserved without
redistributing the original product photos.

usage: python3 make_synthetic_images.py <dir-with-original-pngs> <products.json> <out-dir>
Writes <out-dir>/<name>.png and prints a size report.
"""
import io
import json
import os
import random
import sys

from PIL import Image, ImageDraw

src, products_json, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
products = json.load(open(products_json))
PALETTE = [(42, 120, 214), (235, 104, 52), (27, 175, 122), (140, 90, 200), (200, 160, 40)]


def render(w, h, pid, title, noise_rows):
    rnd = random.Random(pid)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))  # transparent background like the originals
    d = ImageDraw.Draw(im)
    color = PALETTE[pid % len(PALETTE)]
    m = int(min(w, h) * 0.08)
    d.rounded_rectangle([m, m, w - m, h - m], radius=m, fill=color + (255,))
    d.ellipse([w * 0.3, h * 0.25, w * 0.7, h * 0.55], fill=(255, 255, 255, 220))
    # Textured band (random pixels), anchored at the bottom - its height is tuned so the PNG
    # matches the original byte size.
    if noise_rows > 0:
        rows = min(noise_rows, h - 2 * m)
        band = Image.frombytes("RGBA", (w - 2 * m, rows), bytes(rnd.getrandbits(8) for _ in range((w - 2 * m) * rows * 4)))
        im.paste(band, (m, h - m - rows))
    d.text((m * 1.5, m * 1.5), f"#{pid} synthetic image", fill=(255, 255, 255, 255))
    d.text((m * 1.5, m * 2.2), title[:38], fill=(255, 255, 255, 255))
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=False, compress_level=6)
    return buf.getvalue()


report = []
for p in products:
    name = p["image"].rsplit("/", 1)[1]
    orig = Image.open(os.path.join(src, name))
    target = os.path.getsize(os.path.join(src, name))
    w, h = orig.size
    lo, hi = 0, h
    best = None
    for _ in range(18):  # binary search on the textured band height
        mid = (lo + hi) // 2
        data = render(w, h, p["id"], p["title"], mid)
        if best is None or abs(len(data) - target) < abs(len(best) - target):
            best = data
        if len(data) < target:
            lo = mid + 1
        else:
            hi = mid - 1
        if lo > hi:
            break
    open(os.path.join(out, name), "wb").write(best)
    report.append((p["id"], name, (w, h), target, len(best), 100 * (len(best) - target) / target))

for r in report:
    print(f"{r[0]:>2} {r[1]:45} {str(r[2]):12} orig {r[3]:>7} synth {r[4]:>7}  {r[5]:+.1f}%")
print("total orig KB", sum(r[3] for r in report) // 1024, "synthetic KB", sum(r[4] for r in report) // 1024)
