# Quantizes entry.png to a 256-colour palette PNG (same 1024x1024 pixels,
# far smaller file; flat newspaper art loses nothing visible).
# Run after render.mjs: python3 optimize.py
from PIL import Image

im = Image.open("entry.png").convert("RGB")
q = im.quantize(colors=256, method=Image.MEDIANCUT)
q.save("entry.png", optimize=True)
print("optimized entry.png")
