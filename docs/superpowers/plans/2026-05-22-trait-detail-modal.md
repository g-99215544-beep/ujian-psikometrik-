# Trait Detail Modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let students on the results screen click any of the 9 intelligence rows in Bahagian A to open a modal with a poster image plus structured details (ciri, kemahiran, tip, kerjaya) for that intelligence.

**Architecture:** A new data file (`data/intelligence-details.js`) holds transcribed poster content keyed by `domain.key`. A new presentational component (`app/trait-modal.jsx`) renders the modal from `(domain, detail)` props. `app/results.jsx` adds local `selectedDomain` state, makes Bahagian A bar rows clickable when the active instrument is intelligence-based (T5/T6), and conditionally renders `TraitModal`. Poster JPGs are renamed from generated photo names to `<key>.jpg`.

**Tech Stack:** Vanilla JS + React 18 (UMD via script tags), Babel standalone JSX transform, no build step, no test framework. All "tests" are manual browser verifications because the project has no test runner.

**Spec:** [docs/superpowers/specs/2026-05-22-trait-detail-modal-design.md](../specs/2026-05-22-trait-detail-modal-design.md)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `assets/posters/*.jpg` | Rename (9 files) | Per-intelligence poster images keyed by `domain.key`. |
| `data/intelligence-details.js` | Create | `window.INTELLIGENCE_DETAILS` — 9 entries with `{motto, ringkasan, ciri, kemahiran, tip, kerjaya}`. |
| `app/trait-modal.jsx` | Create | `window.TraitModal({domain, detail, onClose})` — pure presentational modal with Esc/overlay/close-button handling. |
| `app/results.jsx` | Modify | Add `selectedDomain` state, gate by instrument kind, make `.bar-row` rows clickable, render `TraitModal`. |
| `app/styles.css` | Modify | `.bar-row.clickable`, `.trait-modal-overlay`, `.trait-modal`, hero/section styles, print rule. |
| `index.html` | Modify | Add 2 `<script>` tags for the new data file and component, in correct load order. |

## Manual Verification Setup

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`. Tests reuse two ICs from previous tasks:
- Pick a Tahun 6 student IC with a saved record (to view results without re-taking).
- Pick a Tahun 4 student IC to verify T4 is correctly excluded.

If you don't have a saved Tahun 4 record, you'll need to take a quick T4 sitting once (or use admin tools to seed).

---

### Task 1: Rename poster files

**Files:**
- Rename: `assets/posters/photo_*_2026-05-22_08-29-56.jpg` → `assets/posters/{key}.jpg`

- [ ] **Step 1: Verify the 9 source files exist**

```powershell
Get-ChildItem assets/posters
```

Expected output: 9 files named `photo_1_2026-05-22_08-29-56.jpg` through `photo_9_2026-05-22_08-29-56.jpg`.

- [ ] **Step 2: Rename the files (one PowerShell command per file, copy-paste safe)**

```powershell
Rename-Item assets/posters/photo_1_2026-05-22_08-29-56.jpg eksistensial.jpg
Rename-Item assets/posters/photo_2_2026-05-22_08-29-56.jpg muzik.jpg
Rename-Item assets/posters/photo_3_2026-05-22_08-29-56.jpg kinestetik.jpg
Rename-Item assets/posters/photo_4_2026-05-22_08-29-56.jpg interpersonal.jpg
Rename-Item assets/posters/photo_5_2026-05-22_08-29-56.jpg naturalis.jpg
Rename-Item assets/posters/photo_6_2026-05-22_08-29-56.jpg visual.jpg
Rename-Item assets/posters/photo_7_2026-05-22_08-29-56.jpg intrapersonal.jpg
Rename-Item assets/posters/photo_8_2026-05-22_08-29-56.jpg logik.jpg
Rename-Item assets/posters/photo_9_2026-05-22_08-29-56.jpg linguistik.jpg
```

- [ ] **Step 3: Verify the renames**

```powershell
Get-ChildItem assets/posters | Sort-Object Name
```

Expected output (9 lines, alphabetical):
```
eksistensial.jpg
interpersonal.jpg
intrapersonal.jpg
kinestetik.jpg
linguistik.jpg
logik.jpg
muzik.jpg
naturalis.jpg
visual.jpg
```

- [ ] **Step 4: Commit**

```bash
git add assets/posters
git commit -m "chore: rename poster files to match intelligence keys"
```

---

### Task 2: Create `data/intelligence-details.js`

**Files:**
- Create: `data/intelligence-details.js`

- [ ] **Step 1: Create the file with all 9 transcribed entries**

Create `data/intelligence-details.js` with the following exact content:

```js
// Detailed content per intelligence — sourced from the school poster series
// produced by UNIT BIMBINGAN DAN KAUNSELING SK SRI AMAN.
// Keyed by INTELLIGENCES[].key. Used by app/trait-modal.jsx.
(function () {
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

    logik: {
      motto: 'Berfikir Logik, Selesaikan Masalah, Cipta Penyelesaian!',
      ringkasan: 'Elemen Logik Matematik merujuk kepada keupayaan menggunakan nombor, pola dan logik untuk menyelesaikan masalah, membuat pengiraan, menganalisis maklumat serta membuat keputusan secara sistematik dan berkesan.',
      ciri: [
        'Suka nombor, pengiraan dan operasi matematik.',
        'Suka mencari pola, hubungan sebab-akibat dan aturan.',
        'Berfikir secara logik, sistematik dan teratur.',
        'Suka mencuba pelbagai cara untuk menyelesaikan masalah.',
        'Teliti, fokus dan tidak mudah berputus asa.'
      ],
      kemahiran: [
        { judul: 'Latihan Pengiraan', huraian: 'Lakukan latihan asas secara konsisten untuk menguasai kemahiran asas matematik.' },
        { judul: 'Analisis dan Mencari Pola', huraian: 'Cari pola dan hubungan dalam nombor, jadual, graf atau situasi.' },
        { judul: 'Strategi Penyelesaian Masalah', huraian: 'Kenal pasti masalah, rancang langkah, cuba pelbagai kaedah dan semak jawapan.' },
        { judul: 'Gunakan Alat Bantu Mengajar', huraian: 'Gunakan alat seperti kalkulator, pembaris, blok asas atau aplikasi matematik.' },
        { judul: 'Buat Nota Ringkas & Rumus', huraian: 'Catat formula, rumus dan langkah penting dalam bentuk ringkas dan teratur.' },
        { judul: 'Bermain Permainan Logik', huraian: 'Cuba permainan seperti sudoku, teka silang nombor, atau kad strategi.' },
        { judul: 'Aplikasi Dalam Kehidupan', huraian: 'Kaitkan matematik dengan situasi harian seperti belanja, masa, jarak dan ukuran.' }
      ],
      tip: [
        'Jangan takut salah, cuba lagi!',
        'Latih minda setiap hari.',
        'Fokus, sabar dan yakin.',
        'Ingat: Praktis membina kepakaran.'
      ],
      kerjaya: ['Jurutera', 'Saintis', 'Akauntan', 'Penganalisis Data', 'Ahli Matematik']
    },

    intrapersonal: {
      motto: 'Kenali Diri, Kuasai Diri, Capai Potensi Diri!',
      ringkasan: 'Elemen Intrapersonal merujuk kepada keupayaan memahami diri sendiri, mengenali kekuatan dan kelemahan diri, mengawal emosi, menetapkan matlamat dan membuat pilihan yang baik untuk mencapai kejayaan diri.',
      ciri: [
        'Mengenali kekuatan dan kelemahan diri sendiri.',
        'Bertanggungjawab terhadap tindakan dan keputusan.',
        'Boleh bekerja sendiri dan fokus terhadap matlamat.',
        'Mengawal emosi dan bersikap positif.',
        'Suka merenung, berfikir dan menilai diri.',
        'Mempunyai motivasi diri yang tinggi dan tidak mudah putus asa.'
      ],
      kemahiran: [
        { judul: 'Belajar Secara Kendiri', huraian: 'Tetapkan masa dan tempat yang sesuai untuk belajar tanpa bergantung kepada orang lain.' },
        { judul: 'Buat Jurnal Refleksi', huraian: 'Catat pengalaman belajar, apa yang dipelajari dan cara menambah baik diri.' },
        { judul: 'Tetapkan Matlamat Belajar', huraian: 'Tentukan matlamat jangka pendek dan jangka panjang serta rancang langkah mencapainya.' },
        { judul: 'Urus Masa Dengan Baik', huraian: 'Buat jadual harian, utamakan tugasan dan elakkan pembaziran masa.' },
        { judul: 'Nilai Kemajuan Diri', huraian: 'Semak dan nilai pencapaian diri secara berkala. Rayakan kejayaan kecil!' },
        { judul: 'Fikir Secara Positif & Yakin Diri', huraian: 'Percayalah pada kemampuan diri dan belajar daripada kesilapan.' },
        { judul: 'Gunakan Strategi Diri Sendiri', huraian: 'Cipta cara belajar yang sesuai dengan diri untuk lebih efektif dan berkesan.' }
      ],
      tip: [
        'Kenali diri - tahu apa yang anda suka dan tidak suka.',
        'Fokus pada matlamat, bukan halangan.',
        'Jangan bandingkan diri dengan orang lain.',
        'Belajar daripada kesilapan.',
        'Jaga kesihatan fizikal dan mental.'
      ],
      kerjaya: ['Kaunselor', 'Ahli Psikologi', 'Penulis', 'Penyelidik', 'Pemimpin']
    },

    visual: {
      motto: 'Saya faham melalui gambar, warna dan ruang!',
      ringkasan: 'Elemen Visual Ruang merujuk kepada keupayaan memproses maklumat melalui imej, ruang, bentuk, warna dan susunan visual. Murid yang dominan dalam elemen ini mudah faham apabila melihat dan membayangkan sesuatu dalam bentuk visual.',
      ciri: [
        'Mudah faham melalui gambar, rajah, carta dan warna.',
        'Suka melihat keseluruhan gambar besar sebelum fokus pada butiran.',
        'Mudah mengingati maklumat berbentuk visual.',
        'Suka melukis, mencipta reka bentuk dan susunan.',
        'Peka pada perincian visual dan susunan ruang.',
        'Mudah mengaitkan maklumat dengan bentuk atau imej.'
      ],
      kemahiran: [
        { judul: 'Gunakan Peta Minda', huraian: 'Susun idea utama dan idea sokongan dalam bentuk peta minda untuk melihat gambaran keseluruhan.' },
        { judul: 'Buat Carta, Graf dan Diagram', huraian: 'Tukar maklumat kepada carta, graf atau jadual untuk memudahkan pemahaman dan perbandingan.' },
        { judul: 'Gunakan Warna dan Penanda', huraian: 'Warna berbeza untuk tajuk, subtajuk dan kata kunci penting bagi membantu ingatan.' },
        { judul: 'Belajar Melalui Gambar & Video', huraian: 'Gunakan video, animasi atau imej untuk memahami konsep yang abstrak.' },
        { judul: 'Buat Nota Visual', huraian: 'Gabungkan tulisan ringkas dengan gambar rajah, simbol atau lakaran.' },
        { judul: 'Gunakan Flashcard Bergambar', huraian: 'Buat kad imbasan dengan gambar, ikon atau warna untuk menghafal dengan lebih mudah.' },
        { judul: 'Susun Maklumat Secara Visual', huraian: 'Gunakan peta alir, garis masa atau rajah alir untuk memahami proses atau urutan.' }
      ],
      tip: [
        'Gunakan warna yang menyerlah.',
        'Lukis ringkas, padat dan kreatif.',
        'Fokus pada gambaran besar sebelum butiran kecil.',
        'Latih diri melukis semula apa yang dipelajari.'
      ],
      kerjaya: ['Arkitek', 'Pereka Grafik', 'Jurutera Bangunan', 'Pelukis', 'Animator', 'Fotografer']
    },

    naturalis: {
      motto: 'Saya faham melalui alam semula jadi!',
      ringkasan: 'Elemen Naturalis merujuk kepada keupayaan mengenali, membezakan dan memahami alam semula jadi, tumbuhan, haiwan, persekitaran dan fenomena alam. Murid yang dominan dalam elemen ini suka meneroka alam dan belajar melalui pengalaman luar.',
      ciri: [
        'Suka berada di alam semula jadi.',
        'Peka terhadap tumbuhan, haiwan dan persekitaran.',
        'Gemar memerhati dan menerokai.',
        'Suka mengumpul bahan semula jadi seperti daun, batu, biji dan cengkerang.',
        'Suka menjaga, menghargai dan memelihara alam sekitar.',
        'Mudah faham apabila dikaitkan dengan alam atau pengalaman luar.',
        'Suka aktiviti luar, praktikal dan berkaitan dengan kehidupan sebenar.'
      ],
      kemahiran: [
        { judul: 'Belajar Di Luar Bilik Darjah', huraian: 'Gunakan persekitaran luar sebagai ruang pembelajaran yang nyata dan bermakna.' },
        { judul: 'Pemerhatian & Eksplorasi', huraian: 'Perhatikan tumbuhan, haiwan, cuaca dan fenomena alam untuk memahami konsep.' },
        { judul: 'Kaitkan Dengan Alam Sekitar', huraian: 'Hubungkan topik pelajaran dengan situasi atau peristiwa yang berlaku di alam.' },
        { judul: 'Aktiviti Hands-On (Praktikal)', huraian: 'Gunakan bahan sebenar seperti tanah, air, daun atau biji untuk eksperimen dan projek.' },
        { judul: 'Buat Catatan Alam', huraian: 'Catat pemerhatian dalam buku jurnal alam melalui lakaran, gambar atau nota ringkas.' },
        { judul: 'Projek & Kajian Lapangan', huraian: 'Lakukan projek mini atau lawatan untuk menambah pengetahuan dan pengalaman.' },
        { judul: 'Penjagaan & Pemeliharaan Alam', huraian: 'Libatkan diri dalam aktiviti kitar semula, penanaman dan pemuliharaan alam sekitar.' }
      ],
      tip: [
        'Pergi ke taman, kebun atau hutan kecil.',
        'Bawa buku nota & pensel setiap kali keluar.',
        'Tanya soalan: Apa? Mengapa? Bagaimana?',
        'Jaga kebersihan dan hargai ciptaan Allah.'
      ],
      kerjaya: ['Ahli Biologi', 'Ahli Botani', 'Pegawai Perhutanan', 'Veterinar', 'Petani Moden', 'Penyelidik Alam Sekitar']
    },

    interpersonal: {
      motto: 'Saya belajar bersama, kita berjaya bersama!',
      ringkasan: 'Elemen Interpersonal merujuk kepada keupayaan memahami dan berinteraksi secara berkesan dengan orang lain. Murid yang dominan dalam elemen ini suka bekerjasama, mudah berkomunikasi, peka perasaan orang lain dan berupaya bekerja dalam kumpulan.',
      ciri: [
        'Suka berkomunikasi dan berinteraksi dengan orang lain.',
        'Empati dan peka terhadap perasaan orang lain.',
        'Suka bekerjasama dalam kumpulan.',
        'Mudah membuat rakan dan membina hubungan baik.',
        'Berupaya menyelesaikan konflik dengan cara yang positif.',
        'Suka memimpin dan memberi sokongan kepada rakan.',
        'Menghargai pandangan dan pendapat orang lain.',
        'Bertanggungjawab terhadap peranan dalam kumpulan.'
      ],
      kemahiran: [
        { judul: 'Belajar Dalam Kumpulan', huraian: 'Belajar bersama rakan melalui perbincangan untuk memahami konsep dengan lebih baik.' },
        { judul: 'Bincang Dan Berkongsi Idea', huraian: 'Bertukar pendapat dan idea untuk mencari penyelesaian terbaik.' },
        { judul: 'Peer Teaching (Ajar Rakan)', huraian: 'Mengajar rakan atau menerangkan semula topik untuk mengukuhkan pemahaman.' },
        { judul: 'Aktiviti Kolaboratif', huraian: 'Menyelesaikan tugasan atau projek secara kerjasama mengikut peranan masing-masing.' },
        { judul: 'Bermain Peranan (Role Play)', huraian: 'Melakonkan situasi sebenar untuk memahami pandangan dan perasaan orang lain.' },
        { judul: 'Perbincangan Terstruktur', huraian: 'Menggunakan teknik seperti Think-Pair-Share, Jigsaw atau Round Table dalam pembelajaran.' },
        { judul: 'Membina Rangkaian Positif', huraian: 'Berhubung dengan guru, rakan dan komuniti untuk mendapat sokongan dan peluang belajar.' }
      ],
      tip: [
        'Dengar dengan penuh perhatian.',
        'Bercakap dengan sopan dan jelas.',
        'Hargai pendapat orang lain.',
        'Jujur, bertolak ansur dan hormat rakan.',
        'Bekerjasama untuk capai kejayaan bersama.'
      ],
      kerjaya: ['Guru', 'Kaunselor', 'Jururawat', 'Pengurus Sumber Manusia', 'Pemimpin', 'Pekerja Sosial']
    },

    kinestetik: {
      motto: 'Saya belajar dengan bergerak, menyentuh dan melakukan!',
      ringkasan: 'Elemen Kinestetik merujuk kepada keupayaan belajar melalui pergerakan, sentuhan dan pengalaman fizikal. Murid yang dominan dalam elemen ini suka melakukan, mencuba, menyentuh dan belajar secara aktiviti.',
      ciri: [
        'Suka bergerak dan aktif.',
        'Sukar duduk diam untuk jangka masa yang lama.',
        'Suka belajar melalui aktiviti praktikal.',
        'Suka menyentuh, memegang atau menggunakan sesuatu.',
        'Cepat bosan dengan ceramah yang panjang.',
        'Suka mencuba dan bereksperimen.',
        'Suka melakukan projek atau tugasan hands-on.'
      ],
      kemahiran: [
        { judul: 'Belajar Melalui Aktiviti', huraian: 'Gunakan aktiviti hands-on, eksperimen, demonstrasi atau simulasi.' },
        { judul: 'Gunakan Bahan Manipulatif', huraian: 'Gunakan objek seperti blok, kad imbasan, model atau alat bantu untuk memahami konsep.' },
        { judul: 'Bergerak Semasa Belajar', huraian: 'Bangun, berjalan, regangan ringan atau ubah kedudukan semasa mengulang kaji.' },
        { judul: 'Buat Nota Melalui Lakaran & Label', huraian: 'Lukis, label dan gunakan warna untuk membantu pemahaman.' },
        { judul: 'Pemecahan Tugas Kepada Aksi Kecil', huraian: 'Bahagikan tugasan kepada langkah-langkah kecil dan lakukan satu persatu.' },
        { judul: 'Bermain Peranan (Role Play)', huraian: 'Gunakan lakonan atau situasi sebenar untuk memahami topik.' },
        { judul: 'Gunakan Teknik "Belajar Dengan Tangan"', huraian: 'Tulis tangan, membuat model, eksperimen atau aktiviti DIY membantu ingatan.' }
      ],
      tip: [
        'Ambil rehat aktif setiap 30-45 minit.',
        'Gunakan pergerakan untuk segarkan minda.',
        'Libatkan diri dalam aktiviti praktikal setiap hari.',
        'Belajar di tempat yang membolehkan anda bergerak.',
        'Jadikan pembelajaran menyeronokkan dan interaktif!'
      ],
      kerjaya: ['Atlet', 'Jurulatih', 'Pakar Bedah', 'Tukang Mahir', 'Penari', 'Anggota Bomba / Polis / Tentera']
    },

    muzik: {
      motto: 'Saya faham melalui bunyi dan irama!',
      ringkasan: 'Elemen Muzik merujuk kepada keupayaan mengalami, membezakan, mengubah dan menyatakan bentuk muzik seperti melodi, ritma, nada, tempo dan timbre. Murid yang dominan dalam elemen ini suka mendengar muzik, berirama, menyanyi dan belajar melalui bunyi.',
      ciri: [
        'Suka mendengar muzik dalam pelbagai genre.',
        'Peka terhadap bunyi, nada, ritma dan tempo.',
        'Suka menyanyi, bersiul, atau berirama.',
        'Mudah mengingati lirik lagu, melodi atau bunyi.',
        'Suka menepuk tangan, mengetuk meja atau bergerak mengikut irama.',
        'Mudah fokus apabila belajar dengan muzik latar.',
        'Mempunyai kreativiti dalam mencipta lagu atau irama.',
        'Belajar lebih baik melalui lagu, melodi atau nyanyian.'
      ],
      kemahiran: [
        { judul: 'Dengar & Faham', huraian: 'Dengar rakaman, lagu atau podcast yang berkaitan dengan topik pelajaran.' },
        { judul: 'Buat Lagu Ringkas', huraian: 'Cipta lagu atau jingle sendiri untuk mengingat konsep, formula atau fakta penting.' },
        { judul: 'Gunakan Irama & Rima', huraian: 'Gunakan irama, rima atau pantun untuk memudahkan mengingati maklumat.' },
        { judul: 'Nyanyi Semasa Belajar', huraian: 'Nyanyikan nota, fakta, jadual atau istilah penting dengan melodi yang mudah.' },
        { judul: 'Gunakan Muzik Latar Yang Sesuai', huraian: 'Pilih muzik instrumental yang menenangkan untuk meningkatkan fokus semasa belajar.' },
        { judul: 'Peta Minda Berirama', huraian: 'Gabungkan simbol muzik, warna dan irama dalam membina peta minda.' },
        { judul: 'Ajar Dengan Muzik', huraian: 'Terangkan semula apa yang dipelajari dengan menyanyi atau berirama.' }
      ],
      tip: [
        'Pilih muzik yang sesuai, tidak terlalu bising.',
        'Gunakan irama untuk bantu fokus dan ingat.',
        'Nyanyi atau dengar semula topik yang sukar.',
        'Jadikan muzik sebagai alat bantu, bukan gangguan.',
        'Gunakan kreativiti muzik untuk belajar dengan seronok!'
      ],
      kerjaya: ['Pemuzik', 'Penyanyi', 'Komposer', 'Jurutera Bunyi', 'Guru Muzik', 'DJ / Penerbit Muzik']
    },

    eksistensial: {
      motto: 'Saya faham makna diri, hidup dan alam semesta!',
      ringkasan: 'Elemen Eksistensial merujuk kepada keupayaan berfikir secara mendalam tentang kewujudan, hidup, nilai, kebenaran, masa depan, alam semesta dan hubungan manusia dengan Tuhan, alam dan sesama makhluk. Murid yang dominan dalam elemen ini suka berfikir, bertanya soalan mendalam dan mencari makna dalam kehidupan.',
      ciri: [
        'Suka berfikir secara mendalam tentang kehidupan.',
        'Ingin memahami makna dan tujuan dirinya sesuatu.',
        'Reflektif dan suka merenung tentang diri dan kehidupan.',
        'Suka berbincang tentang nilai, kepercayaan dan kebenaran.',
        'Peka terhadap perasaan, nilai dan masalah kemanusiaan.',
        'Suka alam semesta, misteri, agama, falsafah dan seni.',
        'Mencari hubungan antara semua perkara dalam kehidupan.',
        'Membuat pilihan berdasarkan nilai dan prinsip diri.'
      ],
      kemahiran: [
        { judul: 'Refleksi Diri', huraian: 'Luangkan masa untuk menulis jurnal, bertanya diri sendiri dan renungkan pengalaman.' },
        { judul: 'Ajuk Soalan Mendalam', huraian: 'Biasakan bertanya "kenapa", "bagaimana", "apakah makna" dan cari jawapan daripada pelbagai sumber.' },
        { judul: 'Kaitkan Dengan Kehidupan Sebenar', huraian: 'Hubungkan pelajaran dengan pengalaman diri, nilai hidup dan isu semasa.' },
        { judul: 'Bincang & Dengar Pandangan Orang Lain', huraian: 'Bertukar pendapat secara terbuka dan hormat perbezaan pandangan.' },
        { judul: 'Gunakan Literasi Pelbagai', huraian: 'Baca buku, artikel, tonton dokumentari, dengar podcast atau kuliah untuk meluaskan pemikiran.' },
        { judul: 'Peta Minda Makna', huraian: 'Gabungkan idea, nilai, soalan dan jawapan dalam peta minda untuk fahami hubungan antara konsep.' },
        { judul: 'Projek Bermakna', huraian: 'Libatkan diri dalam projek yang memberi impak kepada diri, komuniti atau alam sekitar.' }
      ],
      tip: [
        'Hidup bukan tentang mencari diri, tetapi mencipta diri yang bermakna.',
        'Fahami diri, hargai hidup, ciptakan makna.'
      ],
      kerjaya: ['Ahli Falsafah', 'Pemimpin Rohaniah / Ulama', 'Kaunselor', 'Penulis / Penceramah Motivasi', 'Penyelidik Sosial']
    }
  };
})();
```

- [ ] **Step 2: Verify the file parses (syntax check via browser)**

You'll wire the script tag in Task 4 and verify globally then. For now just confirm the file exists:

```powershell
Get-Item data/intelligence-details.js | Select-Object Length
```

Expected: a number > 10000 (the file is large).

- [ ] **Step 3: Commit**

```bash
git add data/intelligence-details.js
git commit -m "feat: add structured intelligence detail content from posters"
```

---

### Task 3: Create `app/trait-modal.jsx`

**Files:**
- Create: `app/trait-modal.jsx`

- [ ] **Step 1: Create the component file**

Create `app/trait-modal.jsx` with the following exact content:

```jsx
// Trait detail modal — opened from results screen Bahagian A rows.
// Pure presentational component. Reads no globals.
window.TraitModal = function ({ domain, detail, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const [imgFailed, setImgFailed] = React.useState(false);
  const posterSrc = `assets/posters/${domain.key}.jpg`;

  return (
    <div className="trait-modal-overlay" onClick={onClose}>
      <div className="trait-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={domain.nama}>
        <div className="trait-modal-accent" style={{ background: domain.warna }} />
        <button className="trait-modal-close" onClick={onClose} aria-label="Tutup">×</button>

        <div className="trait-modal-header">
          <span className="bdot" style={{ background: domain.warna }} />
          <h2>{domain.nama}</h2>
        </div>

        {!imgFailed && (
          <div className="trait-modal-hero">
            <img
              src={posterSrc}
              alt={`Poster ${domain.nama}`}
              onError={() => setImgFailed(true)}
            />
          </div>
        )}

        {detail.motto && (
          <div className="trait-modal-section trait-modal-motto">
            <em>“{detail.motto}”</em>
          </div>
        )}

        {detail.ringkasan && (
          <div className="trait-modal-section">
            <p>{detail.ringkasan}</p>
          </div>
        )}

        {detail.ciri && detail.ciri.length > 0 && (
          <div className="trait-modal-section">
            <h3>Ciri-ciri</h3>
            <ul>
              {detail.ciri.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}

        {detail.kemahiran && detail.kemahiran.length > 0 && (
          <div className="trait-modal-section">
            <h3>Kemahiran Belajar Berkesan</h3>
            <ol className="kemahiran-list">
              {detail.kemahiran.map((item, i) => (
                <li key={i} className="kemahiran-item">
                  <strong>{item.judul}</strong>
                  <span>{item.huraian}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {detail.tip && detail.tip.length > 0 && (
          <div className="trait-modal-section">
            <h3>Tip Hebat</h3>
            <ul>
              {detail.tip.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}

        {detail.kerjaya && detail.kerjaya.length > 0 && (
          <div className="trait-modal-section">
            <h3>Sesuai Dengan Kerjaya</h3>
            <ul className="kerjaya-list">
              {detail.kerjaya.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add app/trait-modal.jsx
git commit -m "feat: add TraitModal component for intelligence detail view"
```

---

### Task 4: Wire script tags in `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add the two script tags**

In `index.html`, find this block:

```html
  <!-- Data -->
  <script src="data/items.js"></script>
  <script src="data/year-instruments.generated.js"></script>
  <script src="data/bahagian-b-images.js"></script>
  <script src="app/firebase.js"></script>
  <script src="app/scoring.js"></script>
```

Replace with:

```html
  <!-- Data -->
  <script src="data/items.js"></script>
  <script src="data/year-instruments.generated.js"></script>
  <script src="data/bahagian-b-images.js"></script>
  <script src="data/intelligence-details.js"></script>
  <script src="app/firebase.js"></script>
  <script src="app/scoring.js"></script>
```

Then find this block:

```html
  <!-- Components -->
  <script type="text/babel" src="app/visuals.jsx"></script>
  <script type="text/babel" src="app/welcome.jsx"></script>
  <script type="text/babel" src="app/exam.jsx"></script>
  <script type="text/babel" src="app/results.jsx"></script>
  <script type="text/babel" src="app/admin.jsx"></script>
```

Replace with:

```html
  <!-- Components -->
  <script type="text/babel" src="app/visuals.jsx"></script>
  <script type="text/babel" src="app/welcome.jsx"></script>
  <script type="text/babel" src="app/exam.jsx"></script>
  <script type="text/babel" src="app/trait-modal.jsx"></script>
  <script type="text/babel" src="app/results.jsx"></script>
  <script type="text/babel" src="app/admin.jsx"></script>
```

`trait-modal.jsx` MUST load before `results.jsx` so `window.TraitModal` is defined when results renders.

- [ ] **Step 2: Manual verification — globals are defined**

Reload `http://localhost:8000`. Open DevTools console. Run:

```js
window.INTELLIGENCE_DETAILS
```

Expected: object with 9 keys (linguistik, logik, intrapersonal, visual, naturalis, interpersonal, kinestetik, muzik, eksistensial).

Run:

```js
typeof window.TraitModal
```

Expected: `"function"`.

If either returns `undefined`, the script tag is missing or the file has a syntax error — open the Sources panel and check.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: load intelligence-details data and TraitModal component"
```

---

### Task 5: Wire `app/results.jsx` — clickable rows + modal render

**Files:**
- Modify: `app/results.jsx`

- [ ] **Step 1: Add state + lookup at top of component**

In `app/results.jsx`, find:

```js
window.ResultsScreen = function ({ murid, jawapan, onHome, instrument, viewOnly }) {
  const active = instrument || (window.GetInstrumentForMurid ? window.GetInstrumentForMurid(murid) : window.INSTRUMENTS[6]);
  const domains = active.domains || window.INTELLIGENCES;
```

Right after the `domains` line, add:

```js
  const details = window.INTELLIGENCE_DETAILS || {};
  const supportsDetail = active.kind === 'intelligence' || active.kind === 'aptitude';
  const [selectedDomain, setSelectedDomain] = React.useState(null);
```

- [ ] **Step 2: Make bar rows clickable**

In `app/results.jsx`, find the existing bar-row mapping in the Bahagian A card (around line 67-80):

```jsx
              <div className="bar-list">
                {aScores.map((s) => {
                  const def = domains[s.idx];
                  return (
                    <div key={s.idx} className="bar-row">
                      <div className="bar-name">
                        <span className="bdot" style={{ background: def.warna }}></span>
                        {def.nama}
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${s.pct}%`, background: def.warna }}></div>
                      </div>
                      <div className="bar-val">{s.ya}/{s.total}</div>
                    </div>
```

Replace with:

```jsx
              <div className="bar-list">
                {aScores.map((s) => {
                  const def = domains[s.idx];
                  const detail = supportsDetail ? details[def.key] : null;
                  const clickable = !!detail;
                  const open = () => setSelectedDomain(def);
                  return (
                    <div
                      key={s.idx}
                      className={`bar-row${clickable ? ' clickable' : ''}`}
                      role={clickable ? 'button' : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      onClick={clickable ? open : undefined}
                      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } } : undefined}
                    >
                      <div className="bar-name">
                        <span className="bdot" style={{ background: def.warna }}></span>
                        {def.nama}
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${s.pct}%`, background: def.warna }}></div>
                      </div>
                      <div className="bar-val">{s.ya}/{s.total}</div>
                    </div>
```

- [ ] **Step 3: Render `TraitModal` conditionally**

In `app/results.jsx`, find the very last `</div>` of the component — it should be the `</div>` that closes the outer `<div className="app">`. The component returns the JSX rooted there. Just before that closing `</div>`, add the modal render.

Concretely, locate the end of the component which looks like:

```jsx
        </div>
      </div>
    </div>
  );
};
```

Replace with:

```jsx
        </div>
      </div>

      {selectedDomain && details[selectedDomain.key] && window.TraitModal && (
        <window.TraitModal
          domain={selectedDomain}
          detail={details[selectedDomain.key]}
          onClose={() => setSelectedDomain(null)}
        />
      )}
    </div>
  );
};
```

(Two opening `</div>` close before the modal block, matching the existing structure. If your local file structure differs, place the modal as a sibling of the outermost `.results` element, still inside the root `.app` wrapper, so it overlays the entire results screen.)

- [ ] **Step 4: Manual verification — click opens modal**

Reload `http://localhost:8000`. Open a saved Tahun 6 result (use the IC re-entry flow from the previous feature).

Test A (click opens modal):
1. In the Bahagian A bar chart, hover over the row for "Verbal-Linguistik". Expected: cursor becomes pointer, subtle background highlight.
2. Click the row. Expected: modal opens, showing the linguistik poster image, motto, ringkasan, ciri, kemahiran, tip, kerjaya.

Test B (close mechanisms):
1. Click the × button. Modal closes.
2. Reopen by clicking another row (e.g. Logik-Matematik). Verify content matches that intelligence.
3. Click outside the modal (on the dark overlay). Modal closes.
4. Reopen. Press Esc. Modal closes.

Test C (image fallback):
1. In DevTools Network tab, block `assets/posters/`. Reload. Open modal.
2. Expected: modal renders without the hero image; text content still shows.
3. Unblock for subsequent tests.

Test D (T4 stays non-clickable):
1. Navigate home, enter a Tahun 4 IC with a saved record. View the results.
2. Hover over bar rows in Bahagian A. Cursor is NOT pointer, no hover background. Clicking does nothing.

Note: the modal will be visually unstyled at this point — that's fixed in Task 6. Focus the verification on behavior.

- [ ] **Step 5: Commit**

```bash
git add app/results.jsx
git commit -m "feat: open trait detail modal on Bahagian A row click"
```

---

### Task 6: Add CSS for clickable rows and modal

**Files:**
- Modify: `app/styles.css`

- [ ] **Step 1: Append the new styles**

Open `app/styles.css`. At the end of the file (after the last existing rule), append:

```css
/* === Bahagian A clickable rows (results screen) === */
.bar-row.clickable {
  cursor: pointer;
  border-radius: 8px;
  padding: 4px 6px;
  margin: -4px -6px;
  transition: background 0.15s ease;
}
.bar-row.clickable:hover { background: var(--surface-2); }
.bar-row.clickable:focus-visible { outline: 2px solid var(--accent, #5B8DEF); outline-offset: 2px; }

/* === Trait detail modal === */
.trait-modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(15, 23, 42, 0.55);
  display: grid; place-items: start center;
  padding: 24px 16px;
  overflow-y: auto;
}
.trait-modal {
  position: relative;
  background: var(--surface, #fff);
  border-radius: var(--radius-lg, 16px);
  max-width: 720px; width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  overflow: hidden;
}
.trait-modal-accent { height: 6px; }
.trait-modal-close {
  position: absolute; top: 10px; right: 14px;
  width: 36px; height: 36px;
  border: none; border-radius: 50%;
  background: rgba(255,255,255,0.85);
  font-size: 1.4rem; line-height: 1; cursor: pointer;
  display: grid; place-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.trait-modal-close:hover { background: #fff; }
.trait-modal-header {
  display: flex; align-items: center; gap: 10px;
  padding: 22px 28px 6px;
}
.trait-modal-header h2 {
  margin: 0; font-family: var(--font-display, inherit);
  font-size: 1.5rem; font-weight: 700;
}
.trait-modal-hero {
  background: var(--surface-2, #f5f6fa);
}
.trait-modal-hero img { display: block; width: 100%; height: auto; }

.trait-modal-section { padding: 14px 28px; }
.trait-modal-section h3 {
  margin: 0 0 8px; font-size: 0.85rem;
  color: var(--ink-2, #555); text-transform: uppercase;
  letter-spacing: 0.06em; font-weight: 700;
}
.trait-modal-section p { margin: 0; line-height: 1.6; color: var(--ink, #222); }
.trait-modal-section ul,
.trait-modal-section ol { margin: 0; padding-left: 20px; line-height: 1.6; }
.trait-modal-section li { margin-bottom: 6px; }

.trait-modal-motto em {
  font-size: 1.05rem; color: var(--ink-2, #444);
}

.kemahiran-list .kemahiran-item { margin-bottom: 10px; }
.kemahiran-list .kemahiran-item strong { display: block; margin-bottom: 2px; }
.kemahiran-list .kemahiran-item span { color: var(--ink-2, #444); }

.kerjaya-list { columns: 2; column-gap: 24px; }
.kerjaya-list li { break-inside: avoid; }

@media (max-width: 520px) {
  .kerjaya-list { columns: 1; }
  .trait-modal-section { padding: 12px 18px; }
  .trait-modal-header { padding: 18px 18px 4px; }
}

@media print {
  .trait-modal-overlay { display: none !important; }
}
```

- [ ] **Step 2: Manual verification — modal looks correct**

Hard-refresh `http://localhost:8000` (Ctrl+F5 to bypass CSS cache).

Open a Tahun 6 result. Click "Verbal-Linguistik" row. Verify:
- Dark overlay covers the page.
- White modal card centered, max-width ~720px.
- Coloured accent strip at top (matches `linguistik` warna — blue).
- Close × button visible at top-right.
- Poster image fills modal width with no awkward gaps.
- Sections separated cleanly with consistent padding.
- "Kerjaya" list displays in 2 columns on desktop.

Resize browser to ~400px width. Verify:
- Modal stays inside viewport with side padding.
- Kerjaya collapses to 1 column.
- Image scales down without overflow.

Open DevTools Print Preview. Verify the modal does NOT appear when print-previewing the results page.

- [ ] **Step 3: Commit**

```bash
git add app/styles.css
git commit -m "style: add CSS for clickable bar rows and trait detail modal"
```

---

### Task 7: End-to-end verification

**Files:** None (pure verification)

- [ ] **Step 1: Full happy-path verification across all 9 intelligences**

For a Tahun 6 result, click each of the 9 rows in order:

| # | Row | Verify |
|---|---|---|
| 1 | Verbal-Linguistik | Modal shows linguistik poster + content |
| 2 | Logik-Matematik | logik poster + content |
| 3 | Intrapersonal | intrapersonal poster + content |
| 4 | Visual-Ruang | visual poster + content |
| 5 | Naturalis | naturalis poster + content |
| 6 | Interpersonal | interpersonal poster + content |
| 7 | Kinestetik | kinestetik poster + content |
| 8 | Muzik | muzik poster + content |
| 9 | Eksistensial | eksistensial poster + content |

For each row, confirm the modal title, accent color (matches `domain.warna`), poster image, and at least one item from each section (ciri, kemahiran, tip, kerjaya) appears.

- [ ] **Step 2: Cross-flow verification (no regression)**

1. Open admin screen at `http://localhost:8000/#admin`. Verify table view + record list still load normally.
2. From admin, return to main app. Re-enter a Tahun 6 IC with saved record. Confirm the "Lihat Keputusan" flow still works.
3. Take a fresh test as a Tahun 6 student (use an IC without a record). Confirm new submission saves correctly and the modal works on the fresh result page too.
4. Take a fresh test as a Tahun 4 student. Confirm bar rows are NOT clickable. Confirm the rest of the report still renders.

- [ ] **Step 3: Print check**

While viewing a result with no modal open, hit Ctrl+P. Verify the PDF preview shows the report with no modal overlay artifacts (filename should still be `Analisis Aptitud {nama} Tahun {n}`).

While viewing a result with the modal open, hit Ctrl+P. Verify the print preview still shows the report only — modal is suppressed.

- [ ] **Step 4: Commit if any docs/fixes emerged**

If verification passed cleanly, no commit needed. If any small fix was made during this verification, commit it now with a descriptive message.

---

## Out of Scope (Confirmed Non-Goals)

- Tahun 4 (TRAITS_T4) personality traits — bar rows remain non-interactive.
- Bahagian B (kemahiran menaakul) — not touched.
- Top-3 Dominan card click — only bar rows are clickable (single entry point).
- Per-poster print button — modal is hidden in print; right-click image works for individual save.
