from pathlib import Path
import json
import re

import fitz  # PyMuPDF
import pdfplumber
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "ujian tahun 4" / "Instrumen Aptitud Am Tahun 4 - Tahun 2026.pdf"
IMG_DIR = ROOT / "assets" / "tahun4-aptitud"
OUT_JS = ROOT / "data" / "tahun4-aptitud.generated.js"

# Kunci jawapan IAA_T4 (No -> A/B/C/D), dari PDF kunci jawapan.
ANSWER_KEY = {
    1: "D", 2: "C", 3: "B", 4: "A", 5: "C", 6: "B", 7: "A", 8: "A", 9: "C", 10: "C",
    11: "D", 12: "D", 13: "C", 14: "A", 15: "C", 16: "A", 17: "D", 18: "D", 19: "B", 20: "A",
    21: "B", 22: "C", 23: "D", 24: "D", 25: "C", 26: "B", 27: "B", 28: "D", 29: "B", 30: "C",
    31: "D", 32: "B", 33: "C", 34: "C", 35: "C", 36: "D", 37: "A", 38: "C", 39: "C", 40: "A",
    41: "D", 42: "C", 43: "B", 44: "C", 45: "B", 46: "D", 47: "D", 48: "D", 49: "C", 50: "C",
    51: "B", 52: "C", 53: "D", 54: "C", 55: "D", 56: "C", 57: "C", 58: "B", 59: "D", 60: "C",
    61: "B", 62: "B", 63: "B", 64: "D", 65: "A", 66: "C", 67: "D", 68: "A", 69: "C", 70: "B",
    71: "C", 72: "C", 73: "C", 74: "D", 75: "B", 76: "B", 77: "B", 78: "C", 79: "C", 80: "B",
}


def bahagian_for(no):
    if no <= 30:
        return "A", "Bahasa Melayu"
    if no <= 60:
        return "B", "Bahasa Inggeris"
    return "C", "Matematik"


# Page content band (PDF points). Page is 595x842; header at ~48pt,
# footer ("[Lihat halaman sebelah" / copyright) starts at ~748pt.
CONTENT_TOP = 62.0
CONTENT_BOTTOM = 742.0
LEFT = 62.0
RIGHT = 542.0

# Arahan (instruction) text for questions that belong to a multi-question group
# whose instruction is only printed once, above the FIRST question of the group.
# The first question's crop already contains the printed instruction, so only the
# trailing members need it surfaced as text in the UI.
ARAHAN = {
    2: "Pilih perkataan yang betul ejaannya.",
    4: "Pilih perkataan yang salah ejaannya.",
    5: "Pilih perkataan yang salah ejaannya.",
    6: "Pilih perkataan yang salah ejaannya.",
    12: "Pilih perkataan yang bukan dalam kumpulan yang sama.",
    13: "Pilih perkataan yang bukan dalam kumpulan yang sama.",
    53: "Which is not in the same group?",
    54: "Which is not in the same group?",
    55: "Which is not in the same group?",
}

# Manual override of crop rectangles for questions the auto bounds get wrong.
# Format: no -> (page_1based, x0, y0, x1, y1). Filled during visual QA (Task 2).
MANUAL_RECTS = {}

# Shared stimulus printed once above the FIRST question of a group, needed by a
# trailing question too. The strip is cropped and stacked above that question's
# own crop so it is self-contained. Format: no -> (page_1based, x0, y0, x1, y1).
STIMULUS_ABOVE = {
    28: (9, 62.0, 70.0, 542.0, 141.0),   # petikan umur Zaidi/Zahir/Kamal/Azhar
    30: (9, 62.0, 395.0, 542.0, 494.0),  # petikan anak Puan Siti
}


def page_features(page):
    """Return (number_anchors, option_bottoms) for a page.

    number_anchors: sorted list of (no, top) for question-number tokens in the
    left margin. option_bottoms: sorted list of bottoms of A/B/C/D option rows.
    """
    numbers = []
    option_bottoms = []
    for w in page.extract_words(x_tolerance=1, y_tolerance=2):
        if 66.0 <= w["x0"] <= 76.0 and re.fullmatch(r"\d{1,2}", w["text"]):
            numbers.append((int(w["text"]), float(w["top"])))
        elif 88.0 <= w["x0"] <= 102.0 and w["text"] in ("A", "B", "C", "D"):
            option_bottoms.append(float(w["bottom"]))
    numbers.sort(key=lambda a: a[1])
    option_bottoms.sort()
    return numbers, option_bottoms


def auto_rects():
    """Option-bounded crops.

    Each question runs from the bottom of the previous question's options (so it
    captures any stimulus/instruction printed above its number) down to the
    bottom of its own last option. The last question on a page extends to the
    content bottom so trailing image-only option blocks are included; whitespace
    is trimmed afterwards.
    """
    rects = {}
    with pdfplumber.open(PDF_PATH) as pdf:
        for pi, page in enumerate(pdf.pages):
            numbers, option_bottoms = page_features(page)
            numbers = [(n, t) for (n, t) in numbers if 1 <= n <= 80]
            prev_bottom = CONTENT_TOP
            for j, (no, top) in enumerate(numbers):
                is_last = j + 1 == len(numbers)
                next_top = CONTENT_BOTTOM if is_last else numbers[j + 1][1]
                # options belonging to this question: between its number and next
                own_opts = [b for b in option_bottoms if top - 2.0 < b < next_top]
                if is_last or not own_opts:
                    y1 = CONTENT_BOTTOM
                else:
                    y1 = min(max(own_opts) + 8.0, CONTENT_BOTTOM)
                y0 = max(prev_bottom - 2.0, CONTENT_TOP)
                rects[no] = (pi + 1, LEFT, y0, RIGHT, y1)
                prev_bottom = y1
    return rects


def trim_white_border(image, padding=20):
    rgb = image.convert("RGB")
    bg = Image.new("RGB", rgb.size, (255, 255, 255))
    bbox = ImageChops.difference(rgb, bg).getbbox()
    if not bbox:
        return rgb
    left = max(bbox[0] - padding, 0)
    top = max(bbox[1] - padding, 0)
    right = min(bbox[2] + padding, rgb.width)
    bottom = min(bbox[3] + padding, rgb.height)
    return rgb.crop((left, top, right, bottom))


def render_clip(doc, rect, matrix):
    page_no, x0, y0, x1, y1 = rect
    page = doc[page_no - 1]
    pix = page.get_pixmap(matrix=matrix, clip=fitz.Rect(x0, y0, x1, y1), alpha=False)
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)


def stack_vertical(top_img, bottom_img, gap=28):
    width = max(top_img.width, bottom_img.width)
    height = top_img.height + gap + bottom_img.height
    canvas = Image.new("RGB", (width, height), (255, 255, 255))
    canvas.paste(top_img, (0, 0))
    canvas.paste(bottom_img, (0, top_img.height + gap))
    return canvas


def render_images(rects):
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF_PATH)
    matrix = fitz.Matrix(3.0, 3.0)
    for no in range(1, 81):
        img = trim_white_border(render_clip(doc, MANUAL_RECTS.get(no, rects[no]), matrix))
        if no in STIMULUS_ABOVE:
            stim = trim_white_border(render_clip(doc, STIMULUS_ABOVE[no], matrix))
            img = stack_vertical(stim, img)
        img.save(IMG_DIR / f"q{no:02d}.png", optimize=True)


def write_js():
    items = []
    for no in range(1, 81):
        bah, nama = bahagian_for(no)
        item = {
            "no": no,
            "bahagian": bah,
            "bahagianNama": nama,
            "pdfImage": f"assets/tahun4-aptitud/q{no:02d}.png",
            "jawapan": ANSWER_KEY[no],
        }
        if no in ARAHAN:
            item["arahan"] = ARAHAN[no]
        items.append(item)
    payload = json.dumps(items, ensure_ascii=False, indent=2)
    js = (
        "// Generated from 'Instrumen Aptitud Am Tahun 4 - Tahun 2026.pdf' by\n"
        "// tools/generate-tahun4-aptitud.py. Overrides INSTRUMENTS[4].\n"
        "(function () {\n"
        f"  window.BAHAGIAN_APTITUD_T4 = {payload};\n\n"
        "  var groups = [\n"
        "    { start: 1,  end: 30, title: 'Bahagian A \\u00b7 Bahasa Melayu',\n"
        "      focus: 'Kemahiran bahasa, perbendaharaan kata dan penaakulan verbal Bahasa Melayu.', kind: 'general' },\n"
        "    { start: 31, end: 60, title: 'Bahagian B \\u00b7 Bahasa Inggeris',\n"
        "      focus: 'Perbendaharaan kata, hubungan kata dan penaakulan verbal Bahasa Inggeris.', kind: 'general' },\n"
        "    { start: 61, end: 80, title: 'Bahagian C \\u00b7 Matematik',\n"
        "      focus: 'Pola nombor, penaakulan kuantitatif dan penyelesaian masalah matematik.', kind: 'general' },\n"
        "  ];\n\n"
        "  function install() {\n"
        "    if (!window.INSTRUMENTS) return false;\n"
        "    window.INSTRUMENTS[4] = {\n"
        "      year: 4,\n"
        "      code: 'IAA_T4',\n"
        "      title: 'Instrumen Aptitud Am Tahun 4',\n"
        "      shortTitle: 'IAA Tahun 4',\n"
        "      kind: 'aptitude',\n"
        "      duration: 90 * 60,\n"
        "      sectionAName: '',\n"
        "      sectionALabel: '',\n"
        "      sectionBName: 'Aptitud Am',\n"
        "      domains: [],\n"
        "      sectionA: [],\n"
        "      sectionB: window.BAHAGIAN_APTITUD_T4,\n"
        "      sectionBGroups: groups,\n"
        "      autoAdvance: true,\n"
        "    };\n"
        "    return true;\n"
        "  }\n"
        "  if (!install()) {\n"
        "    document.addEventListener('DOMContentLoaded', install);\n"
        "  }\n"
        "})();\n"
    )
    OUT_JS.write_text(js, encoding="utf-8")


def main():
    rects = auto_rects()
    missing = [n for n in range(1, 81) if n not in rects and n not in MANUAL_RECTS]
    if missing:
        raise SystemExit(f"No rect detected for questions: {missing}. Add to MANUAL_RECTS.")
    render_images(rects)
    write_js()
    print(f"Generated 80 images in {IMG_DIR} and {OUT_JS.name}")


if __name__ == "__main__":
    main()
