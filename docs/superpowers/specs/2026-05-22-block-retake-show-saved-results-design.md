# Block Retake & Show Saved Results on IC Re-entry

**Date:** 2026-05-22
**Status:** Draft

## Goal

When a student who has already completed the psychometric test re-enters the app and types their IC at the welcome screen, they should be routed directly to their saved results report. They must not be able to retake the test.

## Motivation

The app currently has no guard against retaking. A student who has finished the test and saved a `borangJawapanByIc/{ic}` record can re-enter their IC, click **Mula Pentaksiran**, and overwrite their previous answers. This is undesirable for a one-shot assessment.

A Firebase record already exists for every completed sitting (saved on first render of `ResultsScreen` in [app/results.jsx:18-30](../../../app/results.jsx#L18-L30)), so the data needed to detect "already completed" is already present — we just need to read it before letting the student proceed.

## User-facing Behavior

### Welcome screen — IC lookup

1. Student enters IC and clicks **Semak**.
2. App calls `findMuridByIc(ic)` (existing). If no student, show existing error message and stop.
3. If a student record is found, the app additionally calls a new function `findBorangJawapanByIc(ic)` to check for an existing completed-test record.
4. The identity card displays as today, with one of two end states:

   - **No saved record (new student):** Existing behavior — primary button is `Mula Pentaksiran →`.
   - **Saved record exists:** A small green notice appears in the identity card:
     > ✓ Anda telah selesai menjawab ujian ini.

     The primary button is replaced with `Lihat Keputusan →`. The `Mula Pentaksiran` button is not shown.

5. Clicking `Lihat Keputusan` passes both the student record and the saved borang to the parent, which routes directly to the results screen (skipping `arahan` and `ujian`).

### Results screen (view-only mode)

When opened from a saved record, `ResultsScreen` receives a new prop `viewOnly={true}`:

- The scoring/visualization is unchanged — `ScoreInstrument(jawapan, instrument)` is called as usual, producing an identical report.
- The `useEffect` that re-saves the borang to Firebase is skipped, preserving the original `updatedAt` / `updatedAtIso`.
- The home button still returns to the welcome screen and clears local state, as it does today.

### Aliran murid baru

Unchanged. If `findBorangJawapanByIc` returns `null`, the student goes through `welcome → arahan → ujian → keputusan` as before.

## Technical Design

### New Firebase function

In [app/firebase.js](../../../app/firebase.js), add:

```js
async function findBorangJawapanByIc(input) {
  const ic = normalizeIc(input);
  if (!ic || ic.length < 6) return null;
  if (!hasFirebase()) return null;
  const snap = await firebase.database().ref(`${ROOT}/borangJawapanByIc/${ic}`).get();
  return snap.exists() ? snap.val() : null;
}
```

Export it on `window.StudentDirectory`.

The function deliberately returns `null` (instead of throwing) on Firebase unavailability so a transient network failure does not lock a new student out — it simply falls back to the "no record" branch.

### Welcome screen changes

In [app/welcome.jsx](../../../app/welcome.jsx):

- Add state `existingRecord` alongside `murid`.
- Inside `lookup`, after `findMuridByIc` succeeds, call `findBorangJawapanByIc` (await it). Set `existingRecord` to the result (or `null`).
- In the identity card, render the green completion notice when `existingRecord` is truthy.
- Replace the action button:
  - If `existingRecord`: button text `Lihat Keputusan →`, handler passes `{ murid, existingRecord }` to `onStart`.
  - Else: existing `Mula Pentaksiran →`.

The `onStart` prop signature changes from `onStart(murid)` to `onStart(murid, existingRecord)` where `existingRecord` is optional.

### Main app changes

In [app/main.jsx](../../../app/main.jsx):

- Add state `viewOnly` (boolean, default `false`).
- Persist `viewOnly` in localStorage alongside the existing keys so a refresh during view-only stays in view-only mode. Key: `iat6.viewOnly`. Load it in initial state.
- Modify `handleStart(murid, existingRecord)`:
  - Clear the same localStorage keys as today.
  - If `existingRecord`:
    - `setMurid(existingRecord.murid || murid)` — prefer the snapshot stored at submission time for consistency with the saved results.
    - `setJawapan(existingRecord.jawapan || {})`
    - `setViewOnly(true)`; persist `iat6.viewOnly = '1'`.
    - `setRoute('keputusan')`.
  - Else (new flow):
    - `setMurid(murid)`, `setJawapan({})`, `setViewOnly(false)`, clear `iat6.viewOnly`.
    - `setRoute('arahan')`.
- `handleHome` additionally clears `viewOnly` and `iat6.viewOnly`.
- Pass `viewOnly` prop to `ResultsScreen`.

### Results screen changes

In [app/results.jsx](../../../app/results.jsx):

- Accept new prop `viewOnly`.
- Wrap the existing save `useEffect` body in `if (viewOnly) return;` so it never re-saves when displaying a saved record.

No change to the rendered markup. The report visually identical to a fresh post-test view.

## Out of Scope (Explicit Non-Goals)

- **Admin "allow retake" UI.** The existing admin delete at [app/admin.jsx:300](../../../app/admin.jsx#L300) (`deleteBorangJawapan`) remains as-is. This spec does not add, remove, or modify any admin-side behavior. A teacher who deletes a record from the admin screen effectively unlocks a retake; that is a deliberate admin-only escape hatch, not a student-facing feature.
- **Showing a different timestamp.** Results screen continues to show today's date as `tarikh`. (We could swap to `existingRecord.updatedAtIso`, but the user did not request it and the existing layout already labels the section "Laporan Keputusan" without claiming the date is the submission date.)
- **Read-only watermark / styling.** No visual difference between fresh and saved-record views.

## Edge Cases

| Case | Behavior |
|---|---|
| Firebase down on borang lookup | `findBorangJawapanByIc` returns `null`; student treated as new. They can attempt the test; if they submit, the existing save flow will fail loudly via `console.warn`. Acceptable — same failure mode as today. |
| Student has stale localStorage from a half-done previous session | `handleStart` clears all relevant localStorage keys before setting new state, in both new-flow and view-only branches. No stale `idx`/`startedAt`/`jawapan` leakage. |
| Student mid-test (closed browser before submitting) | No `borangJawapanByIc` record exists → treated as new student. The existing resume-from-localStorage behavior is unchanged for the same device, but on a different device they will simply start over (same as today). |
| Page refresh while in view-only mode | `viewOnly` is loaded from `iat6.viewOnly` on init; route stays `keputusan`; jawapan is in localStorage. Save `useEffect` still skips. |
| Admin deletes record while student is on welcome screen with `existingRecord` cached | Acceptable race: student may briefly see the `Lihat Keputusan` button, click it, and view their (now-stale-in-memory) results. No data corruption — save is skipped in view-only mode. |
| Student auto-resumes from localStorage on the same device (existing `App` init logic skips welcome and goes straight to `arahan`/`ujian`/`keputusan`) | Out of scope for this spec — this case bypasses the IC-entry flow entirely, and the user requirement is specifically about IC re-entry. Practical impact is small: if the same student returns to the same device, localStorage either takes them to `keputusan` (where a redundant save fires with identical data) or, for the rare mid-test scenario, they resume their own incomplete session. They cannot impersonate another student because localStorage holds their own murid. |

## Files Touched

| File | Change |
|---|---|
| [app/firebase.js](../../../app/firebase.js) | Add `findBorangJawapanByIc`; export on `window.StudentDirectory`. |
| [app/welcome.jsx](../../../app/welcome.jsx) | Add `existingRecord` state, completion notice, conditional button. `onStart` passes record. |
| [app/main.jsx](../../../app/main.jsx) | Add `viewOnly` state (persisted); update `handleStart`, `handleHome`; pass prop to `ResultsScreen`. |
| [app/results.jsx](../../../app/results.jsx) | Accept `viewOnly` prop; skip save `useEffect` when true. |

No CSS changes required beyond optionally a small `.identity-completed` notice — if not present in `app/styles.css`, the implementation will add a minimal rule (green text/background, matching the existing identity card visual language).
