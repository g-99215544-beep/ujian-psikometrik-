# Admin Table View — Design Spec
Date: 2026-05-13

## Overview

Tambah paparan jadual ringkasan markah murid dalam dashboard admin. Jadual menunjukkan skor semua domain bagi setiap murid yang telah selesai ujian, dengan toggle untuk bertukar antara jadual baru dan senarai expandable sedia ada.

## Keputusan Reka Bentuk

| Soal | Keputusan |
|------|-----------|
| Format skor | Markah mentah: `ya/jumlah` (contoh: `6/7`) |
| Murid yang ditunjukkan | Hanya murid yang sudah selesai (hantar jawapan) |
| Interaksi baris | Jadual sahaja — tiada expand; butang Cetak di setiap baris |
| Toggle paparan | Tab "⊞ Jadual \| ☰ Senarai" di atas panel kelas |
| Kolum lebar | Sticky columns — Bil, Nama, ID kekal beku di kiri semasa scroll mendatar |

## Kolum Jadual per Instrumen

### Tahun 4 — ITP (Inventori Tret Personaliti)
Kolum tetap: `Bil | Nama | ID Pengenalan` (sticky)
Kolum domain (15 tret): Autonomi · Kreatif · Agresif · Ekstrovert · Pencapaian · Kepelbagaian · Intelektual · Kepemimpinan · Struktur · Daya Tahan · Menolong · Analitikal · Kritik Diri · Wawasan · Ketelusan
Kolum akhir: `Status | Cetak`

Jadual perlu scroll mendatar (15 kolum domain). Kolum Bil/Nama/ID sticky.

### Tahun 5 — IKeP (Inventori Kecerdasan Pelbagai)
Kolum tetap: `Bil | Nama | ID Pengenalan` (sticky)
Kolum domain (9 kecerdasan): Linguistik · Logik-Matematik · Intrapersonal · Visual-Ruang · Naturalis · Interpersonal · Kinestetik · Muzik · Eksistensial
Kolum akhir: `Status | Cetak`

Muat pada skrin biasa tanpa scroll mendatar.

### Tahun 6 — IA (Instrumen Aptitud)
Kolum tetap: `Bil | Nama | ID Pengenalan` (sticky)
Kolum Bahagian A (9 domain, header berkumpul): Linguistik · Logik · Intrapersonal · Visual · Naturalis · Interpersonal · Kinestetik · Muzik · Eksistensial
Kolum Bahagian B (2 kolum, header berkumpul): Menaakul (1–15) · Penyelesaian Masalah (16–30)
Kolum akhir: `Status | Cetak`

Header dua baris: baris pertama "BAHAGIAN A" (colspan 9, biru) + "BAHAGIAN B" (colspan 2, hijau); baris kedua nama domain.

## Komponen Baru

### `ClassTable({ records, instrument })`
Komponen baru dalam `admin.jsx`. Menerima:
- `records` — array rekod murid yang telah selesai (dari `classRecords` sedia ada)
- `instrument` — objek instrumen dari `GetInstrumentForMurid`

Tanggungjawab:
1. Kira skor setiap murid menggunakan `ScoreInstrument` (sudah ada)
2. Render jadual dengan kolum sesuai ikut `instrument.kind` (`traits` / `intelligence` / `aptitude`) dan `instrument.year`
3. Butang Cetak setiap baris menggunakan logik print sedia ada

### Perubahan pada `AdminScreen`
- Tambah state: `const [viewMode, setViewMode] = React.useState('table')`
- Tambah UI toggle tab di atas panel murid:
  ```
  ⊞ Jadual | ☰ Senarai
  ```
- Render `ClassTable` atau senarai expandable sedia ada berdasarkan `viewMode`

## Aliran Data

```
classRecords (array rekod selesai)
  → ClassTable
    → ScoreInstrument(record.jawapan, instrument) per murid
    → render baris jadual
      → butang Cetak → window.print() dengan title format sedia ada
```

## CSS

- Wrapper: `overflow-x: auto` pada div jadual
- Sticky columns: `position: sticky; left: <offset>px; z-index: 2`
  - Bil: `left: 0`
  - Nama: `left: 32px`
  - ID: `left: 152px` (mengikut lebar nama)
- Gaya skor: badge hijau `#dcfce7` untuk domain A, badge biru `#dbeafe` untuk Bahagian B
- Tab toggle: border-radius 6px, tab aktif background `#2563eb`

## Fail yang Diubah

- `app/admin.jsx` — komponen baru `ClassTable`, tambah state `viewMode`, tambah UI toggle
- `app/styles.css` — class CSS untuk jadual sticky, tab toggle, badge skor

## Di Luar Skop

- Sorting atau filtering jadual
- Export CSV
- Pagination
- Murid yang belum selesai (tidak ditunjukkan dalam jadual)
