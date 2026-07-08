// Shared scoring helpers for laporan murid and admin dashboard.
(function () {
  const DOMAIN_HURAIAN = {
    intrapersonal: [
      'Kenal diri sendiri - tahu apa yang disukai, tidak disukai dan apa yang mahu dicapai.',
      'Yakin dengan kemampuan diri - tidak mudah goyah walaupun menerima kritikan.',
      'Stabil emosi - tenang, sabar dan tahu cara mengawal marah atau kecewa.',
      'Ada matlamat hidup - tahu hala tuju dan berusaha mencapainya.',
      'Reflektif - suka menilai semula pengalaman untuk belajar daripadanya.',
      'Bertanggungjawab atas tindakan sendiri - tidak suka menyalahkan orang lain.',
      'Independen - boleh membuat keputusan sendiri dengan yakin.'
    ],
    kinestetik: [
      'Aktif dan bertenaga - sukakan aktiviti fizikal, sukan dan pergerakan.',
      "Belajar melalui pengalaman - lebih faham bila boleh 'buat sendiri'.",
      'Ekspresif - gunakan bahasa tubuh atau gerak isyarat semasa bercakap.',
      'Cekap koordinasi motor - pandai dalam sukan, tarian, lakonan atau aktiviti kemahiran tangan.',
      'Tidak suka duduk lama - cepat bosan dengan aktiviti pasif.',
      'Suka membina atau mencipta - gemar aktiviti DIY, eksperimen dan kerja tangan.',
      'Peka terhadap deria tubuh.'
    ],
    logik: [
      'Suka nombor dan pola - gemar mengira, menganalisis data dan melihat corak tersembunyi.',
      'Berfikiran logik - sentiasa mencari sebab dan bukti sebelum membuat keputusan.',
      'Suka menyelesaikan masalah - gemar teka-teki, strategi dan cabaran intelek.',
      'Struktur dan teratur - suka benda yang sistematik dan langkah demi langkah.',
      'Analitikal - mampu menganalisis situasi secara objektif.',
      'Kreatif secara logik - boleh cipta penyelesaian baharu yang masuk akal.',
      'Minat dalam bidang sains, matematik, teknologi dan komputer.'
    ],
    naturalis: [
      'Cinta alam sekitar - suka tumbuhan, haiwan dan isu alam sekitar.',
      'Suka aktiviti luar - gemar berkebun, berkhemah dan meneroka hutan.',
      'Pemerhati alam yang baik - cepat perasan perubahan cuaca, bunyi dan bau alam.',
      'Prihatin terhadap kelestarian - suka menjaga kebersihan dan alam semula jadi.',
      'Minat biologi atau pertanian - suka eksperimen berkaitan tumbuhan atau haiwan.',
      'Tenang di alam semula jadi - rasa damai bila berada di luar.',
      'Suka menjaga makhluk hidup - contohnya haiwan peliharaan.'
    ],
    visual: [
      'Berfikir dalam bentuk imej - mudah membayangkan sesuatu dalam kepala.',
      'Pandai melihat corak dan hubungan ruang - mudah faham peta, rajah dan arah.',
      'Kreatif dalam reka bentuk - suka melukis, menghias dan membina model.',
      'Belajar melalui pemerhatian - cepat faham bila melihat gambar atau tayangan.',
      'Imaginatif - mampu menghasilkan idea baharu yang unik dan menarik.',
      'Peka terhadap bentuk, warna dan susunan.',
      'Cenderung kepada seni visual, grafik, fotografi dan reka bentuk.'
    ],
    linguistik: [
      'Petah bercakap - mudah mengungkapkan idea dengan jelas dan menarik.',
      'Suka membaca dan menulis - gemar buku, novel, puisi atau esei.',
      'Kaya kosa kata - menggunakan perkataan yang tepat dan berkesan.',
      'Faham cepat melalui bahasa - mudah memahami maklumat bertulis atau lisan.',
      'Suka aktiviti bahasa - seperti debat, pidato, syarahan dan drama.',
      'Mampu memujuk atau meyakinkan orang lain melalui kata-kata.',
      'Kreatif dengan perkataan - pandai bermain bahasa dan penulisan cerita.'
    ],
    muzik: [
      'Suka menyanyi atau bersenandung walaupun tanpa muzik.',
      'Peka terhadap bunyi dan irama di sekeliling.',
      'Gemar mendengar muzik semasa belajar atau berehat.',
      'Suka bermain alat muzik atau mencuba rentak baharu.',
      'Pandai mengikut rentak, irama dan melodi dengan tepat.',
      'Suka mencipta lagu, lirik atau menggubah rentak sendiri.',
      'Belajar lebih baik apabila pelajaran dikaitkan dengan muzik atau irama.',
      'Suka menyertai aktiviti seperti koir, nasyid, band sekolah atau persembahan pentas.'
    ],
    eksistensial: [
      'Yakin diri - berani bercakap di hadapan orang ramai.',
      'Suka menjadi perhatian - seronok bila orang lain memberi pujian atau tumpuan.',
      'Pandai bergaul - cepat mesra dan aktif dalam kumpulan.',
      'Suka tampil di khalayak - minat pertandingan bercerita, pidato atau kepimpinan.',
      'Ada pendapat tersendiri - suka memberi pandangan dan tidak mudah ikut arus.',
      'Berorientasikan kepimpinan sosial - mahu dihargai dan menjadi individu berpengaruh.'
    ],
    interpersonal: [
      'Mesra dan mudah bergaul - cepat menyesuaikan diri dalam kumpulan baharu.',
      'Komunikasi baik - pandai mendengar dan memberi respons sopan.',
      'Empati tinggi - peka terhadap perasaan dan keperluan orang lain.',
      'Suka bekerjasama - lebih gemar tugasan berkumpulan.',
      'Penyayang dan prihatin - menunjukkan belas kasihan kepada rakan atau orang susah.',
      'Disukai ramai - mempunyai ramai kawan dan sering dijadikan tempat rujukan sosial.',
      'Suka membantu - cepat menawarkan bantuan tanpa disuruh.'
    ]
  };

  function band(score, total) {
    const pct = total ? Math.round((score / total) * 100) : 0;
    if (pct >= 80) return { label: 'Cemerlang', pct, tone: 'strong' };
    if (pct >= 60) return { label: 'Baik', pct, tone: 'good' };
    if (pct >= 40) return { label: 'Sederhana', pct, tone: 'fair' };
    return { label: 'Perlu Bimbingan', pct, tone: 'weak' };
  }

  function describeBand(label, kind) {
    const copy = {
      reasoning: {
        Cemerlang: 'Murid sangat baik mengenal pasti pola, hubungan perkataan, simbol, rajah dan logik abstrak.',
        Baik: 'Murid menunjukkan penaakulan verbal, visual dan abstrak yang kukuh, dengan sedikit ruang untuk latihan pola yang lebih mencabar.',
        Sederhana: 'Murid boleh menyelesaikan sebahagian tugasan penaakulan, tetapi masih perlu latihan mengenal pola, analogi dan hubungan simbol.',
        'Perlu Bimbingan': 'Murid memerlukan bimbingan berfokus untuk membina kemahiran melihat pola, membuat perbandingan dan menaakul secara sistematik.'
      },
      problem: {
        Cemerlang: 'Murid sangat baik menggunakan maklumat nombor, jadual, masa, wang, nisbah dan situasi harian untuk menyelesaikan masalah.',
        Baik: 'Murid menunjukkan keupayaan menyelesaikan masalah numerik dan berayat dengan baik, dengan sedikit latihan tambahan untuk ketepatan.',
        Sederhana: 'Murid memahami sebahagian masalah numerik, tetapi perlu latihan membaca kehendak soalan dan memilih operasi yang sesuai.',
        'Perlu Bimbingan': 'Murid memerlukan bimbingan langkah demi langkah dalam masalah berayat, operasi nombor dan aplikasi matematik harian.'
      },
      overall: {
        Cemerlang: 'Kemahiran aptitud Bahagian B berada pada tahap tinggi.',
        Baik: 'Kemahiran aptitud Bahagian B berada pada tahap baik.',
        Sederhana: 'Kemahiran aptitud Bahagian B berada pada tahap sederhana dan boleh diperkukuh dengan latihan berkala.',
        'Perlu Bimbingan': 'Kemahiran aptitud Bahagian B memerlukan sokongan dan latihan berstruktur.'
      },
      general: {
        Cemerlang: 'Pencapaian cemerlang dalam bahagian ini.',
        Baik: 'Pencapaian baik dalam bahagian ini.',
        Sederhana: 'Pencapaian sederhana; boleh diperkukuh dengan latihan berkala.',
        'Perlu Bimbingan': 'Memerlukan sokongan dan latihan berstruktur dalam bahagian ini.'
      }
    };
    return copy[kind][label];
  }

  function bGroup(results, start, end, title, focus, kind, short) {
    const items = results.filter(r => r.no >= start && r.no <= end);
    const right = items.filter(r => r.isRight).length;
    const level = band(right, items.length || 1);
    return {
      start,
      end,
      title,
      short: short || null,
      focus,
      right,
      total: items.length,
      pct: level.pct,
      level: level.label,
      tone: level.tone,
      description: describeBand(level.label, kind)
    };
  }

  function scoreInstrument(jawapan, instrument) {
    const answers = jawapan || {};
    const active = instrument || (window.INSTRUMENTS && window.INSTRUMENTS[6]) || {
      domains: window.INTELLIGENCES || [],
      sectionA: window.BAHAGIAN_A || [],
      sectionB: window.BAHAGIAN_B || [],
      kind: 'aptitude'
    };
    const domains = active.domains || [];
    const sectionA = active.sectionA || [];
    const sectionB = active.sectionB || [];

    const aScores = domains.map((def, dIdx) => {
      const items = sectionA.filter(q => q.domain === dIdx);
      const ya = items.filter(q => answers[`A${q.no}`] === 'YA').length;
      return {
        idx: dIdx,
        key: def.key,
        nama: def.nama,
        warna: def.warna,
        deskripsi: def.deskripsi,
        ya,
        total: items.length,
        pct: items.length ? Math.round((ya / items.length) * 100) : 0
      };
    });

    const bResults = sectionB.map(q => {
      const userAns = answers[`B${q.no}`];
      return {
        no: q.no,
        teks: q.teks ? q.teks.split('\n')[0] : `Soalan ${q.no}`,
        bahagian: q.bahagian || null,
        userAns: userAns || '-',
        correct: q.jawapan,
        isRight: userAns === q.jawapan
      };
    });
    const bRight = bResults.filter(r => r.isRight).length;
    const bTotal = sectionB.length;
    const bLevel = band(bRight, bTotal);
    const bPct = bLevel.pct;
    const top3 = [...aScores].sort((a, b) => b.ya - a.ya).slice(0, 3);
    const bReasoning = sectionB.length ? bGroup(
      bResults,
      1,
      15,
      'Bahagian B 1-15',
      'Penaakulan verbal, abstrak, visual dan logik pola.',
      'reasoning'
    ) : null;
    const bProblemSolving = sectionB.length ? bGroup(
      bResults,
      16,
      30,
      'Bahagian B 16-30',
      'Penyelesaian masalah numerik dan aplikasi matematik harian.',
      'problem'
    ) : null;
    const groupDefs = Array.isArray(active.sectionBGroups) ? active.sectionBGroups : null;
    const groups = groupDefs
      ? groupDefs.map(g => bGroup(bResults, g.start, g.end, g.title, g.focus, g.kind || 'general', g.short))
      : null;
    const topDomainText = top3.length
      ? `Kecenderungan utama murid ialah ${top3.map(s => s.nama).join(', ')}.`
      : 'Kecenderungan domain belum dapat dikenal pasti.';
    const isTraits = active.kind === 'traits';
    const analysis = {
      bahagianA: {
        title: 'Bahagian A',
        focus: active.sectionAName || (isTraits ? 'Inventori Tret Personaliti.' : 'Inventori Kecerdasan Pelbagai.'),
        description: `${topDomainText} Bahagian ini menunjukkan ${isTraits ? 'kecenderungan tret personaliti' : 'kecenderungan minat dan kekuatan pembelajaran'}, bukan markah betul atau salah.`,
        topDomains: top3.map(s => ({
          nama: s.nama,
          ya: s.ya,
          total: s.total,
          pct: s.pct,
          deskripsi: s.deskripsi,
          huraian: DOMAIN_HURAIAN[s.key] || s.huraian || []
        }))
      },
      bReasoning,
      bProblemSolving,
      groups,
      bahagianB: {
        title: 'Bahagian B',
        focus: 'Kemahiran menaakul dan menyelesaikan masalah.',
        right: bRight,
        total: bTotal,
        pct: bPct,
        level: bLevel.label,
        tone: bLevel.tone,
        description: describeBand(bLevel.label, 'overall')
      }
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
  }

  function scoreIAT6(jawapan) {
    return scoreInstrument(jawapan, window.INSTRUMENTS && window.INSTRUMENTS[6]);
  }

  window.ScoreInstrument = scoreInstrument;
  window.ScoreIAT6 = scoreIAT6;
})();
