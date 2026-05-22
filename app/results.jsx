// === Keputusan (results) screen ===

window.ResultsScreen = function ({ murid, jawapan, onHome, instrument, viewOnly }) {
  const active = instrument || (window.GetInstrumentForMurid ? window.GetInstrumentForMurid(murid) : window.INSTRUMENTS[6]);
  const domains = active.domains || window.INTELLIGENCES;
  const score = window.ScoreInstrument ? window.ScoreInstrument(jawapan, active) : window.ScoreIAT6(jawapan);
  const aScores = score.aScores;
  const top3 = score.top3;
  const bResults = score.bResults;
  const bRight = score.bRight;
  const bPct = score.bPct;
  const analysis = score.analysis;
  const hasB = bResults.length > 0;
  const topLabel = active.kind === 'traits' ? '3 Tret Dominan' : '3 Kecerdasan Dominan';

  const tarikh = new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });

  React.useEffect(() => {
    if (viewOnly) return;
    if (!window.StudentDirectory || !window.StudentDirectory.saveBorangJawapan || !window.ScoreIAT6) return;
    const score = window.ScoreInstrument ? window.ScoreInstrument(jawapan, active) : window.ScoreIAT6(jawapan);
    window.StudentDirectory.saveBorangJawapan(murid, jawapan, {
      answeredCount: score.answeredCount,
      bRight: score.bRight,
      bPct: score.bPct,
      bReasoning: score.bReasoning,
      bProblemSolving: score.bProblemSolving,
      analysis: score.analysis,
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
        <button className="btn-icon" onClick={onHome} title="Kembali ke halaman utama">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        </button>
      </div>

      <div className="results">
        <div className="results-inner">
          <div className="res-hero">
            <div className="res-hero-eyebrow">Laporan Keputusan · {active.code} · {tarikh}</div>
            <h1>Profil psikometrik {murid.nama.split(' ')[0]}.</h1>
            <p className="res-hero-meta">
              Berdasarkan <strong>{active.sectionA.length + active.sectionB.length} soalan</strong> dijawab,
              berikut ialah analisis pentaksiran anda.
            </p>
          </div>

          <div className="res-grid">
            {/* Bahagian A — 9 intelligences bar chart */}
            <div className="res-card">
              <h2>Bahagian A · {active.sectionAName}</h2>
              <p className="res-card-sub">Bilangan jawapan YA bagi setiap domain.</p>
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
                  );
                })}
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', marginTop: 28, marginBottom: 0 }}>{topLabel}</h3>
              <div className="top-domains">
                {top3.map((s, i) => {
                  const def = domains[s.idx];
                  return (
                    <div key={s.idx} className="top-domain">
                      <div className="td-num">{i+1}</div>
                      <div className="td-body">
                        <h4>
                          <span className="bdot" style={{ background: def.warna, width: 10, height: 10, borderRadius: '50%', display: 'inline-block' }}></span>
                          {def.nama} <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '0.85rem', marginLeft: 6 }}>({s.ya}/{s.total})</span>
                        </h4>
                        <p>{def.deskripsi}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bahagian B — score */}
            {hasB && <div className="res-card">
              <h2>Bahagian B · Skor Penaakulan</h2>
              <p className="res-card-sub">Soalan kemahiran menaakul &amp; menyelesaikan masalah.</p>
              <p className="score-big">{bRight}<small>/{bResults.length}</small></p>
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
                <div><strong style={{ color: 'var(--err)' }}>● {bResults.length - bRight}</strong> salah / kosong</div>
                <div><strong>{bPct}%</strong></div>
              </div>
            </div>}
          </div>

          <AnalysisSummary analysis={analysis} />

          {/* Bahagian B review */}
          {hasB && <div className="res-card">
            <h2>Semakan Jawapan Bahagian B</h2>
            <p className="res-card-sub">Format bulatan jawapan seperti borang jawapan, diasingkan kepada soalan 1-15 dan 16-30.</p>
            <div className="answer-analysis-split">
              {[bResults.slice(0, 15), bResults.slice(15, 30)].map((group, idx) => (
                <div key={idx} className="answer-analysis-panel">
                  <div className="answer-analysis-title">{idx === 0 ? 'Soalan 1 - 15' : 'Soalan 16 - 30'}</div>
                  {group.map(r => (
                    <div key={r.no} className={`answer-analysis-row ${r.isRight ? 'right' : 'wrong'}`}>
                      <div className="rno">{String(r.no).padStart(2,'0')}</div>
                      <div className="answer-bubbles">
                        {['A', 'B', 'C', 'D'].map(choice => (
                          <span key={choice} className={`answer-bubble ${r.userAns === choice ? 'selected' : ''}`}>
                            {choice}
                          </span>
                        ))}
                      </div>
                      <div className="answer-correct">jwp: {r.correct}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>}

        </div>
      </div>
    </div>
  );
};

function AnalysisSummary({ analysis }) {
  const top = analysis.bahagianA.topDomains[0];
  return (
    <div className="res-card analysis-card">
      <h2>Analisis Psikometrik</h2>
      <p className="res-card-sub">Tafsiran ringkas berdasarkan pola jawapan murid.</p>
      <div className="analysis-grid">
        <AnalysisBlock
          title="Bahagian A"
          scoreText={top ? `${top.ya}/${top.total} domain utama` : '0/0 domain utama'}
          level={analysis.bahagianA.focus.includes('Tret') ? 'Profil Tret' : 'Profil Kecerdasan'}
          tone="profile"
          focus={analysis.bahagianA.focus}
          description={analysis.bahagianA.description}
          details={analysis.bahagianA.topDomains}
        />
        {analysis.bReasoning && <AnalysisBlock
          title="Bahagian B 1-15"
          scoreText={`${analysis.bReasoning.right}/${analysis.bReasoning.total}`}
          level={analysis.bReasoning.level}
          tone={analysis.bReasoning.tone}
          focus={analysis.bReasoning.focus}
          description={analysis.bReasoning.description}
        />}
        {analysis.bProblemSolving && <AnalysisBlock
          title="Bahagian B 16-30"
          scoreText={`${analysis.bProblemSolving.right}/${analysis.bProblemSolving.total}`}
          level={analysis.bProblemSolving.level}
          tone={analysis.bProblemSolving.tone}
          focus={analysis.bProblemSolving.focus}
          description={analysis.bProblemSolving.description}
        />}
      </div>
    </div>
  );
}

function AnalysisBlock({ title, scoreText, level, tone, focus, description, details }) {
  return (
    <div className={`analysis-block ${tone}`}>
      <div className="analysis-block-head">
        <div>
          <h3>{title}</h3>
          <p>{focus}</p>
        </div>
        <strong>{scoreText}</strong>
      </div>
      <div className="analysis-level">{level}</div>
      <p className="analysis-copy">{description}</p>
      {details && details.length > 0 && (
        <div className="analysis-details">
          {details.map((domain, idx) => (
            <div key={domain.nama} className="analysis-domain">
              <h4>{idx + 1}. {domain.nama} <span>{domain.ya}/{domain.total}</span></h4>
              <ul>
                {domain.huraian.map(point => <li key={point}>{point}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
