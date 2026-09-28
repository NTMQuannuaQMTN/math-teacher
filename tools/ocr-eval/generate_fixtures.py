"""Renders tools/ocr-eval/cases.json into photo-like PNG/JPEG fixtures.

Synthetic images are no substitute for real phone photos, but they give a
repeatable baseline across categories (Vietnamese diacritics, fractions,
roots, systems, geometry notation, handwriting-style fonts, blur, negatives).
Usage: python3 tools/ocr-eval/generate_fixtures.py
"""
import json
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).parent
OUT = HERE / "fixtures"
FONTS = {
    "print": "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "hand": "/System/Library/Fonts/Noteworthy.ttc",
    "blur": "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
}
FALLBACK = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"


def font(style: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(FONTS[style], size)
    except OSError:
        return ImageFont.truetype(FALLBACK, size)


def render(case: dict) -> Image.Image:
    rng = random.Random(case["id"])
    width, line_h, size = 1400, 78, 46
    lines = case["lines"]
    extra = 170 if "fraction" in case else 0
    height = 160 + line_h * len(lines) + extra
    paper = (rng.randint(244, 252), rng.randint(240, 248), rng.randint(228, 238))
    img = Image.new("RGB", (width, height), paper)
    draw = ImageDraw.Draw(img)
    f = font(case["style"], size)
    ink = (28, 30, 40) if case["style"] != "hand" else (22, 44, 120)
    y = 70
    for line in lines:
        draw.text((80, y), line, font=f, fill=ink)
        y += line_h
    if "fraction" in case:
        fr = case["fraction"]
        x = 80
        draw.text((x, y + 45), fr["prefix"], font=f, fill=ink)
        x += draw.textlength(fr["prefix"], font=f) + 10
        w = max(draw.textlength(fr["num"], font=f), draw.textlength(fr["den"], font=f)) + 20
        draw.text((x + (w - draw.textlength(fr["num"], font=f)) / 2, y), fr["num"], font=f, fill=ink)
        draw.line((x, y + 72, x + w, y + 72), fill=ink, width=4)
        draw.text((x + (w - draw.textlength(fr["den"], font=f)) / 2, y + 84), fr["den"], font=f, fill=ink)
        draw.text((x + w + 10, y + 45), fr["suffix"], font=f, fill=ink)
    # Photo-like degradation: slight rotation, uneven lighting, noise.
    img = img.rotate(rng.uniform(-1.8, 1.8), expand=True, fillcolor=(90, 90, 95))
    shade = Image.linear_gradient("L").resize(img.size).point(lambda v: 255 - v // 7)
    img = Image.composite(img, Image.new("RGB", img.size, (170, 170, 175)), shade)
    if case["style"] == "blur":
        img = img.filter(ImageFilter.GaussianBlur(9))
    return img


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for case in json.loads((HERE / "cases.json").read_text(encoding="utf-8")):
        img = render(case)
        img.save(OUT / f"{case['id']}.jpg", quality=88)
        print("wrote", case["id"], img.size)


if __name__ == "__main__":
    main()
