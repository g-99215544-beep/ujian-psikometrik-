// === Ujian (exam) screen - handles both Bahagian A and B ===

// Short synthesized "click" played each time an answer is selected.
// Uses Web Audio so no audio asset/network is needed; the AudioContext is
// created lazily on the first click (a user gesture, so autoplay is allowed).
let _answerAudioCtx = null;
function playAnswerSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!_answerAudioCtx) _answerAudioCtx = new AC();
    const ctx = _answerAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  } catch (e) { /* ignore audio errors */ }
}

window.ExamScreen = function ({ murid, jawapan, setJawapan, onComplete, onHome, tweaks, timeLeft, instrument }) {
  const active = instrument || (window.GetInstrumentForMurid ? window.GetInstrumentForMurid(murid) : window.INSTRUMENTS[6]);
  const sectionA = active.sectionA || [];
  const sectionB = active.sectionB || [];
  const totalA = sectionA.length;
  const totalB = sectionB.length;
  const totalQuestions = totalA + totalB;
  const maxIdx = Math.max(totalQuestions - 1, 0);

  const [idx, setIdx] = React.useState(() => {
    const saved = parseInt(localStorage.getItem('iat6.idx') || '0', 10);
    return isNaN(saved) ? 0 : Math.min(saved, maxIdx);
  });
  const [navDirection, setNavDirection] = React.useState('next');

  React.useEffect(() => {
    localStorage.setItem('iat6.idx', String(idx));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idx]);

  React.useEffect(() => {
    setIdx(prev => Math.min(prev, maxIdx));
  }, [maxIdx]);

  const isA = idx < totalA;
  const aIdx = idx;
  const bIdx = idx - totalA;
  const item = isA ? sectionA[aIdx] : sectionB[bIdx];
  const key = isA ? `A${item.no}` : `B${item.no}`;
  const current = jawapan[key];
  const answeredCount = Object.keys(jawapan).length;

  const setAns = (val) => {
    playAnswerSound();
    setJawapan(j => ({ ...j, [key]: val }));
    if ((isA || active.autoAdvance) && idx < maxIdx) {
      setNavDirection('next');
      window.setTimeout(() => {
        setIdx(prev => prev === idx ? Math.min(idx + 1, maxIdx) : prev);
      }, 180);
    }
  };

  const goNext = () => {
    if (idx < maxIdx) {
      setNavDirection('next');
      setIdx(idx + 1);
    }
  };
  const goPrev = () => {
    if (idx > 0) {
      setNavDirection('prev');
      setIdx(idx - 1);
    }
  };

  const fmtTime = (s) => {
    if (s == null) return '--';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };
  const timerClass = timeLeft != null && timeLeft < 300 ? 'danger' : timeLeft != null && timeLeft < 900 ? 'warn' : '';

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">&Psi;</div>
          <div>
            <div className="brand-name">Pentaksiran Psikometrik</div>
            <div className="brand-sub">{murid.nama} &middot; {murid.kelas}</div>
          </div>
        </div>
        <div className="grow"></div>
        <button className="icon-btn" onClick={onHome} title="Halaman utama" aria-label="Halaman utama">
          <span className="home-icon" aria-hidden="true"></span>
        </button>
        <div className="brand-sub" style={{ marginRight: 12 }}>
          {answeredCount}/{totalQuestions} dijawab
        </div>
        {tweaks.timerOn && (
          <div className={`timer-pill ${timerClass}`}>
            <div className="timer-dot"></div>
            {fmtTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="exam">
        <main className="q-area">
          <div key={idx} className={`question-slide ${navDirection === 'prev' ? 'from-left' : 'from-right'}`}>
            <div className="q-meta">
              <span className="chip section">Bahagian {item.bahagian || (isA ? 'A' : 'B')}</span>
              <span className="chip">Soalan {item.no} / {isA ? totalA : totalB}</span>
              <span style={{ flex: 1 }}></span>
              <span>{item.bahagianNama || (isA ? active.sectionALabel : active.sectionBName)}</span>
            </div>

            {isA
              ? <BahagianAItem item={item} value={current} onChange={setAns} />
              : <BahagianBItem item={item} value={current} onChange={setAns} />}
          </div>

          <div className="q-footer">
            <button className="btn" onClick={goPrev} disabled={idx === 0}>&larr; Sebelum</button>
            <span className="q-footer-tip">
              {isA
                ? 'Jawapan YA/TIDAK akan terus ke soalan seterusnya.'
                : (active.autoAdvance && idx !== maxIdx
                    ? 'Memilih jawapan akan terus ke soalan seterusnya.'
                    : (!current ? 'Pilih satu jawapan untuk teruskan' : (idx === maxIdx ? 'Soalan terakhir - semak jawapan sebelum hantar' : 'Tekan Seterusnya')))}
            </span>
            {idx === maxIdx
              ? <button className="btn btn-accent" onClick={onComplete}>Tamatkan</button>
              : (!isA && <button className="btn btn-primary" onClick={goNext} disabled={!current}>Seterusnya &rarr;</button>)}
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
      <p className="q-stem"><strong>"{item.teks}."</strong></p>
      <div className="yt-choices">
        <button className={`yt-choice ya ${value === 'YA' ? 'selected' : ''}`} onClick={() => onChange('YA')}>
          YA
        </button>
        <button className={`yt-choice tidak ${value === 'TIDAK' ? 'selected' : ''}`} onClick={() => onChange('TIDAK')}>
          TIDAK
        </button>
      </div>
    </>
  );
}

function BahagianBItem({ item, value, onChange }) {
  const Visual = window.QuestionVisual;
  const hasPdfImage = Boolean(item.pdfImage);
  return (
    <>
      {item.arahan && <p className="q-arahan">{item.arahan}</p>}
      {hasPdfImage ? (
        <div className="pdf-question-wrap">
          <img className="pdf-question-image" src={item.pdfImage} alt={`Soalan ${item.no}`} loading="lazy" />
        </div>
      ) : (
        <>
          <p className="q-stem">{item.teks}</p>
          {item.visual && <Visual kind={item.visual} />}
        </>
      )}
      <div className={hasPdfImage ? 'pdf-answer-grid' : 'choices'}>
        {(item.pilihan || ['A', 'B', 'C', 'D']).map((p, i) => {
          const k = ['A', 'B', 'C', 'D'][i];
          return (
            <button key={k}
              className={hasPdfImage ? `pdf-answer ${value === k ? 'selected' : ''}` : `choice ${value === k ? 'selected' : ''}`}
              onClick={() => onChange(k)}
              aria-label={`Jawapan ${k}: ${p}`}>
              {hasPdfImage ? (
                k
              ) : (
                <>
                  <span className="choice-key">{k}</span>
                  <span className="choice-text">{p}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
