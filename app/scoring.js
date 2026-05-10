// Shared scoring helpers for laporan murid and admin dashboard.
(function () {
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
      }
    };
    return copy[kind][label];
  }

  function bGroup(results, start, end, title, focus, kind) {
    const items = results.filter(r => r.no >= start && r.no <= end);
    const right = items.filter(r => r.isRight).length;
    const level = band(right, items.length || 1);
    return {
      start,
      end,
      title,
      focus,
      right,
      total: items.length,
      pct: level.pct,
      level: level.label,
      tone: level.tone,
      description: describeBand(level.label, kind)
    };
  }

  function scoreIAT6(jawapan) {
    const answers = jawapan || {};
    const intel = window.INTELLIGENCES || [];

    const aScores = intel.map((def, dIdx) => {
      const items = window.BAHAGIAN_A.filter(q => q.domain === dIdx);
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

    const bResults = window.BAHAGIAN_B.map(q => {
      const userAns = answers[`B${q.no}`];
      return {
        no: q.no,
        teks: q.teks.split('\n')[0],
        userAns: userAns || '-',
        correct: q.jawapan,
        isRight: userAns === q.jawapan
      };
    });
    const bRight = bResults.filter(r => r.isRight).length;
    const bTotal = window.BAHAGIAN_B.length || 1;
    const bLevel = band(bRight, bTotal);
    const bPct = bLevel.pct;
    const top3 = [...aScores].sort((a, b) => b.ya - a.ya).slice(0, 3);
    const bReasoning = bGroup(
      bResults,
      1,
      15,
      'Bahagian B 1-15',
      'Penaakulan verbal, abstrak, visual dan logik pola.',
      'reasoning'
    );
    const bProblemSolving = bGroup(
      bResults,
      16,
      30,
      'Bahagian B 16-30',
      'Penyelesaian masalah numerik dan aplikasi matematik harian.',
      'problem'
    );
    const topDomainText = top3.length
      ? `Kecenderungan utama murid ialah ${top3.map(s => s.nama).join(', ')}.`
      : 'Kecenderungan domain belum dapat dikenal pasti.';
    const analysis = {
      bahagianA: {
        title: 'Bahagian A',
        focus: 'Inventori Kecerdasan Pelbagai.',
        description: `${topDomainText} Bahagian ini menunjukkan kecenderungan minat dan kekuatan pembelajaran, bukan markah betul atau salah.`,
        topDomains: top3.map(s => ({
          nama: s.nama,
          ya: s.ya,
          total: s.total,
          pct: s.pct,
          deskripsi: s.deskripsi
        }))
      },
      bReasoning,
      bProblemSolving,
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
      aScores,
      top3,
      bResults,
      bRight,
      bPct,
      bReasoning,
      bProblemSolving,
      analysis
    };
  }

  window.ScoreIAT6 = scoreIAT6;
})();
