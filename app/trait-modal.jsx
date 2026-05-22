// Trait detail modal — opened from results screen Bahagian A rows.
// Pure presentational component. Reads no globals.
window.TraitModal = function ({ domain, detail, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const [imgFailed, setImgFailed] = React.useState(false);
  const posterSrc = `assets/posters/${domain.key}.jpg`;

  return (
    <div className="trait-modal-overlay" onClick={onClose}>
      <div className="trait-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={domain.nama}>
        <div className="trait-modal-accent" style={{ background: domain.warna }} />
        <button className="trait-modal-close" onClick={onClose} aria-label="Tutup">×</button>

        <div className="trait-modal-header">
          <span className="bdot" style={{ background: domain.warna }} />
          <h2>{domain.nama}</h2>
        </div>

        {!imgFailed && (
          <div className="trait-modal-hero">
            <img
              src={posterSrc}
              alt={`Poster ${domain.nama}`}
              onError={() => setImgFailed(true)}
            />
            <img
              className="trait-modal-logo-overlay"
              src="assets/logo-sksa.jpg"
              alt="Logo SK Sri Aman"
              aria-hidden="true"
            />
          </div>
        )}

        {detail.motto && (
          <div className="trait-modal-section trait-modal-motto">
            <em>“{detail.motto}”</em>
          </div>
        )}

        {detail.ringkasan && (
          <div className="trait-modal-section">
            <p>{detail.ringkasan}</p>
          </div>
        )}

        {detail.ciri && detail.ciri.length > 0 && (
          <div className="trait-modal-section">
            <h3>Ciri-ciri</h3>
            <ul>
              {detail.ciri.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}

        {detail.kemahiran && detail.kemahiran.length > 0 && (
          <div className="trait-modal-section">
            <h3>Kemahiran Belajar Berkesan</h3>
            <ol className="kemahiran-list">
              {detail.kemahiran.map((item, i) => (
                <li key={i} className="kemahiran-item">
                  <strong>{item.judul}</strong>
                  <span>{item.huraian}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {detail.tip && detail.tip.length > 0 && (
          <div className="trait-modal-section">
            <h3>Tip Hebat</h3>
            <ul>
              {detail.tip.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}

        {detail.kerjaya && detail.kerjaya.length > 0 && (
          <div className="trait-modal-section">
            <h3>Sesuai Dengan Kerjaya</h3>
            <ul className="kerjaya-list">
              {detail.kerjaya.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
