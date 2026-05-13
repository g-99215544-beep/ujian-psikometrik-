// === Admin dashboard ===

window.AdminScreen = function ({ onBack }) {
  const [password, setPassword] = React.useState('');
  const [authed, setAuthed] = React.useState(() => sessionStorage.getItem('iat6.admin') === '1');
  const [records, setRecords] = React.useState([]);
  const [allMurid, setAllMurid] = React.useState([]);
  const [selectedKelas, setSelectedKelas] = React.useState('');
  const [expandedIc, setExpandedIc] = React.useState('');
  const [printingAll, setPrintingAll] = React.useState(false);
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');
  const prevTitleRef = React.useRef('');

  const login = (e) => {
    e.preventDefault();
    if (password !== 'admin123') { setMessage('Kata laluan salah.'); return; }
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
      const [rows, muridList] = await Promise.all([
        window.StudentDirectory.listBorangJawapan(),
        window.StudentDirectory.listAllMurid ? window.StudentDirectory.listAllMurid() : Promise.resolve([])
      ]);
      setRecords(rows);
      setAllMurid(muridList);
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

  // Group completed records by kelas
  const completedByKelas = React.useMemo(() => {
    const map = {};
    records.forEach(r => {
      const k = r.murid.kelas || 'Tiada Kelas';
      if (!map[k]) map[k] = [];
      map[k].push(r);
    });
    return map;
  }, [records]);

  // Total students per kelas from full registry
  const totalByKelas = React.useMemo(() => {
    const map = {};
    allMurid.forEach(m => {
      const k = m.kelas || 'Tiada Kelas';
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [allMurid]);

  const classes = React.useMemo(() => {
    const all = new Set([...Object.keys(completedByKelas), ...Object.keys(totalByKelas)]);
    return [...all].sort();
  }, [completedByKelas, totalByKelas]);

  // Auto-select first class
  React.useEffect(() => {
    if (classes.length && !selectedKelas) setSelectedKelas(classes[0]);
  }, [classes]);

  const classRecords = completedByKelas[selectedKelas] || [];
  const expandedRecord = classRecords.find(r => r.ic === expandedIc);
  const expandedInstrument = expandedRecord && window.GetInstrumentForMurid
    ? window.GetInstrumentForMurid(expandedRecord.murid)
    : (window.INSTRUMENTS && window.INSTRUMENTS[6]);
  const expandedScore = expandedRecord && window.ScoreInstrument
    ? window.ScoreInstrument(expandedRecord.jawapan || {}, expandedInstrument)
    : null;

  // Print-all: trigger after render
  React.useEffect(() => {
    if (!printingAll) return;
    const t = window.setTimeout(() => {
      window.print();
      document.title = prevTitleRef.current;
      setPrintingAll(false);
    }, 250);
    return () => window.clearTimeout(t);
  }, [printingAll]);

  const handlePrintAll = () => {
    prevTitleRef.current = document.title;
    document.title = `Analisis Kelas ${selectedKelas}`;
    setPrintingAll(true);
  };

  if (!authed) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-login">
          <div className="welcome-eyebrow">Admin</div>
          <h1>Log Masuk Admin</h1>
          <form onSubmit={login}>
            <label className="fld">
              Kata Laluan
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan kata laluan" autoFocus />
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

  // Print-all mode: render all sheets then auto-print
  if (printingAll) {
    return (
      <div>
        {classRecords.map(record => {
          const inst = window.GetInstrumentForMurid
            ? window.GetInstrumentForMurid(record.murid)
            : (window.INSTRUMENTS && window.INSTRUMENTS[6]);
          const sc = window.ScoreInstrument
            ? window.ScoreInstrument(record.jawapan || {}, inst)
            : null;
          if (!sc) return null;
          return (
            <div key={record.ic} style={{ pageBreakAfter: 'always', marginBottom: 32 }}>
              <AdminAnswerSheet record={record} score={sc} instrument={inst} />
              <div style={{ marginTop: 24 }}>
                <AdminAnalysis analysis={sc.analysis} />
              </div>
            </div>
          );
        })}
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

        {/* Class selector */}
        <div className="admin-card">
          <label className="fld">
            Pilih Kelas
            <select value={selectedKelas} onChange={e => { setSelectedKelas(e.target.value); setExpandedIc(''); }}
              disabled={!classes.length}>
              {classes.map(k => {
                const done = (completedByKelas[k] || []).length;
                const total = totalByKelas[k] || done;
                return <option key={k} value={k}>{k} {done}/{total}</option>;
              })}
            </select>
          </label>
          {message && <div className={`form-message ${status === 'error' ? 'error' : ''}`}>{message}</div>}
        </div>

        {/* Student list for selected class */}
        {selectedKelas && (
          <div className="admin-card">
            <div className="admin-class-header">
              <div>
                <h2>{selectedKelas}</h2>
                <p className="res-card-sub">
                  {classRecords.length} murid telah selesai
                  {totalByKelas[selectedKelas] ? ` daripada ${totalByKelas[selectedKelas]}` : ''}
                </p>
              </div>
              {classRecords.length > 0 && (
                <button className="btn-icon" onClick={handlePrintAll} title="Cetak semua analisis">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6,9 6,2 18,2 18,9"/>
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                </button>
              )}
            </div>

            {classRecords.length === 0
              ? <p style={{ color: 'var(--muted)', marginTop: 12 }}>Tiada murid yang telah menghantar borang.</p>
              : (
                <div className="admin-student-list">
                  {classRecords.map(record => {
                    const inst = window.GetInstrumentForMurid
                      ? window.GetInstrumentForMurid(record.murid)
                      : (window.INSTRUMENTS && window.INSTRUMENTS[6]);
                    const sc = window.ScoreInstrument
                      ? window.ScoreInstrument(record.jawapan || {}, inst)
                      : null;
                    const isExpanded = expandedIc === record.ic;
                    return (
                      <div key={record.ic} className={`admin-student-row ${isExpanded ? 'expanded' : ''}`}>
                        <div className="admin-student-row-head"
                          onClick={() => setExpandedIc(isExpanded ? '' : record.ic)}>
                          <span className="admin-student-name">{record.murid.nama}</span>
                          {sc && (
                            <span className="admin-student-top">
                              {sc.top3.map(s => s.nama).join(' · ')}
                            </span>
                          )}
                          <span className="admin-student-inst">{inst.shortTitle}</span>
                          <button className="btn-icon btn-icon-danger" title="Padam rekod"
                            onClick={e => {
                              e.stopPropagation();
                              if (!window.confirm(`Padam rekod ${record.murid.nama}? Tindakan ini tidak boleh dibatalkan.`)) return;
                              window.StudentDirectory.deleteBorangJawapan(record.ic)
                                .then(() => loadRecords())
                                .catch(err => alert(err.message));
                            }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                            </svg>
                          </button>
                          <span className="expand-caret">{isExpanded ? '▲' : '▼'}</span>
                        </div>

                        {isExpanded && sc && (
                          <div className="admin-student-detail">
                            <div className="admin-grid">
                              <div className="admin-card" style={{ border: 'none', padding: '12px 0', boxShadow: 'none' }}>
                                <h2>{record.murid.nama}</h2>
                                <p className="res-card-sub">{record.murid.kelas} - {record.murid.sekolah}</p>
                                <div className="admin-stats">
                                  <div>
                                    <div className="meta-label">Dijawab</div>
                                    <div className="meta-val">{sc.answeredCount}/{inst.sectionA.length + inst.sectionB.length}</div>
                                  </div>
                                  <div>
                                    <div className="meta-label">Instrumen</div>
                                    <div className="meta-val">{inst.shortTitle}</div>
                                  </div>
                                  <div>
                                    <div className="meta-label">Dihantar</div>
                                    <div className="meta-val">{record.updatedAtIso ? new Date(record.updatedAtIso).toLocaleString('ms-MY') : '-'}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="admin-card" style={{ border: 'none', padding: '12px 0', boxShadow: 'none' }}>
                                <h2>{inst.kind === 'traits' ? '3 Tret Dominan' : '3 Kecerdasan Dominan'}</h2>
                                <div className="admin-mini-list">
                                  {sc.top3.map((s, i) => (
                                    <div key={s.idx} className="admin-mini-row">
                                      <span>{i + 1}. {s.nama}</span>
                                      <strong>{s.ya}/{s.total}</strong>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <AdminAnalysis analysis={sc.analysis} />

                            <div style={{ marginTop: 16 }}>
                              <div className="sheet-toolbar">
                                <div>
                                  <h2>Borang Jawapan</h2>
                                  <p className="res-card-sub">Format cetakan seperti borang jawapan rasmi.</p>
                                </div>
                                <button className="btn" onClick={() => {
                                  const prev = document.title;
                                  document.title = `Analisis Aptitud ${record.murid.nama} Tahun ${inst.year}`;
                                  window.print();
                                  document.title = prev;
                                }}>Cetak</button>
                              </div>
                              <AdminAnswerSheet record={record} score={sc} instrument={inst} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
};

function AdminAnalysis({ analysis }) {
  const top = analysis.bahagianA.topDomains[0];
  return (
    <div className="analysis-grid admin-analysis-grid">
      <AdminAnalysisBlock
        title="Bahagian A"
        scoreText={top ? `${top.ya}/${top.total} domain utama` : '0/0 domain utama'}
        level={analysis.bahagianA.focus.includes('Tret') ? 'Profil Tret' : 'Profil Kecerdasan'}
        tone="profile"
        focus={analysis.bahagianA.focus}
        description={analysis.bahagianA.description}
        details={analysis.bahagianA.topDomains}
      />
      {analysis.bReasoning && <AdminAnalysisBlock
        title="Bahagian B 1-15"
        scoreText={`${analysis.bReasoning.right}/${analysis.bReasoning.total}`}
        level={analysis.bReasoning.level}
        tone={analysis.bReasoning.tone}
        focus={analysis.bReasoning.focus}
        description={analysis.bReasoning.description}
      />}
      {analysis.bProblemSolving && <AdminAnalysisBlock
        title="Bahagian B 16-30"
        scoreText={`${analysis.bProblemSolving.right}/${analysis.bProblemSolving.total}`}
        level={analysis.bProblemSolving.level}
        tone={analysis.bProblemSolving.tone}
        focus={analysis.bProblemSolving.focus}
        description={analysis.bProblemSolving.description}
      />}
    </div>
  );
}

function AdminAnalysisBlock({ title, scoreText, level, tone, focus, description, details }) {
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

function AdminAnswerSheet({ record, score, instrument }) {
  const jawapan = record.jawapan || {};
  const murid = record.murid || {};
  const active = instrument || score.instrument || (window.INSTRUMENTS && window.INSTRUMENTS[6]);
  const domains = active.domains || window.INTELLIGENCES || [];
  const sectionA = active.sectionA || [];
  const sectionB = active.sectionB || [];
  const rowsPerColumn = Math.ceil(sectionA.length / 10);
  const aColumns = Array.from({ length: 10 }, (_, col) =>
    Array.from({ length: rowsPerColumn }, (_, row) => col * rowsPerColumn + row + 1)
      .filter(no => no <= sectionA.length)
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
          <span>PENTAKSIRAN PSIKOMETRIK ({active.title.toUpperCase()})</span>
        </div>
        <div className="sheet-box-title">BORANG<br />JAWAPAN</div>
      </div>

      <div className="sheet-info">
        <label>NAMA MURID <span>{murid.nama || ''}</span></label>
        <label>KELAS/TAHUN <span>{murid.kelas || ''}</span></label>
        <label>NAMA SEKOLAH <span>{murid.sekolah || 'SK Sri Aman'}</span></label>
      </div>

      <div className="sheet-section-title">BAHAGIAN A - {active.sectionAName}</div>
      <div className="sheet-domain-strip" style={{ gridTemplateColumns: `repeat(${domains.length}, minmax(44px, 1fr))` }}>
        {domains.map((domain, idx) => {
          const domainScore = score.aScores.find(s => s.idx === idx);
          return (
            <div key={domain.key || idx}>
              <span>{domain.nama.toUpperCase()}</span>
              <strong>{domainScore ? domainScore.ya : 0}/{domainScore ? domainScore.total : 0}</strong>
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

      {sectionB.length > 0 && <>
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
      </>}
    </div>
  );
}

function ClassTable({ records, instrument, onPrint }) {
  if (!records.length || !instrument) return null;

  const domains = instrument.domains || [];
  const hasBahagianB = (instrument.sectionB || []).length > 0;

  const rows = records.map(record => ({
    record,
    sc: window.ScoreInstrument
      ? window.ScoreInstrument(record.jawapan || {}, instrument)
      : null
  }));

  const thead = hasBahagianB ? (
    React.createElement(React.Fragment, null,
      React.createElement('tr', null,
        React.createElement('th', { className: 'ct-sticky ct-bil', rowSpan: 2 }, 'Bil.'),
        React.createElement('th', { className: 'ct-sticky ct-nama', rowSpan: 2 }, 'Nama'),
        React.createElement('th', { className: 'ct-sticky ct-id', rowSpan: 2 }, 'ID Pengenalan'),
        React.createElement('th', { colSpan: domains.length, className: 'ct-th-a' }, 'BAHAGIAN A — Kecerdasan Pelbagai'),
        React.createElement('th', { colSpan: 2, className: 'ct-th-b' }, 'BAHAGIAN B'),
        React.createElement('th', { rowSpan: 2 }, 'Status'),
        React.createElement('th', { rowSpan: 2 }, 'Cetak')
      ),
      React.createElement('tr', null,
        ...domains.map(d => React.createElement('th', { key: d.key || d.nama }, d.nama)),
        React.createElement('th', null, 'Menaakul', React.createElement('br'), React.createElement('small', { style: { fontWeight: 400 } }, '(1–15)')),
        React.createElement('th', null, 'Penyelesaian', React.createElement('br'), React.createElement('small', { style: { fontWeight: 400 } }, '(16–30)'))
      )
    )
  ) : (
    React.createElement('tr', null,
      React.createElement('th', { className: 'ct-sticky ct-bil' }, 'Bil.'),
      React.createElement('th', { className: 'ct-sticky ct-nama' }, 'Nama'),
      React.createElement('th', { className: 'ct-sticky ct-id' }, 'ID Pengenalan'),
      ...domains.map(d => React.createElement('th', { key: d.key || d.nama }, d.nama)),
      React.createElement('th', null, 'Status'),
      React.createElement('th', null, 'Cetak')
    )
  );

  return (
    <div className="ct-wrap">
      <table className="ct">
        <thead>{thead}</thead>
        <tbody>
          {rows.map(({ record, sc }, idx) => {
            const ic = record.murid.ic || record.ic || '';
            return (
              <tr key={ic || idx}>
                <td className="ct-sticky ct-bil">{idx + 1}</td>
                <td className="ct-sticky ct-nama">{record.murid.nama}</td>
                <td className="ct-sticky ct-id">{ic}</td>

                {domains.map((d, dIdx) => {
                  const s = sc && sc.aScores.find(a => a.idx === dIdx);
                  return (
                    <td key={d.key || d.nama}>
                      {s
                        ? <span className="ct-score-a">{s.ya}/{s.total}</span>
                        : <span className="ct-pending">—</span>}
                    </td>
                  );
                })}

                {hasBahagianB && (
                  sc && sc.bReasoning ? (
                    <>
                      <td><span className="ct-score-b">{sc.bReasoning.right}/{sc.bReasoning.total}</span></td>
                      <td><span className="ct-score-b">{sc.bProblemSolving.right}/{sc.bProblemSolving.total}</span></td>
                    </>
                  ) : (
                    <>
                      <td><span className="ct-pending">—</span></td>
                      <td><span className="ct-pending">—</span></td>
                    </>
                  )
                )}

                <td><span className="ct-done">Selesai</span></td>
                <td>
                  <button className="btn ct-print-btn" onClick={() => onPrint(record)}>
                    Cetak
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
