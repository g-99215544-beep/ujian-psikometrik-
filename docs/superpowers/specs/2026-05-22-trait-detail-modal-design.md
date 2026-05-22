# Trait Detail Modal on Results Screen

**Date:** 2026-05-22
**Status:** Draft

## Goal

On the results screen, let a student click any of the 9 intelligence rows in the Bahagian A bar chart to open a modal showing detailed information about that intelligence: a poster image (provided as JPG in `assets/posters/`) plus structured text — ciri-ciri, kemahiran belajar berkesan, contoh cara belajar, tip, and kerjaya — transcribed from the posters.

## Motivation

The current results screen tells a student WHICH intelligences are dominant but does not explain what each one means in any depth — only a one-line `deskripsi`. The school's counselling unit has produced rich poster content for each intelligence; embedding that content in the report turns the result from a number into an actionable explanation the student (and parents) can read.

## User-facing Behavior

### On the results screen

- For instruments where `kind === 'intelligence'` or `kind === 'aptitude'` (i.e. Tahun 5 and Tahun 6 — those using `INTELLIGENCES`), each `.bar-row` inside the Bahagian A card becomes interactive:
  - Cursor `pointer`, subtle hover background, focus outline.
  - Click or Enter/Space (treated as a button) opens the detail modal for that row's intelligence.
- For Tahun 4 (`kind === 'traits'`, using `TRAITS_T4`), rows remain non-interactive. T4 is explicitly out of scope.

### The modal

When opened, the modal shows:

1. **Header bar** — `domain.warna` as a top accent strip, intelligence name + dot icon as title, close button (×) at top-right.
2. **Hero poster image** — `<img src="assets/posters/{key}.jpg">`. Responsive (`max-width: 100%`). If the image fails to load (`onError`), the `<img>` hides itself so the modal degrades to text-only.
3. **Motto/quote** — short italic line from the poster (e.g. "Saya faham melalui kata-kata.").
4. **Ringkasan** — 2–4 sentence paragraph explaining what the intelligence means.
5. **Ciri-ciri** — bullet list of characteristics (≈6 items).
6. **Kemahiran belajar berkesan** — numbered list of `{judul, huraian}` items (≈6–7 items).
7. **Tip** — bullet list of short tips (≈4 items).
8. **Sesuai dengan kerjaya** — bullet list of careers (≈4–7 items).

The user closes the modal by:
- Clicking the × button
- Clicking outside the modal (on the overlay)
- Pressing Esc

### Print behavior

Modal is hidden in print (`@media print`). The PDF report continues to look exactly as it does today.

## Technical Design

### File layout

| File | Action | Responsibility |
|---|---|---|
| `assets/posters/{key}.jpg` | Rename existing 9 files | Per-intelligence poster images, served as static assets. |
| `data/intelligence-details.js` | Create | Defines `window.INTELLIGENCE_DETAILS` keyed by `domain.key` with `{motto, ringkasan, ciri[], kemahiran[], tip[], kerjaya[]}`. |
| `app/trait-modal.jsx` | Create | Defines `window.TraitModal({ domain, detail, onClose })`. Pure presentational component with Esc listener. |
| `app/results.jsx` | Modify | Make Bahagian A bar rows clickable (gated by instrument kind). Hold `selectedDomain` state. Render `TraitModal` conditionally. |
| `app/styles.css` | Modify | Add `.bar-row` clickable styles, `.trait-modal-overlay`, `.trait-modal`, hero/section styles, print rule. |
| `index.html` | Modify | Add two `<script>` tags (data file + component file) in correct load order. |

### File rename

The 9 poster files currently use generated names (`photo_1_2026-05-22_08-29-56.jpg` … `photo_9_...`). They will be renamed to match `domain.key`:

| Source | Target |
|---|---|
| `photo_1_2026-05-22_08-29-56.jpg` | `eksistensial.jpg` |
| `photo_2_2026-05-22_08-29-56.jpg` | `muzik.jpg` |
| `photo_3_2026-05-22_08-29-56.jpg` | `kinestetik.jpg` |
| `photo_4_2026-05-22_08-29-56.jpg` | `interpersonal.jpg` |
| `photo_5_2026-05-22_08-29-56.jpg` | `naturalis.jpg` |
| `photo_6_2026-05-22_08-29-56.jpg` | `visual.jpg` |
| `photo_7_2026-05-22_08-29-56.jpg` | `intrapersonal.jpg` |
| `photo_8_2026-05-22_08-29-56.jpg` | `logik.jpg` |
| `photo_9_2026-05-22_08-29-56.jpg` | `linguistik.jpg` |

(Mapping was verified by visually inspecting each image.)

### Data shape: `window.INTELLIGENCE_DETAILS`

```js
window.INTELLIGENCE_DETAILS = {
  linguistik: {
    motto: 'Saya faham melalui kata-kata.',
    ringkasan: 'Elemen Verbal Linguistik merujuk kepada keupayaan menggunakan bahasa secara berkesan, sama ada secara lisan atau tulisan. Murid yang dominan dalam elemen ini suka membaca, menulis, bercakap, mendengar dan bermain dengan perkataan.',
    ciri: [
      'Suka membaca pelbagai bahan.',
      'Pandai bertutur dan suka berbual.',
      'Suka menulis, membuat catatan atau diari.',
      'Mudah mengingat melalui perkataan atau cerita.',
      'Suka mendengar cerita, syarahan atau perbincangan.',
      'Boleh menjelaskan idea dengan baik menggunakan bahasa.'
    ],
    kemahiran: [
      { judul: 'Membaca Aktif', huraian: 'Baca dengan fokus, tandakan idea penting, serta buat catatan ringkas.' },
      { judul: 'Mencatat & Menulis', huraian: 'Buat nota sendiri, ringkaskan isi pelajaran dengan ayat mudah.' },
      { judul: 'Perbincangan & Soal Jawab', huraian: 'Belajar melalui perbualan, bertanya soalan dan menjawab untuk memahami.' },
      { judul: 'Bercerita Semula', huraian: 'Ceritakan semula apa yang telah dipelajari menggunakan perkataan sendiri.' },
      { judul: 'Gunakan Peta Minda (Berbentuk Ayat)', huraian: 'Susun idea dalam peta minda menggunakan perkataan dan frasa.' },
      { judul: 'Guna Kad Imbasan & Senarai Kata', huraian: 'Buat kad imbasan, senarai istilah penting atau glosari untuk ulang kaji.' }
    ],
    tip: [
      'Baca setiap hari.',
      'Tulis setiap hari.',
      'Bertanya bila tidak faham.',
      'Ulang kaji dengan menyebut dan menulis.'
    ],
    kerjaya: ['Guru', 'Penulis / Wartawan', 'Peguam', 'Penceramah', 'Penterjemah']
  },
  // ... 8 more entries
};
```

All nine entries will be transcribed verbatim (where possible) from the posters during implementation. Eksistensial's content is also transcribed from its poster.

### Component: `window.TraitModal`

```jsx
window.TraitModal = function ({ domain, detail, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="trait-modal-overlay" onClick={onClose}>
      <div className="trait-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trait-modal-accent" style={{ background: domain.warna }} />
        <button className="trait-modal-close" onClick={onClose} aria-label="Tutup">×</button>
        <div className="trait-modal-header">
          <span className="bdot" style={{ background: domain.warna }} />
          <h2>{domain.nama}</h2>
        </div>
        {/* poster + sections ... */}
      </div>
    </div>
  );
};
```

The component is pure: it derives everything from props. It does NOT read globals (results.jsx passes the matched `detail` object in).

### Results screen wiring

In `app/results.jsx`:

```js
const [selectedDomain, setSelectedDomain] = React.useState(null);
const details = window.INTELLIGENCE_DETAILS || {};
const supportsDetail = active.kind === 'intelligence' || active.kind === 'aptitude';
```

Each bar row in the Bahagian A card becomes:

```jsx
{aScores.map((s) => {
  const def = domains[s.idx];
  const detail = supportsDetail ? details[def.key] : null;
  const clickable = !!detail;
  return (
    <div
      key={s.idx}
      className={`bar-row${clickable ? ' clickable' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => setSelectedDomain(def) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDomain(def); } } : undefined}
    >
      {/* existing bar contents */}
    </div>
  );
})}
```

Modal render at end of JSX:

```jsx
{selectedDomain && details[selectedDomain.key] && (
  <window.TraitModal
    domain={selectedDomain}
    detail={details[selectedDomain.key]}
    onClose={() => setSelectedDomain(null)}
  />
)}
```

The "3 Kecerdasan Dominan" card and Bahagian B card are NOT affected.

### Script load order in index.html

The new `data/intelligence-details.js` must load before `app/results.jsx` (so the global is available). `app/trait-modal.jsx` must load before `app/results.jsx` (so `window.TraitModal` is defined when results renders). The existing order is data → app components — slot the new files into the same pattern.

### Styles

```css
.bar-row.clickable {
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.bar-row.clickable:hover { background: var(--surface-2); }
.bar-row.clickable:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.trait-modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(15, 23, 42, 0.55);
  display: grid; place-items: center; padding: 20px;
  overflow-y: auto;
}
.trait-modal {
  position: relative;
  background: var(--surface);
  border-radius: var(--radius-lg);
  max-width: 720px; width: 100%;
  max-height: 90vh; overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
.trait-modal-accent { height: 6px; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
.trait-modal-close { position: absolute; top: 12px; right: 12px; ... }
.trait-modal-header { display: flex; align-items: center; gap: 10px; padding: 24px 28px 8px; }
.trait-modal-header h2 { margin: 0; font-size: 1.5rem; }
.trait-modal-hero img { display: block; width: 100%; height: auto; }
.trait-modal-section { padding: 16px 28px; }
.trait-modal-section h3 { margin: 0 0 8px; font-size: 1rem; color: var(--ink-2); text-transform: uppercase; letter-spacing: 0.04em; }
.trait-modal-section ul { padding-left: 20px; line-height: 1.55; }
.trait-modal-section .kemahiran-item { margin-bottom: 10px; }
.trait-modal-section .kemahiran-item strong { display: block; margin-bottom: 2px; }

@media print {
  .trait-modal-overlay { display: none !important; }
}
```

## Out of Scope

- **Tahun 4 (TRAITS_T4)** — personality traits like Autonomi, Kreatif. These have no posters yet. Rows remain non-interactive.
- **Bahagian B (kemahiran menaakul)** — separate section, not touched.
- **Top-3 dominant card** — not made clickable (the user explicitly chose "all 9 in bar chart" — adding the top-3 card would be redundant entry points to the same info).
- **Per-poster print button** — not added; modal is hidden in print. If a teacher wants to print one poster, they can right-click the image.
- **Image lazy-loading / preloading** — modern browsers handle this fine; no special handling.
- **Image fallback content** — if a JPG is missing, the `<img>` simply hides. The modal still works.

## Edge Cases

| Case | Behavior |
|---|---|
| Tahun 4 instrument (kind='traits') | `supportsDetail` is false; no rows clickable. |
| Future intelligence added to `INTELLIGENCES` without a corresponding entry in `INTELLIGENCE_DETAILS` | `details[key]` is undefined; that row is not clickable. |
| Poster JPG missing from `assets/posters/` | `<img onError>` hides the image; text content renders. |
| Modal opened then student clicks Home | Component unmounts cleanly; Esc listener is removed on unmount. |
| Viewing on mobile | Modal uses `max-width: 720px; width: 100%` and full-bleed image. Scrolls inside `max-height: 90vh`. |
| Print while modal is open | Modal is hidden via `@media print`; the underlying report prints normally. |
