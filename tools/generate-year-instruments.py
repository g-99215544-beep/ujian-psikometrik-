from pathlib import Path
import json
import re

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "tahun5"
OUT_FILE = ROOT / "data" / "year-instruments.generated.js"


TRAITS_T4 = [
    ("autonomi", "Autonomi"),
    ("kreatif", "Kreatif"),
    ("agresif", "Agresif"),
    ("ekstrovert", "Ekstrovert"),
    ("pencapaian", "Pencapaian"),
    ("kepelbagaian", "Kepelbagaian"),
    ("intelektual", "Intelektual"),
    ("kepemimpinan", "Kepemimpinan"),
    ("struktur", "Struktur"),
    ("daya_tahan", "Daya Tahan"),
    ("menolong", "Menolong"),
    ("analitikal", "Analitikal"),
    ("kritik_diri", "Kritik Diri"),
    ("wawasan", "Wawasan"),
    ("ketelusan", "Ketelusan"),
]

TRAIT_DESCRIPTIONS = {
    "autonomi": "Cenderung berdikari, membuat keputusan sendiri dan selesa mengawal tindakan sendiri.",
    "kreatif": "Cenderung menghasilkan idea baharu, karya unik dan penyelesaian yang berbeza.",
    "agresif": "Cenderung tegas, cepat bertindak dan mempertahankan pandangan sendiri.",
    "ekstrovert": "Cenderung aktif bersosial, mesra dan bertenaga apabila bersama orang lain.",
    "pencapaian": "Cenderung mengejar kejayaan, sasaran dan prestasi terbaik.",
    "kepelbagaian": "Cenderung terbuka kepada perubahan, budaya, gaya dan pengalaman baharu.",
    "intelektual": "Cenderung mencari ilmu, memahami konsep dan meneroka maklumat baharu.",
    "kepemimpinan": "Cenderung memimpin, memberi arahan dan menggerakkan kumpulan.",
    "struktur": "Cenderung menyukai peraturan, susunan, rutin dan kerja yang terancang.",
    "daya_tahan": "Cenderung tabah, gigih dan mampu bangkit semula apabila menghadapi cabaran atau kegagalan.",
    "menolong": "Cenderung prihatin, simpati dan suka membantu orang lain.",
    "analitikal": "Cenderung menilai fakta, membandingkan maklumat dan berfikir sebelum bertindak.",
    "kritik_diri": "Cenderung menilai diri secara kritikal dan mudah meragui kemampuan sendiri.",
    "wawasan": "Cenderung mempunyai hala tuju, cita-cita dan strategi masa hadapan.",
    "ketelusan": "Cenderung memberi gambaran diri yang sangat positif dan patuh kepada nilai sosial.",
}

TRAIT_COLORS = [
    "#2563EB",
    "#D97706",
    "#DC2626",
    "#059669",
    "#7C3AED",
    "#0891B2",
    "#9333EA",
    "#EA580C",
    "#475569",
    "#0EA5E9",
    "#16A34A",
    "#0F766E",
    "#BE123C",
    "#4F46E5",
    "#CA8A04",
]


def parse_t4_items():
    items = []
    pattern = re.compile(r"^(\d{1,3})\s+(.+?)\s+YA\s+TIDAK$")
    with pdfplumber.open(ROOT / "ujian psikometrik tahun 4.pdf") as pdf:
        for page in pdf.pages[1:]:
            text = page.extract_text(x_tolerance=1, y_tolerance=3) or ""
            for raw in text.splitlines():
                line = " ".join(raw.split())
                match = pattern.match(line)
                if not match:
                    continue
                no = int(match.group(1))
                statement = match.group(2).strip()
                items.append({
                    "no": no,
                    "teks": f"Saya {statement}",
                    "domain": (no - 1) % len(TRAITS_T4),
                })
    if len(items) != 150:
        raise RuntimeError(f"Expected 150 Tahun 4 items (15 traits × 10 items), got {len(items)}")
    return sorted(items, key=lambda item: item["no"])


def t5_items():
    texts = [
        "Saya boleh berucap tanpa teks di hadapan rakan-rakan",
        "Saya membuat perancangan yang teliti sebelum berbelanja",
        "Saya lebih suka melakukan aktiviti tanpa kawalan orang lain",
        "Saya membuat nota menggunakan kaedah lukisan berbentuk carta",
        "Saya minat memerhatikan pelbagai jenis tumbuhan",
        "Saya suka melakukan aktiviti bersama rakan-rakan",
        "Saya aktif menyertai aktiviti sukan dan permainan",
        "Saya boleh menghasilkan alat muzik sendiri",
        "Saya suka mengetahui asal-usul sesuatu kejadian",
        "Saya suka mencari perkataan baharu melalui pembacaan",
        "Saya akan mengira baki wang selepas berbelanja",
        "Saya boleh merancang sendiri masa penggunaan gajet",
        "Saya boleh menghasilkan model menggunakan kertas",
        "Saya suka mengenali pelbagai jenis haiwan",
        "Saya mudah bersimpati dengan rakan yang berada dalam kesusahan",
        "Saya boleh melakukan aktiviti fizikal",
        "Saya boleh mengarang lirik lagu",
        "Saya percaya setiap rintangan hidup memberi kekuatan diri",
        "Saya boleh menceritakan semula watak-watak daripada bahan pembacaan",
        "Saya boleh menggunakan pelbagai cara untuk menghafal sifir",
        "Saya lebih selesa belajar secara bersendirian",
        "Saya boleh melukis bangunan dari pelbagai sudut pandangan",
        "Saya suka menikmati suasana alam semula jadi",
        "Saya mudah memahami perasaan orang lain",
        "Saya suka aktiviti yang melibatkan pergerakan",
        "Saya cepat menghafal melodi lagu",
        "Saya tahu setiap perkara yang dilakukan akan mendapat balasan",
        "Saya boleh memberikan pendapat secara spontan",
        "Saya membuat perbandingan harga sebelum membeli sesuatu",
        "Saya suka menikmati masa berseorangan",
        "Saya suka menghasilkan ciptaan daripada permainan blok",
        "Saya dapat menerangkan kesan-kesan aktiviti manusia terhadap alam sekitar",
        "Saya suka belajar secara berkumpulan",
        "Saya suka menghasilkan kraftangan",
        "Saya boleh menjadikan sebarang alatan sebagai alat muzik",
        "Saya sedar setiap perbuatan memberi kesan kepada orang lain",
        "Saya suka meluahkan perasaan melalui penulisan",
        "Saya suka menyelesaikan masalah secara sistematik",
        "Saya sentiasa memperbaiki kelemahan diri untuk menjadi yang lebih baik",
        "Saya suka melakukan aktiviti menyusun puzzle",
        "Saya suka menonton klip video berkaitan tumbuh-tumbuhan atau haiwan",
        "Saya bosan apabila berseorangan",
        "Saya boleh melakukan aktiviti senamrobik",
        "Saya boleh menyanyi dalam pelbagai genre muzik",
        "Saya percaya tidak ada yang kekal di dunia",
        "Saya mudah menghafal menggunakan perkataan",
        "Saya mengelaskan komponen peralatan sebelum membuat pemasangan",
        "Saya suka membuat pilihan sendiri tentang sesuatu perkara",
        "Saya boleh mengetahui sesuatu lokasi berpandukan papan tanda arah",
        "Saya peka terhadap perubahan alam sekitar",
        "Saya mudah berkenalan dengan kawan baharu",
        "Saya boleh melakukan aktiviti yang melibatkan koordinasi badan",
        "Saya boleh menghasilkan muzik melalui pelbagai cara",
        "Saya percaya setiap kehidupan memberi manfaat",
        "Saya mudah mempelajari bahasa baharu",
        "Saya suka melakukan tugasan mengikut jadual",
        "Saya suka merahsiakan sesuatu perkara tentang diri sendiri",
        "Saya mahir menggunakan peta untuk ke sesuatu lokasi",
        "Saya suka menikmati keindahan alam sekitar",
        "Saya boleh memahami emosi orang lain",
        "Saya suka bersukan",
        "Saya boleh menghasilkan lirik lagu baharu menggunakan rentak sedia ada",
        "Saya percaya setiap manusia mempunyai matlamat diri",
        "Saya mudah memahami sesuatu perkara menggunakan perkataan",
        "Saya mudah mengingat menggunakan nombor",
        "Saya yakin dengan penampilan diri sendiri",
        "Saya mudah mengingat menggunakan gambar rajah",
        "Saya suka memahami kitaran hidup haiwan atau tumbuhan",
        "Saya rasa gembira berkongsi kejayaan dengan rakan-rakan",
        "Saya boleh melakukan aktiviti sukan menggunakan peralatan",
        "Saya mudah mengingati maklumat menggunakan lagu",
        "Saya menghormati kepercayaan orang lain",
        "Saya suka mencatat pengalaman hidup",
        "Saya suka permainan yang berunsurkan strategi",
        "Saya bertanggungjawab terhadap tindakan yang saya lakukan",
        "Saya suka menggunakan lukisan untuk menerangkan sesuatu",
        "Saya boleh mengenali pelbagai jenis batuan",
        "Saya boleh memulakan perbualan dengan rakan baharu",
        "Saya suka belajar perkara yang melibatkan aktiviti praktikal",
        "Saya boleh melakukan aktiviti tarian",
        "Saya percaya sesuatu peristiwa yang berlaku mempunyai pengajaran",
        "Saya suka aktiviti perbahasan",
        "Saya mahir menggunakan komputer",
        "Saya boleh mengawal emosi sendiri",
        "Saya suka menyusun atur peralatan dalam kelas",
        "Saya suka memerhatikan awan di langit",
        "Saya suka membantu rakan-rakan",
        "Saya boleh melakukan pelbagai aktiviti regangan badan",
        "Saya selesa belajar sambil mendengar muzik",
        "Saya mengakui kesilapan yang dilakukan",
    ]
    if len(texts) != 90:
        raise RuntimeError(f"Expected 90 Tahun 5 items, got {len(texts)}")
    return [{"no": no, "teks": text, "domain": (no - 1) % 9} for no, text in enumerate(texts, start=1)]


def js_literal(value):
    return json.dumps(value, ensure_ascii=False, indent=2)


def write_js(t4_items):
    traits = [
        {
            "key": key,
            "nama": label,
            "warna": TRAIT_COLORS[idx % len(TRAIT_COLORS)],
            "deskripsi": TRAIT_DESCRIPTIONS[key],
            "huraian": [TRAIT_DESCRIPTIONS[key]],
        }
        for idx, (key, label) in enumerate(TRAITS_T4)
    ]
    content = f"""// Generated from Tahun 4 and Tahun 5 PDFs by tools/generate-year-instruments.py.
(function () {{
  window.TRAITS_T4 = {js_literal(traits)};

  window.BAHAGIAN_A_T4 = {js_literal(t4_items)};

  window.BAHAGIAN_A_T5 = {js_literal(t5_items())};

  function normalizeYear(value) {{
    const n = parseInt(String(value || '').replace(/[^0-9]/g, ''), 10);
    return [4, 5, 6].includes(n) ? n : null;
  }}

  function inferYearFromIc(ic) {{
    const raw = String(ic || '').replace(/[^0-9]/g, '');
    if (raw.length < 2) return null;
    const yy = parseInt(raw.slice(0, 2), 10);
    if (Number.isNaN(yy)) return null;
    const birthYear = yy <= 30 ? 2000 + yy : 1900 + yy;
    const cohortYear = 2026 - birthYear - 6;
    if (cohortYear >= 4 && cohortYear <= 6) return cohortYear;
    return null;
  }}

  function inferYearFromClass(kelas) {{
    const text = String(kelas || '').toLowerCase();
    if (/tahun\\s*4|\\bt4\\b|\\b4\\b/.test(text)) return 4;
    if (/tahun\\s*5|\\bt5\\b|\\b5\\b/.test(text)) return 5;
    if (/tahun\\s*6|\\bt6\\b|\\b6\\b/.test(text)) return 6;
    return null;
  }}

  window.INSTRUMENTS = {{
    4: {{
      year: 4,
      code: 'ITP_T4',
      title: 'Inventori Tret Personaliti Tahun 4',
      shortTitle: 'ITP Tahun 4',
      kind: 'traits',
      duration: 30 * 60,
      sectionAName: 'Inventori Tret Personaliti',
      sectionALabel: 'Inventori tret personaliti',
      sectionBName: '',
      domains: window.TRAITS_T4,
      sectionA: window.BAHAGIAN_A_T4,
      sectionB: [],
    }},
    5: {{
      year: 5,
      code: 'IKeP_T5',
      title: 'Inventori Kecerdasan Pelbagai Tahun 5',
      shortTitle: 'IKeP Tahun 5',
      kind: 'intelligence',
      duration: 45 * 60,
      sectionAName: 'Inventori Kecerdasan Pelbagai',
      sectionALabel: 'Inventori kecerdasan pelbagai',
      sectionBName: '',
      domains: window.INTELLIGENCES,
      sectionA: window.BAHAGIAN_A_T5,
      sectionB: [],
    }},
    6: {{
      year: 6,
      code: 'IA_T6',
      title: 'Instrumen Aptitud Tahun 6',
      shortTitle: 'IA Tahun 6',
      kind: 'aptitude',
      duration: 90 * 60,
      sectionAName: 'Inventori Kecerdasan Pelbagai',
      sectionALabel: 'Inventori kecerdasan pelbagai',
      sectionBName: 'Kemahiran Menaakul & Menyelesaikan Masalah',
      domains: window.INTELLIGENCES,
      sectionA: window.BAHAGIAN_A,
      sectionB: window.BAHAGIAN_B,
    }},
  }};

  window.GetInstrumentYear = function (murid) {{
    return normalizeYear(murid && murid.tahun)
      || inferYearFromClass(murid && (murid.kelas || murid.namaKelas))
      || inferYearFromIc(murid && (murid.ic || murid.id || murid.noPengenalan))
      || 6;
  }};

  window.GetInstrumentForMurid = function (murid) {{
    return window.INSTRUMENTS[window.GetInstrumentYear(murid)] || window.INSTRUMENTS[6];
  }};
}})();
"""
    OUT_FILE.write_text(content, encoding="utf-8")


def main():
    t4 = parse_t4_items()
    write_js(t4)
    print(f"Generated {OUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
