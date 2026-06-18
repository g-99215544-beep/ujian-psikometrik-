# Reka Bentuk: Ganti Instrumen Tahun 4 dengan Instrumen Aptitud Am Tahun 4

Tarikh: 2026-06-18

## Masalah

Dalam webapp, instrumen yang dipaparkan untuk **Tahun 4** sekarang ialah
*Inventori Tret Personaliti Tahun 4* (`ITP_T4`) — inventori personaliti gaya
YA/TIDAK. Ini bukan instrumen yang betul untuk murid Tahun 4. Instrumen yang
betul ialah **Instrumen Aptitud Am Tahun 4** (`IAA_T4`), satu ujian objektif
80 soalan dengan jawapan betul/salah.

Bahan sumber ada dalam `ujian tahun 4/`:
- `Instrumen Aptitud Am Tahun 4 - Tahun 2026.pdf` (25 halaman, 80 soalan)
- `Kunci Jawapan Instrumen Aptitud Am Tahun 4 - Tahun 2026.pdf`
- `Borang Jawapan Instrumen Aptitud Am Tahun 4 - Tahun 2026.pdf`

## Matlamat

Gantikan sepenuhnya instrumen Tahun 4 (`INSTRUMENTS[4]`) dengan Instrumen
Aptitud Am Tahun 4. Tahun 5 dan Tahun 6 tidak berubah.

## Spesifikasi Instrumen

- **80 soalan objektif**, pilihan A/B/C/D, satu jawapan betul setiap soalan.
- Tiga bahagian:
  - **Bahagian A — Bahasa Melayu**: soalan 1–30
  - **Bahagian B — Bahasa Inggeris**: soalan 31–60
  - **Bahagian C — Matematik**: soalan 61–80
- Masa: **1 jam 30 minit** (90 minit).
- Kunci jawapan (No → Jawapan):
  ```
  1D 2C 3B 4A 5C 6B 7A 8A 9C 10C 11D 12D 13C 14A 15C 16A 17D 18D 19B 20A
  21B 22C 23D 24D 25C 26B 27B 28D 29B 30C 31D 32B 33C 34C 35C 36D 37A 38C
  39C 40A 41D 42C 43B 44C 45B 46D 47D 48D 49C 50C 51B 52C 53D 54C 55D 56C
  57C 58B 59D 60C 61B 62B 63B 64D 65A 66C 67D 68A 69C 70B 71C 72C 73C 74D
  75B 76B 77B 78C 79C 80B
  ```

## Pendekatan Terpilih

**Setiap soalan dirender sebagai imej PNG** dari PDF (sama seperti Bahagian B
Tahun 6 sedia ada — lihat `tools/generate-bahagian-b-crops.py` dan
`assets/bahagian-b/`). Ini mengekalkan susun atur, rajah, dan gambar dengan
tepat. Banyak soalan bergantung pada elemen visual (cth. Q10 permainan
ting-ting, Q20 payung, Q57 rajah, Q62, Q68–71 yang pilihan A/B/C/D pun imej,
Q72 peta) yang tidak boleh ditaip sebagai teks sahaja.

Imej disimpan dalam folder lokal repo (`assets/tahun4-aptitud/`) dan di-commit,
supaya terus berfungsi di GitHub Pages tanpa kredential Firebase.

Alternatif yang ditolak:
- *Taip semula sebagai teks* — banyak kerja, berisiko silap, dan soalan visual
  tulen tetap perlukan imej.
- *Hos di Firebase Storage* — perlukan kredential upload; folder lokal lebih
  mudah dan berfungsi luar talian.

## Komponen & Perubahan

### 1. Tool penjana — `tools/generate-tahun4-aptitud.py` (baharu)

Tanggungjawab:
1. **Crop 80 imej soalan** dari PDF guna PyMuPDF (`fitz`) →
   `assets/tahun4-aptitud/q01.png … q80.png`. Tiap imej meliputi blok soalan
   penuh (stem + pilihan A/B/C/D) tanpa header/footer halaman. Bagi soalan
   berkongsi rangsangan/petikan (cth. Q27–28, Q29–30, Q52–55), rangsangan
   dimasukkan dalam imej setiap soalan berkenaan supaya tiap soalan lengkap
   sendiri.
2. **Tulis `data/tahun4-aptitud.generated.js`** yang mengandungi:
   - `window.BAHAGIAN_APTITUD_T4` — array 80 item:
     `{ no, bahagian: 'A'|'B'|'C', bahagianNama, pdfImage, jawapan }`
   - IIFE yang menetapkan `window.INSTRUMENTS[4]` (override) kepada instrumen
     aptitud setelah `year-instruments.generated.js` dimuatkan.

Definisi crop rectangle ditentukan per soalan (gaya `QUESTION_RECTS` dalam tool
Bahagian B). Boleh dibantu dengan koordinat perkataan daripada `pdfplumber`
untuk mengesan sempadan soalan, kemudian disahkan secara visual.

### 2. Instrumen `INSTRUMENTS[4]` baharu

```
4: {
  year: 4,
  code: 'IAA_T4',
  title: 'Instrumen Aptitud Am Tahun 4',
  shortTitle: 'IAA Tahun 4',
  kind: 'aptitude',
  duration: 90 * 60,
  sectionAName: '',
  sectionBName: 'Aptitud Am',
  domains: [],
  sectionA: [],
  sectionB: window.BAHAGIAN_APTITUD_T4,
  sectionBGroups: [
    { start: 1,  end: 30, title: 'Bahagian A · Bahasa Melayu',  focus: '...', kind: 'general' },
    { start: 31, end: 60, title: 'Bahagian B · Bahasa Inggeris', focus: '...', kind: 'general' },
    { start: 61, end: 80, title: 'Bahagian C · Matematik',       focus: '...', kind: 'general' },
  ],
}
```

Nota: nombor soalan `sectionB` berjulat 1–80 (global). Item lama `TRAITS_T4` /
`BAHAGIAN_A_T4` dalam `year-instruments.generated.js` kekal ditakrif tetapi
tidak lagi digunakan oleh Tahun 4 (dead code yang tidak memudaratkan).

### 3. `index.html`

Tambah selepas baris `year-instruments.generated.js`:
```html
<script src="data/tahun4-aptitud.generated.js"></script>
```

### 4. `app/exam.jsx`

- Semua 80 soalan dimuatkan dalam `sectionB` (sectionA kosong), jadi semua
  dirender sebagai imej-MCQ melalui laluan `pdfImage` sedia ada.
- Chip "Bahagian" dalam `q-meta`: bila item ada medan `bahagian`/`bahagianNama`,
  papar label per-item (cth. "Bahagian A · Bahasa Melayu") dan bukan label
  bahagian tetap.
- Tip footer khusus YA/TIDAK tidak ditunjuk untuk instrumen ini (tiada
  sectionA).
- Pastikan navigasi/`maxIdx` berfungsi bila `totalA === 0` (sudah disokong
  kerana `isA = idx < totalA` menjadi sentiasa `false`).

### 5. `app/scoring.js`

- Generalisasikan pengumpulan Bahagian B: gunakan `instrument.sectionBGroups`
  jika ada (array `{start, end, title, focus, kind}`). Jika tiada, kekalkan
  kelakuan Tahun 6 sedia ada (1–15 reasoning, 16–30 problem) supaya Tahun 6
  tidak terjejas.
- Hasilkan `analysis.groups` (array) daripada `sectionBGroups`, setiap satu
  dengan `right/total/pct/level/tone/description`.
- Tambah salinan band `kind: 'general'` untuk huraian pecahan bahasa/matematik.
- Bila `domains` kosong, `aScores`/`top3` jadi array kosong (tiada perubahan
  diperlukan; pastikan tiada ralat).

### 6. `app/results.jsx`

- Bila instrumen tiada `domains` (atau `kind === 'aptitude'` dengan sectionA
  kosong): sembunyikan kad "3 Dominan" dan kad "Bahagian A · domain".
- Papar kad markah: **jumlah betul / 80**, peratus, band keseluruhan.
- Papar pecahan setiap bahagian daripada `score.analysis.groups`
  (BM /30, BI /30, Matematik /20) guna komponen `AnalysisBlock` sedia ada,
  dijadikan gelung ke atas array `groups`.
- Header hero guna `active.sectionA.length + active.sectionB.length` (= 80).

## Yang TIDAK berubah

- Instrumen Tahun 5 (`IKeP_T5`) dan Tahun 6 (`IA_T6`).
- Papan pemuka admin, integrasi Firebase, aliran murid (welcome → arahan →
  ujian → keputusan), pemilihan instrumen mengikut tahun.

## Pengesahan

- 80 imej dijana dan dipaparkan betul (semakan visual contact sheet).
- Setiap soalan boleh dijawab A/B/C/D; jawapan disimpan.
- Pemarkahan: skor sepadan dengan kunci jawapan; pecahan bahagian betul.
- Tahun 6 masih berfungsi seperti biasa (tiada regresi pada pemarkahan/keputusan).
- App dimuatkan tanpa ralat konsol di GitHub Pages / pelayar tempatan.
