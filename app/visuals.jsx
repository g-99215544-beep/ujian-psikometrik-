// Visual helper components for Bahagian B questions that need diagrams.
// Pure SVG / inline JSX — no external assets.

const vColors = {
  ink: '#1f2230',
  sub: '#5b6478',
  line: '#bfc6d4',
  warm: '#f4c25a',
  red:  '#e76f51',
  green:'#5daa68',
  blue: '#5b8def',
};

// Q4 — buah pattern: 🍎 🍎 🥭 🍍 🍎 ? ? — answers describe last 3 (epal, mangga, etc)
// PDF shows: epal, epal, mangga, nanas, epal, _, _ — ans D: epal, nanas, mangga
// We render the FIXED first 5 + 2 question-marks.
function FruitIcon({ kind, size = 56 }) {
  const sz = size;
  if (kind === 'epal') return (
    <svg width={sz} height={sz} viewBox="0 0 64 64">
      <path d="M32 18c-2-7-9-9-13-7 0 0 4 0 6 4-6-4-15 0-15 12 0 14 11 22 22 22s22-8 22-22c0-12-9-16-15-12 2-4 6-4 6-4-4-2-11 0-13 7z" fill="#e63946" stroke="#a52738" strokeWidth="1.2"/>
      <path d="M32 18c0-4 2-8 5-10" stroke="#5d8a3a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="38" cy="14" rx="6" ry="3" fill="#7cb342" transform="rotate(-30 38 14)"/>
    </svg>
  );
  if (kind === 'mangga') return (
    <svg width={sz} height={sz} viewBox="0 0 64 64">
      <path d="M20 22c4-8 16-10 24-4 8 6 8 22 0 30-10 10-26 6-30-4-3-8 2-18 6-22z" fill="#f4a72e" stroke="#b87800" strokeWidth="1.2"/>
      <path d="M28 14c0-3 4-6 7-5" stroke="#5d8a3a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M22 28c4-2 9-2 14 0" stroke="#d97c00" strokeWidth="1" fill="none" opacity=".5"/>
    </svg>
  );
  if (kind === 'nanas') return (
    <svg width={sz} height={sz} viewBox="0 0 64 64">
      {/* leaves */}
      <path d="M32 4 L26 18 L32 14 L38 18 Z" fill="#4a8b3a"/>
      <path d="M32 6 L22 16 L28 16 Z" fill="#5da045"/>
      <path d="M32 6 L42 16 L36 16 Z" fill="#5da045"/>
      {/* body */}
      <ellipse cx="32" cy="38" rx="16" ry="20" fill="#e8a93a" stroke="#a06b00" strokeWidth="1.2"/>
      {/* cross-hatch */}
      {[0,1,2,3,4].map(r => (
        <g key={r}>
          {[0,1,2,3].map(c => (
            <path key={c} d={`M ${20+c*7} ${24+r*6} l 3 3 l -3 3 l -3 -3 z`} fill="none" stroke="#a06b00" strokeWidth=".8"/>
          ))}
        </g>
      ))}
    </svg>
  );
  if (kind === 'q') return (
    <svg width={sz} height={sz} viewBox="0 0 64 64">
      <rect x="6" y="6" width="52" height="52" rx="10" fill="#fff7e6" stroke="#d4a017" strokeWidth="1.5" strokeDasharray="3 3"/>
      <text x="32" y="44" textAnchor="middle" fontSize="32" fontWeight="700" fill="#b87800" fontFamily="serif">?</text>
    </svg>
  );
  return null;
}

function Q4Visual() {
  const seq = ['epal','epal','mangga','nanas','epal','q','q'];
  return (
    <div className="vBox">
      <div className="vRow">
        {seq.map((k, i) => (
          <React.Fragment key={i}>
            <FruitIcon kind={k} size={64} />
            {i < seq.length - 1 && <span className="vSep">,</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Q5 — letter grid (3x3-ish). PDF shows a grid pattern of letters.
// Rendered as a hint: "complete the 3x3 grid of letters"
function Q5Visual() {
  // common interpretation of this puzzle: corner letters mirror; we show abstract grid hint
  return (
    <div className="vBox">
      <div className="letterGrid">
        <div>N</div><div>L</div><div>K</div>
        <div>M</div><div>?</div><div>?</div>
        <div>?</div><div>?</div><div>?</div>
      </div>
      <p className="vCaption">Lengkapkan 9 huruf dalam grid (atas-bawah, kiri-kanan).</p>
    </div>
  );
}

// Q6 — bentuk: triangle counts
function Q6Visual() {
  const Tri = () => <svg width="22" height="22" viewBox="0 0 24 24"><polygon points="12,3 22,21 2,21" fill={vColors.warm} stroke={vColors.ink} strokeWidth="1.2"/></svg>;
  const Row = ({ label, n }) => (
    <div className="eqRow"><span className="eqLabel">{label}</span><span className="eqEq">=</span><span className="eqShapes">{Array.from({length:n}).map((_,i)=><Tri key={i}/>)}</span></div>
  );
  return (
    <div className="vBox eqBox">
      <Row label="TUKANG" n={3} />
      <Row label="KERJA"  n={2} />
      <Row label="LAYU"   n={1} />
      <div className="eqRow"><span className="eqLabel">KEJAYAAN</span><span className="eqEq">=</span><span className="eqShapes"><span className="qmark">?</span></span></div>
      <p className="vCaption">Petunjuk: bilangan ▲ = bilangan suku kata.</p>
    </div>
  );
}

// Q7 — salasilah keluarga
function Q7Visual() {
  return (
    <div className="vBox">
      <svg viewBox="0 0 480 220" className="famSvg">
        <style>{`.fn{font: 600 13px 'Plus Jakarta Sans', sans-serif; fill:${vColors.ink}}.fl{stroke:${vColors.line};stroke-width:1.5;fill:none}`}</style>
        {/* Generation 1 */}
        <text x="80"  y="20" textAnchor="middle" className="fn">Pak Ali + Mak Munah</text>
        <text x="380" y="20" textAnchor="middle" className="fn">Pak Man + Mak Eton</text>
        {/* Vertical lines down */}
        <path className="fl" d="M80 28 V60 H380 V28" />
        <path className="fl" d="M180 60 V90" />
        <path className="fl" d="M280 60 V90" />
        {/* Generation 2 */}
        <text x="180" y="105" textAnchor="middle" className="fn">Fatimah + Amran</text>
        <text x="280" y="105" textAnchor="middle" className="fn">Siti + Hamid</text>
        <text x="380" y="105" textAnchor="middle" className="fn">Julia</text>
        <path className="fl" d="M380 60 V90" />
        {/* Children */}
        <path className="fl" d="M280 115 V145 H380 V115" />
        <text x="280" y="165" textAnchor="middle" className="fn">Amin</text>
        <text x="380" y="165" textAnchor="middle" className="fn">Amira</text>
      </svg>
    </div>
  );
}

// Q9 — letter shape grid (6x4 ish). PDF text: a y a k k k a c a / o y o k ?
// Render as 2 row grid prompt
function Q9Visual() {
  return (
    <div className="vBox">
      <div className="charGrid">
        <span>a</span><span>y</span><span>a</span><span>k</span>
        <span>k</span><span>k</span><span>a</span><span>c</span><span>a</span>
      </div>
      <p className="vCaption">Petunjuk: o-y-o-k-? mengikuti corak yang sama.</p>
    </div>
  );
}

// Q12 — shape equations: square + circle = 6 etc.
function Q12Visual() {
  const Sq = () => <svg width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill={vColors.blue} stroke={vColors.ink} strokeWidth="1.2"/></svg>;
  const Ci = () => <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill={vColors.red} stroke={vColors.ink} strokeWidth="1.2"/></svg>;
  const Tr = () => <svg width="22" height="22" viewBox="0 0 24 24"><polygon points="12,3 22,21 2,21" fill={vColors.warm} stroke={vColors.ink} strokeWidth="1.2"/></svg>;
  const Row = ({ items, total }) => (
    <div className="eqRow">
      <span className="eqShapes">{items.map((it,i) => <React.Fragment key={i}>{it === 'sq' ? <Sq/> : it === 'ci' ? <Ci/> : <Tr/>}{i < items.length - 1 && <span className="plus">+</span>}</React.Fragment>)}</span>
      <span className="eqEq">=</span>
      <span className="eqLabel">{total}</span>
    </div>
  );
  return (
    <div className="vBox eqBox">
      <Row items={['sq','ci']} total="6" />
      <Row items={['sq','ci','tr']} total="6" />
      <Row items={['sq','tr','tr']} total="6" />
      <Row items={['sq','tr','ci','ci']} total="?" />
    </div>
  );
}

// Q14 — letter cross. radar/tamat/katak/masam: middle letter shared
function Q14Visual() {
  return (
    <div className="vBox">
      <div className="crossWords">
        <div className="cwTop">katak</div>
        <div className="cwCenter">×</div>
        <div className="cwTop">masam</div>
        <div className="cwBot">radar</div>
        <div></div>
        <div className="cwBot">tamat</div>
      </div>
      <p className="vCaption">× berkongsi huruf tengah dengan empat perkataan di sekelilingnya.</p>
    </div>
  );
}

// Q21 — 3x3 number grid. From the puzzle: arrow above 6, move 2 left.
// Common form of this puzzle uses a 3x3 grid:
//  1 2 3
//  4 5 6   <- player above 6 (so player is at top-right area)
//  7 8 9
// "Bergerak 2 langkah ke kiri" means columns shift; below player becomes 4. Answer A=4.
function Q21Visual() {
  return (
    <div className="vBox">
      <div className="numGrid">
        {[1,2,3,4,5,6,7,8,9].map(n => <div key={n} className={n === 6 ? 'hl' : ''}>{n}</div>)}
      </div>
      <p className="vCaption">Anda berada di atas grid; sel 6 berada di bawah anda.</p>
    </div>
  );
}

window.QuestionVisual = function ({ kind }) {
  switch (kind) {
    case 'buah4':     return <Q4Visual />;
    case 'huruf5':    return <Q5Visual />;
    case 'bentuk6':   return <Q6Visual />;
    case 'salasilah': return <Q7Visual />;
    case 'huruf9':    return <Q9Visual />;
    case 'bentuk12':  return <Q12Visual />;
    case 'huruf14':   return <Q14Visual />;
    case 'grid21':    return <Q21Visual />;
    default: return null;
  }
};
