# Admin Table View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah paparan jadual ringkasan markah murid dalam dashboard admin dengan toggle antara jadual baru dan senarai expandable sedia ada.

**Architecture:** Tambah komponen `ClassTable` baru dalam `admin.jsx` yang menerima `records` dan `instrument` sebagai prop, mengira skor via `ScoreInstrument` sedia ada, dan render jadual dengan sticky columns. `AdminScreen` mendapat state baru `viewMode` ('table'|'list') dan `printingRecord` untuk print per-baris dari jadual.

**Tech Stack:** React (CDN, no build), CSS custom properties (`var(--line)` etc.), Firebase Realtime DB (tidak diubah), `window.ScoreInstrument` dari `scoring.js` (tidak diubah).

---

## File Map

| Fail | Perubahan |
|------|-----------|
| `app/styles.css` | Tambah CSS: `.view-tabs`, `.ct-wrap`, `.ct`, sticky columns, score badges |
| `app/admin.jsx` | Tambah `ClassTable` component; tambah `viewMode`, `printingRecord`, `classInstrument`, `handleTablePrint` ke `AdminScreen` |

---

### Task 1: Tambah CSS untuk jadual dan toggle tab

**Files:**
- Modify: `app/styles.css` (append di hujung, sebelum `@media print` block)

- [ ] **Step 1: Buka `app/styles.css` dan cari baris `@media print`**

  Cari baris yang bermula dengan `@media print` (kira-kira baris 560+). CSS baru akan disisip **sebelum** blok ini.

- [ ] **Step 2: Sisip CSS baru sebelum blok `@media print`**

  Tambah blok berikut:

  ```css
  /* ---- View toggle tabs ---- */
  .view-tabs {
    display: flex;
    width: fit-content;
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 14px;
  }
  .view-tab {
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 600;
    background: var(--surface);
    color: var(--muted);
    border: none;
    cursor: pointer;
    transition: background .15s;
  }
  .view-tab + .view-tab { border-left: 1px solid var(--line); }
  .view-tab.active { background: var(--ink); color: #fff; }

  /* ---- Class table ---- */
  .ct-wrap {
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: 10px;
    margin-top: 12px;
  }
  .ct {
    border-collapse: collapse;
    font-size: 12.5px;
    min-width: 100%;
    white-space: nowrap;
  }
  .ct th {
    background: #1e293b;
    color: #fff;
    padding: 7px 10px;
    text-align: center;
    font-size: 11.5px;
  }
  .ct td {
    border: 1px solid var(--line);
    padding: 6px 9px;
    text-align: center;
    vertical-align: middle;
  }
  .ct tbody tr:nth-child(even) td { background: var(--surface-2); }
  .ct tbody tr:nth-child(even) .ct-sticky { background: oklch(0.955 0.008 80); }

  /* Sticky columns */
  .ct-sticky { position: sticky; z-index: 2; background: var(--surface); }
  .ct th.ct-sticky { z-index: 3; background: #0f172a; }
  .ct-bil  { left: 0; width: 36px; }
  .ct-nama { left: 36px; min-width: 140px; text-align: left !important; font-weight: 600; }
  .ct-id   { left: 176px; min-width: 130px; border-right: 2px solid var(--line-2) !important; }

  /* Grouped header colors (Tahun 6) */
  .ct-th-a { background: #1e3a5f !important; border-bottom: 2px solid #60a5fa !important; }
  .ct-th-b { background: #14532d !important; border-bottom: 2px solid #4ade80 !important; }

  /* Score badges */
  .ct-score-a { background: #dcfce7; color: #166534; border-radius: 4px; padding: 2px 6px; font-weight: 700; font-size: 11px; }
  .ct-score-b { background: #dbeafe; color: #1e40af; border-radius: 4px; padding: 2px 6px; font-weight: 700; font-size: 11px; }
  .ct-done    { background: #dcfce7; color: #166534; border-radius: 4px; padding: 2px 7px; font-size: 11px; font-weight: 700; }
  .ct-pending { color: var(--muted); font-size: 12px; }
  .ct-print-btn { padding: 3px 10px !important; font-size: 11px !important; }
  ```

- [ ] **Step 3: Semak secara visual — buka `index.html` di browser, log masuk admin, pastikan tiada ralat CSS**

  Jadual dan toggle belum kelihatan lagi (komponen belum ditulis). Ini normal.

- [ ] **Step 4: Commit**

  ```bash
  git add app/styles.css
  git commit -m "style: add class table and view toggle CSS"
  ```

---

### Task 2: Tambah komponen `ClassTable`

**Files:**
- Modify: `app/admin.jsx` — tambah fungsi `ClassTable` selepas fungsi `AdminAnswerSheet` (baris ~468, selepas penutup `}` terakhir)

- [ ] **Step 1: Buka `app/admin.jsx`, pergi ke baris 469 (selepas `AdminAnswerSheet`)**

  Tambah komponen baru di hujung fail:

  ```javascript
  function ClassTable({ records, instrument, onPrint }) {
    if (!records.length || !instrument) return null;

    const domains = instrument.domains || [];
    const hasBahagianB = (instrument.sectionB || []).length > 0;

    const rows = records.map(record => ({
      record,
      sc: window.ScoreInstrument
        ? window.ScoreInstrument(record.jawapan || {}, instrument)
        : null
    }));

    const thead = hasBahagianB ? (
      <>
        <tr>
          <th className="ct-sticky ct-bil" rowSpan={2}>Bil.</th>
          <th className="ct-sticky ct-nama" rowSpan={2}>Nama</th>
          <th className="ct-sticky ct-id" rowSpan={2}>ID Pengenalan</th>
          <th colSpan={domains.length} className="ct-th-a">BAHAGIAN A — Kecerdasan Pelbagai</th>
          <th colSpan={2} className="ct-th-b">BAHAGIAN B</th>
          <th rowSpan={2}>Status</th>
          <th rowSpan={2}>Cetak</th>
        </tr>
        <tr>
          {domains.map(d => <th key={d.key || d.nama}>{d.nama}</th>)}
          <th>Menaakul<br /><small style={{ fontWeight: 400 }}>(1–15)</small></th>
          <th>Penyelesaian<br /><small style={{ fontWeight: 400 }}>(16–30)</small></th>
        </tr>
      </>
    ) : (
      <tr>
        <th className="ct-sticky ct-bil">Bil.</th>
        <th className="ct-sticky ct-nama">Nama</th>
        <th className="ct-sticky ct-id">ID Pengenalan</th>
        {domains.map(d => <th key={d.key || d.nama}>{d.nama}</th>)}
        <th>Status</th>
        <th>Cetak</th>
      </tr>
    );

    return (
      <div className="ct-wrap">
        <table className="ct">
          <thead>{thead}</thead>
          <tbody>
            {rows.map(({ record, sc }, idx) => {
              const ic = record.murid.ic || record.ic || '';
              return (
                <tr key={ic || idx}>
                  <td className="ct-sticky ct-bil">{idx + 1}</td>
                  <td className="ct-sticky ct-nama">{record.murid.nama}</td>
                  <td className="ct-sticky ct-id">{ic}</td>

                  {domains.map((d, dIdx) => {
                    const s = sc && sc.aScores.find(a => a.idx === dIdx);
                    return (
                      <td key={d.key || d.nama}>
                        {s
                          ? <span className="ct-score-a">{s.ya}/{s.total}</span>
                          : <span className="ct-pending">—</span>}
                      </td>
                    );
                  })}

                  {hasBahagianB && (
                    sc && sc.bReasoning ? (
                      <>
                        <td><span className="ct-score-b">{sc.bReasoning.right}/{sc.bReasoning.total}</span></td>
                        <td><span className="ct-score-b">{sc.bProblemSolving.right}/{sc.bProblemSolving.total}</span></td>
                      </>
                    ) : (
                      <>
                        <td><span className="ct-pending">—</span></td>
                        <td><span className="ct-pending">—</span></td>
                      </>
                    )
                  )}

                  <td><span className="ct-done">Selesai</span></td>
                  <td>
                    <button className="btn ct-print-btn" onClick={() => onPrint(record)}>
                      Cetak
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  ```

- [ ] **Step 2: Semak fail disimpan — buka browser, pastikan tiada ralat JavaScript di konsol**

  Komponen belum digunakan lagi — tiada perubahan visual. Tiada ralat sepatutnya muncul.

- [ ] **Step 3: Commit**

  ```bash
  git add app/admin.jsx
  git commit -m "feat: add ClassTable component for admin score overview"
  ```

---

### Task 3: Tambah mekanisme print per-baris

**Files:**
- Modify: `app/admin.jsx` — dalam fungsi `AdminScreen`

- [ ] **Step 1: Tambah state `printingRecord` dalam `AdminScreen`**

  Cari blok state sedia ada di bahagian atas `AdminScreen` (baris ~6-13):

  ```javascript
  const [password, setPassword] = React.useState('');
  const [authed, setAuthed] = React.useState(() => sessionStorage.getItem('iat6.admin') === '1');
  const [records, setRecords] = React.useState([]);
  const [allMurid, setAllMurid] = React.useState([]);
  const [selectedKelas, setSelectedKelas] = React.useState('');
  const [expandedIc, setExpandedIc] = React.useState('');
  const [printingAll, setPrintingAll] = React.useState(false);
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');
  const prevTitleRef = React.useRef('');
  ```

  Tambah satu baris selepas `setPrintingAll`:

  ```javascript
  const [printingRecord, setPrintingRecord] = React.useState(null);
  ```

- [ ] **Step 2: Tambah `useEffect` untuk print selepas `printingRecord` di-set**

  Cari blok `useEffect` yang menangani `printingAll` (baris ~89-98):

  ```javascript
  React.useEffect(() => {
    if (!printingAll) return;
    const t = window.setTimeout(() => {
      window.print();
      document.title = prevTitleRef.current;
      setPrintingAll(false);
    }, 250);
    return () => window.clearTimeout(t);
  }, [printingAll]);
  ```

  Tambah `useEffect` baru tepat **selepas** blok di atas:

  ```javascript
  React.useEffect(() => {
    if (!printingRecord) return;
    const t = window.setTimeout(() => {
      window.print();
      document.title = prevTitleRef.current;
      setPrintingRecord(null);
    }, 250);
    return () => window.clearTimeout(t);
  }, [printingRecord]);
  ```

- [ ] **Step 3: Tambah fungsi `handleTablePrint`**

  Tambah selepas blok `useEffect` `printingRecord` di atas:

  ```javascript
  const handleTablePrint = React.useCallback((record) => {
    const inst = window.GetInstrumentForMurid
      ? window.GetInstrumentForMurid(record.murid)
      : (window.INSTRUMENTS && window.INSTRUMENTS[6]);
    const sc = window.ScoreInstrument
      ? window.ScoreInstrument(record.jawapan || {}, inst)
      : null;
    if (!sc) return;
    prevTitleRef.current = document.title;
    document.title = `Analisis Aptitud ${record.murid.nama} Tahun ${inst.year}`;
    setPrintingRecord({ record, sc, inst });
  }, []);
  ```

- [ ] **Step 4: Tambah early-return untuk `printingRecord`**

  Cari blok `if (printingAll)` (baris ~129-152):

  ```javascript
  if (printingAll) {
    return (
      <div>
        {classRecords.map(record => { ... })}
      </div>
    );
  }
  ```

  Tambah blok baru **selepasnya**:

  ```javascript
  if (printingRecord) {
    const { record, sc, inst } = printingRecord;
    return (
      <div>
        <AdminAnswerSheet record={record} score={sc} instrument={inst} />
        <div style={{ marginTop: 24 }}>
          <AdminAnalysis analysis={sc.analysis} />
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 5: Uji print per-baris secara manual (selepas Task 4 siap)**

  Ini akan diuji bersama Task 4. Langkah ini adalah peringatan untuk tidak lupa uji.

- [ ] **Step 6: Commit**

  ```bash
  git add app/admin.jsx
  git commit -m "feat: add per-row print mechanism for table view"
  ```

---

### Task 4: Tambah `viewMode` toggle dan wire `ClassTable` ke `AdminScreen`

**Files:**
- Modify: `app/admin.jsx` — dalam fungsi `AdminScreen`

- [ ] **Step 1: Tambah state `viewMode` dan `classInstrument` useMemo**

  Di bahagian state (bersama state lain), tambah:

  ```javascript
  const [viewMode, setViewMode] = React.useState('table');
  ```

  Cari blok `const classRecords = completedByKelas[selectedKelas] || [];` (baris ~80). Tambah `classInstrument` tepat selepasnya:

  ```javascript
  const classRecords = completedByKelas[selectedKelas] || [];
  const classInstrument = React.useMemo(() => {
    if (!classRecords.length) return window.INSTRUMENTS && window.INSTRUMENTS[6];
    return window.GetInstrumentForMurid
      ? window.GetInstrumentForMurid(classRecords[0].murid)
      : (window.INSTRUMENTS && window.INSTRUMENTS[6]);
  }, [classRecords]);
  ```

- [ ] **Step 2: Tambah UI toggle tab dan render bersyarat dalam JSX**

  Cari bahagian `{/* Student list for selected class */}` dalam `return` (baris ~191). Di dalam blok `{selectedKelas && (...)}`, cari `<div className="admin-student-list">` dan blok `{classRecords.length === 0 ? ... : (...)}`.

  Gantikan keseluruhan blok senarai (dari `{classRecords.length === 0` sehingga `)}` penutupnya) dengan:

  ```jsx
  {classRecords.length === 0
    ? <p style={{ color: 'var(--muted)', marginTop: 12 }}>Tiada murid yang telah menghantar borang.</p>
    : (
      <>
        <div className="view-tabs">
          <button
            className={`view-tab ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}>
            ⊞ Jadual
          </button>
          <button
            className={`view-tab ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}>
            ☰ Senarai
          </button>
        </div>

        {viewMode === 'table'
          ? <ClassTable records={classRecords} instrument={classInstrument} onPrint={handleTablePrint} />
          : (
            <div className="admin-student-list">
              {classRecords.map(record => {
                const inst = window.GetInstrumentForMurid
                  ? window.GetInstrumentForMurid(record.murid)
                  : (window.INSTRUMENTS && window.INSTRUMENTS[6]);
                const sc = window.ScoreInstrument
                  ? window.ScoreInstrument(record.jawapan || {}, inst)
                  : null;
                const isExpanded = expandedIc === record.ic;
                return (
                  <div key={record.ic} className={`admin-student-row ${isExpanded ? 'expanded' : ''}`}>
                    <div className="admin-student-row-head"
                      onClick={() => setExpandedIc(isExpanded ? '' : record.ic)}>
                      <span className="admin-student-name">{record.murid.nama}</span>
                      {sc && (
                        <span className="admin-student-top">
                          {sc.top3.map(s => s.nama).join(' · ')}
                        </span>
                      )}
                      <span className="admin-student-inst">{inst.shortTitle}</span>
                      <button className="btn-icon btn-icon-danger" title="Padam rekod"
                        onClick={e => {
                          e.stopPropagation();
                          if (!window.confirm(`Padam rekod ${record.murid.nama}? Tindakan ini tidak boleh dibatalkan.`)) return;
                          window.StudentDirectory.deleteBorangJawapan(record.ic)
                            .then(() => loadRecords())
                            .catch(err => alert(err.message));
                        }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                      </button>
                      <span className="expand-caret">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {isExpanded && sc && (
                      <div className="admin-student-detail">
                        <div className="admin-grid">
                          <div className="admin-card" style={{ border: 'none', padding: '12px 0', boxShadow: 'none' }}>
                            <h2>{record.murid.nama}</h2>
                            <p className="res-card-sub">{record.murid.kelas} - {record.murid.sekolah}</p>
                            <div className="admin-stats">
                              <div>
                                <div className="meta-label">Dijawab</div>
                                <div className="meta-val">{sc.answeredCount}/{inst.sectionA.length + inst.sectionB.length}</div>
                              </div>
                              <div>
                                <div className="meta-label">Instrumen</div>
                                <div className="meta-val">{inst.shortTitle}</div>
                              </div>
                              <div>
                                <div className="meta-label">Dihantar</div>
                                <div className="meta-val">{record.updatedAtIso ? new Date(record.updatedAtIso).toLocaleString('ms-MY') : '-'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="admin-card" style={{ border: 'none', padding: '12px 0', boxShadow: 'none' }}>
                            <h2>{inst.kind === 'traits' ? '3 Tret Dominan' : '3 Kecerdasan Dominan'}</h2>
                            <div className="admin-mini-list">
                              {sc.top3.map((s, i) => (
                                <div key={s.idx} className="admin-mini-row">
                                  <span>{i + 1}. {s.nama}</span>
                                  <strong>{s.ya}/{s.total}</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <AdminAnalysis analysis={sc.analysis} />

                        <div style={{ marginTop: 16 }}>
                          <div className="sheet-toolbar">
                            <div>
                              <h2>Borang Jawapan</h2>
                              <p className="res-card-sub">Format cetakan seperti borang jawapan rasmi.</p>
                            </div>
                            <button className="btn" onClick={() => {
                              const prev = document.title;
                              document.title = `Analisis Aptitud ${record.murid.nama} Tahun ${inst.year}`;
                              window.print();
                              document.title = prev;
                            }}>Cetak</button>
                          </div>
                          <AdminAnswerSheet record={record} score={sc} instrument={inst} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        }
      </>
    )
  }
  ```

- [ ] **Step 3: Uji secara manual**

  1. Buka `index.html` di browser, log masuk admin
  2. Pilih kelas yang ada murid selesai
  3. Pastikan tab "⊞ Jadual | ☰ Senarai" kelihatan
  4. Tab Jadual: pastikan jadual muncul dengan kolum domain yang betul ikut tahun
  5. Scroll mendatar (Tahun 4): pastikan Bil/Nama/ID kekal beku di kiri
  6. Klik butang Cetak pada satu baris → pastikan halaman print muncul dengan borang jawapan murid tersebut
  7. Tab Senarai: pastikan senarai expandable sedia ada berfungsi seperti biasa
  8. Tukar kelas → pastikan jadual dikemas kini dengan murid kelas baharu

- [ ] **Step 4: Commit**

  ```bash
  git add app/admin.jsx
  git commit -m "feat: add viewMode toggle and wire ClassTable into AdminScreen"
  ```

---

## Semakan Pelan

**Liputan spec:**
- ✅ Format skor: `ya/jumlah` (ClassTable, baris `s.ya/${s.total}`)
- ✅ Hanya murid selesai: `records` dari `classRecords` (sudah filtered)
- ✅ Jadual sahaja + butang Cetak: `onPrint` callback + `printingRecord` state
- ✅ Toggle tab "Jadual | Senarai": Task 4 Step 2
- ✅ Sticky columns (Bil, Nama, ID): CSS `.ct-sticky`, `.ct-bil`, `.ct-nama`, `.ct-id`
- ✅ Kolum Tahun 4 (15 tret): `domains.map` dari `instrument.domains` (TRAITS_T4 ada 15 item)
- ✅ Kolum Tahun 5 (9 domain): sama, `instrument.domains` dari `INTELLIGENCES`
- ✅ Kolum Tahun 6 (9+2): `hasBahagianB` flag + grouped header dua baris
- ✅ Print per-baris: Task 3, `handleTablePrint` + `printingRecord` early return
