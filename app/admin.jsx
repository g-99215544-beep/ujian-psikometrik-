// === Admin dashboard ===

window.AdminScreen = function ({ onBack }) {
  const [password, setPassword] = React.useState('');
  const [authed, setAuthed] = React.useState(() => sessionStorage.getItem('iat6.admin') === '1');
  const [records, setRecords] = React.useState([]);
  const [selectedIc, setSelectedIc] = React.useState('');
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');

  const login = (e) => {
    e.preventDefault();
    if (password !== 'admin123') {
      setMessage('Kata laluan salah.');
      return;
    }
    sessionStorage.setItem('iat6.admin', '1');
    setAuthed(true);
    setMessage('');
  };

  const loadRecords = React.useCallback(async () => {
    if (!window.StudentDirectory || !window.StudentDirectory.listBorangJawapan) {
      setStatus('error');
      setMessage('Sambungan Firebase belum tersedia.');
      return;
    }
    setStatus('loading');
    try {
      const rows = await window.StudentDirectory.listBorangJawapan();
      setRecords(rows);
      setSelectedIc(rows[0] ? rows[0].ic : '');
      setStatus('ready');
      setMessage(rows.length ? '' : 'Belum ada borang jawapan murid dihantar.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Tidak dapat memuatkan borang jawapan.');
    }
  }, []);

  React.useEffect(() => {
    if (authed) loadRecords();
  }, [authed, loadRecords]);

  const selected = records.find(r => r.ic === selectedIc);
  const score = selected && window.ScoreIAT6 ? window.ScoreIAT6(selected.jawapan || {}) : null;

  if (!authed) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-login">
          <div className="welcome-eyebrow">Admin</div>
          <h1>Log Masuk Admin</h1>
          <form onSubmit={login}>
            <label className="fld">
              Kata Laluan
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan kata laluan"
                autoFocus
              />
            </label>
            {message && <div className="form-message error">{message}</div>}
            <div className="welcome-actions">
              <button className="btn btn-primary" type="submit">Log Masuk</button>
              <button className="btn btn-ghost" type="button" onClick={onBack}>Kembali</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <div className="admin-header">
          <div>
            <div className="welcome-eyebrow">Admin</div>
            <h1>Markah Murid</h1>
          </div>
          <div className="admin-actions">
            <button className="btn" onClick={loadRecords} disabled={status === 'loading'}>
              {status === 'loading' ? 'Memuat...' : 'Muat Semula'}
            </button>
            <button className="btn btn-ghost" onClick={() => {
              sessionStorage.removeItem('iat6.admin');
              setAuthed(false);
            }}>Log Keluar</button>
            <button className="btn btn-ghost" onClick={onBack}>Kembali</button>
          </div>
        </div>

        <div className="admin-card">
          <label className="fld">
            Pilih Borang Jawapan Murid
            <select value={selectedIc} onChange={e => setSelectedIc(e.target.value)} disabled={!records.length}>
              {records.map(record => (
                <option key={record.ic} value={record.ic}>
                  {record.murid.nama} - {record.murid.kelas} ({record.summary && record.summary.bRight != null ? record.summary.bRight : 0}/30)
                </option>
              ))}
            </select>
          </label>
          {message && <div className={`form-message ${status === 'error' ? 'error' : ''}`}>{message}</div>}
        </div>

        {selected && score && (
          <>
            <div className="admin-grid">
              <div className="admin-card">
                <h2>{selected.murid.nama}</h2>
                <p className="res-card-sub">{selected.murid.kelas} - {selected.murid.sekolah}</p>
                <div className="admin-stats">
                  <div>
                    <div className="meta-label">Dijawab</div>
                    <div className="meta-val">{score.answeredCount}/120</div>
                  </div>
                  <div>
                    <div className="meta-label">Bahagian B</div>
                    <div className="meta-val">{score.bRight}/30 ({score.bPct}%)</div>
                  </div>
                  <div>
                    <div className="meta-label">Dihantar</div>
                    <div className="meta-val">{selected.updatedAtIso ? new Date(selected.updatedAtIso).toLocaleString('ms-MY') : '-'}</div>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <h2>3 Kecerdasan Dominan</h2>
                <div className="admin-mini-list">
                  {score.top3.map((s, i) => (
                    <div key={s.idx} className="admin-mini-row">
                      <span>{i + 1}. {s.nama}</span>
                      <strong>{s.ya}/10</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="sheet-toolbar">
                <div>
                  <h2>Analisis Psikometrik</h2>
                  <p className="res-card-sub">Tafsiran Bahagian A, Bahagian B 1-15 dan Bahagian B 16-30 untuk murid ini.</p>
                </div>
              </div>
              <AdminAnalysis analysis={score.analysis} />
            </div>

            <div className="admin-card">
              <div className="sheet-toolbar">
                <div>
                  <h2>Borang Jawapan</h2>
                  <p className="res-card-sub">Format cetakan seperti borang jawapan rasmi.</p>
                </div>
                <button className="btn" onClick={() => window.print()}>Cetak Borang</button>
              </div>
              <AdminAnswerSheet record={selected} score={score} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function AdminAnalysis({ analysis }) {
  return (
    <div className="analysis-grid admin-analysis-grid">
      <AdminAnalysisBlock
        title="Bahagian A"
        scoreText={`${analysis.bahagianA.topDomains.length ? analysis.bahagianA.topDomains[0].ya : 0}/10 domain utama`}
        level="Profil Kecerdasan"
        tone="profile"
        focus={analysis.bahagianA.focus}
        description={analysis.bahagianA.description}
      />
      <AdminAnalysisBlock
        title="Bahagian B 1-15"
        scoreText={`${analysis.bReasoning.right}/${analysis.bReasoning.total}`}
        level={analysis.bReasoning.level}
        tone={analysis.bReasoning.tone}
        focus={analysis.bReasoning.focus}
        description={analysis.bReasoning.description}
      />
      <AdminAnalysisBlock
        title="Bahagian B 16-30"
        scoreText={`${analysis.bProblemSolving.right}/${analysis.bProblemSolving.total}`}
        level={analysis.bProblemSolving.level}
        tone={analysis.bProblemSolving.tone}
        focus={analysis.bProblemSolving.focus}
        description={analysis.bProblemSolving.description}
      />
    </div>
  );
}

function AdminAnalysisBlock({ title, scoreText, level, tone, focus, description }) {
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

function AdminAnswerSheet({ record, score }) {
  const jawapan = record.jawapan || {};
  const murid = record.murid || {};
  const domains = window.INTELLIGENCES || [];
  const aColumns = Array.from({ length: 10 }, (_, col) =>
    Array.from({ length: 9 }, (_, row) => col * 9 + row + 1)
  );
  const bGroups = [
    { label: '1 - 15', items: Array.from({ length: 15 }, (_, idx) => idx + 1) },
    { label: '16 - 30', items: Array.from({ length: 15 }, (_, idx) => idx + 16) },
  ];

  const isASelected = (no, value) => jawapan[`A${no}`] === value;
  const isBSelected = (no, value) => jawapan[`B${no}`] === value;

  return (
    <div className="answer-sheet">
      <div className="sheet-head">
        <div className="sheet-title">
          <strong>KEMENTERIAN PENDIDIKAN</strong>
          <span>PENTAKSIRAN PSIKOMETRIK (INSTRUMEN APTITUD TAHUN 6)</span>
        </div>
        <div className="sheet-box-title">BORANG<br />JAWAPAN</div>
      </div>

      <div className="sheet-info">
        <label>NAMA MURID <span>{murid.nama || ''}</span></label>
        <label>KELAS/TAHUN <span>{murid.kelas || ''}</span></label>
        <label>NAMA SEKOLAH <span>{murid.sekolah || 'SK Sri Aman'}</span></label>
      </div>

      <div className="sheet-section-title">BAHAGIAN A</div>
      <div className="sheet-domain-strip">
        {domains.map((domain, idx) => {
          const domainScore = score.aScores.find(s => s.idx === idx);
          return (
            <div key={domain.key || idx}>
              <span>{domain.nama.toUpperCase()}</span>
              <strong>{domainScore ? domainScore.ya : 0}/10</strong>
            </div>
          );
        })}
      </div>
      <div className="sheet-a-grid">
        {aColumns.map((column, colIdx) => (
          <div key={colIdx} className="sheet-a-col">
            {column.map(no => (
              <div key={no} className="sheet-a-item">
                <span className="sheet-no">{no}</span>
                <span className={`sheet-box ${isASelected(no, 'YA') ? 'selected' : ''}`}>Y</span>
                <span className={`sheet-box ${isASelected(no, 'TIDAK') ? 'selected' : ''}`}>T</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="sheet-section-title b">BAHAGIAN B</div>
      <div className="sheet-b-split">
        {bGroups.map(group => (
          <div key={group.label} className="sheet-b-panel">
            <div className="sheet-b-panel-title">{group.label}</div>
            <div className="sheet-b-col">
            {group.items.map(no => (
              <div key={no} className="sheet-b-item">
                <span className="sheet-no">{no}</span>
                {['A', 'B', 'C', 'D'].map(choice => (
                  <span key={choice} className={`sheet-circle ${isBSelected(no, choice) ? 'selected' : ''}`}>
                    {choice}
                  </span>
                ))}
              </div>
            ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
