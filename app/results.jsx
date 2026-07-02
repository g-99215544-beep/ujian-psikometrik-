// === Keputusan (results) screen ===

window.ResultsScreen = function ({ murid, jawapan, onHome, instrument, viewOnly }) {
  const active = instrument || (window.GetInstrumentForMurid ? window.GetInstrumentForMurid(murid) : window.INSTRUMENTS[6]);
  const domains = active.domains || window.INTELLIGENCES;
  const details = window.INTELLIGENCE_DETAILS || {};
  const supportsDetail = active.kind === 'intelligence' || active.kind === 'aptitude';
  const [selectedDomain, setSelectedDomain] = React.useState(null);
  const score = window.ScoreInstrument ? window.ScoreInstrument(jawapan, active) : window.ScoreIAT6(jawapan);
  const aScores = score.aScores;
  const top3 = score.top3;
  const bResults = score.bResults;
  const bRight = score.bRight;
  const bPct = score.bPct;
  const analysis = score.analysis;
  const hasB = bResults.length > 0;
  const groups = analysis.groups; // array for IAA_T4, null for Tahun 6
  const hasDomains = domains && domains.length > 0 && top3.length > 0;
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

          <div className="res-stack">
            {/* 1 — Trait dominan (klik untuk poster) */}
            {hasDomains && (
            <div className="res-card">
              <h2>{topLabel}</h2>
              <p className="res-card-sub">Klik pada kad untuk melihat poster dan panduan belajar.</p>
              <div className="top-domains">
                {top3.map((s, i) => {
                  const def = domains[s.idx];
                  const detail = supportsDetail ? details[def.key] : null;
                  const clickable = !!detail;
                  const open = () => setSelectedDomain(def);
                  return (
                    <div
                      key={s.idx}
                      className={`top-domain${clickable ? ' clickable' : ''}`}
                      role={clickable ? 'button' : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      onClick={clickable ? open : undefined}
                      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } } : undefined}
                    >
                      <div className="td-num">{i+1}</div>
                      <div className="td-body">
                        <h4>
                          <span className="bdot" style={{ background: def.warna, width: 10, height: 10, borderRadius: '50%', display: 'inline-block' }}></span>
                          {def.nama} <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '0.85rem', marginLeft: 6 }}>({s.ya}/{s.total})</span>
                        </h4>
                        <p>{def.deskripsi}</p>
                        {clickable && <span className="td-poster-hint">Lihat poster →</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            {/* 2 — Bilangan jawapan bagi setiap domain */}
            {hasDomains && (
            <div className="res-card">
              <h2>Bahagian A · {active.sectionAName}</h2>
              <p className="res-card-sub">Bilangan jawapan YA bagi setiap domain.</p>
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
                  );
                })}
              </div>
            </div>
            )}

            {/* 3 — Keputusan aptitud (Tahun 4) atau Analisis Bahagian B (Tahun 6) */}
            {groups ? (
              <div className="res-card">
                <h2>Keputusan Aptitud</h2>
                <p className="res-card-sub">Markah keseluruhan dan pecahan mengikut bahagian.</p>
                <p className="score-big">{bRight}<small>/{bResults.length}</small></p>
                <p className="score-cap">
                  {bPct >= 80 ? 'Cemerlang — majoriti soalan dijawab dengan tepat.' :
                   bPct >= 60 ? 'Baik — pencapaian aptitud yang kukuh.' :
                   bPct >= 40 ? 'Sederhana — teruskan latihan untuk meningkatkan markah.' :
                                'Perlu bimbingan dan latihan tambahan.'}
                </p>
                <div className="score-bar">
                  <div className="score-bar-fill" style={{ width: `${bPct}%` }}></div>
                </div>
                <div className="score-legend">
                  <div><strong style={{ color: 'var(--ok)' }}>● {bRight}</strong> betul</div>
                  <div><strong style={{ color: 'var(--err)' }}>● {bResults.length - bRight}</strong> salah / kosong</div>
                  <div><strong>{bPct}%</strong></div>
                </div>
                <div className="analysis-grid" style={{ marginTop: 20 }}>
                  {groups.map((g) => (
                    <AnalysisBlock
                      key={g.start}
                      title={g.title}
                      scoreText={`${g.right}/${g.total}`}
                      level={g.level}
                      tone={g.tone}
                      focus={g.focus}
                      description={g.description}
                    />
                  ))}
                </div>
              </div>
            ) : (hasB && (
              <div className="res-card">
                <h2>Analisis Bahagian B</h2>
                <p className="res-card-sub">Kemahiran menaakul &amp; menyelesaikan masalah.</p>
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
                <div className="score-legend">
                  <div><strong style={{ color: 'var(--ok)' }}>● {bRight}</strong> betul</div>
                  <div><strong style={{ color: 'var(--err)' }}>● {bResults.length - bRight}</strong> salah / kosong</div>
                  <div><strong>{bPct}%</strong></div>
                </div>
                <div className="analysis-grid" style={{ marginTop: 20 }}>
                  {analysis.bReasoning && <AnalysisBlock
                    title="Bahagian B 1-15"
                    scoreText={`${analysis.bReasoning.pct}% (${analysis.bReasoning.right}/${analysis.bReasoning.total})`}
                    level={analysis.bReasoning.level}
                    tone={analysis.bReasoning.tone}
                    focus={analysis.bReasoning.focus}
                    description={analysis.bReasoning.description}
                  />}
                  {analysis.bProblemSolving && <AnalysisBlock
                    title="Bahagian B 16-30"
                    scoreText={`${analysis.bProblemSolving.pct}% (${analysis.bProblemSolving.right}/${analysis.bProblemSolving.total})`}
                    level={analysis.bProblemSolving.level}
                    tone={analysis.bProblemSolving.tone}
                    focus={analysis.bProblemSolving.focus}
                    description={analysis.bProblemSolving.description}
                  />}
                </div>
              </div>
            ))}
          </div>

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

function AnalysisBlock({ title, scoreText, level, tone, focus, description }) {
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
    </div>
  );
}
