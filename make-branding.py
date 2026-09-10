"""Build Lantern Alley's icon source and social-link preview from game art.

The mark intentionally uses the existing painted map and floor lantern. That
keeps sharing and install surfaces visually tied to the playable world instead
of introducing a second illustration style.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
MAP = ROOT / "assets" / "map" / "lantern-alley-map-HQ.png"
LANTERN = ROOT / "assets" / "home" / "decor" / "floor-lantern-v1.webp"
MARK = ROOT / "assets" / "branding" / "lantern-mark-v1.png"
SHARE = ROOT / "assets" / "social" / "lantern-alley-share-v1.jpg"
NAVY = (14, 24, 48)
CREAM = (255, 240, 207)
AMBER = (247, 200, 119)
FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")
FONT_JP = Path("C:/Windows/Fonts/yumin.ttf")


def cover(image, size):
    """Resize and center-crop an image to a fixed canvas."""
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def radial_glow(size, center, radius, color):
    """Return an alpha glow that fades from the lantern outward."""
    layer = Image.new("RGBA", size)
    pixels = layer.load()
    cx, cy = center
    for y in range(size[1]):
        for x in range(size[0]):
            distance = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            strength = max(0.0, 1.0 - distance / radius) ** 2
            if strength:
                pixels[x, y] = (*color, round(150 * strength))
    return layer


def paste_lantern(canvas, lantern, box):
    art = lantern.copy()
    art.thumbnail(box, Image.Resampling.LANCZOS)
    x = (canvas.width - art.width) // 2
    y = (canvas.height - art.height) // 2
    canvas.alpha_composite(art, (x, y))
    return art.size


def build_mark(map_image, lantern):
    size = (1024, 1024)
    scene = cover(map_image, size).convert("RGBA")
    scene = scene.filter(ImageFilter.GaussianBlur(3))
    dark = Image.new("RGBA", size, (*NAVY, 212))
    mark = Image.alpha_composite(scene, dark)
    mark = Image.alpha_composite(mark, radial_glow(size, (512, 520), 420, AMBER))
    paste_lantern(mark, lantern, (430, 650))
    MARK.parent.mkdir(parents=True, exist_ok=True)
    mark.convert("RGB").save(MARK, "PNG", optimize=True)


def build_share(map_image, lantern):
    size = (1200, 630)
    scene = cover(map_image, size).convert("RGBA")
    shade = Image.new("RGBA", size, (5, 12, 28, 0))
    draw = ImageDraw.Draw(shade)
    for x in range(size[0]):
        alpha = round(218 * max(0, 1 - x / 820) ** 1.6)
        draw.line((x, 0, x, size[1]), fill=(5, 12, 28, alpha))
    share = Image.alpha_composite(scene, shade)
    share = Image.alpha_composite(share, radial_glow(size, (175, 315), 245, AMBER))

    art = lantern.copy()
    art.thumbnail((200, 270), Image.Resampling.LANCZOS)
    share.alpha_composite(art, (75, 170))

    draw = ImageDraw.Draw(share)
    english = ImageFont.truetype(str(FONT_BOLD), 70)
    japanese = ImageFont.truetype(str(FONT_JP), 88)
    detail = ImageFont.truetype(str(FONT_BOLD), 23)
    draw.text((305, 182), "LANTERN ALLEY", font=english, fill=CREAM, stroke_width=1, stroke_fill=(8, 15, 31))
    draw.text((305, 266), "言葉の路地", font=japanese, fill=AMBER, stroke_width=1, stroke_fill=(8, 15, 31))
    draw.line((308, 376, 700, 376), fill=AMBER, width=3)
    draw.text((308, 401), "A Japanese story-walk for JLPT N2", font=detail, fill=CREAM)
    SHARE.parent.mkdir(parents=True, exist_ok=True)
    share.convert("RGB").save(SHARE, "JPEG", quality=90, optimize=True)


def main():
    map_image = Image.open(MAP).convert("RGB")
    lantern = Image.open(LANTERN).convert("RGBA")
    build_mark(map_image, lantern)
    build_share(map_image, lantern)
    print(MARK.relative_to(ROOT))
    print(SHARE.relative_to(ROOT))


if __name__ == "__main__":
    main()
