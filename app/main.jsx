// === Main app === orchestrates routes + state + timer + tweaks
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "timerOn": true,
  "textSize": "sederhana",
  "theme": "default"
}/*EDITMODE-END*/;

const TOTAL_DURATION = 90 * 60; // 1h 30m in seconds

function loadJawapan() {
  try { return JSON.parse(localStorage.getItem('iat6.jawapan') || '{}'); } catch { return {}; }
}

function loadMurid() {
  try {
    const saved = JSON.parse(localStorage.getItem('iat6.murid') || 'null');
    return saved && saved.ic && saved.nama && saved.kelas ? saved : null;
  } catch {
    return null;
  }
}

function App() {
  // Routes: 'welcome' | 'arahan' | 'ujian' | 'keputusan'
  const [route, setRoute] = useState(() => loadMurid() ? (localStorage.getItem('iat6.route') || 'welcome') : 'welcome');
  const [murid, setMurid] = useState(loadMurid);
  const [jawapan, setJawapan] = useState(loadJawapan);

  const [tweaks, setTweaks] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : useTweaksLocal(TWEAK_DEFAULTS);
  const setTweak = (k, v) => setTweaks(prev => ({ ...prev, [k]: v }));

  // === Timer ===
  const [startedAt, setStartedAt] = useState(() => {
    const s = localStorage.getItem('iat6.startedAt');
    return s ? parseInt(s, 10) : null;
  });
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => { localStorage.setItem('iat6.route', route); }, [route]);
  useEffect(() => { localStorage.setItem('iat6.jawapan', JSON.stringify(jawapan)); }, [jawapan]);
  useEffect(() => { document.documentElement.setAttribute('data-textsize', tweaks.textSize); }, [tweaks.textSize]);

  useEffect(() => {
    if (route !== 'ujian' || !tweaks.timerOn) { setTimeLeft(null); return; }
    if (!startedAt) {
      const now = Date.now();
      setStartedAt(now);
      localStorage.setItem('iat6.startedAt', String(now));
    }
    const tick = () => {
      const elapsed = Math.floor((Date.now() - (startedAt || Date.now())) / 1000);
      const remaining = TOTAL_DURATION - elapsed;
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        setRoute('keputusan');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [route, startedAt, tweaks.timerOn]);

  const handleStart = (data) => {
    setMurid(data);
    localStorage.setItem('iat6.murid', JSON.stringify(data));
    setRoute('arahan');
  };

  const handleBeginExam = () => {
    if (!startedAt) {
      const now = Date.now();
      setStartedAt(now);
      localStorage.setItem('iat6.startedAt', String(now));
    }
    setRoute('ujian');
  };

  const handleComplete = () => {
    if (window.confirm('Anda pasti mahu menamatkan pentaksiran? Semua jawapan akan disimpan.')) {
      setRoute('keputusan');
    }
  };

  const handleRestart = () => {
    if (!window.confirm('Mula semula akan memadam semua jawapan. Teruskan?')) return;
    ['iat6.murid','iat6.jawapan','iat6.idx','iat6.route','iat6.startedAt'].forEach(k => localStorage.removeItem(k));
    setMurid(null); setJawapan({}); setStartedAt(null); setTimeLeft(null); setRoute('welcome');
  };

  const handlePrint = () => window.print();

  // Render
  let view;
  if (route === 'welcome' || !murid) {
    view = <window.WelcomeScreen onStart={handleStart} />;
  } else if (route === 'arahan') {
    view = <window.ArahanScreen onContinue={handleBeginExam} onBack={() => setRoute('welcome')} />;
  } else if (route === 'ujian') {
    return (
      <div className="app">
        <window.ExamScreen
          murid={murid}
          jawapan={jawapan}
          setJawapan={setJawapan}
          onComplete={handleComplete}
          tweaks={tweaks}
          timeLeft={timeLeft}
        />
        <TweaksUI tweaks={tweaks} setTweak={setTweak} />
      </div>
    );
  } else {
    return (
      <>
        <window.ResultsScreen murid={murid} jawapan={jawapan} onRestart={handleRestart} onPrint={handlePrint} />
        <TweaksUI tweaks={tweaks} setTweak={setTweak} />
      </>
    );
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">Ψ</div>
          <div>
            <div className="brand-name">Pentaksiran Psikometrik</div>
            <div className="brand-sub">Instrumen Aptitud Tahun 6</div>
          </div>
        </div>
      </div>
      {view}
      <TweaksUI tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

// === Tweaks UI ===
function TweaksUI({ tweaks, setTweak }) {
  const TP = window.TweaksPanel;
  if (!TP) return null;
  return (
    <TP title="Tweaks">
      <window.TweakSection title="Pemasa">
        <window.TweakToggle label="Hidupkan pemasa 1j 30m" value={tweaks.timerOn} onChange={v => setTweak('timerOn', v)} />
      </window.TweakSection>
      <window.TweakSection title="Saiz teks">
        <window.TweakRadio
          value={tweaks.textSize}
          onChange={v => setTweak('textSize', v)}
          options={[
            { value: 'kecil', label: 'Kecil' },
            { value: 'sederhana', label: 'Sederhana' },
            { value: 'besar', label: 'Besar' },
          ]}
        />
      </window.TweakSection>
    </TP>
  );
}

// Fallback hook if tweaks-panel hasn't loaded yet
function useTweaksLocal(defaults) {
  const [s, set] = useState(defaults);
  return [s, set];
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
