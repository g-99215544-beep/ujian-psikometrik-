from pathlib import Path

import fitz
from PIL import Image, ImageChops


PDF_PATH = Path("UJIAN PSIKOMETRIK T6.pdf")
OUT_DIR = Path("assets/bahagian-b")

# Rectangles are PDF points: (page_number, x0, y0, x1, y1).
# They intentionally exclude the page header/footer and include each complete
# question block exactly as printed in the source PDF.
QUESTION_RECTS = {
    1: (7, 88, 168, 530, 315),
    2: (7, 88, 334, 530, 455),
    3: (7, 88, 488, 530, 660),
    4: (8, 88, 62, 530, 216),
    5: (8, 88, 224, 530, 368),
    6: (8, 88, 378, 530, 696),
    7: (9, 88, 62, 530, 341),
    8: (9, 88, 362, 530, 512),
    9: (10, 88, 60, 530, 348),
    10: (10, 88, 370, 530, 527),
    11: (10, 88, 548, 530, 690),
    12: (11, 88, 64, 530, 696),
    13: (12, 88, 66, 530, 184),
    14: (12, 88, 218, 530, 434),
    15: (12, 88, 460, 530, 612),
    16: (13, 88, 64, 530, 371),
    17: (13, 88, 402, 530, 573),
    18: (14, 88, 64, 530, 222),
    19: (14, 88, 248, 530, 406),
    20: (14, 88, 429, 530, 583),
    21: (15, 88, 64, 530, 432),
    22: (15, 88, 434, 530, 670),
    23: (16, 88, 64, 530, 202),
    24: (16, 88, 228, 530, 400),
    25: (16, 88, 426, 530, 592),
    26: (17, 88, 64, 530, 210),
    27: (17, 88, 236, 530, 378),
    28: (17, 88, 390, 530, 553),
    29: (18, 88, 64, 530, 230),
    30: (18, 88, 244, 530, 438),
}


def trim_white_border(image: Image.Image, padding: int = 22) -> Image.Image:
    rgb = image.convert("RGB")
    bg = Image.new("RGB", rgb.size, (255, 255, 255))
    diff = ImageChops.difference(rgb, bg)
    bbox = diff.getbbox()
    if not bbox:
        return rgb

    left = max(bbox[0] - padding, 0)
    top = max(bbox[1] - padding, 0)
    right = min(bbox[2] + padding, rgb.width)
    bottom = min(bbox[3] + padding, rgb.height)
    return rgb.crop((left, top, right, bottom))


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pdf = fitz.open(PDF_PATH)
    zoom = 3.0
    matrix = fitz.Matrix(zoom, zoom)

    for no, (page_no, x0, y0, x1, y1) in QUESTION_RECTS.items():
        page = pdf[page_no - 1]
        clip = fitz.Rect(x0, y0, x1, y1)
        pix = page.get_pixmap(matrix=matrix, clip=clip, alpha=False)
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        image = trim_white_border(image)
        image.save(OUT_DIR / f"q{no:02d}.png", optimize=True)

    print(f"Generated {len(QUESTION_RECTS)} images in {OUT_DIR}")


if __name__ == "__main__":
    main()
