// Firebase Realtime Database connection for GitHub Pages.
// Data lives under: ujianpsikometrikapp
(function () {
  const ROOT = 'ujianpsikometrikapp';
  const EXTRA_MURID_BY_IC = {
    '160629101953': {
      nama: 'AFI RAYYAN BIN SYAMSUL RIZWAN',
      kelas: '4 CEMERLANG',
      tahun: 4,
      namaKelas: 'CEMERLANG',
      noPengenalan: '160629101953',
      sekolah: 'SK Sri Aman'
    },
    '160919070630': {
      nama: 'AFYA QISTINA BINTI EDDIWANIS',
      kelas: '4 CEMERLANG',
      tahun: 4,
      namaKelas: 'CEMERLANG',
      noPengenalan: '160919070630',
      sekolah: 'SK Sri Aman'
    }
  };

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

  function attachMuridIdentity(ic, murid) {
    return {
      ...murid,
      ic,
      id: ic,
      noPengenalan: murid.noPengenalan || ic,
      sekolah: murid.sekolah || 'SK Sri Aman'
    };
  }

  async function findMuridByIc(input) {
    const ic = normalizeIc(input);
    if (!ic || ic.length < 6) {
      throw new Error('Sila masukkan nombor IC yang sah.');
    }
    const extraMurid = EXTRA_MURID_BY_IC[ic];
    if (!hasFirebase()) {
      if (extraMurid) return attachMuridIdentity(ic, extraMurid);
      throw new Error('Firebase belum dimuatkan. Sila semak sambungan internet.');
    }

    const snap = await firebase.database().ref(`${ROOT}/muridByIc/${ic}`).get();
    if (!snap.exists()) return extraMurid ? attachMuridIdentity(ic, extraMurid) : null;

    const murid = snap.val();
    return attachMuridIdentity(ic, murid);
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

  async function findBorangJawapanByIc(input) {
    const ic = normalizeIc(input);
    if (!ic || ic.length < 6) return null;
    if (!hasFirebase()) return null;
    try {
      const snap = await firebase.database().ref(`${ROOT}/borangJawapanByIc/${ic}`).get();
      return snap.exists() ? snap.val() : null;
    } catch (err) {
      console.warn('findBorangJawapanByIc failed:', err);
      return null;
    }
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
  async function deleteBorangJawapan(ic) {
    if (!hasFirebase()) throw new Error('Firebase belum dimuatkan.');
    const normalized = normalizeIc(ic);
    if (!normalized) throw new Error('IC tidak sah.');
    await firebase.database().ref(`${ROOT}/borangJawapanByIc/${normalized}`).remove();
  }

  async function listAllMurid() {
    if (!hasFirebase()) throw new Error('Firebase belum dimuatkan.');
    const snap = await firebase.database().ref(`${ROOT}/muridByIc`).get();
    const rows = snap.exists()
      ? Object.entries(snap.val()).map(([ic, value]) => attachMuridIdentity(ic, value))
      : [];
    Object.entries(EXTRA_MURID_BY_IC).forEach(([ic, value]) => {
      if (!rows.some(row => row.ic === ic)) rows.push(attachMuridIdentity(ic, value));
    });
    return rows;
  }

  window.StudentDirectory = { normalizeIc, findMuridByIc, findBorangJawapanByIc, saveBorangJawapan, listBorangJawapan, deleteBorangJawapan, listAllMurid };
})();
