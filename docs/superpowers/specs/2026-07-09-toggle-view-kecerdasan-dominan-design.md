# Toggle View: Senarai Murid Mengikut Kecerdasan Dominan

**Tarikh:** 2026-07-09
**Fail utama:** `app/class-analysis.jsx` (+ CSS dalam `app/styles.css`)
**Skop:** Bahagian "Senarai Murid Mengikut Kecerdasan Dominan" dalam `CaDomainAnalysis` sahaja (Admin > Analisis Tahun, untuk Tahun 5 & 6 — instrumen 9 kecerdasan). Bahagian Tahun 4 (`CaAptitudeAnalysis`, band aptitud) TIDAK berubah.

## Tujuan

Guru mahu dua cara melihat senarai murid dalam bahagian yang sama:
1. **Ikut Kecerdasan** — paparan sedia ada: murid dikumpulkan mengikut kecerdasan paling dominan.
2. **Ikut Nama Murid** — senarai ikut nama, setiap murid papar 3 kecerdasan dominan mereka; tekan nama untuk popup profil ringkas kecerdasan.

## Reka Bentuk

### 1. Toggle

- Pill/tab toggle di penjuru kanan tajuk kad "Senarai Murid Mengikut Kecerdasan Dominan".
- Guna semula gaya `view-tab` yang sedia ada di `admin.jsx` (⊞/☰).
- Dua pilihan:
  - `Ikut Kecerdasan` (default) — paparan sekarang, tiada perubahan tingkah laku.
  - `Ikut Nama Murid` — paparan baru.
- State tempatan dalam `CaDomainAnalysis`: `dominanView` (`'kecerdasan' | 'nama'`), default `'kecerdasan'`.

### 2. View "Ikut Nama Murid"

- Senarai murid disusun ikut abjad nama.
- **Pengumpulan ikut kelas kekal** apabila `groupByKelas` benar (iaitu "Semua Kelas" dipilih), konsisten dengan view sedia ada. Apabila satu kelas dipilih, satu senarai rata.
- Setiap baris murid:
  - **Nama murid** — butang boleh diklik (buka popup).
  - 3 kecerdasan dominan sebagai badge berwarna (warna kecerdasan), cth:
    `HUSNA BINTI SHAIK NAZRUL` · 1) Interpersonal (10/10) · 2) Eksistensial (9/10) · 3) Logik-Matematik (9/10)
  - Sumber top-3: `sc.top3` (sudah disusun ikut bilangan "YA" oleh `ScoreInstrument`). Skor dipapar sebagai `ya/total`.
- Murid tanpa kecenderungan jelas (semua "YA" = 0) tetap disenaraikan dengan skor sedia ada.

### 3. Popup profil ringkas (tekan nama)

- Guna semula gaya overlay/modal `trait-modal` sedia ada (`trait-modal-overlay`, `trait-modal`, dsb.).
- Komponen baru `CaStudentModal` dalam `class-analysis.jsx` (presentational, tiada bergantung pada global selain yang dihantar sebagai props).
- Kandungan:
  - Tajuk: nama murid + kelas.
  - Senarai **penuh 9 kecerdasan** murid itu, disusun tinggi→rendah (ikut bilangan "YA", konsisten dengan top-3).
  - Setiap kecerdasan: titik warna + nama + skor `ya/total` + tahap.
  - Tahap: Tinggi ≥70%, Sederhana 40–69%, Rendah <40% (guna `caTahap(pct)` sedia ada).
- Tutup: butang `×`, klik overlay luar, atau tekan `Esc`.

### 4. Perlaksanaan

Dalam `app/class-analysis.jsx`, komponen `CaDomainAnalysis`:

- Tambah state:
  - `const [dominanView, setDominanView] = React.useState('kecerdasan')`
  - `const [modalStudent, setModalStudent] = React.useState(null)`
- Bina senarai murid (dalam `useMemo` atas `scored`):
  - Setiap item: `{ nama, kelas, top3: sc.top3, all: [...sc.aScores].sort((a,b) => b.ya - a.ya) }`.
- Render bersyarat pada bahagian akhir kad: `dominanView === 'kecerdasan'` → markup sedia ada; `=== 'nama'` → markup senarai nama baru.
- Render `CaStudentModal` bila `modalStudent` bukan null.

Komponen baru:
- `CaStudentModal({ student, onClose })` — presentational, guna gaya modal sedia ada, papar senarai `student.all`.

CSS (`app/styles.css`):
- Kelas baru untuk baris nama murid + badge kecerdasan (cth `ca-name-row`, `ca-name-badges`).
- Guna semula kelas modal sedia ada untuk popup; tambah sedikit gaya untuk senarai kecerdasan dalam popup jika perlu.

## Di Luar Skop

- Tiada perubahan pada bahagian Tahun 4 (aptitud/band).
- Tiada analisis penuh / borang jawapan / cetak dalam popup (popup ringkas sahaja).
- Tiada perubahan logik pemarkahan (`scoring.js`).

## Pengesahan

- Tukar antara dua view — kedua-dua papar murid yang sama, tersusun betul.
- View "Ikut Nama Murid" papar 3 kecerdasan dominan yang tepat per murid (padan dengan view "Ikut Kecerdasan").
- Pengumpulan ikut kelas berfungsi bila "Semua Kelas"; senarai rata bila satu kelas dipilih.
- Tekan nama → popup papar 9 kecerdasan tersusun tinggi→rendah dengan skor & tahap betul.
- Tutup popup via `×`, klik luar, dan `Esc`.
- Cetak Analisis kekal berfungsi mengikut view yang aktif.
