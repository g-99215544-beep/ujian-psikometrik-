// === Keputusan (results) screen ===

window.ResultsScreen = function ({ murid, jawapan, onRestart, onPrint }) {
  const intel = window.INTELLIGENCES;

  // Score Bahagian A: count YA per domain (10 items per domain)
  const aScores = intel.map((_, dIdx) => {
    const items = window.BAHAGIAN_A.filter(q => q.domain === dIdx);
    const ya = items.filter(q => jawapan[`A${q.no}`] === 'YA').length;
    return { idx: dIdx, ya, total: items.length, pct: Math.round((ya / items.length) * 100) };
  });
  const aSorted = [...aScores].sort((a, b) => b.ya - a.ya);
  const top3 = aSorted.slice(0, 3);

  // Score Bahagian B: against jawapan key
  const bResults = window.BAHAGIAN_B.map(q => {
    const userAns = jawapan[`B${q.no}`];
    return { no: q.no, teks: q.teks.split('\n')[0], userAns: userAns || '—', correct: q.jawapan, isRight: userAns === q.jawapan };
  });
  const bRight = bResults.filter(r => r.isRight).length;
  const bPct = Math.round((bRight / 30) * 100);

  const tarikh = new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });

  React.useEffect(() => {
    if (!window.StudentDirectory || !window.StudentDirectory.saveBorangJawapan || !window.ScoreIAT6) return;
    const score = window.ScoreIAT6(jawapan);
    window.StudentDirectory.saveBorangJawapan(murid, jawapan, {
      answeredCount: score.answeredCount,
      bRight: score.bRight,
      bPct: score.bPct,
      top3: score.top3.map(s => ({ nama: s.nama, ya: s.ya, total: s.total }))
    }).catch(err => console.warn('Gagal simpan borang jawapan:', err));
  }, []);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">Ψ</div>
          <div>
            <div className="brand-name">Laporan Pentaksiran</div>
            <div className="brand-sub">{murid.nama} · {murid.kelas} · {murid.sekolah}</div>
          </div>
        </div>
        <div className="grow"></div>
        <button className="btn" onClick={onPrint}>🖨 Cetak</button>
        <button className="btn btn-ghost" onClick={onRestart}>Mula Semula</button>
      </div>

      <div className="results">
        <div className="results-inner">
          <div className="res-hero">
            <div className="res-hero-eyebrow">Laporan Keputusan · IA_T6 · {tarikh}</div>
            <h1>Profil aptitud {murid.nama.split(' ')[0]}.</h1>
            <p className="res-hero-meta">
              Berdasarkan <strong>120 soalan</strong> dijawab, berikut ialah profil kecerdasan pelbagai
              dan skor penaakulan anda.
            </p>
          </div>

          <div className="res-grid">
            {/* Bahagian A — 9 intelligences bar chart */}
            <div className="res-card">
              <h2>Bahagian A · Profil Kecerdasan Pelbagai</h2>
              <p className="res-card-sub">Bilangan jawapan YA bagi setiap domain (maksimum 10).</p>
              <div className="bar-list">
                {aScores.map((s) => {
                  const def = intel[s.idx];
                  return (
                    <div key={s.idx} className="bar-row">
                      <div className="bar-name">
                        <span className="bdot" style={{ background: def.warna }}></span>
                        {def.nama}
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${s.pct}%`, background: def.warna }}></div>
                      </div>
                      <div className="bar-val">{s.ya}/10</div>
                    </div>
                  );
                })}
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', marginTop: 28, marginBottom: 0 }}>3 Kecerdasan Dominan</h3>
              <div className="top-domains">
                {top3.map((s, i) => {
                  const def = intel[s.idx];
                  return (
                    <div key={s.idx} className="top-domain">
                      <div className="td-num">{i+1}</div>
                      <div className="td-body">
                        <h4>
                          <span className="bdot" style={{ background: def.warna, width: 10, height: 10, borderRadius: '50%', display: 'inline-block' }}></span>
                          {def.nama} <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '0.85rem', marginLeft: 6 }}>({s.ya}/10)</span>
                        </h4>
                        <p>{def.deskripsi}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bahagian B — score */}
            <div className="res-card">
              <h2>Bahagian B · Skor Penaakulan</h2>
              <p className="res-card-sub">Soalan kemahiran menaakul &amp; menyelesaikan masalah.</p>
              <p className="score-big">{bRight}<small>/30</small></p>
              <p className="score-cap">
                {bPct >= 80 ? 'Cemerlang — anda menjawab majoriti soalan dengan tepat.' :
                 bPct >= 60 ? 'Baik — anda menunjukkan kemahiran penaakulan yang kukuh.' :
                 bPct >= 40 ? 'Sederhana — terus berlatih untuk meningkatkan kemahiran ini.' :
                              'Perlu latihan tambahan dalam kemahiran penaakulan.'}
              </p>
              <div className="score-bar">
                <div className="score-bar-fill" style={{ width: `${bPct}%` }}></div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 20, fontSize: '0.85rem', color: 'var(--muted)' }}>
                <div><strong style={{ color: 'var(--ok)' }}>● {bRight}</strong> betul</div>
                <div><strong style={{ color: 'var(--err)' }}>● {30 - bRight}</strong> salah / kosong</div>
                <div><strong>{bPct}%</strong></div>
              </div>
            </div>
          </div>

          {/* Bahagian B review */}
          <div className="res-card">
            <h2>Semakan Jawapan Bahagian B</h2>
            <p className="res-card-sub">Lihat jawapan anda berbanding jawapan rasmi.</p>
            <div className="review-list">
              {bResults.map(r => (
                <div key={r.no} className={`review-row ${r.isRight ? 'right' : 'wrong'}`}>
                  <div className="rno">{String(r.no).padStart(2,'0')}</div>
                  <div className="rq" title={r.teks}>{r.teks}</div>
                  <div className="ra">{r.userAns}</div>
                  <div className="ck">jwp: {r.correct}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="res-actions">
            <button className="btn btn-primary" onClick={onPrint}>🖨 Cetak / Simpan PDF</button>
            <button className="btn" onClick={onRestart}>Mula Pentaksiran Baru</button>
          </div>
        </div>
      </div>
    </div>
  );
};
