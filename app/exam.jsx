// === Ujian (exam) screen — handles both Bahagian A and B ===

const TOTAL_A = 90;
const TOTAL_B = 30;

window.ExamScreen = function ({ murid, jawapan, setJawapan, onComplete, tweaks, timeLeft }) {
  // Flat question index: 0..89 -> Bhg A, 90..119 -> Bhg B
  const [idx, setIdx] = React.useState(() => {
    const saved = parseInt(localStorage.getItem('iat6.idx') || '0', 10);
    return isNaN(saved) ? 0 : Math.min(saved, 119);
  });

  React.useEffect(() => {
    localStorage.setItem('iat6.idx', String(idx));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idx]);

  const isA = idx < TOTAL_A;
  const aIdx = idx;
  const bIdx = idx - TOTAL_A;
  const item = isA ? window.BAHAGIAN_A[aIdx] : window.BAHAGIAN_B[bIdx];
  const key = isA ? `A${item.no}` : `B${item.no}`;
  const current = jawapan[key];

  const answeredCount = Object.keys(jawapan).length;
  const answeredA = Array.from({length: TOTAL_A}, (_, i) => `A${window.BAHAGIAN_A[i].no}`).filter(k => jawapan[k]).length;
  const answeredB = Array.from({length: TOTAL_B}, (_, i) => `B${window.BAHAGIAN_B[i].no}`).filter(k => jawapan[k]).length;

  const setAns = (val) => setJawapan(j => ({ ...j, [key]: val }));
  const goNext = () => { if (idx < 119) setIdx(idx + 1); };
  const goPrev = () => { if (idx > 0) setIdx(idx - 1); };

  const fmtTime = (s) => {
    if (s == null) return '—';
    const h = Math.floor(s/3600);
    const m = Math.floor((s%3600)/60);
    const sec = s%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };
  const timerClass = timeLeft != null && timeLeft < 300 ? 'danger' : timeLeft != null && timeLeft < 900 ? 'warn' : '';

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">Ψ</div>
          <div>
            <div className="brand-name">Pentaksiran Psikometrik</div>
            <div className="brand-sub">{murid.nama} · {murid.kelas}</div>
          </div>
        </div>
        <div className="grow"></div>
        <div className="brand-sub" style={{ marginRight: 12 }}>
          {answeredCount}/120 dijawab
        </div>
        {tweaks.timerOn && (
          <div className={`timer-pill ${timerClass}`}>
            <div className="timer-dot"></div>
            {fmtTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="exam">
        <aside className="sidebar">
          <div className="sb-header">
            <div className="sb-title">Peta Soalan</div>
            <div className="sb-prog">{answeredCount}/120</div>
          </div>

          <div className="sb-section">
            <div className="sb-section-label">A · Kecerdasan ({answeredA}/90)</div>
            <div className="qmap">
              {window.BAHAGIAN_A.map((q, i) => {
                const k = `A${q.no}`;
                return (
                  <button key={k}
                    className={`${jawapan[k] ? 'answered' : ''} ${idx === i ? 'current' : ''}`}
                    onClick={() => setIdx(i)}
                    title={`Soalan ${q.no}`}>
                    {q.no}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-section-label">B · Penaakulan ({answeredB}/30)</div>
            <div className="qmap">
              {window.BAHAGIAN_B.map((q, i) => {
                const k = `B${q.no}`;
                const flat = TOTAL_A + i;
                return (
                  <button key={k}
                    className={`${jawapan[k] ? 'answered' : ''} ${idx === flat ? 'current' : ''}`}
                    onClick={() => setIdx(flat)}>
                    {q.no}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={onComplete} className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }}>
            Tamatkan &amp; Hantar
          </button>
        </aside>

        <main className="q-area">
          <div className="q-meta">
            <span className="chip section">Bahagian {isA ? 'A' : 'B'}</span>
            <span className="chip">Soalan {item.no} / {isA ? 90 : 30}</span>
            <span style={{ flex: 1 }}></span>
            <span>{isA ? 'Inventori kecerdasan' : 'Penaakulan & Menyelesaikan masalah'}</span>
          </div>

          {isA ? <BahagianAItem item={item} value={current} onChange={setAns} /> : <BahagianBItem item={item} value={current} onChange={setAns} />}

          <div className="q-footer">
            <button className="btn" onClick={goPrev} disabled={idx === 0}>← Sebelum</button>
            <span className="q-footer-tip">
              {!current ? 'Pilih satu jawapan untuk teruskan' : (idx === 119 ? 'Soalan terakhir — semak peta soalan jika ada yang terlepas' : 'Tekan Seterusnya')}
            </span>
            {idx === 119
              ? <button className="btn btn-accent" onClick={onComplete}>Tamatkan  ✓</button>
              : <button className="btn btn-primary" onClick={goNext} disabled={!current}>Seterusnya →</button>}
          </div>
        </main>
      </div>
    </>
  );
};

function BahagianAItem({ item, value, onChange }) {
  return (
    <>
      <div className="q-meta" style={{ marginTop: -8, marginBottom: 16 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Adakah pernyataan ini benar tentang diri anda?</span>
      </div>
      <p className="q-stem"><strong>“{item.teks}.”</strong></p>
      <div className="yt-choices">
        <button className={`yt-choice ya ${value === 'YA' ? 'selected' : ''}`} onClick={() => onChange('YA')}>
          <span className="yt-glyph">✓</span> YA
        </button>
        <button className={`yt-choice tidak ${value === 'TIDAK' ? 'selected' : ''}`} onClick={() => onChange('TIDAK')}>
          <span className="yt-glyph">✕</span> TIDAK
        </button>
      </div>
    </>
  );
}

function BahagianBItem({ item, value, onChange }) {
  const Visual = window.QuestionVisual;
  return (
    <>
      <p className="q-stem">{item.teks}</p>
      {item.visual && <Visual kind={item.visual} />}
      <div className="choices">
        {item.pilihan.map((p, i) => {
          const k = ['A','B','C','D'][i];
          return (
            <button key={k}
              className={`choice ${value === k ? 'selected' : ''}`}
              onClick={() => onChange(k)}>
              <span className="choice-key">{k}</span>
              <span className="choice-text">{p}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
