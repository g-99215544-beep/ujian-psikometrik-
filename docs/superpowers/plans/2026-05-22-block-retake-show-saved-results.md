# Block Retake & Show Saved Results — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a student re-enters their IC at the welcome screen and a saved result exists in Firebase, show them the saved result and prevent any retake of the test.

**Architecture:** Add a Firebase lookup function for `borangJawapanByIc/{ic}` in `app/firebase.js`. Use the result in `welcome.jsx` to toggle the primary CTA between "Mula Pentaksiran" and "Lihat Keputusan". When the user opens a saved result, `main.jsx` routes directly to `keputusan` with a new `viewOnly` flag (persisted to localStorage). `results.jsx` skips its re-save effect in view-only mode.

**Tech Stack:** Vanilla JS + React 18 (UMD via script tags), Firebase Realtime Database (compat SDK), no build step, no test framework. All "tests" in this plan are manual browser verifications because the project has no test runner.

**Spec:** [docs/superpowers/specs/2026-05-22-block-retake-show-saved-results-design.md](../specs/2026-05-22-block-retake-show-saved-results-design.md)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| [app/firebase.js](../../../app/firebase.js) | Modify | Add `findBorangJawapanByIc(ic)`; export on `window.StudentDirectory`. |
| [app/welcome.jsx](../../../app/welcome.jsx) | Modify | After IC lookup, also fetch borang. Render completion notice + conditional button. Pass `existingRecord` to `onStart`. |
| [app/main.jsx](../../../app/main.jsx) | Modify | New `viewOnly` state (persisted). `handleStart(murid, existingRecord)` branches. `handleHome` clears flag. Prop passed to `ResultsScreen`. |
| [app/results.jsx](../../../app/results.jsx) | Modify | Accept `viewOnly` prop; skip save `useEffect` when true. |
| [app/styles.css](../../../app/styles.css) | Modify | Add `.identity-completed` notice style. |

## Manual Verification Setup

This project runs as a static site (no build). To verify each task:

```bash
python -m http.server 8000
# OR (PowerShell): python -m http.server 8000
# OR open index.html directly (Firebase still works on file:// for reads)
```

Open `http://localhost:8000`. Use real Firebase data — `muridByIc` and `borangJawapanByIc` are already populated from prior test sessions.

**Reusable test IC numbers** (verify by listing in admin screen at `http://localhost:8000/#admin`):
- Pick any IC visible in the admin "Borang Tersimpan" list — that IC has a saved record (use for the "already completed" path).
- Pick an IC from the admin "Senarai Murid" list that does NOT appear in "Borang Tersimpan" — that IC has no saved record (use for the "new student" path).

Record both IC numbers in a scratch note before starting; you'll reuse them in nearly every task.

---

### Task 1: Add `findBorangJawapanByIc` to Firebase helper

**Files:**
- Modify: `app/firebase.js`

- [ ] **Step 1: Add the function**

In `app/firebase.js`, after the existing `listBorangJawapan` function (around line 87) and before the `try { ... }` initialization block, add:

```js
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
```

The function returns `null` (not throws) on any failure so a transient network problem never locks a fresh student out of the test.

- [ ] **Step 2: Export the function on `window.StudentDirectory`**

In `app/firebase.js`, find the line:

```js
  window.StudentDirectory = { normalizeIc, findMuridByIc, saveBorangJawapan, listBorangJawapan, deleteBorangJawapan, listAllMurid };
```

Replace with:

```js
  window.StudentDirectory = { normalizeIc, findMuridByIc, findBorangJawapanByIc, saveBorangJawapan, listBorangJawapan, deleteBorangJawapan, listAllMurid };
```

- [ ] **Step 3: Manual verification — function exists and works**

Open `http://localhost:8000` in browser. Open DevTools console. Run:

```js
await window.StudentDirectory.findBorangJawapanByIc('<IC_WITH_RECORD>')
```

Expected: returns an object with `murid`, `jawapan`, `summary`, `updatedAt`, `updatedAtIso` keys.

Run:

```js
await window.StudentDirectory.findBorangJawapanByIc('999999999999')
```

Expected: returns `null` (no record for fake IC).

Run:

```js
await window.StudentDirectory.findBorangJawapanByIc('')
```

Expected: returns `null` (too short, doesn't even hit Firebase).

- [ ] **Step 4: Commit**

```bash
git add app/firebase.js
git commit -m "feat: add findBorangJawapanByIc helper for completed-test lookup"
```

---

### Task 2: Welcome screen — fetch borang and toggle button

**Files:**
- Modify: `app/welcome.jsx`

- [ ] **Step 1: Add `existingRecord` state and fetch logic**

In `app/welcome.jsx`, find the component's state declarations near the top:

```js
window.WelcomeScreen = function ({ onStart }) {
  const [ic, setIc] = React.useState('');
  const [murid, setMurid] = React.useState(null);
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');
```

Add a new state line right after `message`:

```js
  const [existingRecord, setExistingRecord] = React.useState(null);
```

- [ ] **Step 2: Reset `existingRecord` whenever IC input changes**

In `app/welcome.jsx`, find the `onChange` handler on the IC input (around line 85-91). Currently:

```js
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
                    setIc(value);
                    setMurid(null);
                    setStatus('idle');
                    setMessage('');
                  }}
```

Replace with:

```js
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
                    setIc(value);
                    setMurid(null);
                    setExistingRecord(null);
                    setStatus('idle');
                    setMessage('');
                  }}
```

- [ ] **Step 3: Fetch borang after `findMuridByIc` succeeds**

In `app/welcome.jsx`, find the `lookup` function. Currently after a successful find:

```js
      const found = await directory.findMuridByIc(cleanIc);
      if (!found) {
        setStatus('error');
        setMessage('Rekod murid tidak dijumpai. Sila semak nombor IC.');
        return;
      }
      setIc(cleanIc);
      setMurid(found);
      setStatus('found');
```

Replace with:

```js
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
```

- [ ] **Step 4: Update `confirmIdentity` to pass `existingRecord`**

In `app/welcome.jsx`, find:

```js
  const confirmIdentity = () => {
    if (murid) onStart(murid);
  };
```

Replace with:

```js
  const confirmIdentity = () => {
    if (murid) onStart(murid, existingRecord);
  };
```

- [ ] **Step 5: Add completion notice inside the identity card**

In `app/welcome.jsx`, find the `<div className="identity-card">` block. After the closing `</div>` of the `identity-row` and before the `{selectedInstrument && ...}` block, add the completion notice. The full block becomes:

```jsx
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
```

- [ ] **Step 6: Toggle the primary button label**

In `app/welcome.jsx`, find:

```jsx
          <div className="welcome-actions">
            <button type="button" className="btn btn-primary" disabled={!murid} onClick={confirmIdentity}>
              Mula Pentaksiran →
            </button>
            <span className="brand-sub" style={{ marginLeft: 8 }}>
              Sahkan nama dan kelas sebelum mula.
            </span>
          </div>
```

Replace with:

```jsx
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
```

- [ ] **Step 7: Manual verification — UI toggles correctly**

Reload `http://localhost:8000`. Clear localStorage first: in DevTools console run `localStorage.clear()`.

Test A (new student path):
1. Type the IC of a student WITHOUT a saved record. Click **Semak**.
2. Expected: identity card appears. NO green completion notice. Button reads `Mula Pentaksiran →`.
3. Subtext reads "Sahkan nama dan kelas sebelum mula."

Test B (completed-test path):
1. Clear the input. Type the IC of a student WITH a saved record. Click **Semak**.
2. Expected: identity card appears. Green completion notice "✓ Anda telah selesai menjawab ujian ini." is visible. Button reads `Lihat Keputusan →`.
3. Subtext reads "Anda akan dibawa ke laporan keputusan."

Test C (input change resets):
1. After Test B, type one more character into the IC input.
2. Expected: identity card disappears, completion notice disappears (state reset).

The completion notice will be unstyled at this point (Task 5 adds CSS) — verify only that the text is rendered. Clicking the button will currently not behave correctly because main.jsx hasn't been updated; that comes in Task 3.

- [ ] **Step 8: Commit**

```bash
git add app/welcome.jsx
git commit -m "feat: detect completed test and toggle welcome CTA to 'Lihat Keputusan'"
```

---

### Task 3: Main app — `viewOnly` state and routing for saved results

**Files:**
- Modify: `app/main.jsx`

- [ ] **Step 1: Add `loadViewOnly` helper**

In `app/main.jsx`, find the `loadMurid` function (around line 16):

```js
function loadMurid() {
  try {
    const saved = JSON.parse(localStorage.getItem('iat6.murid') || 'null');
    return saved && saved.ic && saved.nama && saved.kelas ? saved : null;
  } catch {
    return null;
  }
}
```

Right after it, add:

```js
function loadViewOnly() {
  return localStorage.getItem('iat6.viewOnly') === '1';
}
```

- [ ] **Step 2: Add `viewOnly` state**

In `app/main.jsx`, find the existing state block in `App()`:

```js
  const [murid, setMurid] = useState(loadMurid);
  const [jawapan, setJawapan] = useState(loadJawapan);
```

Add a third line right after:

```js
  const [viewOnly, setViewOnly] = useState(loadViewOnly);
```

- [ ] **Step 3: Update `handleStart` to branch on `existingRecord`**

In `app/main.jsx`, find:

```js
  const handleStart = (data) => {
    ['iat6.jawapan','iat6.idx','iat6.startedAt'].forEach(k => localStorage.removeItem(k));
    setMurid(data);
    setJawapan({});
    setStartedAt(null);
    setTimeLeft(null);
    localStorage.setItem('iat6.murid', JSON.stringify(data));
    setRoute('arahan');
  };
```

Replace with:

```js
  const handleStart = (data, existingRecord) => {
    ['iat6.jawapan','iat6.idx','iat6.startedAt','iat6.viewOnly'].forEach(k => localStorage.removeItem(k));
    setStartedAt(null);
    setTimeLeft(null);

    if (existingRecord) {
      const savedMurid = existingRecord.murid || data;
      const savedJawapan = existingRecord.jawapan || {};
      setMurid(savedMurid);
      setJawapan(savedJawapan);
      setViewOnly(true);
      localStorage.setItem('iat6.murid', JSON.stringify(savedMurid));
      localStorage.setItem('iat6.jawapan', JSON.stringify(savedJawapan));
      localStorage.setItem('iat6.viewOnly', '1');
      setRoute('keputusan');
      return;
    }

    setMurid(data);
    setJawapan({});
    setViewOnly(false);
    localStorage.setItem('iat6.murid', JSON.stringify(data));
    setRoute('arahan');
  };
```

- [ ] **Step 4: Update `handleHome` to clear `viewOnly`**

In `app/main.jsx`, find:

```js
  const handleHome = () => {
    ['iat6.murid','iat6.jawapan','iat6.idx','iat6.route','iat6.startedAt'].forEach(k => localStorage.removeItem(k));
    setMurid(null); setJawapan({}); setStartedAt(null); setTimeLeft(null); setRoute('welcome');
  };
```

Replace with:

```js
  const handleHome = () => {
    ['iat6.murid','iat6.jawapan','iat6.idx','iat6.route','iat6.startedAt','iat6.viewOnly'].forEach(k => localStorage.removeItem(k));
    setMurid(null); setJawapan({}); setStartedAt(null); setTimeLeft(null); setViewOnly(false); setRoute('welcome');
  };
```

- [ ] **Step 5: Pass `viewOnly` prop to `ResultsScreen`**

In `app/main.jsx`, find the keputusan render branch (around line 162):

```jsx
  } else {
    return (
      <>
        <window.ResultsScreen murid={murid} jawapan={jawapan} onHome={handleHome} instrument={instrument} />
        <TweaksUI tweaks={tweaks} setTweak={setTweak} duration={duration} />
      </>
    );
  }
```

Replace with:

```jsx
  } else {
    return (
      <>
        <window.ResultsScreen murid={murid} jawapan={jawapan} onHome={handleHome} instrument={instrument} viewOnly={viewOnly} />
        <TweaksUI tweaks={tweaks} setTweak={setTweak} duration={duration} />
      </>
    );
  }
```

- [ ] **Step 6: Manual verification — routing works**

Reload `http://localhost:8000`. Clear localStorage: `localStorage.clear()` then reload.

Test A (completed-test routing):
1. Enter IC of a student with a saved record. Click **Semak**.
2. Click **Lihat Keputusan →**.
3. Expected: page goes directly to the results screen showing that student's report. The arahan and ujian screens are skipped.
4. In DevTools console, run `localStorage.getItem('iat6.viewOnly')`. Expected: `"1"`.
5. In DevTools console, run `localStorage.getItem('iat6.route')`. Expected: `"keputusan"`.

Test B (refresh keeps view-only):
1. While on the results screen from Test A, hit browser refresh.
2. Expected: results screen still shows, same student, same data.
3. Verify `localStorage.getItem('iat6.viewOnly')` is still `"1"`.

Test C (new student routing unchanged):
1. Click the home icon (top-right). Expected: returns to welcome. `localStorage.getItem('iat6.viewOnly')` returns `null`.
2. Enter IC of a student WITHOUT a saved record. Click **Semak**.
3. Click **Mula Pentaksiran →**.
4. Expected: goes to arahan screen as before.
5. Verify `localStorage.getItem('iat6.viewOnly')` returns `null`.

Note: at this point, viewing a saved result will STILL re-save to Firebase because `results.jsx` doesn't know about `viewOnly` yet. That's fixed in Task 4. To confirm: open the Firebase console or admin screen and note the saved record's `updatedAt`; viewing the result will currently update it (incorrectly). Task 4 fixes this.

- [ ] **Step 7: Commit**

```bash
git add app/main.jsx
git commit -m "feat: route completed-test viewers directly to results with viewOnly flag"
```

---

### Task 4: Results screen — skip re-save in `viewOnly` mode

**Files:**
- Modify: `app/results.jsx`

- [ ] **Step 1: Accept `viewOnly` prop and guard the save effect**

In `app/results.jsx`, find:

```js
window.ResultsScreen = function ({ murid, jawapan, onHome, instrument }) {
```

Replace with:

```js
window.ResultsScreen = function ({ murid, jawapan, onHome, instrument, viewOnly }) {
```

Then find the save useEffect (lines 18-30):

```js
  React.useEffect(() => {
    if (!window.StudentDirectory || !window.StudentDirectory.saveBorangJawapan || !window.ScoreIAT6) return;
    const score = window.ScoreInstrument ? window.ScoreInstrument(jawapan, active) : window.ScoreIAT6(jawapan);
    window.StudentDirectory.saveBorangJawapan(murid, jawapan, {
      answeredCount: score.answeredCount,
      bRight: score.bRight,
      bPct: score.bPct,
      bReasoning: score.bReasoning,
      bProblemSolving: score.bProblemSolving,
      analysis: score.analysis,
      top3: score.top3.map(s => ({ nama: s.nama, ya: s.ya, total: s.total }))
    }).catch(err => console.warn('Gagal simpan borang jawapan:', err));
  }, []);
```

Replace with:

```js
  React.useEffect(() => {
    if (viewOnly) return;
    if (!window.StudentDirectory || !window.StudentDirectory.saveBorangJawapan || !window.ScoreIAT6) return;
    const score = window.ScoreInstrument ? window.ScoreInstrument(jawapan, active) : window.ScoreIAT6(jawapan);
    window.StudentDirectory.saveBorangJawapan(murid, jawapan, {
      answeredCount: score.answeredCount,
      bRight: score.bRight,
      bPct: score.bPct,
      bReasoning: score.bReasoning,
      bProblemSolving: score.bProblemSolving,
      analysis: score.analysis,
      top3: score.top3.map(s => ({ nama: s.nama, ya: s.ya, total: s.total }))
    }).catch(err => console.warn('Gagal simpan borang jawapan:', err));
  }, []);
```

- [ ] **Step 2: Manual verification — save is skipped in view-only**

Reload `http://localhost:8000`. Clear localStorage: `localStorage.clear()` then reload.

Pre-step: open the admin screen at `http://localhost:8000/#admin` in a separate tab. Find the IC of a student with a saved record. Note the displayed `updatedAt` / "Dikemas kini" timestamp for that record. Close the admin tab.

Test A (view-only does not re-save):
1. Back on the main app, enter the IC of that student. Click **Semak** → **Lihat Keputusan →**.
2. Confirm the results screen renders.
3. Open `http://localhost:8000/#admin` again in a new tab. Locate the same record.
4. Expected: `updatedAt` for this student is UNCHANGED from the pre-step value.

Test B (fresh submission still saves):
1. Close the admin tab. Return to main app and click home.
2. Enter the IC of a student WITHOUT a saved record. Go through arahan, answer a few items, complete the ujian (use the "Tamat" button or wait for timer; for speed, you can answer just one item and end early).
3. When the results screen appears, open `http://localhost:8000/#admin` in another tab.
4. Expected: a new saved record appears for this student with a fresh `updatedAt`.

Test C (regression: opening results from completion still saves)
1. The above Test B IS the regression check. As long as Test B's record was created, the non-viewOnly save path still works.

If both A and B pass, the feature is complete.

- [ ] **Step 3: Commit**

```bash
git add app/results.jsx
git commit -m "feat: skip results re-save when displaying a saved record (viewOnly)"
```

---

### Task 5: Style the completion notice

**Files:**
- Modify: `app/styles.css`

- [ ] **Step 1: Add the notice style**

In `app/styles.css`, find the existing `.identity-row` rule (around line 163):

```css
.identity-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
```

Right after it, add:

```css
.identity-completed {
  padding: 10px 14px; border-radius: var(--radius);
  background: oklch(0.95 0.08 145); color: oklch(0.32 0.14 145);
  border: 1px solid oklch(0.82 0.12 145);
  font-weight: 600; font-size: 0.95rem;
}
```

This uses the same OKLCH color family as the existing `.form-message.error` (line 156) but in the green hue band (~145°) instead of red (~25°), so it visually matches the design system.

- [ ] **Step 2: Manual verification — notice is styled**

Reload `http://localhost:8000`. Clear localStorage. Enter the IC of a student with a saved record. Click **Semak**.

Expected: the green completion notice appears inside the identity card with:
- Green background (light green)
- Darker green text
- Subtle green border
- Rounded corners matching other cards
- Bold-ish weight

Hard-refresh (Ctrl+F5 / Cmd+Shift+R) if styling appears unchanged — the CSS may be cached.

- [ ] **Step 3: Commit**

```bash
git add app/styles.css
git commit -m "style: add green completion notice for already-completed identity card"
```

---

### Task 6: End-to-end verification across all flows

**Files:** None (pure verification task)

- [ ] **Step 1: Full happy-path verification**

Reload `http://localhost:8000`. Run `localStorage.clear()` in DevTools console, then reload.

Path 1 — New student takes test:
1. Enter the IC of a student WITHOUT a saved record. Click **Semak**.
2. Confirm: no green notice, button reads "Mula Pentaksiran →".
3. Click button → arahan screen appears → click "Saya Faham, Mula →".
4. Answer at least one item → click "Tamat" → confirm dialog → results screen appears.
5. Verify in admin tab: new record exists.

Path 2 — Same student returns:
1. Click home icon.
2. Enter the same IC. Click **Semak**.
3. Confirm: green notice appears, button reads "Lihat Keputusan →".
4. Click button → results screen appears directly (no arahan, no ujian).
5. Verify in admin tab: the record's `updatedAt` is the SAME as after Path 1 (no re-save).

Path 3 — Different student (also new):
1. Click home.
2. Enter a different IC without a record.
3. Confirm: no green notice, button reads "Mula Pentaksiran →".
4. Proceed through ujian — confirms new-student flow still works after a view-only session.

Path 4 — Refresh during view-only:
1. From Path 2's results screen, hit browser refresh.
2. Expected: still on results screen, same student, no re-save fired.

Path 5 — Input change resets state:
1. Click home. Enter the completed IC. Click **Semak**. See green notice.
2. Add or delete a character in the IC field.
3. Expected: identity card disappears, must click **Semak** again. (Prevents UI lying about a stale lookup.)

- [ ] **Step 2: Edge cases — Firebase down**

In DevTools, open the **Network** tab and add a URL block on `firebasedatabase.app` (or temporarily disable network). Reload.

1. Enter an IC of a student with a saved record. Click **Semak**.
2. Expected: `findMuridByIc` throws → existing error message: "Sambungan Firebase belum tersedia..." or similar. The new function never runs because the murid lookup failed first. This is acceptable: the student sees a clear error and cannot proceed.

Re-enable network for next steps.

- [ ] **Step 3: Commit if any docs/fixes emerged**

If verification passed cleanly, no commit needed. If any quick fix was made during this task, commit it now with a descriptive message.

---

## Out of Scope (Confirmed Non-Goals)

These are explicitly NOT addressed by this plan, per the spec:

- Admin "allow retake" button — existing `deleteBorangJawapan` at [app/admin.jsx:300](../../../app/admin.jsx#L300) is the override mechanism; no new admin UI.
- Displaying the original submission date in the results header — `tarikh` continues to render `new Date()`.
- Read-only watermark or styling difference on the results screen itself.
- Server-side enforcement — Firebase rules are not modified. A determined user can bypass via DevTools or admin route. This matches existing security posture.
