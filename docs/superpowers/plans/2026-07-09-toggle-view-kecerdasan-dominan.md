# Toggle View: Senarai Murid Mengikut Kecerdasan Dominan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a toggle to the "Senarai Murid Mengikut Kecerdasan Dominan" card (Admin > Analisis Tahun, Year 5 & 6) offering a second view that lists students by name with their top-3 intelligences, where tapping a name opens a lightweight profile popup.

**Architecture:** All work is in `app/class-analysis.jsx` inside the existing `CaDomainAnalysis` component, plus CSS in `app/styles.css`. Two local state values drive the feature: `dominanView` selects which view renders; `modalStudent` holds the student whose popup is open. A derived `students` list (built from the already-computed `scored`) feeds the name view, and a new presentational `CaStudentModal` renders the popup by reusing existing `trait-modal` styles.

**Tech Stack:** React 18 via in-browser Babel (`type="text/babel"` scripts, no build step, no bundler). Components are attached to `window` or declared as file-local functions. No test framework — verification is manual in the browser.

## Global Constraints

- No build tooling: code must run under `@babel/standalone` in the browser. Plain JSX + React global, no imports/exports.
- Scope is `CaDomainAnalysis` only (Year 5 & 6, 9-intelligence instrument). Do NOT touch `CaAptitudeAnalysis` (Year 4) or `scoring.js`.
- Follow existing file conventions: file-local helper components declared as `function CaX(...)`; the main component stays `window.ClassAnalysis`.
- UI copy in Malay, matching surrounding text.
- Reuse existing CSS classes where they exist: `view-tabs`, `view-tab`, `trait-modal-overlay`, `trait-modal`, `trait-modal-close`, `trait-modal-header`, `ca-dot`, `ca-group-kelas`, `ca-group-kelas-name`.
- Verification is manual: run a local static server, open the admin analysis screen, and observe. There are no automated tests to add.

**Data shapes (already produced by `window.ScoreInstrument`, see `app/scoring.js`):**
- `sc.aScores`: array of `{ idx, key, nama, warna, deskripsi, ya, total, pct }` — one per intelligence.
- `sc.top3`: `aScores` sorted by `ya` desc, sliced to 3 (same object shape).
- `record.murid`: `{ nama, kelas, sekolah, ... }`.
- `caTahap(pct)` (file-local in `class-analysis.jsx`): returns `'tinggi'` (≥70), `'sederhana'` (≥40), else `'rendah'`.

---

### Task 1: Toggle + "Ikut Nama Murid" list view

**Files:**
- Modify: `app/class-analysis.jsx` — component `CaDomainAnalysis` (state, derived `students`, the final "Senarai Murid" `res-card`), plus a new file-local `CaNameRow` component.
- Modify: `app/styles.css` — add name-list / badge styles.

**Interfaces:**
- Consumes: `scored` (`Array<{ record, sc }>`), `groupByKelas` (bool) — both already in scope inside `CaDomainAnalysis`.
- Produces: file-local `function CaNameRow({ student, onSelect })`; state setter `setModalStudent` (used here only to pass `onSelect`, popup body added in Task 2); derived `students` array of `{ nama, kelas, top3, all }` where `all = [...sc.aScores].sort((a,b) => b.ya - a.ya)`.

- [ ] **Step 1: Add the `CaNameRow` presentational component**

Add this file-local component just above `function CaDomainAnalysis(...)` in `app/class-analysis.jsx` (right after the `CaRadar` component, near line 204):

```jsx
function CaNameRow({ student, onSelect }) {
  return (
    <li className="ca-name-row">
      <button className="ca-name-btn" onClick={() => onSelect(student)}>
        {student.nama}
      </button>
      <span className="ca-name-badges">
        {student.top3.map((s, i) => (
          <span key={s.idx} className="ca-name-badge" style={{ borderColor: s.warna, color: s.warna }}>
            {i + 1}) {s.nama} <small>({s.ya}/{s.total})</small>
          </span>
        ))}
      </span>
    </li>
  );
}
```

- [ ] **Step 2: Add local state + derived `students` list**

In `CaDomainAnalysis`, add the two state hooks and the memo. Place the state hooks immediately after the existing `const details = window.INTELLIGENCE_DETAILS || {};` line (near line 209), before the `const { stats, tiada } = React.useMemo(...)` block:

```jsx
  const [dominanView, setDominanView] = React.useState('kecerdasan');
  const [modalStudent, setModalStudent] = React.useState(null);
```

Then add this memo right after the existing `const { stats, tiada } = React.useMemo(...)` block (after line 241):

```jsx
  const students = React.useMemo(
    () => scored
      .map(({ record, sc }) => ({
        nama: record.murid.nama,
        kelas: record.murid.kelas || 'Tiada Kelas',
        top3: sc.top3,
        all: [...sc.aScores].sort((a, b) => b.ya - a.ya),
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama)),
    [scored]
  );
```

- [ ] **Step 3: Replace the "Senarai Murid" card with a toggled version**

Replace the entire final `res-card` block (currently `app/class-analysis.jsx:411-442`, the `<div className="res-card">` that contains `<h2>Senarai Murid Mengikut Kecerdasan Dominan</h2>` through its closing `</div>`) with:

```jsx
      <div className="res-card">
        <div className="ca-list-head">
          <div>
            <h2>Senarai Murid Mengikut Kecerdasan Dominan</h2>
            <p className="res-card-sub">Rujukan guru: murid dikumpulkan mengikut kecerdasan paling dominan.</p>
          </div>
          <div className="view-tabs">
            <button
              className={`view-tab ${dominanView === 'kecerdasan' ? 'active' : ''}`}
              onClick={() => setDominanView('kecerdasan')}>
              ◧ Ikut Kecerdasan
            </button>
            <button
              className={`view-tab ${dominanView === 'nama' ? 'active' : ''}`}
              onClick={() => setDominanView('nama')}>
              ☰ Ikut Nama Murid
            </button>
          </div>
        </div>

        {dominanView === 'kecerdasan' ? (
          <>
            {topDominan.map(s => (
              <div key={s.def.key} className="ca-group">
                <div className="ca-group-head" style={{ background: s.def.warna }}>
                  <span>{s.def.icon} {s.def.nama}</span>
                  <span>{s.dominan.length} murid</span>
                </div>
                {groupByKelas
                  ? [...new Set(s.dominan.map(m => m.kelas))].sort().map(k => (
                      <div key={k} className="ca-group-kelas">
                        <div className="ca-group-kelas-name">{k}</div>
                        <ol className="ca-names">
                          {s.dominan.filter(m => m.kelas === k)
                            .sort((a, b) => a.nama.localeCompare(b.nama))
                            .map(m => <li key={m.nama}>{m.nama} <small>({m.ya}/{m.total})</small></li>)}
                        </ol>
                      </div>
                    ))
                  : (
                    <ol className="ca-names">
                      {[...s.dominan].sort((a, b) => a.nama.localeCompare(b.nama))
                        .map(m => <li key={m.nama}>{m.nama} <small>({m.ya}/{m.total})</small></li>)}
                    </ol>
                  )}
              </div>
            ))}
            {tiada.length > 0 && (
              <p className="ca-note">Tiada kecenderungan jelas ({tiada.length}): {tiada.join(', ')}</p>
            )}
          </>
        ) : (
          groupByKelas
            ? [...new Set(students.map(m => m.kelas))].sort().map(k => (
                <div key={k} className="ca-group-kelas">
                  <div className="ca-group-kelas-name">{k}</div>
                  <ul className="ca-name-list">
                    {students.filter(m => m.kelas === k)
                      .map(m => <CaNameRow key={m.nama} student={m} onSelect={setModalStudent} />)}
                  </ul>
                </div>
              ))
            : (
              <ul className="ca-name-list">
                {students.map(m => <CaNameRow key={m.nama} student={m} onSelect={setModalStudent} />)}
              </ul>
            )
        )}
      </div>
```

Note: the `kecerdasan` branch is the existing markup verbatim (moved inside the fragment). `setModalStudent` is wired now; the popup body is added in Task 2.

- [ ] **Step 4: Add CSS for the name list and badges**

In `app/styles.css`, add near the `ca-group-kelas` rules (around line 883):

```css
.ca-list-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.ca-name-list { list-style: none; margin: 0; padding: 0; }
.ca-name-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
}
.ca-name-btn {
  font-weight: 700;
  color: var(--ink);
  background: none;
  border: none;
  padding: 0;
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
}
.ca-name-btn:hover { text-decoration: underline; }
.ca-name-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.ca-name-badge {
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
  border-radius: 999px;
  padding: 2px 9px;
  white-space: nowrap;
}
.ca-name-badge small { font-weight: 700; }
```

- [ ] **Step 5: Manual verification**

Start a static server from the repo root and open the app:

Run: `python -m http.server 8000` (leave running), then open `http://localhost:8000/` in a browser.

Steps to verify:
1. Log in / navigate to Admin > Analisis Tahun, pick a Year (5 or 6) that has records.
2. Scroll to "Senarai Murid Mengikut Kecerdasan Dominan". Confirm the toggle shows two buttons, `◧ Ikut Kecerdasan` active by default, and the existing grouped-by-intelligence view is unchanged.
3. Click `☰ Ikut Nama Murid`. Expected: a list of students by name (alphabetical), each with up to 3 colored badges `1) <Kecerdasan> (ya/total) 2) ... 3) ...`.
4. With "Semua Kelas" selected, confirm students are grouped under class headings. Select a single class from the dropdown and confirm a single flat alphabetical list.
5. Cross-check one student: their #1 badge intelligence matches the group they appear under in the `Ikut Kecerdasan` view.
6. Clicking a name does nothing visible yet (popup arrives in Task 2) — no console error.

- [ ] **Step 6: Commit**

```bash
git add app/class-analysis.jsx app/styles.css
git commit -m "feat: toggle view 'Ikut Nama Murid' untuk Senarai Murid Kecerdasan Dominan"
```

---

### Task 2: Student profile popup

**Files:**
- Modify: `app/class-analysis.jsx` — add file-local `CaStudentModal`; render it in `CaDomainAnalysis`.
- Modify: `app/styles.css` — add popup intelligence-list styles.

**Interfaces:**
- Consumes: `modalStudent` state + `setModalStudent` (from Task 1); `caTahap` (file-local); `student.all` (from Task 1's `students`, shape `{ idx, nama, warna, ya, total, pct }` sorted by `ya` desc).
- Produces: `function CaStudentModal({ student, onClose })`.

- [ ] **Step 1: Add the `CaStudentModal` component**

Add this file-local component just above `function CaDomainAnalysis(...)` (next to `CaNameRow` from Task 1):

```jsx
function CaStudentModal({ student, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tahapLabel = { tinggi: 'Tinggi', sederhana: 'Sederhana', rendah: 'Rendah' };

  return (
    <div className="trait-modal-overlay" onClick={onClose}>
      <div className="trait-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={student.nama}>
        <button className="trait-modal-close" onClick={onClose} aria-label="Tutup">×</button>
        <div className="trait-modal-header">
          <h2>{student.nama}</h2>
        </div>
        <p className="res-card-sub ca-modal-kelas">{student.kelas}</p>
        <ol className="ca-modal-intel">
          {student.all.map(s => {
            const t = caTahap(s.pct);
            return (
              <li key={s.idx} className="ca-modal-intel-row">
                <span className="ca-dot" style={{ background: s.warna }}></span>
                <span className="ca-modal-intel-name">{s.nama}</span>
                <span className="ca-modal-intel-score">{s.ya}/{s.total}</span>
                <span className={`ca-tahap ca-tahap-${t}`}>{tahapLabel[t]}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render the popup in `CaDomainAnalysis`**

Add this line immediately before the final closing `</div>` of the `<div className="ca-body">` wrapper (i.e. as the last child inside `ca-body`, after the "Senarai Murid" `res-card`):

```jsx
      {modalStudent && (
        <CaStudentModal student={modalStudent} onClose={() => setModalStudent(null)} />
      )}
```

- [ ] **Step 3: Add CSS for the popup intelligence list**

In `app/styles.css`, add after the name-list rules from Task 1:

```css
.ca-modal-kelas { margin: -6px 0 4px; }
.ca-modal-intel { list-style: none; margin: 14px 0 4px; padding: 0; }
.ca-modal-intel-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
}
.ca-modal-intel-name { flex: 1; }
.ca-modal-intel-score { font-weight: 700; font-variant-numeric: tabular-nums; }
.ca-tahap {
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 9px;
  min-width: 78px;
  text-align: center;
}
.ca-tahap-tinggi { color: var(--ok); background: oklch(0.95 0.06 150); }
.ca-tahap-sederhana { color: #8a6d00; background: oklch(0.95 0.07 90); }
.ca-tahap-rendah { color: var(--err); background: oklch(0.95 0.05 25); }
```

- [ ] **Step 4: Manual verification**

Reload `http://localhost:8000/` and return to Admin > Analisis Tahun (Year 5 or 6) > "Ikut Nama Murid".

Steps to verify:
1. Click a student's name. Expected: a modal opens showing the student's name, class, and all 9 intelligences sorted highest→lowest by "YA", each with score `ya/total` and a Tinggi/Sederhana/Rendah pill.
2. Confirm the top rows of the popup match the 3 badges shown on that student's row.
3. Confirm the tahap pill colors: Tinggi green, Sederhana amber, Rendah red; and thresholds look right (≥70% Tinggi, 40–69% Sederhana, <40% Rendah).
4. Close via the `×` button; reopen and close by clicking the dark overlay outside the card; reopen and close with the `Esc` key. All three close it.
5. Confirm no console errors, and switching back to `◧ Ikut Kecerdasan` still works.

- [ ] **Step 5: Commit**

```bash
git add app/class-analysis.jsx app/styles.css
git commit -m "feat: popup profil kecerdasan murid dalam Analisis Tahun"
```

---

## Self-Review

**Spec coverage:**
- Toggle with two views → Task 1 Step 3. ✓
- View A unchanged (grouped by intelligence) → Task 1 Step 3 (`kecerdasan` branch is verbatim existing markup). ✓
- View B: students by name with top-3 dominant intelligences → Task 1 Steps 1, 3. ✓
- View B keeps class grouping when "Semua Kelas" → Task 1 Step 3 (`groupByKelas` branch). ✓
- Tap name → popup with full 9 intelligences, score + tahap, sorted high→low → Task 2. ✓
- Close via ×, overlay, Esc → Task 2 Step 1. ✓
- Scope limited to `CaDomainAnalysis`; no Year-4 / scoring changes → constraints honored; edits are confined to that component + additive CSS. ✓
- Print keeps working per active view → no print code touched; conditional render preserves print behavior; covered by Task 1/2 manual checks not regressing. ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete code. ✓

**Type consistency:** `students` items `{ nama, kelas, top3, all }` produced in Task 1 and consumed by `CaNameRow` (`top3`) and `CaStudentModal` (`nama`, `kelas`, `all`). `all`/`top3` element fields (`idx`, `nama`, `warna`, `ya`, `total`, `pct`) match `scoring.js` `aScores`. `caTahap` returns `'tinggi'|'sederhana'|'rendah'`, matched by `tahapLabel` keys and `.ca-tahap-*` classes. `setModalStudent` defined in Task 1, consumed in Tasks 1 & 2. ✓
