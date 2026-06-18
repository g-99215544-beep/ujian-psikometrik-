// === Welcome / Pendaftaran screen ===

window.WelcomeScreen = function ({ onStart }) {
  const [ic, setIc] = React.useState('');
  const [murid, setMurid] = React.useState(null);
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');
  const [existingRecord, setExistingRecord] = React.useState(null);

  const lookup = async (e) => {
    e.preventDefault();
    const directory = window.StudentDirectory;
    const cleanIc = directory
      ? directory.normalizeIc(ic)
      : String(ic || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();

    setMurid(null);
    setMessage('');

    if (!cleanIc || cleanIc.length < 6) {
      setStatus('error');
      setMessage('Sila masukkan nombor IC yang sah.');
      return;
    }

    if (!directory) {
      setStatus('error');
      setMessage('Sambungan Firebase belum tersedia. Sila muat semula halaman.');
      return;
    }

    setStatus('loading');
    try {
      const found = await directory.findMuridByIc(cleanIc);
      if (!found) {
        setStatus('error');
        setMessage('Rekod murid tidak dijumpai. Sila semak nombor IC.');
        return;
      }
      setIc(cleanIc);
      setMurid(found);
      const record = directory.findBorangJawapanByIc
        ? await directory.findBorangJawapanByIc(cleanIc)
        : null;
      setExistingRecord(record);
      setStatus('found');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Tidak dapat menyemak identiti murid.');
    }
  };

  const confirmIdentity = () => {
    if (murid) onStart(murid, existingRecord);
  };
  const selectedInstrument = murid && window.GetInstrumentForMurid ? window.GetInstrumentForMurid(murid) : null;

  return (
    <div className="welcome">
      <div className="welcome-card">
        <div className="welcome-eyebrow">Pentaksiran Psikometrik</div>
        <h1>Kenali <em>kekuatan</em> dan profil diri anda.</h1>
        <p className="welcome-lede">
          Masukkan nombor IC untuk mendapatkan instrumen mengikut tahun murid.
          Jawablah dengan jujur mengikut diri anda yang sebenar.
        </p>

        <div className="welcome-meta">
          <div className="meta-item">
            <div className="meta-label">Masa</div>
            <div className="meta-val">Ikut instrumen</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Soalan</div>
            <div className="meta-val">Tahun 4, 5 atau 6</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Bahasa</div>
            <div className="meta-val">Bahasa Melayu</div>
          </div>
        </div>

        <form onSubmit={lookup}>
          <div className="fld-row full">
            <label className="fld">
              Nombor IC Murid
              <div className="ic-search">
                <input
                  value={ic}
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
                    setIc(value);
                    setMurid(null);
                    setExistingRecord(null);
                    setStatus('idle');
                    setMessage('');
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Cth: 140101010101"
                  required
                />
                <button type="submit" className="btn" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Menyemak...' : 'Semak'}
                </button>
              </div>
            </label>
          </div>

          {message && <div className="form-message error">{message}</div>}

          {murid && (
            <div className="identity-card">
              <div>
                <div className="meta-label">Nama Murid</div>
                <div className="identity-name">{murid.nama}</div>
              </div>
              <div className="identity-row">
                <div>
                  <div className="meta-label">Kelas</div>
                  <div className="meta-val">{murid.kelas}</div>
                </div>
                <div>
                  <div className="meta-label">Sekolah</div>
                  <div className="meta-val">{murid.sekolah}</div>
                </div>
              </div>
              {existingRecord && (
                <div className="identity-completed">
                  ✓ Anda telah selesai menjawab ujian ini.
                </div>
              )}
              {selectedInstrument && (
                <div>
                  <div className="meta-label">Instrumen</div>
                  <div className="meta-val">{selectedInstrument.title}</div>
                </div>
              )}
            </div>
          )}

          <div className="welcome-actions">
            <button type="button" className="btn btn-primary" disabled={!murid} onClick={confirmIdentity}>
              {existingRecord ? 'Lihat Keputusan →' : 'Mula Pentaksiran →'}
            </button>
            <span className="brand-sub" style={{ marginLeft: 8 }}>
              {existingRecord
                ? 'Anda akan dibawa ke laporan keputusan.'
                : 'Sahkan nama dan kelas sebelum mula.'}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

// === Arahan screen ===
window.ArahanScreen = function ({ onContinue, onBack, instrument }) {
  const active = instrument || (window.INSTRUMENTS && window.INSTRUMENTS[6]);
  const total = active.sectionA.length + active.sectionB.length;
  const minutes = Math.round((active.duration || 0) / 60);
  const sectionGroups = Array.isArray(active.sectionBGroups) ? active.sectionBGroups : null;
  // "Bahagian A · Bahasa Melayu" -> "Bahasa Melayu"
  const sectionName = (g) => String(g.title || '').split('·').pop().trim();
  return (
    <div className="arahan">
      <div className="arahan-card">
        <h2>Arahan Pentaksiran</h2>
        <p className="lead">Sila baca arahan dengan teliti sebelum memulakan pentaksiran.</p>

        <ol>
          <li>Pentaksiran ini mengandungi <strong>{total} soalan</strong>.</li>
          {sectionGroups && (
            <li>Pentaksiran ini mengandungi <strong>{sectionGroups.length} bahagian</strong>: {sectionGroups.map(g => sectionName(g)).join(', ')}.</li>
          )}
          <li>Anda diberi <strong>{minutes} minit</strong> untuk menjawab kesemua soalan.</li>
          <li>Bagi setiap soalan, pilih <strong>satu jawapan sahaja</strong>.</li>
          <li>Anda boleh berundur ke soalan sebelum dengan butang <em>Sebelum</em> atau peta soalan di tepi.</li>
          <li>Jawapan anda akan disimpan secara automatik. Jika anda menutup pelayar, anda boleh menyambung semula.</li>
        </ol>

        {active.sectionA.length > 0 && (
          <div className="arahan-section">
            <h3><span className="badge">A</span> {active.sectionAName} · {active.sectionA.length} soalan</h3>
            <p>Tandakan <strong>YA</strong> jika anda <em>setuju</em> dengan pernyataan tentang diri anda, atau <strong>TIDAK</strong> jika anda <em>tidak setuju</em>. Jawablah dengan jujur - tiada jawapan betul atau salah.</p>
          </div>
        )}

        {sectionGroups ? (
          sectionGroups.map((g, i) => (
            <div className="arahan-section" key={i}>
              <h3><span className="badge">{['A', 'B', 'C', 'D'][i] || '•'}</span> {sectionName(g)} · {g.end - g.start + 1} soalan</h3>
              <p>{g.focus} Pilih jawapan yang paling tepat dari pilihan A, B, C, atau D.</p>
            </div>
          ))
        ) : (active.sectionB.length > 0 && (
          <div className="arahan-section">
            <h3><span className="badge">B</span> Kemahiran Menaakul &amp; Menyelesaikan Masalah · {active.sectionB.length} soalan</h3>
            <p>Pilih jawapan yang paling tepat dari pilihan A, B, C, atau D. Beberapa soalan disertakan dengan rajah atau jadual.</p>
          </div>
        ))}

        <div className="welcome-actions">
          <button onClick={onBack} className="btn btn-ghost">← Kembali</button>
          <button onClick={onContinue} className="btn btn-primary">Saya Faham, Mula →</button>
        </div>
      </div>
    </div>
  );
};
