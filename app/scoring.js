// Shared scoring helpers for laporan murid and admin dashboard.
(function () {
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
    const bPct = Math.round((bRight / bTotal) * 100);
    const top3 = [...aScores].sort((a, b) => b.ya - a.ya).slice(0, 3);

    return {
      answeredCount: Object.keys(answers).length,
      aScores,
      top3,
      bResults,
      bRight,
      bPct
    };
  }

  window.ScoreIAT6 = scoreIAT6;
})();
