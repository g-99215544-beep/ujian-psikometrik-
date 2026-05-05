// === Welcome / Pendaftaran screen ===

window.WelcomeScreen = function ({ onStart }) {
  const [ic, setIc] = React.useState('');
  const [murid, setMurid] = React.useState(null);
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');

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
      setStatus('found');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Tidak dapat menyemak identiti murid.');
    }
  };

  const confirmIdentity = () => {
    if (murid) onStart(murid);
  };

  return (
    <div className="welcome">
      <div className="welcome-card">
        <div className="welcome-eyebrow">Pentaksiran Psikometrik · IA_T6</div>
        <h1>Kenali <em>kekuatan</em> dan kecerdasan diri anda.</h1>
        <p className="welcome-lede">
          Instrumen Aptitud Tahun 6 ini terdiri daripada dua bahagian: inventori kecerdasan
          pelbagai dan ujian penaakulan. Tiada jawapan betul atau salah dalam Bahagian A -
          jawablah dengan jujur mengikut diri anda yang sebenar.
        </p>

        <div className="welcome-meta">
          <div className="meta-item">
            <div className="meta-label">Masa</div>
            <div className="meta-val">1 jam 30 minit</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Soalan</div>
            <div className="meta-val">120 (90 + 30)</div>
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
            </div>
          )}

          <div className="welcome-actions">
            <button type="button" className="btn btn-primary" disabled={!murid} onClick={confirmIdentity}>
              Mula Pentaksiran →
            </button>
            <span className="brand-sub" style={{ marginLeft: 8 }}>
              Sahkan nama dan kelas sebelum mula.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

// === Arahan screen ===
window.ArahanScreen = function ({ onContinue, onBack }) {
  return (
    <div className="arahan">
      <div className="arahan-card">
        <h2>Arahan Pentaksiran</h2>
        <p className="lead">Sila baca arahan dengan teliti sebelum memulakan pentaksiran.</p>

        <ol>
          <li>Pentaksiran ini mengandungi <strong>120 soalan</strong> dalam dua bahagian.</li>
          <li>Anda diberi <strong>1 jam 30 minit</strong> untuk menjawab kesemua soalan.</li>
          <li>Bagi setiap soalan, pilih <strong>satu jawapan sahaja</strong>.</li>
          <li>Anda boleh berundur ke soalan sebelum dengan butang <em>Sebelum</em> atau peta soalan di tepi.</li>
          <li>Jawapan anda akan disimpan secara automatik. Jika anda menutup pelayar, anda boleh menyambung semula.</li>
        </ol>

        <div className="arahan-section">
          <h3><span className="badge">A</span> Inventori Kecerdasan Pelbagai · 90 soalan</h3>
          <p>Tandakan <strong>YA</strong> jika anda <em>setuju</em> dengan pernyataan tentang diri anda, atau <strong>TIDAK</strong> jika anda <em>tidak setuju</em>. Jawablah dengan jujur - tiada jawapan betul atau salah.</p>
        </div>

        <div className="arahan-section">
          <h3><span className="badge">B</span> Kemahiran Menaakul &amp; Menyelesaikan Masalah · 30 soalan</h3>
          <p>Pilih jawapan yang paling tepat dari pilihan A, B, C, atau D. Beberapa soalan disertakan dengan rajah atau jadual.</p>
        </div>

        <div className="welcome-actions">
          <button onClick={onBack} className="btn btn-ghost">← Kembali</button>
          <button onClick={onContinue} className="btn btn-primary">Saya Faham, Mula →</button>
        </div>
      </div>
    </div>
  );
};
