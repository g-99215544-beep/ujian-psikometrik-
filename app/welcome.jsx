// === Welcome / Pendaftaran screen ===

window.WelcomeScreen = function ({ onStart }) {
  const [form, setForm] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('iat6.murid') || '{}'); } catch { return {}; }
  });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const valid = form.nama && form.kelas && form.sekolah;

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    localStorage.setItem('iat6.murid', JSON.stringify(form));
    onStart(form);
  };

  return (
    <div className="welcome">
      <div className="welcome-card">
        <div className="welcome-eyebrow">Pentaksiran Psikometrik · IA_T6</div>
        <h1>Kenali <em>kekuatan</em> dan kecerdasan diri anda.</h1>
        <p className="welcome-lede">
          Instrumen Aptitud Tahun 6 ini terdiri daripada dua bahagian: inventori kecerdasan
          pelbagai dan ujian penaakulan. Tiada jawapan betul atau salah dalam Bahagian A —
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

        <form onSubmit={submit}>
          <div className="fld-row full">
            <label className="fld">
              Nama Penuh
              <input value={form.nama || ''} onChange={e => set('nama', e.target.value)} placeholder="Cth: Aisyah binti Ahmad" required />
            </label>
          </div>
          <div className="fld-row">
            <label className="fld">
              Kelas
              <input value={form.kelas || ''} onChange={e => set('kelas', e.target.value)} placeholder="Cth: 6 Bestari" required />
            </label>
            <label className="fld">
              No. Pendaftaran (pilihan)
              <input value={form.id || ''} onChange={e => set('id', e.target.value)} placeholder="Cth: A1234" />
            </label>
          </div>
          <div className="fld-row full">
            <label className="fld">
              Nama Sekolah
              <input value={form.sekolah || ''} onChange={e => set('sekolah', e.target.value)} placeholder="Cth: SK Taman Indah" required />
            </label>
          </div>

          <div className="welcome-actions">
            <button type="submit" className="btn btn-primary" disabled={!valid}>
              Mula Pentaksiran  →
            </button>
            <span className="brand-sub" style={{ marginLeft: 8 }}>
              Maklumat hanya disimpan dalam pelayar anda.
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
          <p>Tandakan <strong>YA</strong> jika anda <em>setuju</em> dengan pernyataan tentang diri anda, atau <strong>TIDAK</strong> jika anda <em>tidak setuju</em>. Jawablah dengan jujur — tiada jawapan betul atau salah.</p>
        </div>

        <div className="arahan-section">
          <h3><span className="badge">B</span> Kemahiran Menaakul &amp; Menyelesaikan Masalah · 30 soalan</h3>
          <p>Pilih jawapan yang paling tepat dari pilihan A, B, C, atau D. Beberapa soalan disertakan dengan rajah atau jadual.</p>
        </div>

        <div className="welcome-actions">
          <button onClick={onBack} className="btn btn-ghost">← Kembali</button>
          <button onClick={onContinue} className="btn btn-primary">Saya Faham, Mula  →</button>
        </div>
      </div>
    </div>
  );
};
