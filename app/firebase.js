// Firebase Realtime Database connection for GitHub Pages.
// Data lives under: ujianpsikometrikapp
(function () {
  const ROOT = 'ujianpsikometrikapp';

  const firebaseConfig = {
    apiKey: "AIzaSyBSWbXoKgQt1E8xvJa9zaKyw3e9V_EMxAE",
    authDomain: "sk-sri-aman-database.firebaseapp.com",
    databaseURL: "https://sk-sri-aman-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sk-sri-aman-database",
    storageBucket: "sk-sri-aman-database.firebasestorage.app",
    messagingSenderId: "810640165554",
    appId: "1:810640165554:web:b3ad2dc6f1583ec2a657ab",
    measurementId: "G-EW575JGKQR"
  };

  function normalizeIc(value) {
    return String(value || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  }

  function hasFirebase() {
    return window.firebase && firebase.apps !== undefined && firebase.database;
  }

  async function findMuridByIc(input) {
    const ic = normalizeIc(input);
    if (!ic || ic.length < 6) {
      throw new Error('Sila masukkan nombor IC yang sah.');
    }
    if (!hasFirebase()) {
      throw new Error('Firebase belum dimuatkan. Sila semak sambungan internet.');
    }

    const snap = await firebase.database().ref(`${ROOT}/muridByIc/${ic}`).get();
    if (!snap.exists()) return null;

    const murid = snap.val();
    return {
      ...murid,
      ic,
      id: ic,
      sekolah: murid.sekolah || 'SK Sri Aman'
    };
  }

  async function saveBorangJawapan(murid, jawapan, summary) {
    if (!hasFirebase()) {
      throw new Error('Firebase belum dimuatkan. Sila semak sambungan internet.');
    }
    const ic = normalizeIc(murid && (murid.ic || murid.id || murid.noPengenalan));
    if (!ic) throw new Error('IC murid tidak sah.');

    const payload = {
      murid: {
        ic,
        nama: murid.nama || '',
        kelas: murid.kelas || '',
        tahun: murid.tahun || null,
        namaKelas: murid.namaKelas || '',
        sekolah: murid.sekolah || 'SK Sri Aman'
      },
      jawapan: jawapan || {},
      summary: summary || {},
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
      updatedAtIso: new Date().toISOString()
    };

    await firebase.database().ref(`${ROOT}/borangJawapanByIc/${ic}`).set(payload);
    return payload;
  }

  async function listBorangJawapan() {
    if (!hasFirebase()) {
      throw new Error('Firebase belum dimuatkan. Sila semak sambungan internet.');
    }
    const snap = await firebase.database().ref(`${ROOT}/borangJawapanByIc`).get();
    if (!snap.exists()) return [];

    return Object.entries(snap.val()).map(([ic, value]) => ({
      ic,
      ...value
    })).sort((a, b) => {
      const nameA = (a.murid && a.murid.nama) || '';
      const nameB = (b.murid && b.murid.nama) || '';
      return nameA.localeCompare(nameB);
    });
  }

  try {
    if (window.firebase && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      if (firebase.analytics && window.location.protocol !== 'file:') {
        try { firebase.analytics(); } catch (err) { console.warn('Analytics disabled:', err); }
      }
    }
  } catch (err) {
    console.error('Firebase initialization failed:', err);
  }

  window.UJIAN_DB_ROOT = ROOT;
  window.StudentDirectory = { normalizeIc, findMuridByIc, saveBorangJawapan, listBorangJawapan };
})();
