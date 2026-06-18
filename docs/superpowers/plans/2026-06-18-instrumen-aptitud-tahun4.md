# Instrumen Aptitud Am Tahun 4 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Tahun 4 instrument (`INSTRUMENTS[4]`) with the Instrumen Aptitud Am Tahun 4 (IAA_T4): 80 objective MCQ rendered as per-question PNG crops, scored against an answer key with a per-section breakdown.

**Architecture:** A Python tool crops each of the 80 questions from the source PDF into `assets/tahun4-aptitud/qNN.png` and emits `data/tahun4-aptitud.generated.js`, which overrides `window.INSTRUMENTS[4]`. The existing image-MCQ render path (`pdfImage`) in `exam.jsx` displays them; `scoring.js` and `results.jsx` are generalized to score MCQ by configurable section groups and show a score + section breakdown when the instrument has no inventory domains.

**Tech Stack:** Vanilla React 18 via Babel-in-browser (no build), plain `window.*` globals, Python (PyMuPDF `fitz` + `pdfplumber` + Pillow) for PDF cropping. No test framework in repo — verification is by running the generator and visual/scoring checks.

---

## File Structure

- **Create** `tools/generate-tahun4-aptitud.py` — crops 80 question images + writes the data JS. Owns: answer key, section mapping, crop rectangles, JS emission.
- **Create** `assets/tahun4-aptitud/q01.png … q80.png` — generated question images (committed).
- **Create** `data/tahun4-aptitud.generated.js` — `window.BAHAGIAN_APTITUD_T4` + `INSTRUMENTS[4]` override (generated).
- **Modify** `index.html` — load the new data file after `year-instruments.generated.js`.
- **Modify** `app/exam.jsx` — per-item section label; suppress YA/TIDAK footer tip for this instrument.
- **Modify** `app/scoring.js` — configurable `sectionBGroups`; `analysis.groups` array; `general` band copy; guard empty domains.
- **Modify** `app/results.jsx` — hide domain cards when no domains; render score /total + section-group breakdown.

---

## Task 1: Crop tool scaffold — answer key, mapping, image generation

**Files:**
- Create: `tools/generate-tahun4-aptitud.py`
- Create (output): `assets/tahun4-aptitud/q01.png … q80.png`

- [ ] **Step 1: Write the tool with answer key, section map, auto-detected rects, and manual overrides**

```python
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
    1:"D",2:"C",3:"B",4:"A",5:"C",6:"B",7:"A",8:"A",9:"C",10:"C",
    11:"D",12:"D",13:"C",14:"A",15:"C",16:"A",17:"D",18:"D",19:"B",20:"A",
    21:"B",22:"C",23:"D",24:"D",25:"C",26:"B",27:"B",28:"D",29:"B",30:"C",
    31:"D",32:"B",33:"C",34:"C",35:"C",36:"D",37:"A",38:"C",39:"C",40:"A",
    41:"D",42:"C",43:"B",44:"C",45:"B",46:"D",47:"D",48:"D",49:"C",50:"C",
    51:"B",52:"C",53:"D",54:"C",55:"D",56:"C",57:"C",58:"B",59:"D",60:"C",
    61:"B",62:"B",63:"B",64:"D",65:"A",66:"C",67:"D",68:"A",69:"C",70:"B",
    71:"C",72:"C",73:"C",74:"D",75:"B",76:"B",77:"B",78:"C",79:"C",80:"B",
}

def bahagian_for(no):
    if no <= 30:  return "A", "Bahasa Melayu"
    if no <= 60:  return "B", "Bahasa Inggeris"
    return "C", "Matematik"

# Page content band (PDF points). Page is 595x842; header ~65pt, footer ~795pt.
CONTENT_TOP = 64.0
CONTENT_BOTTOM = 792.0
LEFT = 78.0
RIGHT = 540.0

# Manual override of crop rectangles for questions whose auto-detected top
# would miss a shared stimulus/diagram, or whose box is image-only.
# Format: no -> (page_1based, x0, y0, x1, y1). Filled during visual QA (Task 2).
MANUAL_RECTS = {}

def detect_anchors(page):
    """Return list of (no, top) for question-number tokens in the left margin."""
    anchors = []
    words = page.extract_words(x_tolerance=1, y_tolerance=2)
    for w in words:
        if 66.0 <= w["x0"] <= 76.0 and re.fullmatch(r"\d{1,2}", w["text"]):
            anchors.append((int(w["text"]), float(w["top"])))
    anchors.sort(key=lambda a: a[1])
    return anchors

def auto_rects():
    """Auto crop rects from number anchors: each question spans from a small
    pad above its number to just above the next question's number (or footer)."""
    rects = {}
    with pdfplumber.open(PDF_PATH) as pdf:
        for pi, page in enumerate(pdf.pages):
            anchors = detect_anchors(page)
            # keep only plausibly-sequential question numbers (1..80)
            anchors = [(n, t) for (n, t) in anchors if 1 <= n <= 80]
            for j, (no, top) in enumerate(anchors):
                y0 = max(top - 10.0, CONTENT_TOP)
                y1 = (anchors[j + 1][1] - 6.0) if j + 1 < len(anchors) else CONTENT_BOTTOM
                rects[no] = (pi + 1, LEFT, y0, RIGHT, y1)
    return rects

def trim_white_border(image, padding=20):
    rgb = image.convert("RGB")
    bg = Image.new("RGB", rgb.size, (255, 255, 255))
    bbox = ImageChops.difference(rgb, bg).getbbox()
    if not bbox:
        return rgb
    l = max(bbox[0] - padding, 0); t = max(bbox[1] - padding, 0)
    r = min(bbox[2] + padding, rgb.width); b = min(bbox[3] + padding, rgb.height)
    return rgb.crop((l, t, r, b))

def render_images(rects):
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF_PATH)
    matrix = fitz.Matrix(3.0, 3.0)
    for no in range(1, 81):
        page_no, x0, y0, x1, y1 = MANUAL_RECTS.get(no, rects[no])
        page = doc[page_no - 1]
        pix = page.get_pixmap(matrix=matrix, clip=fitz.Rect(x0, y0, x1, y1), alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img = trim_white_border(img)
        img.save(IMG_DIR / f"q{no:02d}.png", optimize=True)
    return [f"q{no:02d}.png" for no in range(1, 81)]

def write_js():
    items = []
    for no in range(1, 81):
        bah, nama = bahagian_for(no)
        items.append({
            "no": no,
            "bahagian": bah,
            "bahagianNama": nama,
            "pdfImage": f"assets/tahun4-aptitud/q{no:02d}.png",
            "jawapan": ANSWER_KEY[no],
        })
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
```

- [ ] **Step 2: Ensure Python deps installed**

Run: `python -m pip install pymupdf pdfplumber pillow -q`
Expected: installs succeed (pdfplumber already present from prior work).

- [ ] **Step 3: Run the generator**

Run: `python tools/generate-tahun4-aptitud.py`
Expected: `Generated 80 images in .../assets/tahun4-aptitud and tahun4-aptitud.generated.js`. If it raises `No rect detected for questions: [...]`, note which numbers and proceed to Task 2 to add overrides.

- [ ] **Step 4: Commit the tool and first-pass output**

```bash
git add tools/generate-tahun4-aptitud.py data/tahun4-aptitud.generated.js assets/tahun4-aptitud
git commit -m "feat: tahun4 aptitud crop tool + first-pass generated data"
```

---

## Task 2: Visual QA of crops — fix shared-stimulus / image-only questions

**Files:**
- Modify: `tools/generate-tahun4-aptitud.py` (`MANUAL_RECTS` dict only)
- Regenerate: `assets/tahun4-aptitud/*.png`

Auto-detection starts each crop just above its question number. Questions whose
meaning depends on content ABOVE the number (shared petikan/stimulus, a boxed
diagram, or pure-image option sets) need a higher `y0` and sometimes a specific
page. Known candidates to inspect closely: **10, 15, 20, 25, 26, 27, 28, 29, 30,
57, 62, 68, 69, 70, 71, 72, 79, 80** (stimulus boxes, diagrams, or image-only
A/B/C/D).

- [ ] **Step 1: Build a contact sheet to inspect all 80 crops at once**

Run:
```bash
python -c "
from PIL import Image; import math, glob, os
files = sorted(glob.glob('assets/tahun4-aptitud/q*.png'))
cols=4; rows=math.ceil(len(files)/cols); cw,ch=520,360
sheet=Image.new('RGB',(cols*cw,rows*ch),'white')
for i,f in enumerate(files):
    im=Image.open(f); im.thumbnail((cw-10,ch-10))
    sheet.paste(im,((i%cols)*cw+5,(i//cols)*ch+5))
sheet.save('assets/tahun4-aptitud/_contact.png'); print('wrote _contact.png',rows,'rows')
"
```
Expected: writes `_contact.png`. Open it and verify each crop shows the full
question stem + all four options, no neighbouring question bleeding in, and any
required stimulus/diagram is included.

- [ ] **Step 2: For each wrong crop, add an override**

For every question that is clipped or missing a stimulus, measure the correct
rectangle (use `pdfplumber` page coords — the source page number is printed on
the PDF header line "TERHAD N IAA_T4", which equals `page_1based`). Add entries:

```python
MANUAL_RECTS = {
    # no: (page_1based, x0, y0, x1, y1)
    # e.g. 27: (9, 78, 150, 540, 320),  # include the shared petikan above Q27
}
```

Measure y-coordinates with this helper while iterating:
```bash
python -c "
import pdfplumber
pdf=pdfplumber.open('ujian tahun 4/Instrumen Aptitud Am Tahun 4 - Tahun 2026.pdf')
PAGE=9  # 1-based page to inspect
for w in pdf.pages[PAGE-1].extract_words(x_tolerance=1,y_tolerance=2):
    print(round(w['x0'],1), round(w['top'],1), round(w['bottom'],1), repr(w['text']))
" | head -60
```

- [ ] **Step 3: Regenerate and re-inspect**

Run: `python tools/generate-tahun4-aptitud.py` then rebuild the contact sheet
(Step 1). Repeat Steps 2–3 until every one of the 80 crops is self-contained
and correct.

- [ ] **Step 4: Remove the contact sheet and commit**

```bash
rm -f assets/tahun4-aptitud/_contact.png
git add tools/generate-tahun4-aptitud.py assets/tahun4-aptitud data/tahun4-aptitud.generated.js
git commit -m "fix: correct tahun4 aptitud crops for shared-stimulus questions"
```

---

## Task 3: Wire the data file into the page

**Files:**
- Modify: `index.html:26`

- [ ] **Step 1: Add the script tag after year-instruments**

In `index.html`, after the `year-instruments.generated.js` line, add:
```html
  <script src="data/tahun4-aptitud.generated.js"></script>
```
So the block reads:
```html
  <script src="data/items.js"></script>
  <script src="data/year-instruments.generated.js"></script>
  <script src="data/tahun4-aptitud.generated.js"></script>
  <script src="data/bahagian-b-images.js"></script>
```

- [ ] **Step 2: Verify INSTRUMENTS[4] is overridden**

Run:
```bash
python -m http.server 8000 >/dev/null 2>&1 &
sleep 1
```
Open `http://localhost:8000/` in a browser, open DevTools console, run:
`window.INSTRUMENTS[4].code` → Expected: `"IAA_T4"`;
`window.INSTRUMENTS[4].sectionB.length` → Expected: `80`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: load tahun4 aptitud data file"
```

---

## Task 4: Per-item section label + suppress YA/TIDAK tip in exam screen

**Files:**
- Modify: `app/exam.jsx:95-100` (q-meta chip) and `:109-113` (footer tip)

- [ ] **Step 1: Show per-item Bahagian label when present**

Replace the `q-meta` block (currently lines ~95-100) so the section chip uses
the item's own `bahagian`/`bahagianNama` when available:

```jsx
            <div className="q-meta">
              <span className="chip section">
                Bahagian {item.bahagian || (isA ? 'A' : 'B')}
              </span>
              <span className="chip">Soalan {item.no} / {isA ? totalA : totalB}</span>
              <span style={{ flex: 1 }}></span>
              <span>{item.bahagianNama || (isA ? active.sectionALabel : active.sectionBName)}</span>
            </div>
```

- [ ] **Step 2: Suppress the YA/TIDAK footer tip when there is no inventory section**

Replace the footer tip expression (currently lines ~109-113) with:

```jsx
            <span className="q-footer-tip">
              {isA
                ? 'Jawapan YA/TIDAK akan terus ke soalan seterusnya.'
                : (!current ? 'Pilih satu jawapan untuk teruskan' : (idx === maxIdx ? 'Soalan terakhir - semak jawapan sebelum hantar' : 'Tekan Seterusnya'))}
            </span>
```

This already behaves correctly because for IAA_T4 `totalA === 0`, so `isA` is
always false and the YA/TIDAK branch never shows. No change needed beyond
confirming. (Leave as-is.)

- [ ] **Step 3: Manual verify in browser**

With the dev server running, start the flow as a Tahun 4 student (enter a
student whose year resolves to 4 — e.g. class containing "Tahun 4"). On the exam
screen confirm: question shows as an image with A/B/C/D buttons, the chip reads
"Bahagian A · Bahasa Melayu" for Q1, switches to "Bahagian B · Bahasa Inggeris"
at Q31 and "Bahagian C · Matematik" at Q61. Selecting a letter records the
answer and advances via Seterusnya.

- [ ] **Step 4: Commit**

```bash
git add app/exam.jsx
git commit -m "feat: per-section labels for tahun4 aptitud exam"
```

---

## Task 5: Generalize scoring to configurable section groups

**Files:**
- Modify: `app/scoring.js:95-117` (`describeBand`), `:119-135` (`bGroup`), `:178-225` (analysis assembly)

- [ ] **Step 1: Add a `general` band copy in `describeBand`**

In the `copy` object inside `describeBand`, add a `general` key:

```js
      general: {
        Cemerlang: 'Pencapaian cemerlang dalam bahagian ini.',
        Baik: 'Pencapaian baik dalam bahagian ini.',
        Sederhana: 'Pencapaian sederhana; boleh diperkukuh dengan latihan berkala.',
        'Perlu Bimbingan': 'Memerlukan sokongan dan latihan berstruktur dalam bahagian ini.'
      }
```

- [ ] **Step 2: Build `analysis.groups` from `instrument.sectionBGroups`**

In `scoreInstrument`, after `bResults`/`bLevel` are computed and before the
`analysis` object is assembled, add:

```js
    const groupDefs = Array.isArray(active.sectionBGroups) ? active.sectionBGroups : null;
    const groups = groupDefs
      ? groupDefs.map(g => bGroup(bResults, g.start, g.end, g.title, g.focus, g.kind || 'general'))
      : null;
```

- [ ] **Step 3: Expose `groups` in the analysis object and return value**

In the `analysis` object literal add `groups,` (alongside `bReasoning`,
`bProblemSolving`, `bahagianB`). In the final `return { ... }` add `groups,` too.

```js
    const analysis = {
      bahagianA: { /* unchanged */ },
      bReasoning,
      bProblemSolving,
      groups,
      bahagianB: { /* unchanged */ }
    };

    return {
      answeredCount: Object.keys(answers).length,
      instrument: active,
      aScores,
      top3,
      bResults,
      bRight,
      bPct,
      bReasoning,
      bProblemSolving,
      groups,
      analysis
    };
```

`bGroup` already returns `{start,end,title,focus,right,total,pct,level,tone,description}`
and works for any range, so no change to `bGroup` is needed beyond passing the
`kind`. Tahun 6 keeps its `bReasoning`/`bProblemSolving` (sectionBGroups absent →
`groups` is `null`, so Tahun 6 results render unchanged).

- [ ] **Step 4: Verify scoring against the answer key in Node**

Run:
```bash
node -e "
global.window={};
require('./data/tahun4-aptitud.generated.js');
require('./app/scoring.js');
const inst=window.INSTRUMENTS?window.INSTRUMENTS[4]:null;
" 2>&1 | head
```
This will fail because the data file expects `INSTRUMENTS` to exist; instead use
the focused check below.

Run:
```bash
node -e "
global.document={addEventListener(){}};
global.window={INSTRUMENTS:{}};
require('./data/tahun4-aptitud.generated.js');
require('./app/scoring.js');
const inst=window.INSTRUMENTS[4];
// all-correct answers -> 80/80
const perfect={}; inst.sectionB.forEach(q=>perfect['B'+q.no]=q.jawapan);
const r=window.ScoreInstrument(perfect, inst);
console.log('bRight', r.bRight, 'of', inst.sectionB.length);
console.log('groups', r.analysis.groups.map(g=>g.title+': '+g.right+'/'+g.total));
"
```
Expected: `bRight 80 of 80` and three groups each `30/30`, `30/30`, `20/20`.

- [ ] **Step 5: Commit**

```bash
git add app/scoring.js
git commit -m "feat: configurable section-group scoring for aptitude instruments"
```

---

## Task 6: Results screen — score + section breakdown, hide domain cards

**Files:**
- Modify: `app/results.jsx:9-17` (derive flags), `:66-173` (card stack)

- [ ] **Step 1: Derive a `hasDomains` flag and group data**

After the existing `score`/`analysis` destructuring (around line 15), add:

```jsx
  const hasDomains = (domains && domains.length > 0) && top3.length > 0;
  const groups = score.analysis.groups; // null for Tahun 6, array for IAA_T4
```

- [ ] **Step 2: Guard the two domain cards with `hasDomains`**

Wrap the "3 Dominan" card (the `res-card` containing `{topLabel}`) and the
"Bahagian A · domain" card each in `{hasDomains && ( ... )}` so they do not
render when the instrument has no inventory domains.

- [ ] **Step 3: Render the aptitude score card when `groups` exists**

Replace the existing `{hasB && (...)}` Bahagian B card with a branch: when
`groups` is present (IAA_T4), render the score-over-total and map the section
groups; otherwise keep the existing Tahun 6 card. Insert:

```jsx
            {groups ? (
              <div className="res-card">
                <h2>Keputusan Aptitud</h2>
                <p className="res-card-sub">Markah keseluruhan dan pecahan mengikut bahagian.</p>
                <p className="score-big">{bRight}<small>/{bResults.length}</small></p>
                <p className="score-cap">
                  {bPct >= 80 ? 'Cemerlang — majoriti soalan dijawab dengan tepat.' :
                   bPct >= 60 ? 'Baik — pencapaian aptitud yang kukuh.' :
                   bPct >= 40 ? 'Sederhana — teruskan latihan untuk meningkatkan markah.' :
                                'Perlu bimbingan dan latihan tambahan.'}
                </p>
                <div className="score-bar">
                  <div className="score-bar-fill" style={{ width: `${bPct}%` }}></div>
                </div>
                <div className="score-legend">
                  <div><strong style={{ color: 'var(--ok)' }}>● {bRight}</strong> betul</div>
                  <div><strong style={{ color: 'var(--err)' }}>● {bResults.length - bRight}</strong> salah / kosong</div>
                  <div><strong>{bPct}%</strong></div>
                </div>
                <div className="analysis-grid" style={{ marginTop: 20 }}>
                  {groups.map((g) => (
                    <AnalysisBlock
                      key={g.start}
                      title={g.title}
                      scoreText={`${g.right}/${g.total}`}
                      level={g.level}
                      tone={g.tone}
                      focus={g.focus}
                      description={g.description}
                    />
                  ))}
                </div>
              </div>
            ) : (hasB && (
              /* existing Tahun 6 "Analisis Bahagian B" card unchanged */
            ))}
```

Keep the existing Tahun 6 card markup exactly as-is inside the `: (hasB && ( ... ))`
branch.

- [ ] **Step 4: Confirm hero count still works**

The hero uses `active.sectionA.length + active.sectionB.length` = `0 + 80` = 80.
No change needed.

- [ ] **Step 5: Manual verify in browser**

As a Tahun 4 student, answer a few questions, click Tamatkan. On the results
screen confirm: no "3 Dominan"/domain cards; a "Keputusan Aptitud" card shows
`X/80`, a percentage bar, and three `AnalysisBlock`s (Bahasa Melayu /30, Bahasa
Inggeris /30, Matematik /20) with bands. Then switch to a Tahun 6 student and
confirm the old results layout still renders (domains + Bahagian B card).

- [ ] **Step 6: Commit**

```bash
git add app/results.jsx
git commit -m "feat: aptitude score + section breakdown on results screen"
```

---

## Task 7: Final end-to-end verification

- [ ] **Step 1: Full Tahun 4 run**

Serve locally, run the full flow for a Tahun 4 student: welcome → arahan → 80
image questions across 3 sections → Tamatkan → results with score + breakdown.
Confirm no console errors.

- [ ] **Step 2: Regression check Tahun 5 & Tahun 6**

Run a Tahun 6 student through to results; confirm Bahagian A domains + Bahagian B
analysis still render. Load a Tahun 5 student; confirm the inventory still works.

- [ ] **Step 3: Confirm clean console + images load**

In DevTools Network tab, confirm `assets/tahun4-aptitud/qNN.png` load with 200,
and Console is free of errors.

- [ ] **Step 4: Final commit / branch ready for review**

```bash
git status   # expect clean
git log --oneline -8
```
The branch `feat/instrumen-aptitud-tahun4` is ready for review/merge.

---

## Self-Review Notes

- **Spec coverage:** crop tool + local assets (Task 1-2) ✓; data + INSTRUMENTS[4] override (Task 1) ✓; index.html load (Task 3) ✓; exam labels (Task 4) ✓; scoring groups (Task 5) ✓; results score+breakdown, hide domains (Task 6) ✓; Tahun 5/6 unchanged (Task 5 null-group fallback, Task 6 branch, Task 7 regression) ✓.
- **Answer key** transcribed into `ANSWER_KEY` matches spec.
- **Type consistency:** `bGroup` return shape (`right/total/pct/level/tone/description/title/focus`) is consumed unchanged by `AnalysisBlock` in Task 6; `analysis.groups` is the same array produced in Task 5.
- **Known execution-time data:** exact crop rectangles (`MANUAL_RECTS`) are discovered via visual QA in Task 2 — this is measured data, not a code placeholder.
