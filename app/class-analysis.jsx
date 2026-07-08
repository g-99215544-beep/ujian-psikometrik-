// === Analisis Tahun / Kelas (admin) ===
// Dashboard analisis kecerdasan/aptitud mengikut tahun (4/5/6) dan kelas,
// termasuk senarai murid mengikut kecerdasan dominan untuk rujukan guru.

const CA_SHORT = {
  linguistik: 'VL',
  logik: 'LM',
  intrapersonal: 'INTRA',
  visual: 'VR',
  naturalis: 'NT',
  interpersonal: 'INTER',
  kinestetik: 'KN',
  muzik: 'MZ',
  eksistensial: 'EK',
};

const CA_APPROACH = {
  linguistik: 'aktiviti bahasa, bacaan dan perbincangan',
  logik: 'penyelesaian masalah dan aktiviti berfikir',
  intrapersonal: 'refleksi kendiri dan pembelajaran terarah kendiri',
  visual: 'bahan visual, rajah dan grafik',
  naturalis: 'aktiviti luar bilik darjah dan alam sekitar',
  interpersonal: 'aktiviti berkumpulan, komunikasi dan pengalaman sebenar',
  kinestetik: 'aktiviti hands-on dan pergerakan',
  muzik: 'irama, lagu dan bunyi',
  eksistensial: 'soal jawab mendalam dan refleksi nilai',
};

const CA_STRATEGI = {
  linguistik: [
    { icon: '📚', nama: 'Bercerita & Pembentangan' },
    { icon: '💬', nama: 'Debat & Soal Jawab' },
    { icon: '✍️', nama: 'Jurnal & Penulisan' },
  ],
  logik: [
    { icon: '🧠', nama: 'KBAT' },
    { icon: '🧩', nama: 'Puzzle & Permainan Logik' },
    { icon: '🔬', nama: 'Eksperimen Berstruktur' },
  ],
  intrapersonal: [
    { icon: '🧘', nama: 'Refleksi Kendiri' },
    { icon: '📓', nama: 'Jurnal Pembelajaran' },
    { icon: '🎯', nama: 'Matlamat Peribadi' },
  ],
  visual: [
    { icon: '🗺️', nama: 'Peta Minda & Grafik' },
    { icon: '🎨', nama: 'Canva' },
    { icon: '🎬', nama: 'Video & Animasi' },
  ],
  naturalis: [
    { icon: '🌳', nama: 'Outdoor Learning' },
    { icon: '🌿', nama: 'Pemerhatian Alam' },
    { icon: '♻️', nama: 'Projek Persekitaran' },
  ],
  interpersonal: [
    { icon: '👥', nama: 'Pembelajaran Koperatif' },
    { icon: '📝', nama: 'Think Pair Share' },
    { icon: '🖼️', nama: 'Gallery Walk' },
  ],
  kinestetik: [
    { icon: '⚽', nama: 'Aktiviti Hands-on' },
    { icon: '🎭', nama: 'Role Play' },
    { icon: '🎲', nama: 'Permainan Edukatif' },
  ],
  muzik: [
    { icon: '🎵', nama: 'Lagu & Irama dalam PdP' },
    { icon: '🎤', nama: 'Nyanyian Fakta' },
    { icon: '🥁', nama: 'Rentak Ingatan' },
  ],
  eksistensial: [
    { icon: '💭', nama: 'Soal Jawab Mendalam' },
    { icon: '🪷', nama: 'Refleksi & Jurnal Nilai' },
    { icon: '⚖️', nama: 'Perbincangan Nilai' },
  ],
};

const CA_BAND_COLORS = {
  Cemerlang: 'var(--ok)',
  Baik: '#5B8DEF',
  Sederhana: '#D4A017',
  'Perlu Bimbingan': 'var(--err)',
};
const CA_BANDS = ['Cemerlang', 'Baik', 'Sederhana', 'Perlu Bimbingan'];

function caTahap(pct) {
  if (pct >= 70) return 'tinggi';
  if (pct >= 40) return 'sederhana';
  return 'rendah';
}

function caPolar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ---- Charts (SVG, tiada library luaran) ----

function CaDonut({ items, centerValue, centerLabel }) {
  const cx = 110, cy = 110, rO = 100, rI = 62;
  const total = items.reduce((s, it) => s + it.value, 0);
  if (!total) return null;
  const pad = items.length > 1 ? 1.6 : 0; // jurang antara segmen
  let angle = -90;
  const segs = items.map(it => {
    const sweep = (it.value / total) * 360;
    const a0 = angle + pad / 2;
    const a1 = angle + sweep - pad / 2;
    angle += sweep;
    return { ...it, a0, a1: Math.max(a1, a0 + 0.1), pctVal: Math.round((it.value / total) * 100) };
  });
  const arc = (a0, a1) => {
    const large = a1 - a0 > 180 ? 1 : 0;
    const p0 = caPolar(cx, cy, rO, a0), p1 = caPolar(cx, cy, rO, a1);
    const p2 = caPolar(cx, cy, rI, a1), p3 = caPolar(cx, cy, rI, a0);
    return `M ${p0.x} ${p0.y} A ${rO} ${rO} 0 ${large} 1 ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${rI} ${rI} 0 ${large} 0 ${p3.x} ${p3.y} Z`;
  };
  return (
    <svg viewBox="0 0 220 220" className="ca-donut" role="img" aria-label={centerLabel}>
      {segs.map(s => (
        <path key={s.label} d={arc(s.a0, s.a1)} fill={s.color}>
          <title>{`${s.label}: ${s.value} murid (${s.pctVal}%)`}</title>
        </path>
      ))}
      {segs.filter(s => s.pctVal >= 7).map(s => {
        const mid = caPolar(cx, cy, (rO + rI) / 2, (s.a0 + s.a1) / 2);
        return (
          <text key={`t${s.label}`} x={mid.x} y={mid.y + 3.5} textAnchor="middle"
            fontSize="11" fontWeight="700" fill="#fff">{s.pctVal}%</text>
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fill="var(--muted)">{centerLabel}</text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--ink)">{centerValue}</text>
    </svg>
  );
}

function CaBarChart({ items, unit }) {
  const w = 480, h = 210, padB = 26, padT = 22;
  const max = Math.max(1, ...items.map(it => it.value));
  const bw = Math.min(34, (w - 20) / items.length - 10);
  const step = (w - 20) / items.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ca-bar" role="img" aria-label="Carta bar">
      <line x1="8" y1={h - padB} x2={w - 8} y2={h - padB} stroke="var(--line)" strokeWidth="1" />
      {items.map((it, i) => {
        const x = 10 + i * step + (step - bw) / 2;
        const bh = Math.max(2, ((h - padB - padT) * it.value) / max);
        const y = h - padB - bh;
        const r = Math.min(4, bh / 2);
        return (
          <g key={it.code}>
            <path d={`M ${x} ${h - padB} V ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + bw - r} Q ${x + bw} ${y} ${x + bw} ${y + r} V ${h - padB} Z`}
              fill={it.color}>
              <title>{`${it.label}: ${it.value}${unit ? ' ' + unit : ''}`}</title>
            </path>
            <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink-2)">{it.value}</text>
            <text x={x + bw / 2} y={h - padB + 15} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="var(--muted)">{it.code}</text>
          </g>
        );
      })}
    </svg>
  );
}

function CaRadar({ items }) {
  const cx = 140, cy = 128, R = 92;
  const n = items.length;
  if (n < 3) return null;
  const angleAt = i => -90 + (i * 360) / n;
  const ringPoints = f => items.map((_, i) => {
    const p = caPolar(cx, cy, R * f, angleAt(i));
    return `${p.x},${p.y}`;
  }).join(' ');
  const dataPoints = items.map((it, i) => caPolar(cx, cy, (R * Math.max(it.pct, 2)) / 100, angleAt(i)));
  return (
    <svg viewBox="0 0 280 260" className="ca-radar" role="img" aria-label="Profil kecerdasan kelas">
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={ringPoints(f)} fill="none" stroke="var(--line-2)" strokeWidth="1" />
      ))}
      {items.map((it, i) => {
        const p = caPolar(cx, cy, R, angleAt(i));
        return <line key={`ax${it.code}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--line-2)" strokeWidth="1" />;
      })}
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(91,141,239,0.18)" stroke="#5B8DEF" strokeWidth="2" strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={`d${items[i].code}`} cx={p.x} cy={p.y} r="4" fill={items[i].color} stroke="#fff" strokeWidth="2">
          <title>{`${items[i].label}: purata ${items[i].pct}%`}</title>
        </circle>
      ))}
      {items.map((it, i) => {
        const a = angleAt(i);
        const p = caPolar(cx, cy, R + 16, a);
        const cos = Math.cos((a * Math.PI) / 180);
        const anchor = cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle';
        return (
          <text key={`lb${it.code}`} x={p.x} y={p.y + 3.5} textAnchor={anchor}
            fontSize="10" fontWeight="600" fill="var(--muted)">{it.code}</text>
        );
      })}
    </svg>
  );
}

// ---- Analisis instrumen berasaskan domain (Tahun 5 & 6) ----

function CaDomainAnalysis({ scored, instrument, label, groupByKelas }) {
  const domains = instrument.domains || [];
  const details = window.INTELLIGENCE_DETAILS || {};

  const { stats, tiada } = React.useMemo(() => {
    const st = domains.map((def, idx) => ({
      def, idx,
      short: CA_SHORT[def.key] || def.nama.slice(0, 4).toUpperCase(),
      tinggi: 0, sederhana: 0, rendah: 0,
      sumPct: 0,
      dominan: [],
    }));
    const tanpa = [];
    scored.forEach(({ record, sc }) => {
      sc.aScores.forEach(s => {
        const t = st[s.idx];
        if (!t) return;
        t.sumPct += s.pct;
        t[caTahap(s.pct)]++;
      });
      let top = null;
      sc.aScores.forEach(s => { if (!top || s.ya > top.ya) top = s; });
      if (top && top.ya > 0) {
        st[top.idx].dominan.push({
          nama: record.murid.nama,
          kelas: record.murid.kelas || 'Tiada Kelas',
          ya: top.ya,
          total: top.total,
        });
      } else {
        tanpa.push(record.murid.nama);
      }
    });
    return { stats: st, tiada: tanpa };
  }, [scored, domains]);

  const jumlahMurid = scored.length;
  const byDominan = [...stats].sort((a, b) => b.dominan.length - a.dominan.length);
  const topDominan = byDominan.filter(s => s.dominan.length > 0);
  const byTinggi = [...stats].sort((a, b) => b.tinggi - a.tinggi);
  const maxTinggi = Math.max(1, ...stats.map(s => s.tinggi));

  const strategi = [];
  const seen = new Set();
  topDominan.slice(0, 3).forEach(s => {
    (CA_STRATEGI[s.def.key] || []).forEach(item => {
      if (!seen.has(item.nama)) { seen.add(item.nama); strategi.push(item); }
    });
  });

  const autoText = topDominan.length
    ? `Profil ${label} menunjukkan kecenderungan yang tinggi terhadap kecerdasan ` +
      `${topDominan.slice(0, 3).map(s => s.def.nama).join(', ')}. ` +
      `Ini menunjukkan murid lebih mudah belajar melalui ` +
      `${topDominan.slice(0, 3).map(s => CA_APPROACH[s.def.key]).filter(Boolean).join('; ')}.`
    : 'Belum cukup data untuk analisis automatik.';

  // Bahagian B (Tahun 6): purata kumpulan menaakul & penyelesaian
  const bStats = React.useMemo(() => {
    const withB = scored.filter(({ sc }) => sc.bReasoning);
    if (!withB.length) return null;
    const avg = sel => Math.round(withB.reduce((s, { sc }) => s + sel(sc), 0) / withB.length);
    return {
      menaakul: avg(sc => sc.bReasoning.pct),
      penyelesaian: avg(sc => sc.bProblemSolving.pct),
    };
  }, [scored]);

  return (
    <div className="ca-body">
      {/* Kad ringkas: 4 kecerdasan teratas (bilangan murid tahap tinggi) */}
      <div className="ca-cards">
        {byTinggi.slice(0, 4).map(s => (
          <div key={s.def.key} className="ca-card" style={{ borderColor: s.def.warna }}>
            <div className="ca-card-icon" style={{ color: s.def.warna }}>{s.def.icon}</div>
            <div className="ca-card-name" style={{ color: s.def.warna }}>{s.def.nama}</div>
            <div className="ca-card-value">{s.tinggi} Murid</div>
            <div className="ca-card-stars">{'★'.repeat(Math.max(1, Math.round((s.tinggi / maxTinggi) * 5)))}</div>
            <div className="ca-card-sub">tahap tinggi</div>
          </div>
        ))}
      </div>

      <div className="ca-grid-2">
        <div className="res-card ca-chart-card">
          <h2>Dominan Kecerdasan Murid</h2>
          <p className="res-card-sub">Bilangan murid mengikut kecerdasan paling dominan.</p>
          <CaDonut
            items={topDominan.map(s => ({ label: s.def.nama, value: s.dominan.length, color: s.def.warna }))}
            centerValue={topDominan.reduce((s, x) => s + x.dominan.length, 0)}
            centerLabel="Jumlah"
          />
          <div className="ca-legend">
            {stats.map(s => (
              <div key={s.def.key} className="ca-legend-item">
                <span className="ca-dot" style={{ background: s.def.warna }}></span>
                {s.short} ({s.dominan.length})
              </div>
            ))}
          </div>
        </div>

        <div className="res-card ca-chart-card">
          <h2>Bilangan Murid Tahap Tinggi</h2>
          <p className="res-card-sub">Murid dengan skor 70% ke atas bagi setiap kecerdasan.</p>
          <CaBarChart
            unit="murid"
            items={stats.map(s => ({ code: s.short, label: s.def.nama, value: s.tinggi, color: s.def.warna }))}
          />
        </div>
      </div>

      <div className="ca-grid-2">
        <div className="res-card ca-chart-card">
          <h2>Profil Kecerdasan {label}</h2>
          <p className="res-card-sub">Purata skor (%) bagi setiap kecerdasan.</p>
          <CaRadar
            items={stats.map(s => ({
              code: s.short,
              label: s.def.nama,
              pct: jumlahMurid ? Math.round(s.sumPct / jumlahMurid) : 0,
              color: s.def.warna,
            }))}
          />
        </div>

        <div className="res-card">
          <h2>Ringkasan Analisis Kecerdasan</h2>
          <p className="res-card-sub">Tahap: Tinggi &#8805;70%, Sederhana 40&#8211;69%, Rendah &lt;40%.</p>
          <table className="ca-table">
            <thead>
              <tr>
                <th>Kecerdasan</th>
                <th className="ca-th-tinggi">Tinggi</th>
                <th className="ca-th-sederhana">Sederhana</th>
                <th className="ca-th-rendah">Rendah</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.def.key}>
                  <td><span className="ca-dot" style={{ background: s.def.warna }}></span> {s.def.nama}</td>
                  <td className="ca-td-tinggi">{s.tinggi}</td>
                  <td className="ca-td-sederhana">{s.sederhana}</td>
                  <td className="ca-td-rendah">{s.rendah}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bStats && (
            <div className="ca-bstats">
              <div><span className="meta-label">Purata Menaakul (B 1-15)</span><strong>{bStats.menaakul}%</strong></div>
              <div><span className="meta-label">Purata Penyelesaian (B 16-30)</span><strong>{bStats.penyelesaian}%</strong></div>
            </div>
          )}
        </div>
      </div>

      <div className="ca-auto">
        <div className="ca-auto-title">&#129302; Analisis Automatik</div>
        <p>{autoText}</p>
      </div>

      {strategi.length > 0 && (
        <div className="res-card">
          <h2>Cadangan Strategi PdP</h2>
          <p className="res-card-sub">Berdasarkan kecerdasan paling dominan dalam {label}.</p>
          <div className="ca-strategies">
            {strategi.slice(0, 9).map(item => (
              <div key={item.nama} className="ca-strategy">
                <div className="ca-strategy-icon">{item.icon}</div>
                <div>{item.nama}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {topDominan.length > 0 && (
        <div className="res-card">
          <h2>Gaya Belajar Mengikut Kecerdasan Dominan</h2>
          <p className="res-card-sub">Cara belajar yang sesuai untuk kumpulan murid dominan.</p>
          <div className="ca-styles">
            {topDominan.slice(0, 4).map(s => {
              const detail = details[s.def.key];
              const bullets = detail && detail.kemahiran
                ? detail.kemahiran.slice(0, 3).map(k => k.judul)
                : [];
              return (
                <div key={s.def.key} className="ca-style" style={{ borderLeftColor: s.def.warna }}>
                  <div className="ca-style-head">
                    <span className="ca-style-icon" style={{ color: s.def.warna }}>{s.def.icon}</span>
                    <strong>{s.def.nama}</strong>
                  </div>
                  <ul>
                    {bullets.map(b => <li key={b}>{b}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="res-card">
        <h2>Senarai Murid Mengikut Kecerdasan Dominan</h2>
        <p className="res-card-sub">Rujukan guru: murid dikumpulkan mengikut kecerdasan paling dominan.</p>
        {topDominan.map(s => (
          <div key={s.def.key} className="ca-group">
            <div className="ca-group-head" style={{ background: s.def.warna }}>
              <span>{s.def.icon} {s.def.nama}</span>
              <span>{s.dominan.length} murid</span>
            </div>
            {groupByKelas
              ? [...new Set(s.dominan.map(m => m.kelas))].sort().map(k => (
                  <div key={k} className="ca-group-kelas">
                    <div className="ca-group-kelas-name">{k}</div>
                    <ol className="ca-names">
                      {s.dominan.filter(m => m.kelas === k)
                        .sort((a, b) => a.nama.localeCompare(b.nama))
                        .map(m => <li key={m.nama}>{m.nama} <small>({m.ya}/{m.total})</small></li>)}
                    </ol>
                  </div>
                ))
              : (
                <ol className="ca-names">
                  {[...s.dominan].sort((a, b) => a.nama.localeCompare(b.nama))
                    .map(m => <li key={m.nama}>{m.nama} <small>({m.ya}/{m.total})</small></li>)}
                </ol>
              )}
          </div>
        ))}
        {tiada.length > 0 && (
          <p className="ca-note">Tiada kecenderungan jelas ({tiada.length}): {tiada.join(', ')}</p>
        )}
      </div>
    </div>
  );
}

// ---- Analisis instrumen aptitud tanpa domain (Tahun 4) ----

function CaAptitudeAnalysis({ scored, label, groupByKelas }) {
  const data = React.useMemo(() => {
    const withGroups = scored.filter(({ sc }) => sc.groups && sc.groups.length);
    const groupStats = {};
    const bandLists = {};
    CA_BANDS.forEach(b => { bandLists[b] = []; });
    let sumOverall = 0;
    withGroups.forEach(({ record, sc }) => {
      sc.groups.forEach(g => {
        if (!groupStats[g.title]) {
          groupStats[g.title] = { title: g.title, short: g.short, sumPct: 0, n: 0, bands: { Cemerlang: 0, Baik: 0, Sederhana: 0, 'Perlu Bimbingan': 0 } };
        }
        const gs = groupStats[g.title];
        gs.sumPct += g.pct;
        gs.n++;
        gs.bands[g.level] = (gs.bands[g.level] || 0) + 1;
      });
      const overall = sc.analysis.bahagianB;
      sumOverall += overall.pct;
      bandLists[overall.level].push({
        nama: record.murid.nama,
        kelas: record.murid.kelas || 'Tiada Kelas',
        pct: overall.pct,
      });
    });
    return {
      n: withGroups.length,
      avgOverall: withGroups.length ? Math.round(sumOverall / withGroups.length) : 0,
      groups: Object.values(groupStats),
      bandLists,
    };
  }, [scored]);

  if (!data.n) {
    return <p className="ca-empty">Tiada data aptitud untuk {label}.</p>;
  }

  const shortTitle = t => (t.split('·').pop() || t).trim();
  const groupLabel = g => g.short || shortTitle(g.title);

  return (
    <div className="ca-body">
      <div className="ca-cards">
        <div className="ca-card">
          <div className="ca-card-name">Murid Dinilai</div>
          <div className="ca-card-value">{data.n}</div>
        </div>
        <div className="ca-card">
          <div className="ca-card-name">Purata Keseluruhan</div>
          <div className="ca-card-value">{data.avgOverall}%</div>
        </div>
        {data.groups.map(g => (
          <div key={g.title} className="ca-card">
            <div className="ca-card-name">{groupLabel(g)}</div>
            <div className="ca-card-value">{g.n ? Math.round(g.sumPct / g.n) : 0}%</div>
            <div className="ca-card-sub">purata</div>
          </div>
        ))}
      </div>

      <div className="ca-grid-2">
        <div className="res-card ca-chart-card">
          <h2>Purata Markah Mengikut Bahagian</h2>
          <p className="res-card-sub">Purata peratus {label} bagi setiap bahagian.</p>
          <CaBarChart
            unit="%"
            items={data.groups.map(g => ({
              code: groupLabel(g),
              label: shortTitle(g.title),
              value: g.n ? Math.round(g.sumPct / g.n) : 0,
              color: '#5B8DEF',
            }))}
          />
        </div>

        <div className="res-card">
          <h2>Taburan Tahap Mengikut Bahagian</h2>
          <p className="res-card-sub">Tahap: Cemerlang &#8805;80%, Baik &#8805;60%, Sederhana &#8805;40%.</p>
          <table className="ca-table">
            <thead>
              <tr>
                <th>Bahagian</th>
                {CA_BANDS.map(b => <th key={b} style={{ color: CA_BAND_COLORS[b] }}>{b}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.groups.map(g => (
                <tr key={g.title}>
                  <td>{groupLabel(g)}</td>
                  {CA_BANDS.map(b => <td key={b} style={{ textAlign: 'center', fontWeight: 700 }}>{g.bands[b] || 0}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="res-card">
        <h2>Senarai Murid Mengikut Tahap Keseluruhan</h2>
        <p className="res-card-sub">Rujukan guru: murid dikumpulkan mengikut tahap pencapaian aptitud.</p>
        {CA_BANDS.filter(b => data.bandLists[b].length > 0).map(b => (
          <div key={b} className="ca-group">
            <div className="ca-group-head" style={{ background: CA_BAND_COLORS[b] }}>
              <span>{b}</span>
              <span>{data.bandLists[b].length} murid</span>
            </div>
            {groupByKelas
              ? [...new Set(data.bandLists[b].map(m => m.kelas))].sort().map(k => (
                  <div key={k} className="ca-group-kelas">
                    <div className="ca-group-kelas-name">{k}</div>
                    <ol className="ca-names">
                      {data.bandLists[b].filter(m => m.kelas === k)
                        .sort((x, y) => y.pct - x.pct)
                        .map(m => <li key={m.nama}>{m.nama} <small>({m.pct}%)</small></li>)}
                    </ol>
                  </div>
                ))
              : (
                <ol className="ca-names">
                  {[...data.bandLists[b]].sort((x, y) => y.pct - x.pct)
                    .map(m => <li key={m.nama}>{m.nama} <small>({m.pct}%)</small></li>)}
                </ol>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Komponen utama ----

window.ClassAnalysis = function ({ records }) {
  const byYear = React.useMemo(() => {
    const map = { 4: [], 5: [], 6: [] };
    (records || []).forEach(r => {
      const y = window.GetInstrumentYear ? window.GetInstrumentYear(r.murid) : 6;
      if (map[y]) map[y].push(r);
    });
    return map;
  }, [records]);

  const [tahun, setTahun] = React.useState(() => {
    let best = 6, bestN = 0;
    [4, 5, 6].forEach(y => {
      const n = (byYear[y] || []).length;
      if (n > bestN) { best = y; bestN = n; }
    });
    return best;
  });
  const [kelas, setKelas] = React.useState('');

  const yearRecords = byYear[tahun] || [];
  const classes = React.useMemo(
    () => [...new Set(yearRecords.map(r => r.murid.kelas || 'Tiada Kelas'))].sort(),
    [yearRecords]
  );
  const filtered = kelas
    ? yearRecords.filter(r => (r.murid.kelas || 'Tiada Kelas') === kelas)
    : yearRecords;
  const instrument = window.INSTRUMENTS && window.INSTRUMENTS[tahun];

  const scored = React.useMemo(() => filtered.map(record => ({
    record,
    sc: window.ScoreInstrument ? window.ScoreInstrument(record.jawapan || {}, instrument) : null,
  })).filter(x => x.sc), [filtered, instrument]);

  const label = kelas ? `Kelas ${kelas}` : `Tahun ${tahun}`;
  const isDomain = instrument && (instrument.domains || []).length > 0;

  const handlePrint = () => {
    const prev = document.title;
    document.title = `Analisis ${label}`;
    window.print();
    document.title = prev;
  };

  return (
    <div className="admin-card ca">
      <div className="ca-controls">
        <div className="ca-year-tabs">
          {[4, 5, 6].map(y => (
            <button key={y}
              className={`ca-year-tab ${tahun === y ? 'active' : ''}`}
              onClick={() => { setTahun(y); setKelas(''); }}>
              Tahun {y}
              <span className="ca-year-count">{(byYear[y] || []).length}</span>
            </button>
          ))}
        </div>
        <div className="ca-controls-right">
          <select value={kelas} onChange={e => setKelas(e.target.value)} disabled={!classes.length}>
            <option value="">Semua Kelas</option>
            {classes.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          {scored.length > 0 && (
            <button className="btn" onClick={handlePrint}>Cetak Analisis</button>
          )}
        </div>
      </div>

      <div className="ca-title">
        <h2>Analisis {label}</h2>
        <p className="res-card-sub">
          {instrument ? instrument.title : ''} &middot; {scored.length} murid dinilai
        </p>
      </div>

      {scored.length === 0
        ? <p className="ca-empty">Tiada borang jawapan untuk Tahun {tahun} lagi.</p>
        : isDomain
          ? <CaDomainAnalysis scored={scored} instrument={instrument} label={label} groupByKelas={!kelas} />
          : <CaAptitudeAnalysis scored={scored} label={label} groupByKelas={!kelas} />}
    </div>
  );
};
